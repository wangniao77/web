"""
从 D:\\UGit\\data 导入学院数据到 PostgreSQL（含 L0/L1 扩展表）。

用法（在 backend 目录）:
  python scripts/import_ugit_data.py
  python scripts/import_ugit_data.py --only students,gpa,cet,dorm,employment,research,thesis,teachers,classes,tags,kpi
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
from Utils.Analytics.student_tag_service import rebuild_student_tags
from Utils.DB.Models import (
    AchievementItem,
    AcademicSnapshot,
    College,
    CollegeKpiSnapshot,
    EmploymentRecord,
    Major,
    ResearchIp,
    ResearchPaper,
    ResearchPlatform,
    ResearchProject,
    SchoolClass,
    StudentAcademicRecord,
    StudentAdmission,
    StudentProfile,
    StudentTag,
    Teacher,
    ThesisAdvisor,
)
from Utils.Excel import list_sheet_names, read_tabular

COLLEGE_NAME = "大数据与人工智能学院"
COLLEGE_CODE = "big-data-ai"
DEFAULT_DATA_ROOT = Path(r"D:\UGit\data")


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


def _find_sheet(path: Path, *keywords: str) -> str | None:
    names = list_sheet_names(path)
    for kw in keywords:
        for name in names:
            if kw == name or kw in name:
                return name
    return None


def _research_workbook(data_root: Path) -> Path | None:
    cands = list(data_root.glob("科研成果*.xls")) + list(data_root.glob("科研成果*.xlsx"))
    if not cands:
        return None
    # 优先带完整 sheet 命名说明的那份
    cands.sort(key=lambda p: (("sheet" not in p.name.lower()), p.stat().st_size))
    return cands[0]


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


async def ensure_class(
    *,
    major: Major | None,
    class_name: str | None,
    grade: int | None,
    counselor: str | None = None,
) -> SchoolClass | None:
    name = (class_name or "").strip()
    if not major or not name:
        return None
    existing = await SchoolClass.get_or_none(major_id=major.id, name=name)
    if existing:
        changed = False
        if grade and existing.grade != grade:
            existing.grade = grade
            changed = True
        if counselor and existing.counselor_name != counselor:
            existing.counselor_name = counselor
            changed = True
        if changed:
            await existing.save()
        return existing
    return await SchoolClass.create(
        major=major,
        name=name,
        grade=grade or 0,
        counselor_name=counselor,
    )


async def upsert_student(payload: dict[str, Any], *, college: College) -> str:
    student_id = str(payload.get("student_id") or "").strip()
    grade = payload.get("grade")
    if not student_id or grade is None:
        return "skip"

    existing = await StudentAcademicRecord.get_or_none(student_id=student_id, grade=grade)
    fields = {k: v for k, v in payload.items() if k not in {"student_id", "grade"} and v is not None}
    fields["college_id"] = college.id
    major_name = fields.get("major_name")
    major = None
    if major_name:
        major = await ensure_major(college, str(major_name))
        if major:
            fields["major_id"] = major.id
    class_name = fields.get("class_name")
    if class_name and major:
        klass = await ensure_class(
            major=major,
            class_name=str(class_name),
            grade=int(grade) if grade else None,
            counselor=fields.get("counselor"),
        )
        if klass:
            fields["school_class_id"] = klass.id

    if existing:
        for k, v in fields.items():
            setattr(existing, k, v)
        await existing.save()
        return "update"
    await StudentAcademicRecord.create(student_id=student_id, grade=grade, **fields)
    return "create"


async def upsert_teacher(
    college: College,
    *,
    name: str,
    teacher_no: str | None = None,
    photo_path: str | None = None,
    source: str | None = None,
) -> str:
    name = (name or "").strip()
    if not name:
        return "skip"
    existing = await Teacher.get_or_none(college_id=college.id, name=name)
    if existing:
        changed = False
        if teacher_no and not existing.teacher_no:
            existing.teacher_no = teacher_no
            changed = True
        if photo_path and not existing.photo_path:
            existing.photo_path = photo_path
            changed = True
        if source and existing.source and source not in existing.source:
            existing.source = f"{existing.source},{source}"
            changed = True
        elif source and not existing.source:
            existing.source = source
            changed = True
        if changed:
            await existing.save()
        return "update"
    await Teacher.create(
        college=college,
        name=name,
        teacher_no=teacher_no,
        photo_path=photo_path,
        source=source,
        status="active",
    )
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
            sid = _pick(row, "学号")
            if not sid:
                stats["skip"] += 1
                continue
            grade = _to_int(_pick(row, "当前所在级", "年级")) or default_grade
            status_raw = _pick(row, "学籍状态")
            status = "active"
            if status_raw and ("离" in status_raw or "注销" in status_raw):
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
                "admission_score": _to_decimal(_pick(row, "录取分数")),
                "source_place": _pick(row, "生源所在地") or None,
                "native_place": _pick(row, "籍贯") or None,
                "hmt_status": _pick(row, "港澳台侨外") or None,
            }
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


async def import_employment(data_root: Path, college: College) -> dict[str, int]:
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
        payload = {
            "college_id": college.id,
            "name": _pick(row, "姓名") or None,
            "education_level": _pick(row, "学历") or None,
            "education_status": _pick(row, "学历状况") or None,
            "major_name": _pick(row, "专业名称") or None,
            "class_name": _pick(row, "班级名称") or None,
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


async def import_research(data_root: Path, college: College) -> dict[str, int]:
    stats = {
        "projects": 0,
        "papers": 0,
        "ips": 0,
        "platforms": 0,
        "achievements": 0,
        "skip": 0,
    }
    path = _research_workbook(data_root)
    if not path:
        return {"missing": 1}
    print(f"[research] {path.name} sheets={list_sheet_names(path)}")

    await ResearchProject.filter(college_id=college.id).delete()
    await ResearchProject.filter(college_id__isnull=True).delete()
    await ResearchPaper.filter(college_id=college.id).delete()
    await ResearchPaper.filter(college_id__isnull=True).delete()
    await ResearchIp.filter(college_id=college.id).delete()
    await ResearchIp.filter(college_id__isnull=True).delete()
    await ResearchPlatform.filter(college_id=college.id).delete()
    await AchievementItem.filter(college_id=college.id).delete()

    vertical = _find_sheet(path, "纵向项目", "科研项目")
    if vertical:
        for row in read_tabular(path, sheet_name=vertical):
            title = _pick(row, "项目名称")
            if not title:
                continue
            await ResearchProject.create(
                college=college,
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
            await AchievementItem.create(
                college=college,
                section="topic",
                name=title,
                category=_pick(row, "项目类别") or None,
                level=_pick(row, "项目级别") or None,
                leader=_pick(row, "负责人") or None,
                occurred_on=_pick(row, "立项日期") or None,
                note=_pick(row, "项目编号") or None,
                source_file=path.name,
            )
            stats["achievements"] += 1

    horizontal = _find_sheet(path, "横向项目", "社会服务")
    if horizontal:
        for row in read_tabular(path, sheet_name=horizontal):
            title = _pick(row, "项目名称")
            if not title:
                continue
            await ResearchProject.create(
                college=college,
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
            await AchievementItem.create(
                college=college,
                section="service",
                name=title,
                category=_pick(row, "项目类别") or None,
                leader=_pick(row, "负责人") or None,
                org=_pick(row, "项目来源单位") or None,
                occurred_on=_pick(row, "立项日期") or None,
                source_file=path.name,
            )
            stats["achievements"] += 1

    papers = _find_sheet(path, "科研论文", "科研成果")
    if papers:
        for row in read_tabular(path, sheet_name=papers):
            title = _pick(row, "论文名称")
            if not title:
                continue
            await ResearchPaper.create(
                college=college,
                category=_pick(row, "类别") or None,
                title=title,
                authors=_pick(row, "作者") or None,
                level=_pick(row, "论文级别") or None,
                published_at=_pick(row, "发表/出版时间") or None,
                venue=_pick(row, "刊物名称") or None,
                source_file=path.name,
            )
            stats["papers"] += 1
            await AchievementItem.create(
                college=college,
                section="paper",
                name=title,
                category=_pick(row, "类别") or None,
                level=_pick(row, "论文级别") or None,
                leader=_pick(row, "作者") or None,
                org=_pick(row, "刊物名称") or None,
                occurred_on=_pick(row, "发表/出版时间") or None,
                source_file=path.name,
            )
            stats["achievements"] += 1

    ips = _find_sheet(path, "知识产权")
    if ips:
        for row in read_tabular(path, sheet_name=ips):
            title = _pick(row, "专利名称")
            if not title:
                continue
            await ResearchIp.create(
                college=college,
                patent_type=_pick(row, "专利类型") or None,
                title=title,
                inventor=_pick(row, "第一发明人") or None,
                patent_no=_pick(row, "专利号") or None,
                grant_date=_pick(row, "授权公告日") or None,
                status=_pick(row, "专利状态") or None,
                source_file=path.name,
            )
            stats["ips"] += 1
            await AchievementItem.create(
                college=college,
                section="output",
                name=title,
                category=_pick(row, "专利类型") or None,
                leader=_pick(row, "第一发明人") or None,
                occurred_on=_pick(row, "授权公告日") or None,
                note=_pick(row, "专利号") or None,
                source_file=path.name,
            )
            stats["achievements"] += 1

    platforms = _find_sheet(path, "教学成果", "科研平台", "科研团队")
    if platforms:
        current_team_label = ""
        for row in read_tabular(path, sheet_name=platforms):
            typ = _pick(row, "类型")
            name = _pick(row, "平台名称")
            # 分组标题行：类型有值、平台名为空
            if typ and not name:
                current_team_label = typ
                continue
            if not name:
                continue
            category = typ or current_team_label or None
            await ResearchPlatform.create(
                college=college,
                name=name,
                category=category,
                leader=_pick(row, "负责人") or None,
                founded_at=_pick(row, "批准时间") or None,
                approved_by=_pick(row, "批准部门") or None,
                eval_passed_at=_pick(row, "动态评估通过时间") or None,
                source_file=path.name,
            )
            stats["platforms"] += 1
            section = "platform"
            if category and ("奖" in category or "教学成果" in category):
                section = "award"
            elif category and "团队" in category:
                section = "collective"
            await AchievementItem.create(
                college=college,
                section=section,
                name=name,
                category=category,
                leader=_pick(row, "负责人") or None,
                org=_pick(row, "批准部门") or None,
                occurred_on=_pick(row, "批准时间") or None,
                note=_pick(row, "动态评估通过时间") or None,
                source_file=path.name,
            )
            stats["achievements"] += 1

    reports = _find_sheet(path, "学术报告")
    if reports:
        for row in read_tabular(path, sheet_name=reports):
            name = _pick(row, "会议名称")
            if not name:
                continue
            await AchievementItem.create(
                college=college,
                section="service",
                name=name,
                category=_pick(row, "会议类型") or "学术报告",
                leader=_pick(row, "主讲人") or None,
                org=_pick(row, "主讲人单位及职称") or None,
                occurred_on=_pick(row, "举办时间") or None,
                source_file=path.name,
            )
            stats["achievements"] += 1

    return stats


async def import_thesis(data_root: Path, college: College) -> dict[str, int]:
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
            "college_id": college.id,
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
            stats["update"] += 1
        else:
            await ThesisAdvisor.create(student_id=sid, **payload)
            stats["create"] += 1
        if payload.get("advisor_name"):
            await upsert_teacher(
                college,
                name=str(payload["advisor_name"]),
                teacher_no=payload.get("advisor_no"),
                source="thesis",
            )
    return stats


async def import_teachers(data_root: Path, college: College) -> dict[str, int]:
    stats = {"create": 0, "update": 0, "skip": 0}
    photo_dir = (
        data_root
        / "班主任、辅导员、住宿、学生照片、四六级、毕业设计指导老师"
        / "教师个人照合集"
    )
    if photo_dir.exists():
        for path in sorted(photo_dir.glob("*.jpg")):
            name = path.stem.replace("-", "").strip()
            if not name:
                stats["skip"] += 1
                continue
            rel = str(path.relative_to(data_root)).replace("\\", "/")
            action = await upsert_teacher(
                college,
                name=name,
                photo_path=rel,
                source="photo",
            )
            stats[action] = stats.get(action, 0) + 1

    # 从科研负责人补齐
    for leader in await ResearchProject.filter(college_id=college.id).values_list("leader", flat=True):
        if not leader:
            continue
        # 可能有多负责人用顿号分隔
        for part in re.split(r"[、,，/]", str(leader)):
            action = await upsert_teacher(college, name=part.strip(), source="research")
            stats[action] = stats.get(action, 0) + 1

    for inventor in await ResearchIp.filter(college_id=college.id).values_list("inventor", flat=True):
        if inventor:
            action = await upsert_teacher(college, name=str(inventor).strip(), source="ip")
            stats[action] = stats.get(action, 0) + 1

    return stats


async def sync_classes(college: College) -> dict[str, int]:
    stats = {"create": 0, "update": 0, "link": 0, "skip": 0}
    records = await StudentAcademicRecord.filter(college_id=college.id).all()
    for rec in records:
        if not rec.major_id or not rec.class_name:
            stats["skip"] += 1
            continue
        major = await Major.get_or_none(id=rec.major_id)
        klass = await ensure_class(
            major=major,
            class_name=rec.class_name,
            grade=rec.grade,
            counselor=rec.counselor,
        )
        if not klass:
            stats["skip"] += 1
            continue
        if rec.school_class_id != klass.id:
            rec.school_class_id = klass.id
            await rec.save(update_fields=["school_class_id", "updated_at"])
            stats["link"] += 1
        else:
            stats["update"] += 1
    stats["classes"] = await SchoolClass.filter(major__college_id=college.id).count()
    return stats


async def normalize_students_from_wide(college: College) -> dict[str, Any]:
    """宽表 → students / student_admission / academic_snapshots，并回填附属表 student_pk。"""
    stats = {
        "profiles_upsert": 0,
        "admissions_upsert": 0,
        "snapshots_upsert": 0,
        "employment_linked": 0,
        "thesis_linked": 0,
        "wide_rows": 0,
        "distinct_student_nos": 0,
        "admission_score_nonzero": 0,
    }
    rows = await StudentAcademicRecord.filter(college_id=college.id).order_by("-grade", "student_id")
    if not rows:
        rows = await StudentAcademicRecord.all().order_by("-grade", "student_id")
    stats["wide_rows"] = len(rows)

    latest_by_no: dict[str, StudentAcademicRecord] = {}
    rows_by_no: dict[str, list[StudentAcademicRecord]] = {}
    for rec in rows:
        sid = rec.student_id
        if not sid:
            continue
        rows_by_no.setdefault(sid, []).append(rec)
        if sid not in latest_by_no:
            latest_by_no[sid] = rec

    stats["distinct_student_nos"] = len(latest_by_no)
    profile_by_no: dict[str, StudentProfile] = {}

    for sid, latest in latest_by_no.items():
        profile = await StudentProfile.get_or_none(student_no=sid)
        payload = {
            "name": latest.name,
            "gender": latest.gender,
            "status": latest.status or "active",
            "college_id": latest.college_id or college.id,
            "major_id": latest.major_id,
            "school_class_id": latest.school_class_id,
            "campus": latest.campus,
            "education_level": latest.education_level,
            "enrollment_year": latest.enrollment_year,
            "teaching_department": latest.teaching_department,
            "major_name": latest.major_name,
            "major_direction_name": latest.major_direction_name,
            "class_name": latest.class_name,
            "student_picture_path": latest.student_picture_path,
        }
        if profile:
            for k, v in payload.items():
                setattr(profile, k, v)
            await profile.save()
        else:
            profile = await StudentProfile.create(student_no=sid, **payload)
        profile_by_no[sid] = profile
        stats["profiles_upsert"] += 1

        # 录取信息：优先取有分数的行
        adm_src = latest
        for r in rows_by_no.get(sid, []):
            if r.admission_score is not None:
                adm_src = r
                break
        adm = await StudentAdmission.get_or_none(student_id=profile.id)
        adm_payload = {
            "admission_score": adm_src.admission_score,
            "source_place": adm_src.source_place,
            "native_place": adm_src.native_place,
            "hmt_status": adm_src.hmt_status,
        }
        if adm:
            for k, v in adm_payload.items():
                setattr(adm, k, v)
            await adm.save()
        else:
            await StudentAdmission.create(student=profile, **adm_payload)
        stats["admissions_upsert"] += 1
        if adm_src.admission_score is not None:
            stats["admission_score_nonzero"] += 1

    for sid, recs in rows_by_no.items():
        profile = profile_by_no.get(sid)
        if not profile:
            continue
        for rec in recs:
            if rec.grade is None:
                continue
            snap = await AcademicSnapshot.get_or_none(student_id=profile.id, grade=rec.grade)
            snap_payload = {
                "college_id": rec.college_id or college.id,
                "major_id": rec.major_id,
                "major_name": rec.major_name,
                "class_name": rec.class_name,
                "major_course_count": rec.major_course_count,
                "major_course_avg_score": rec.major_course_avg_score,
                "subject_basic_course_count": rec.subject_basic_course_count,
                "subject_basic_course_avg_score": rec.subject_basic_course_avg_score,
                "general_course_count": rec.general_course_count,
                "general_course_avg_score": rec.general_course_avg_score,
                "required_course_count": rec.required_course_count,
                "required_course_avg_score": rec.required_course_avg_score,
                "elective_course_count": rec.elective_course_count,
                "elective_course_avg_score": rec.elective_course_avg_score,
                "all_course_count": rec.all_course_count,
                "all_course_avg_score": rec.all_course_avg_score,
                "absent_exam_count": rec.absent_exam_count,
                "makeup_exam_count": rec.makeup_exam_count,
                "retake_count": rec.retake_count,
                "required_credits": rec.required_credits,
                "elective_credits": rec.elective_credits,
                "earned_total_credits": rec.earned_total_credits,
                "failed_total_credits": rec.failed_total_credits,
                "average_credit_gpa": rec.average_credit_gpa,
                "cet4_score": rec.cet4_score,
                "cet6_score": rec.cet6_score,
                "class_teacher": rec.class_teacher,
                "counselor": rec.counselor,
                "competition_award_count": rec.competition_award_count,
                "competition_award_detail": rec.competition_award_detail,
            }
            if snap:
                for k, v in snap_payload.items():
                    setattr(snap, k, v)
                await snap.save()
            else:
                await AcademicSnapshot.create(student=profile, grade=rec.grade, **snap_payload)
            stats["snapshots_upsert"] += 1

    # 回填就业 / 毕设 student_pk
    for emp in await EmploymentRecord.all():
        profile = profile_by_no.get(emp.student_id) or await StudentProfile.get_or_none(
            student_no=emp.student_id
        )
        if profile:
            emp.profile = profile
            await emp.save()
            stats["employment_linked"] += 1

    for th in await ThesisAdvisor.all():
        profile = profile_by_no.get(th.student_id) or await StudentProfile.get_or_none(
            student_no=th.student_id
        )
        if profile:
            th.profile = profile
            await th.save()
            stats["thesis_linked"] += 1

    # 校验
    stats["verify_profiles"] = await StudentProfile.all().count()
    stats["verify_snapshots"] = await AcademicSnapshot.all().count()
    stats["verify_admissions"] = await StudentAdmission.all().count()
    stats["verify_view_hint"] = (
        f"profiles={stats['verify_profiles']} ~= distinct={stats['distinct_student_nos']}; "
        f"snapshots={stats['verify_snapshots']} ~= wide={stats['wide_rows']}"
    )
    return stats


async def rebuild_kpi_snapshot(college: College) -> dict[str, Any]:
    students = await StudentAcademicRecord.filter(college_id=college.id, status="active").count()
    teachers = await Teacher.filter(college_id=college.id, status="active").count()
    courses = 0  # 课程建设明细未导入
    try:
        from Utils.DB.Models import Course

        courses = await Course.filter(college_id=college.id).count()
    except Exception:
        courses = 0
    papers = await ResearchPaper.filter(college_id=college.id).count()
    projects = await ResearchProject.filter(college_id=college.id).count()
    patents = await ResearchIp.filter(college_id=college.id).count()
    platforms = await ResearchPlatform.filter(college_id=college.id).count()
    ratio = round(students / teachers, 2) if teachers else None
    payload = {
        "teachers": teachers,
        "studentRatio": ratio,
        "courses": courses,
        "topPapers": papers,
        "projects": projects,
        "patents": patents,
        "platforms": platforms,
        "teams": await ResearchPlatform.filter(college_id=college.id, category__contains="团队").count(),
        "students": students,
        "employment": await EmploymentRecord.filter(college_id=college.id).count(),
        "achievements": await AchievementItem.filter(college_id=college.id).count(),
    }
    # 简易发展指数：有数项归一化累加（占位，非官方口径）
    score = 0.0
    score += min(teachers / 80, 1) * 15
    score += min((papers or 0) / 100, 1) * 20
    score += min((projects or 0) / 80, 1) * 20
    score += min((platforms or 0) / 10, 1) * 15
    score += min((students or 0) / 3000, 1) * 15
    score += min((patents or 0) / 10, 1) * 15
    development_index = round(score, 2)

    existing = await CollegeKpiSnapshot.get_or_none(
        college_id=college.id, academic_year="2024-2025", semester=None
    )
    if existing:
        existing.payload = payload
        existing.development_index = Decimal(str(development_index))
        await existing.save()
    else:
        await CollegeKpiSnapshot.create(
            college=college,
            academic_year="2024-2025",
            semester=None,
            payload=payload,
            development_index=Decimal(str(development_index)),
        )
    return {"payload": payload, "development_index": development_index}


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
                results["employment"] = await import_employment(data_root, college)
            if "research" in only:
                results["research"] = await import_research(data_root, college)
            if "thesis" in only:
                results["thesis"] = await import_thesis(data_root, college)
            if "teachers" in only:
                results["teachers"] = await import_teachers(data_root, college)
            if "classes" in only:
                results["classes"] = await sync_classes(college)
            if "tags" in only:
                results["tags"] = await rebuild_student_tags(college)
            if "normalize-students" in only or "normalize_students" in only:
                results["normalize_students"] = await normalize_students_from_wide(college)
            if "kpi" in only:
                results["kpi"] = await rebuild_kpi_snapshot(college)

            counts = {
                "students": await StudentAcademicRecord.all().count(),
                "student_profiles": await StudentProfile.all().count(),
                "academic_snapshots": await AcademicSnapshot.all().count(),
                "student_admission": await StudentAdmission.all().count(),
                "classes": await SchoolClass.all().count(),
                "employment": await EmploymentRecord.all().count(),
                "research_projects": await ResearchProject.all().count(),
                "research_papers": await ResearchPaper.all().count(),
                "research_ips": await ResearchIp.all().count(),
                "research_platforms": await ResearchPlatform.all().count(),
                "achievements": await AchievementItem.all().count(),
                "teachers": await Teacher.all().count(),
                "thesis": await ThesisAdvisor.all().count(),
                "student_tags": await StudentTag.all().count(),
                "kpi_snapshots": await CollegeKpiSnapshot.all().count(),
            }
            print("RESULTS", results)
            print("COUNTS", counts)
    finally:
        await Tortoise.close_connections()


def main() -> None:
    parser = argparse.ArgumentParser(description="Import D:\\UGit\\data into PostgreSQL")
    parser.add_argument("--data-root", type=Path, default=DEFAULT_DATA_ROOT)
    parser.add_argument(
        "--only",
        type=str,
        default="students,gpa,cet,dorm,employment,research,thesis,teachers,classes,tags,kpi",
        help="comma-separated steps",
    )
    args = parser.parse_args()
    only = {x.strip() for x in args.only.split(",") if x.strip()}
    print("NOTE: skip course-score detail sheets / photo xls / awards docx (no structured parser)")
    print("NOTE: sensitive columns (phone/id/bank) are never persisted")
    asyncio.run(run(args.data_root, only))


if __name__ == "__main__":
    main()
