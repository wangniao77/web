"""
从 D:\\UGit\\data 导入学院数据到 PostgreSQL。

用法（在 backend 目录）:
  set POSTGRES_DSN=postgres://user:pass@host:5432/studentmodelingdata
  python scripts/import_ugit_data.py
  python scripts/import_ugit_data.py --data-root D:\\UGit\\data --only students,gpa,cet,employment,research,thesis,dorm
"""

from __future__ import annotations

import argparse
import asyncio
import re
import sys
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

from tortoise import Tortoise
from tortoise.transactions import in_transaction

from core.config import get_settings
from core.database import TORTOISE_ORM
from Utils.DB.Models import (
    College,
    EmploymentRecord,
    Major,
    ResearchIp,
    ResearchPaper,
    ResearchProject,
    StudentAcademicRecord,
    ThesisAdvisor,
)
from Utils.Excel import list_sheet_names, read_tabular

COLLEGE_NAME = "大数据与人工智能学院"
COLLEGE_CODE = "big-data-ai"
DEFAULT_DATA_ROOT = Path(r"D:\UGit\data")

# 不入库的敏感列关键词
SENSITIVE_KEYS = ("身份证", "银行", "电话", "手机", "证件", "考生号", "准考证")


def _to_int(v: str | None) -> int | None:
    if v is None or str(v).strip() == "":
        return None
    s = str(v).strip()
    try:
        return int(float(s))
    except ValueError:
        m = re.search(r"(\d{4})", s)
        return int(m.group(1)) if m else None


def _to_decimal(v: str | None) -> Decimal | None:
    if v is None or str(v).strip() == "":
        return None
    s = str(v).strip().replace(",", "")
    try:
        return Decimal(s)
    except InvalidOperation:
        return None


def _pick(row: dict[str, str], *names: str) -> str:
    for n in names:
        if n in row and row[n] != "":
            return row[n]
        for k, v in row.items():
            if k == n or k.startswith(n):
                if v != "":
                    return v
    return ""


def _grade_from_name(name: str) -> int | None:
    m = re.search(r"(20)?(\d{2})级", name)
    if not m:
        return None
    yy = int(m.group(2))
    return 2000 + yy if yy < 100 else yy


async def ensure_college() -> College:
    college = await College.get_or_none(code=COLLEGE_CODE)
    if college:
        if college.name != COLLEGE_NAME:
            college.name = COLLEGE_NAME
            await college.save()
        return college
    college = await College.get_or_none(name=COLLEGE_NAME)
    if college:
        college.code = COLLEGE_CODE
        await college.save()
        return college
    return await College.create(code=COLLEGE_CODE, name=COLLEGE_NAME, short_name="数智学院")


async def ensure_major(college: College, major_name: str) -> Major | None:
    name = (major_name or "").strip()
    if not name:
        return None
    major = await Major.get_or_none(college_id=college.id, name=name)
    if major:
        return major
    code = re.sub(r"\W+", "", name)[:32] or f"m{college.id}"
    return await Major.create(college=college, name=name, code=code)


async def upsert_student(payload: dict[str, Any], *, college: College) -> str:
    student_id = str(payload.get("student_id") or "").strip()
    grade = payload.get("grade")
    if not student_id or grade is None:
        return "skip"

    existing = await StudentAcademicRecord.get_or_none(student_id=student_id, grade=grade)
    fields = {k: v for k, v in payload.items() if k not in {"student_id", "grade"} and v is not None}
    fields["college_id"] = college.id
    major_name = fields.get("major_name")
    if major_name:
        major = await ensure_major(college, str(major_name))
        if major:
            fields["major_id"] = major.id

    if existing:
        for k, v in fields.items():
            setattr(existing, k, v)
        await existing.save()
        return "update"
    await StudentAcademicRecord.create(student_id=student_id, grade=grade, **fields)
    return "create"


async def import_rosters(data_root: Path, college: College) -> dict[str, int]:
    stats = {"create": 0, "update": 0, "skip": 0}
    folder = data_root / "全年级学生成绩学籍数据"
    files = sorted(folder.glob("*级学籍.xls"))
    for path in files:
        default_grade = _grade_from_name(path.name)
        rows = read_tabular(path)
        print(f"[roster] {path.name} rows={len(rows)}")
        for row in rows:
            # 跳过敏感字段，不读取入库
            sid = _pick(row, "学号")
            if not sid:
                stats["skip"] += 1
                continue
            grade = _to_int(_pick(row, "当前所在级", "年级")) or default_grade
            status_raw = _pick(row, "学籍状态")
            status = "active"
            if status_raw and ("无" in status_raw or "注销" in status_raw):
                status = "inactive"
            payload = {
                "student_id": sid,
                "grade": grade,
                "name": _pick(row, "姓名") or None,
                "gender": _pick(row, "性别") or None,
                "teaching_department": _pick(row, "上课院系") or COLLEGE_NAME,
                "major_name": _pick(row, "专业名称") or None,
                "major_direction_name": _pick(row, "专业方向名称") or None,
                "class_name": _pick(row, "班级") or None,
                "campus": _pick(row, "校区") or None,
                "enrollment_year": _to_int(_pick(row, "入学年份")),
                "education_level": _pick(row, "培养层次") or None,
                "status": status,
            }
            # 过滤外院
            dept = payload["teaching_department"] or ""
            if dept and COLLEGE_NAME not in dept and "大数据" not in dept and "人工智能" not in dept:
                stats["skip"] += 1
                continue
            action = await upsert_student(payload, college=college)
            stats[action] = stats.get(action, 0) + 1
    return stats


async def import_gpa(data_root: Path, college: College) -> dict[str, int]:
    stats = {"update": 0, "create": 0, "skip": 0}
    folder = data_root / "全年级学生成绩学籍数据"
    for path in sorted(folder.glob("*绩点.xls")):
        default_grade = _grade_from_name(path.name)
        rows = read_tabular(path)
        print(f"[gpa] {path.name} rows={len(rows)}")
        for row in rows:
            sid = _pick(row, "学号")
            if not sid:
                stats["skip"] += 1
                continue
            grade = _to_int(_pick(row, "年级")) or default_grade
            payload = {
                "student_id": sid,
                "grade": grade,
                "name": _pick(row, "姓名") or None,
                "gender": _pick(row, "性别") or None,
                "major_name": _pick(row, "专业") or None,
                "class_name": _pick(row, "班级名称", "班级") or None,
                "required_credits": _to_decimal(_pick(row, "必修")),
                "elective_credits": _to_decimal(_pick(row, "选修", "限选")),
                "earned_total_credits": _to_decimal(_pick(row, "获得总学分")),
                "failed_total_credits": _to_decimal(_pick(row, "不及格总学分")),
                "average_credit_gpa": _to_decimal(_pick(row, "平均学分绩点")),
                "teaching_department": _pick(row, "学院") or COLLEGE_NAME,
            }
            dept = payload["teaching_department"] or ""
            if dept and COLLEGE_NAME not in dept and "大数据" not in dept:
                stats["skip"] += 1
                continue
            action = await upsert_student(payload, college=college)
            stats[action] = stats.get(action, 0) + 1
    return stats


async def import_cet(data_root: Path) -> dict[str, int]:
    stats = {"update": 0, "skip": 0}
    root = data_root / "班主任、辅导员、住宿、学生照片、四六级、毕业设计指导老师" / "四六级成绩" / "四六级成绩"
    if not root.exists():
        # 兼容少一层目录
        root = data_root / "班主任、辅导员、住宿、学生照片、四六级、毕业设计指导老师" / "四六级成绩"
    files = list(root.rglob("*.xls"))
    best4: dict[str, Decimal] = {}
    best6: dict[str, Decimal] = {}
    for path in files:
        rows = read_tabular(path)
        is4 = "四级" in path.name
        is6 = "六级" in path.name
        print(f"[cet] {path.name} rows={len(rows)} type={'4' if is4 else '6' if is6 else '?'}")
        for row in rows:
            sid = _pick(row, "学号")
            score = _to_decimal(_pick(row, "分数总成绩", "等级总成绩", "成绩"))
            if not sid or score is None:
                continue
            if is4:
                best4[sid] = max(score, best4.get(sid, Decimal("-1")))
            elif is6:
                best6[sid] = max(score, best6.get(sid, Decimal("-1")))
    # 写回：更新该学号所有年级行
    for sid, score in best4.items():
        updated = await StudentAcademicRecord.filter(student_id=sid).update(cet4_score=score)
        stats["update"] += updated
        if not updated:
            stats["skip"] += 1
    for sid, score in best6.items():
        updated = await StudentAcademicRecord.filter(student_id=sid).update(cet6_score=score)
        stats["update"] += updated
        if not updated:
            stats["skip"] += 1
    return stats


async def import_dorm_teachers(data_root: Path) -> dict[str, int]:
    """从本院住宿表回填校区/班主任/辅导员（不含宿舍号等敏感字段到 Agent）。"""
    stats = {"update": 0, "skip": 0}
    base = data_root / "班主任、辅导员、住宿、学生照片、四六级、毕业设计指导老师"
    for path in [
        base / "住宿情况（广州校区）.xlsx",
        base / "住宿情况（佛山校区）.xlsx",
    ]:
        if not path.exists():
            continue
        rows = read_tabular(path)
        print(f"[dorm] {path.name} rows={len(rows)}")
        for row in rows:
            college = _pick(row, "学院")
            if COLLEGE_NAME not in college:
                stats["skip"] += 1
                continue
            sid = _pick(row, "学号")
            if not sid:
                stats["skip"] += 1
                continue
            grade = _to_int(_pick(row, "年级"))
            qs = StudentAcademicRecord.filter(student_id=sid)
            if grade:
                qs = qs.filter(grade=grade)
            n = await qs.update(
                campus=_pick(row, "校区") or None,
                class_teacher=_pick(row, "班主任") or None,
                counselor=_pick(row, "辅导员") or None,
                class_name=_pick(row, "班级") or None,
                major_name=_pick(row, "专业") or None,
            )
            stats["update"] += n
            if not n:
                stats["skip"] += 1
    return stats


async def import_employment(data_root: Path) -> dict[str, int]:
    stats = {"create": 0, "update": 0, "skip": 0}
    path = data_root / "就业信息20260623.xlsx"
    if not path.exists():
        return {"skip": 0, "missing": 1}
    rows = read_tabular(path)
    print(f"[employment] {path.name} rows={len(rows)}")
    for row in rows:
        sid = _pick(row, "学号")
        if not sid:
            stats["skip"] += 1
            continue
        # 不入库联系电话/邮箱
        payload = {
            "name": _pick(row, "姓名") or None,
            "destination": _pick(row, "毕业去向") or None,
            "unit_name": _pick(
                row,
                "就业单位名称/征兵办名称/项目名称/创业单位名称/升学院校名称/境外单位名称",
                "就业单位名称",
            )
            or None,
            "unit_type": _pick(row, "单位类型") or None,
            "industry": _pick(row, "单位所属行业") or None,
            "region": _pick(row, "单位/征兵办/项目/院校所属地区", "所属地区") or None,
            "job_title": _pick(row, "岗位名称/专业名称/工作内容") or None,
            "occupation_type": _pick(row, "职业类型") or None,
            "salary": _pick(row, "薪酬") or None,
            "relevance": _pick(row, "专业与就业相关度") or None,
            "signed_at": _pick(row, "签约时间/入伍时间/创业时间/就业时间/入学、入职时间") or None,
            "source_file": path.name,
        }
        existing = await EmploymentRecord.get_or_none(student_id=sid)
        if existing:
            for k, v in payload.items():
                setattr(existing, k, v)
            await existing.save()
            stats["update"] += 1
        else:
            await EmploymentRecord.create(student_id=sid, **payload)
            stats["create"] += 1
    return stats


async def import_research(data_root: Path) -> dict[str, int]:
    stats = {"projects": 0, "papers": 0, "ips": 0, "skip": 0}
    # 文件名可能略有变化
    candidates = list(data_root.glob("科研成果*.xls")) + list(data_root.glob("科研成果*.xlsx"))
    if not candidates:
        return {"missing": 1}
    path = candidates[0]
    print(f"[research] {path.name} sheets={list_sheet_names(path)}")

    # 清空后重导，避免重复
    await ResearchProject.all().delete()
    await ResearchPaper.all().delete()
    await ResearchIp.all().delete()

    # 纵向
    try:
        for row in read_tabular(path, sheet_name="纵向项目"):
            title = _pick(row, "项目名称")
            if not title:
                continue
            await ResearchProject.create(
                kind="vertical",
                project_no=_pick(row, "项目编号") or None,
                title=title,
                leader=_pick(row, "负责人") or None,
                level=_pick(row, "项目级别") or None,
                category=_pick(row, "项目类别") or None,
                main_type=_pick(row, "项目主分类", "类型") or None,
                start_date=_pick(row, "立项日期") or None,
                funding=_pick(row, "批准经费", "项目经费") or None,
                source_file=path.name,
            )
            stats["projects"] += 1
    except Exception as e:
        print("  vertical fail:", e)

    try:
        for row in read_tabular(path, sheet_name="横向项目"):
            title = _pick(row, "项目名称")
            if not title:
                continue
            await ResearchProject.create(
                kind="horizontal",
                project_no=_pick(row, "项目编号") or None,
                title=title,
                leader=_pick(row, "负责人") or None,
                category=_pick(row, "项目类别") or None,
                start_date=_pick(row, "立项日期") or None,
                funding=_pick(row, "项目经费") or None,
                source_org=_pick(row, "项目来源单位") or None,
                source_file=path.name,
            )
            stats["projects"] += 1
    except Exception as e:
        print("  horizontal fail:", e)

    try:
        for row in read_tabular(path, sheet_name="科研论文"):
            title = _pick(row, "论文名称")
            if not title:
                continue
            await ResearchPaper.create(
                category=_pick(row, "类别") or None,
                title=title,
                authors=_pick(row, "作者") or None,
                level=_pick(row, "论文级别") or None,
                published_at=_pick(row, "发表/出版时间") or None,
                venue=_pick(row, "刊物名称") or None,
                source_file=path.name,
            )
            stats["papers"] += 1
    except Exception as e:
        print("  papers fail:", e)

    try:
        for row in read_tabular(path, sheet_name="知识产权"):
            title = _pick(row, "专利名称")
            if not title:
                continue
            await ResearchIp.create(
                patent_type=_pick(row, "专利类型") or None,
                title=title,
                inventor=_pick(row, "第一发明人") or None,
                patent_no=_pick(row, "专利号") or None,
                grant_date=_pick(row, "授权公告日") or None,
                status=_pick(row, "专利状态") or None,
                source_file=path.name,
            )
            stats["ips"] += 1
    except Exception as e:
        print("  ip fail:", e)

    return stats


async def import_thesis(data_root: Path) -> dict[str, int]:
    stats = {"create": 0, "update": 0, "skip": 0}
    base = data_root / "班主任、辅导员、住宿、学生照片、四六级、毕业设计指导老师"
    files = list(base.glob("*毕业设计指导*.xls")) + list(base.glob("*毕业设计指导*.xlsx"))
    if not files:
        return {"missing": 1}
    path = files[0]
    rows = read_tabular(path)
    print(f"[thesis] {path.name} rows={len(rows)}")
    for row in rows:
        sid = _pick(row, "学生学号", "学号")
        if not sid:
            stats["skip"] += 1
            continue
        payload = {
            "student_name": _pick(row, "学生姓名", "姓名") or None,
            "major_name": _pick(row, "专业") or None,
            "class_name": _pick(row, "班级") or None,
            "advisor_name": _pick(row, "指导教师姓名") or None,
            "advisor_no": _pick(row, "指导教师工号") or None,
            "status": _pick(row, "状态") or None,
            "source_file": path.name,
        }
        existing = await ThesisAdvisor.get_or_none(student_id=sid)
        if existing:
            for k, v in payload.items():
                setattr(existing, k, v)
            await existing.save()
            # 同步导师到学籍
            await StudentAcademicRecord.filter(student_id=sid).update()
            stats["update"] += 1
        else:
            await ThesisAdvisor.create(student_id=sid, **payload)
            stats["create"] += 1
        # 有导师名则写到学籍（若模型有扩展字段则更好；当前写不到 supervisor，跳过）
    return stats


async def run(data_root: Path, only: set[str]) -> None:
    settings = get_settings()
    print("DSN host/db:", settings.postgres_dsn.split("@")[-1])
    print("data_root:", data_root)
    if not data_root.exists():
        raise SystemExit(f"data root not found: {data_root}")

    await Tortoise.init(config=TORTOISE_ORM, _enable_global_fallback=True)
    await Tortoise.generate_schemas(safe=True)

    try:
        async with in_transaction():
            college = await ensure_college()
            print("college:", college.code, college.name)

            results: dict[str, Any] = {}
            if "students" in only:
                results["students"] = await import_rosters(data_root, college)
            if "gpa" in only:
                results["gpa"] = await import_gpa(data_root, college)
            if "cet" in only:
                results["cet"] = await import_cet(data_root)
            if "dorm" in only:
                results["dorm"] = await import_dorm_teachers(data_root)
            if "employment" in only:
                results["employment"] = await import_employment(data_root)
            if "research" in only:
                results["research"] = await import_research(data_root)
            if "thesis" in only:
                results["thesis"] = await import_thesis(data_root)

            # 汇总
            student_n = await StudentAcademicRecord.all().count()
            emp_n = await EmploymentRecord.all().count()
            proj_n = await ResearchProject.all().count()
            paper_n = await ResearchPaper.all().count()
            ip_n = await ResearchIp.all().count()
            thesis_n = await ThesisAdvisor.all().count()
            print("RESULTS", results)
            print(
                "COUNTS",
                {
                    "students": student_n,
                    "employment": emp_n,
                    "research_projects": proj_n,
                    "research_papers": paper_n,
                    "research_ips": ip_n,
                    "thesis": thesis_n,
                },
            )
    finally:
        await Tortoise.close_connections()


def main() -> None:
    parser = argparse.ArgumentParser(description="Import D:\\UGit\\data into PostgreSQL")
    parser.add_argument("--data-root", type=Path, default=DEFAULT_DATA_ROOT)
    parser.add_argument(
        "--only",
        type=str,
        default="students,gpa,cet,dorm,employment,research,thesis",
        help="comma-separated steps",
    )
    args = parser.parse_args()
    only = {x.strip() for x in args.only.split(",") if x.strip()}
    # 明确未导入：课程成绩明细大表、带照片学籍、教师写真、docx 获奖
    print("NOTE: skip course-score detail sheets / photo xls / teacher jpgs / awards docx")
    print("NOTE: sensitive columns (phone/id/bank) are never persisted")
    asyncio.run(run(args.data_root, only))


if __name__ == "__main__":
    main()
