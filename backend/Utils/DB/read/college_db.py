from __future__ import annotations

import asyncio
import time
from decimal import Decimal
from typing import Any

from tortoise import Tortoise
from tortoise.expressions import Q

from Utils.DB.Models.college_models import College
from Utils.DB.Models.college_student_models import StudentProfile
from Utils.DB.Models.student_academic_record_models import StudentAcademicRecord

# 总览页会并发打多个接口，同一学院学籍只拉一次（singleflight + 短 TTL）
_RECORDS_TTL_SEC = 45.0
_records_cache: dict[str, tuple[float, list[StudentAcademicRecord]]] = {}
_records_inflight: dict[str, asyncio.Future[list[StudentAcademicRecord]]] = {}


def to_float(value: Decimal | float | int | None) -> float:
    return float(value or 0)


async def resolve_college(college_code: str | None) -> College | None:
    if college_code:
        college = await College.get_or_none(code=college_code)
        if college:
            return college
    return await College.first()


def _hydrate_academic_record(row: dict[str, Any]) -> StudentAcademicRecord:
    """把视图/字典行灌进 StudentAcademicRecord 实例（只读，不落库）。"""
    rec = StudentAcademicRecord()
    for key, value in row.items():
        if hasattr(StudentAcademicRecord, key) or key in StudentAcademicRecord._meta.fields_map:
            try:
                setattr(rec, key, value)
            except Exception:
                pass
    return rec


async def fetch_college_records_from_view(college: College | None) -> list[StudentAcademicRecord]:
    """从兼容视图读取（每人最新年级一行）。"""
    conn = Tortoise.get_connection("default")
    if college:
        sql = """
            SELECT * FROM v_student_academic_records
            WHERE college_id = $1
               OR teaching_department ILIKE $2
               OR ($3 <> '' AND teaching_department ILIKE $3)
            ORDER BY grade DESC NULLS LAST, student_id
        """
        short = college.short_name or ""
        rows = await conn.execute_query_dict(
            sql,
            [college.id, f"%{college.name}%", f"%{short}%" if short else ""],
        )
    else:
        rows = await conn.execute_query_dict(
            "SELECT * FROM v_student_academic_records ORDER BY grade DESC NULLS LAST, student_id",
            [],
        )
    return [_hydrate_academic_record(r) for r in rows]


async def _fetch_college_records_uncached(college: College | None) -> list[StudentAcademicRecord]:
    """获取学院范围内的学籍记录（无缓存）。"""
    try:
        has_profiles = await StudentProfile.all().limit(1).exists()
    except Exception:
        has_profiles = False

    if has_profiles:
        try:
            return await fetch_college_records_from_view(college)
        except Exception:
            # 视图异常时回退宽表，避免驾驶舱中断
            pass

    qs = StudentAcademicRecord.all().order_by("-grade", "student_id")
    if college:
        name = college.name
        short_name = college.short_name or ""
        qs = qs.filter(
            Q(college_id=college.id)
            | Q(teaching_department__icontains=name)
            | Q(teaching_department__icontains=short_name)
        )
    return await qs


def _college_cache_key(college: College | None) -> str:
    return str(college.id) if college else "all"


async def fetch_college_records(college: College | None) -> list[StudentAcademicRecord]:
    """获取学院范围内的学籍记录。

    若已规范化（students 有数据）则读 v_student_academic_records；
    否则回退宽表 student_academic_records。

    并发请求同一学院时合并为一次查询（singleflight），并缓存约 45s。
    """
    key = _college_cache_key(college)
    now = time.monotonic()
    hit = _records_cache.get(key)
    if hit and now - hit[0] < _RECORDS_TTL_SEC:
        return hit[1]

    inflight = _records_inflight.get(key)
    if inflight is not None and not inflight.done():
        return await asyncio.shield(inflight)

    loop = asyncio.get_running_loop()
    fut: asyncio.Future[list[StudentAcademicRecord]] = loop.create_future()
    _records_inflight[key] = fut
    try:
        records = await _fetch_college_records_uncached(college)
        _records_cache[key] = (time.monotonic(), records)
        fut.set_result(records)
        return records
    except Exception as exc:
        if not fut.done():
            fut.set_exception(exc)
        raise
    finally:
        if _records_inflight.get(key) is fut:
            _records_inflight.pop(key, None)


async def fetch_college_student_stats(college: College | None) -> tuple[int, float]:
    """仅取在籍人数与平均 GPA，供 hub 等轻量接口，避免全量灌模。"""
    conn = Tortoise.get_connection("default")
    try:
        has_profiles = await StudentProfile.all().limit(1).exists()
    except Exception:
        has_profiles = False

    if has_profiles:
        try:
            if college:
                short = college.short_name or ""
                sql = """
                    SELECT COUNT(*)::int AS n,
                           COALESCE(AVG(NULLIF(average_credit_gpa, 0)), 0)::float AS avg_gpa
                    FROM v_student_academic_records
                    WHERE college_id = $1
                       OR teaching_department ILIKE $2
                       OR ($3 <> '' AND teaching_department ILIKE $3)
                """
                rows = await conn.execute_query_dict(
                    sql,
                    [college.id, f"%{college.name}%", f"%{short}%" if short else ""],
                )
            else:
                rows = await conn.execute_query_dict(
                    """
                    SELECT COUNT(*)::int AS n,
                           COALESCE(AVG(NULLIF(average_credit_gpa, 0)), 0)::float AS avg_gpa
                    FROM v_student_academic_records
                    """,
                    [],
                )
            if rows:
                return int(rows[0].get("n") or 0), float(rows[0].get("avg_gpa") or 0)
        except Exception:
            pass

    # 回退：走缓存全量路径再聚合（仍受益于 singleflight）
    students = latest_records_by_student(await fetch_college_records(college))
    n = len(students)
    if not n:
        return 0, 0.0
    avg = sum(to_float(s.average_credit_gpa) for s in students) / n
    return n, avg


def latest_records_by_student(records: list[StudentAcademicRecord]) -> list[StudentAcademicRecord]:
    """同一学号只保留最新年级记录。"""

    latest: dict[str, StudentAcademicRecord] = {}
    for record in records:
        if record.student_id not in latest:
            latest[record.student_id] = record
    return list(latest.values())


def record_to_roster(
    record: StudentAcademicRecord,
    *,
    hp: list[dict],
    warnings: list[dict],
    highlight: str | None = None,
) -> dict[str, Any]:
    """转为前端花名册结构（不含敏感字段）。"""

    warn = warnings[0] if warnings else None
    level_map = {"high": "红色预警", "medium": "黄色预警", "low": "蓝色预警"}
    if highlight is None:
        highlight = hp[0]["highlight"] if hp else ""
    return {
        "id": str(record.id),
        "name": record.name or "",
        "gender": record.gender or "未知",
        "studentId": record.student_id,
        "className": record.class_name or "",
        "major": record.major_name or "",
        "grade": f"{record.grade}级" if record.grade else "",
        "counselor": record.counselor or "",
        "dorm": "",
        "gpa": to_float(record.average_credit_gpa),
        "political": "",
        "phone": "",
        "hp": [t["dimension"] for t in hp],
        "warnings": [w["type"] for w in warnings],
        "highlight": highlight or "",
        "warnReason": warn["reason"] if warn else None,
        "warnLevel": level_map.get(warn["level"], "蓝色预警") if warn else None,
    }
