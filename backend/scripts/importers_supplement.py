"""7_27 等补充数据导入：就业、研究生、干部、竞赛/课题/论文、课时。

手机 / 地址 / 宿舍号按业务需要入库；身份证号不入库。
"""

from __future__ import annotations

import re
from datetime import datetime, timedelta
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any

from Utils.DB.Models import (
    College,
    CompetitionAward,
    EmploymentRecord,
    StudentAcademicRecord,
    StudentInternship,
    StudentLeadershipRole,
    StudentPaper,
    StudentProfile,
    StudentProject,
    StudentTag,
    TeachingCourseHour,
)
from Utils.Excel import list_sheet_names, read_tabular


def _pick(row: dict[str, str], *names: str) -> str:
    for n in names:
        if n in row and row[n] != "":
            return row[n]
        for k, v in row.items():
            if k == n or k.startswith(n):
                if v != "":
                    return v
    return ""


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


def _norm_sid(v: str | None) -> str:
    if not v:
        return ""
    s = str(v).strip()
    if re.fullmatch(r"\d+\.0+", s):
        s = s.split(".", 1)[0]
    return s


def _norm_phone(v: str | None) -> str | None:
    s = _norm_sid(v)
    if not s:
        return None
    return s[:64]


def _clean_name(v: str | None) -> str:
    s = (v or "").strip()
    s = re.sub(r"[（(].*?[）)]", "", s).strip()
    return s


def _excel_date(v: str | None) -> str | None:
    if v is None or str(v).strip() == "":
        return None
    s = str(v).strip()
    try:
        n = float(s)
        if 20000 < n < 80000:
            return (datetime(1899, 12, 30) + timedelta(days=int(n))).strftime("%Y-%m")
    except ValueError:
        pass
    return s[:64]


def _grade_from_text(text: str) -> int | None:
    m = re.search(r"(20\d{2})\s*级", text)
    if m:
        return int(m.group(1))
    m = re.search(r"(?<!\d)(\d{2})级", text)
    if m:
        return 2000 + int(m.group(1))
    return None


async def _upsert_contact(
    *,
    student_id: str | None,
    name: str | None = None,
    phone: str | None = None,
    address: str | None = None,
    dormitory: str | None = None,
    political_status: str | None = None,
    advisor_name: str | None = None,
    education_level: str | None = None,
    major_name: str | None = None,
    class_name: str | None = None,
    campus: str | None = None,
    enrollment_year: int | None = None,
    gender: str | None = None,
    college: College | None = None,
) -> StudentProfile | None:
    if not student_id and not name:
        return None
    profile: StudentProfile | None = None
    if student_id:
        profile = await StudentProfile.get_or_none(student_no=student_id)
    if profile is None and name and college:
        qs = StudentProfile.filter(name=name, college_id=college.id)
        if class_name:
            qs = qs.filter(class_name__icontains=class_name[:8])
        profile = await qs.first()

    payload = {
        "phone": phone,
        "address": address,
        "dormitory": dormitory,
        "political_status": political_status,
        "advisor_name": advisor_name,
        "education_level": education_level,
        "major_name": major_name,
        "class_name": class_name,
        "campus": campus,
        "enrollment_year": enrollment_year,
        "gender": gender,
    }
    cleaned = {k: v for k, v in payload.items() if v not in (None, "")}

    if profile is None and student_id:
        profile = await StudentProfile.create(
            student_no=student_id,
            name=name,
            college=college,
            status="active",
            **cleaned,
        )
    elif profile is not None:
        for k, v in cleaned.items():
            setattr(profile, k, v)
        if name and not profile.name:
            profile.name = name
        if college and profile.college_id is None:
            profile.college = college
        await profile.save()

    if student_id:
        recs = await StudentAcademicRecord.filter(student_id=student_id).all()
        for rec in recs:
            for k, v in cleaned.items():
                if hasattr(rec, k):
                    setattr(rec, k, v)
            if name and not rec.name:
                rec.name = name
            if college and rec.college_id is None:
                rec.college = college
            await rec.save()
        if not recs and enrollment_year and college:
            await StudentAcademicRecord.create(
                student_id=student_id,
                grade=enrollment_year,
                name=name,
                college=college,
                status="active",
                **cleaned,
            )
    return profile


async def _name_class_index(college: College) -> dict[tuple[str, str], str]:
    """(name, class_key) -> student_id"""
    out: dict[tuple[str, str], str] = {}
    recs = await StudentAcademicRecord.filter(college_id=college.id).all()
    for r in recs:
        if not r.student_id or not r.name:
            continue
        ck = re.sub(r"\s+", "", (r.class_name or ""))
        out[(r.name, ck)] = r.student_id
        out[(r.name, "")] = r.student_id  # fallback last-wins
    profiles = await StudentProfile.filter(college_id=college.id).all()
    for p in profiles:
        if not p.student_no or not p.name:
            continue
        ck = re.sub(r"\s+", "", (p.class_name or ""))
        out.setdefault((p.name, ck), p.student_no)
        out.setdefault((p.name, ""), p.student_no)
    return out


def _resolve_sid(
    index: dict[tuple[str, str], str],
    name: str,
    class_name: str = "",
) -> str:
    name = _clean_name(name)
    if not name:
        return ""
    ck = re.sub(r"\s+", "", class_name or "")
    if (name, ck) in index:
        return index[(name, ck)]
    # fuzzy: class contains / contained
    for (n, c), sid in index.items():
        if n != name:
            continue
        if not ck or not c:
            continue
        if ck in c or c in ck:
            return sid
    return index.get((name, ""), "")


# ---------- employment ----------


def _employment_files(data_root: Path) -> list[Path]:
    files: list[Path] = []
    for pat in ("*就业信息*.xlsx", "*就业信息*.xls", "就业信息*.xlsx", "就业信息*.xls"):
        files.extend(data_root.glob(pat))
        files.extend(data_root.rglob(pat))
    # unique, skip temp
    seen: set[Path] = set()
    out: list[Path] = []
    for p in files:
        rp = p.resolve()
        if p.name.startswith("~$") or rp in seen:
            continue
        seen.add(rp)
        out.append(p)
    out.sort(key=lambda p: p.name)
    return out


async def import_employment_flexible(data_root: Path, college: College) -> dict[str, int]:
    stats = {"create": 0, "update": 0, "skip": 0, "files": 0}
    paths = _employment_files(data_root)
    if not paths:
        return {"missing": 1}
    for path in paths:
        stats["files"] += 1
        rows = read_tabular(path)
        print(f"[employment] {path.name} rows={len(rows)}")
        for row in rows:
            sid = _norm_sid(_pick(row, "学号"))
            if not sid:
                stats["skip"] += 1
                continue
            payload = {
                "college_id": college.id,
                "name": _pick(row, "姓名") or None,
                "education_level": _pick(row, "学历") or None,
                "education_status": _pick(row, "学历状况") or None,
                "major_name": _pick(row, "专业名称", "专业") or None,
                "class_name": _pick(row, "班级名称", "班级") or None,
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


# ---------- graduates ----------


async def import_graduates(data_root: Path, college: College) -> dict[str, int]:
    stats = {"create": 0, "update": 0, "skip": 0, "files": 0}
    cands = list(data_root.glob("*研究生名册*")) + list(data_root.rglob("*研究生名册*"))
    seen: set[Path] = set()
    uniq: list[Path] = []
    for p in cands:
        if not p.is_file() or p.name.startswith("~$"):
            continue
        rp = p.resolve()
        if rp in seen:
            continue
        seen.add(rp)
        uniq.append(p)
    if not uniq:
        return {"missing": 1}
    for path in uniq:
        stats["files"] += 1
        rows = read_tabular(path)
        print(f"[graduates] {path.name} rows={len(rows)}")
        for row in rows:
            sid = _norm_sid(_pick(row, "学号"))
            name = _clean_name(_pick(row, "姓名"))
            mentor = _pick(row, "导师")
            if "放弃" in mentor or "保留学籍" in mentor:
                stats["skip"] += 1
                continue
            if not sid and not name:
                stats["skip"] += 1
                continue
            grade = _to_int(_pick(row, "年级"))
            phone = _norm_phone(_pick(row, "电话", "手机", "联系电话", "联系方式"))
            dorm = _pick(row, "寝室", "宿舍", "宿舍号") or None
            political = _pick(row, "是否党员", "政治面貌") or None
            if political == "否":
                political = "群众"
            elif political and "预备" in political:
                political = "预备党员"
            elif political == "是":
                political = "党员"

            before = await StudentProfile.get_or_none(student_no=sid) if sid else None
            await _upsert_contact(
                student_id=sid or None,
                name=name or None,
                phone=phone,
                dormitory=dorm,
                political_status=political,
                advisor_name=mentor or None,
                education_level="研究生",
                major_name=_pick(row, "专业") or None,
                class_name=_pick(row, "研究方向") or None,
                campus=None,
                enrollment_year=grade,
                gender=_pick(row, "性别") or None,
                college=college,
            )
            if before:
                stats["update"] += 1
            else:
                stats["create"] += 1
    return stats


# ---------- leadership ----------


async def _upsert_leadership_tag(
    college: College,
    student_id: str,
    reason: str,
    grade: int | None = None,
) -> None:
    profile = await StudentProfile.get_or_none(student_no=student_id)
    existing = await StudentTag.get_or_none(
        student_id=student_id,
        grade=grade,
        tag_type="high_potential",
        tag_key="leadership",
    )
    if existing:
        existing.reason = (reason or existing.reason or "")[:500]
        existing.source = "import"
        existing.college = college
        existing.profile = profile
        await existing.save()
    else:
        await StudentTag.create(
            college=college,
            profile=profile,
            student_id=student_id,
            grade=grade,
            tag_type="high_potential",
            tag_key="leadership",
            reason=(reason or "")[:500] or None,
            source="import",
        )


async def import_leadership(data_root: Path, college: College) -> dict[str, Any]:
    stats: dict[str, Any] = {
        "roles": 0,
        "matched": 0,
        "unmatched": 0,
        "tags": 0,
        "files": 0,
        "unmatched_samples": [],
    }
    index = await _name_class_index(college)

    # wipe previous import for this college then re-import
    await StudentLeadershipRole.filter(college_id=college.id).delete()
    await StudentTag.filter(
        college_id=college.id, tag_key="leadership", source="import"
    ).delete()

    base = data_root / "学生数据信息"
    roots = [base, data_root] if base.exists() else [data_root]

    # 班委
    cadre_files: list[Path] = []
    for root in roots:
        cadre_files.extend((root / "班委任职情况").glob("*.xlsx") if (root / "班委任职情况").exists() else [])
        cadre_files.extend(root.glob("*班委*.xlsx"))
    cadre_files = [p for p in dict.fromkeys(cadre_files) if not p.name.startswith("~$")]

    for path in cadre_files:
        stats["files"] += 1
        year_hint = _grade_from_text(path.name) or _grade_from_text(path.stem)
        academic_year = f"{year_hint}级" if year_hint else path.stem
        sheets = list_sheet_names(path)
        print(f"[leadership/cadre] {path.name} sheets={sheets}")

        # prefer detail sheets with 学号
        for sn in sheets:
            rows = read_tabular(path, sheet_name=sn)
            if not rows:
                continue
            has_sid = any(_pick(r, "学号") for r in rows[:5])
            has_role = any(_pick(r, "职位", "职务") for r in rows[:5])
            if not has_role and sn == "班委总表":
                # wide pivot: 班级 + 各职务列为人名
                for row in rows:
                    class_name = _pick(row, "班级")
                    for role_title, person in row.items():
                        if role_title in ("班级",) or not person:
                            continue
                        if role_title.startswith("col_"):
                            continue
                        name = _clean_name(person)
                        if not name or name == class_name:
                            continue
                        sid = _resolve_sid(index, name, class_name)
                        if not sid:
                            stats["unmatched"] += 1
                            if len(stats["unmatched_samples"]) < 20:
                                stats["unmatched_samples"].append(f"{name}/{class_name}")
                            continue
                        stats["matched"] += 1
                        profile = await _upsert_contact(
                            student_id=sid,
                            name=name,
                            college=college,
                            class_name=class_name or None,
                        )
                        await StudentLeadershipRole.create(
                            college=college,
                            profile=profile,
                            student_id=sid,
                            name=name,
                            role_kind="class_committee",
                            role_title=role_title,
                            class_name=class_name or None,
                            academic_year=academic_year,
                            source_file=path.name,
                        )
                        stats["roles"] += 1
                        await _upsert_leadership_tag(
                            college, sid, f"班委:{role_title}", year_hint
                        )
                        stats["tags"] += 1
                continue

            if not has_role:
                continue

            last_class = ""
            for row in rows:
                class_name = _pick(row, "班级") or last_class
                if _pick(row, "班级"):
                    last_class = _pick(row, "班级")
                role_title = _pick(row, "职位", "职务")
                name = _clean_name(_pick(row, "姓名"))
                if not role_title or not name:
                    continue
                sid = _norm_sid(_pick(row, "学号")) or _resolve_sid(index, name, class_name)
                phone = _norm_phone(_pick(row, "联系电话", "联系方式", "手机", "电话"))
                address = _pick(row, "现家庭住址", "家庭住址", "地址") or None
                dorm = _pick(row, "宿舍号", "宿舍", "寝室") or None
                if not sid:
                    stats["unmatched"] += 1
                    if len(stats["unmatched_samples"]) < 20:
                        stats["unmatched_samples"].append(f"{name}/{class_name}")
                    # still store role without sid
                    await StudentLeadershipRole.create(
                        college=college,
                        student_id=None,
                        name=name,
                        role_kind="class_committee",
                        role_title=role_title,
                        class_name=class_name or None,
                        academic_year=academic_year,
                        phone=phone,
                        address=address,
                        dormitory=dorm,
                        political_status=_pick(row, "政治面貌") or None,
                        gender=_pick(row, "性别") or None,
                        source_file=f"{path.name}#{sn}",
                    )
                    stats["roles"] += 1
                    continue

                stats["matched"] += 1
                profile = await _upsert_contact(
                    student_id=sid,
                    name=name,
                    phone=phone,
                    address=address,
                    dormitory=dorm,
                    political_status=_pick(row, "政治面貌") or None,
                    gender=_pick(row, "性别") or None,
                    class_name=class_name or None,
                    college=college,
                )
                await StudentLeadershipRole.create(
                    college=college,
                    profile=profile,
                    student_id=sid,
                    name=name,
                    role_kind="class_committee",
                    role_title=role_title,
                    class_name=class_name or None,
                    academic_year=academic_year,
                    phone=phone,
                    address=address,
                    dormitory=dorm,
                    political_status=_pick(row, "政治面貌") or None,
                    gender=_pick(row, "性别") or None,
                    source_file=f"{path.name}#{sn}",
                )
                stats["roles"] += 1
                await _upsert_leadership_tag(college, sid, f"班委:{role_title}", year_hint)
                stats["tags"] += 1

    # 部门干部
    org_files: list[Path] = []
    for root in roots:
        org_files.extend(root.glob("*部门干部*.xlsx"))
    org_files = [p for p in dict.fromkeys(org_files) if not p.name.startswith("~$")]
    for path in org_files:
        stats["files"] += 1
        academic_year = "2026-2027" if "2026-2027" in path.name else path.stem
        campus = "佛山" if "佛山" in path.name else ("广州" if "广州" in path.name else None)
        rows = read_tabular(path)
        print(f"[leadership/org] {path.name} rows={len(rows)}")
        last_dept = ""
        for row in rows:
            dept = _pick(row, "所属部门") or last_dept
            if _pick(row, "所属部门"):
                last_dept = _pick(row, "所属部门")
            role_title = _pick(row, "职位", "职务")
            name = _clean_name(_pick(row, "姓名"))
            class_name = _pick(row, "班级")
            if not role_title or not name:
                continue
            sid = _resolve_sid(index, name, class_name)
            phone = _norm_phone(_pick(row, "联系电话", "联系方式", "手机", "电话"))
            dorm = _pick(row, "宿舍号", "宿舍", "寝室") or None
            address = _pick(row, "现家庭住址", "家庭住址", "地址") or None
            if sid:
                stats["matched"] += 1
                profile = await _upsert_contact(
                    student_id=sid,
                    name=name,
                    phone=phone,
                    address=address,
                    dormitory=dorm,
                    class_name=class_name or None,
                    campus=campus or _pick(row, "校区") or None,
                    college=college,
                )
            else:
                stats["unmatched"] += 1
                if len(stats["unmatched_samples"]) < 20:
                    stats["unmatched_samples"].append(f"{name}/{class_name}")
                profile = None
            await StudentLeadershipRole.create(
                college=college,
                profile=profile,
                student_id=sid or None,
                name=name,
                role_kind="student_org",
                role_title=role_title,
                department=dept or None,
                class_name=class_name or None,
                campus=campus or _pick(row, "校区") or None,
                academic_year=academic_year,
                phone=phone,
                address=address,
                dormitory=dorm,
                source_file=path.name,
            )
            stats["roles"] += 1
            if sid:
                await _upsert_leadership_tag(
                    college, sid, f"学生组织:{dept}-{role_title}", None
                )
                stats["tags"] += 1

    return stats


# ---------- awards / projects / papers ----------


_MEMBER_SPLIT = re.compile(r"[,，、;/；\n\r]+")


def _award_files(data_root: Path) -> list[Path]:
    files: list[Path] = []
    for root in (data_root, data_root / "学生数据信息", data_root / "学生数据信息" / "省级以上获奖数据"):
        if not root.exists():
            continue
        files.extend(root.glob("*获奖*.xlsx"))
        files.extend(root.glob("*荣誉*.xlsx"))
    return [p for p in dict.fromkeys(files) if not p.name.startswith("~$")]


def _split_member_names(text: str | None) -> list[str]:
    if not text:
        return []
    s = str(text).strip()
    if not s or s in ("无", "无其他成员", "无其他", "-", "—", "/", "无队员"):
        return []
    names: list[str] = []
    for part in _MEMBER_SPLIT.split(s):
        n = _clean_name(part)
        if n and n not in ("无", "等"):
            names.append(n)
    return list(dict.fromkeys(names))


def _award_dedupe_key(
    college_id: int | None,
    student_id: str,
    contest: str,
    awarded_on: str | None,
    award_rank: str | None,
    role: str,
) -> str:
    return "|".join(
        [
            str(college_id or ""),
            student_id or "",
            (contest or "").strip()[:200],
            (awarded_on or "").strip()[:32],
            (award_rank or "").strip()[:32],
            role or "primary",
        ]
    )


def _project_dedupe_key(
    college_id: int | None,
    student_id: str,
    title: str,
    role: str,
) -> str:
    return "|".join(
        [
            str(college_id or ""),
            student_id or "",
            (title or "").strip()[:300],
            role or "leader",
        ]
    )


def _paper_dedupe_key(
    college_id: int | None,
    student_id: str,
    title: str,
    published_on: str | None,
) -> str:
    return "|".join(
        [
            str(college_id or ""),
            student_id or "",
            (title or "").strip()[:300],
            (published_on or "").strip()[:32],
        ]
    )


async def _refresh_competition_wide(student_ids: set[str]) -> None:
    for sid in student_ids:
        details = await CompetitionAward.filter(student_id=sid).order_by("-id").limit(20)
        cnt = await CompetitionAward.filter(student_id=sid).count()
        detail_txt = "；".join(
            f"{d.contest_name}/{d.award_level or ''}/{d.award_rank or ''}"
            + ("" if d.member_role == "primary" else "(队友)")
            for d in details
        )
        for rec in await StudentAcademicRecord.filter(student_id=sid):
            rec.competition_award_count = cnt
            rec.competition_award_detail = detail_txt[:2000]
            await rec.save()


async def _ensure_rural_tag(
    college: College,
    sid: str,
    profile: StudentProfile | None,
    title: str,
) -> None:
    existing = await StudentTag.get_or_none(
        student_id=sid,
        tag_type="high_potential",
        tag_key="rural",
        grade=None,
    )
    reason = f"双百工程:{title}"[:500]
    if existing:
        existing.source = "import"
        existing.reason = reason
        await existing.save()
    else:
        await StudentTag.create(
            college=college,
            profile=profile,
            student_id=sid,
            tag_type="high_potential",
            tag_key="rural",
            reason=reason,
            source="import",
        )


async def import_awards(data_root: Path, college: College) -> dict[str, Any]:
    stats = {
        "awards": 0,
        "award_teammates": 0,
        "projects": 0,
        "project_members": 0,
        "papers": 0,
        "files": 0,
        "skip": 0,
        "teammate_unmatched": 0,
    }
    paths = _award_files(data_root)
    if not paths:
        return {"missing": 1}

    await CompetitionAward.filter(college_id=college.id).delete()
    for path in paths:
        await StudentProject.filter(college_id=college.id, source_file=path.name).delete()
        await StudentPaper.filter(college_id=college.id, source_file=path.name).delete()

    name_idx = await _name_class_index(college)
    touched_award_sids: set[str] = set()

    for path in paths:
        stats["files"] += 1
        sheets = list_sheet_names(path)
        print(f"[awards] {path.name} sheets={sheets}")

        for sn in sheets:
            rows = read_tabular(path, sheet_name=sn)
            if not rows:
                continue
            if "竞赛" in sn or "奖励" in sn:
                for row in rows:
                    sid = _norm_sid(_pick(row, "学号"))
                    contest = _pick(row, "竞赛名称")
                    name = _clean_name(_pick(row, "学生姓名", "姓名"))
                    if not contest or not sid:
                        stats["skip"] += 1
                        continue
                    major_name = _pick(row, "专业（全称）", "专业") or None
                    class_name = _pick(row, "班级（2X级+专业+X班）", "班级") or None
                    organizer = _pick(row, "主办单位") or None
                    contest_category = _pick(row, "竞赛类别") or None
                    award_level = _pick(row, "获奖类别") or None
                    award_rank = _pick(row, "获奖等级") or None
                    contest_type = _pick(row, "竞赛类型") or None
                    awarded_on = _excel_date(_pick(row, "获奖时间"))
                    team_size = _to_int(_pick(row, "获奖人数"))
                    teammates_raw = (
                        _pick(row, "团队其他成员（请按证书顺序撰写）", "团队其他成员") or None
                    )
                    advisor = _pick(row, "指导老师") or None
                    note = _pick(row, "备注") or None

                    profile = await _upsert_contact(
                        student_id=sid,
                        name=name or None,
                        major_name=major_name,
                        class_name=class_name,
                        college=college,
                    )
                    primary_key = _award_dedupe_key(
                        college.id, sid, contest, awarded_on, award_rank, "primary"
                    )
                    if not await CompetitionAward.get_or_none(
                        college_id=college.id, dedupe_key=primary_key
                    ):
                        await CompetitionAward.create(
                            college=college,
                            profile=profile,
                            student_id=sid,
                            name=name or None,
                            major_name=major_name,
                            class_name=class_name,
                            contest_name=contest,
                            organizer=organizer,
                            contest_category=contest_category,
                            award_level=award_level,
                            award_rank=award_rank,
                            contest_type=contest_type,
                            awarded_on=awarded_on,
                            team_size=team_size,
                            teammates=teammates_raw,
                            advisor=advisor,
                            note=note,
                            member_role="primary",
                            primary_student_id=sid,
                            dedupe_key=primary_key,
                            source_file=path.name,
                        )
                        stats["awards"] += 1
                        touched_award_sids.add(sid)
                    else:
                        stats["skip"] += 1
                        touched_award_sids.add(sid)

                    for mate_name in _split_member_names(teammates_raw):
                        if mate_name == name:
                            continue
                        mate_sid = _resolve_sid(name_idx, mate_name, class_name or "")
                        if not mate_sid:
                            stats["teammate_unmatched"] += 1
                            continue
                        if mate_sid == sid:
                            continue
                        mate_key = _award_dedupe_key(
                            college.id,
                            mate_sid,
                            contest,
                            awarded_on,
                            award_rank,
                            "teammate",
                        )
                        existing = await CompetitionAward.get_or_none(
                            college_id=college.id, dedupe_key=mate_key
                        )
                        if existing:
                            continue
                        mate_profile = await _upsert_contact(
                            student_id=mate_sid, name=mate_name, college=college
                        )
                        await CompetitionAward.create(
                            college=college,
                            profile=mate_profile,
                            student_id=mate_sid,
                            name=mate_name,
                            contest_name=contest,
                            organizer=organizer,
                            contest_category=contest_category,
                            award_level=award_level,
                            award_rank=award_rank,
                            contest_type=contest_type,
                            awarded_on=awarded_on,
                            team_size=team_size,
                            teammates=None,
                            advisor=advisor,
                            note=f"队友·主获奖人:{name or sid}"[:255],
                            member_role="teammate",
                            primary_student_id=sid,
                            dedupe_key=mate_key,
                            source_file=path.name,
                        )
                        stats["award_teammates"] += 1
                        touched_award_sids.add(mate_sid)

            elif "课题" in sn:
                for row in rows:
                    title = _pick(row, "项目名称")
                    name = _clean_name(_pick(row, "姓名", "项目负责人"))
                    if not title:
                        stats["skip"] += 1
                        continue
                    sid = _norm_sid(_pick(row, "学号"))
                    if not sid and name:
                        sid = _resolve_sid(name_idx, name, "")
                    ptype = _pick(row, "项目类型") or None
                    pcat = _pick(row, "项目类别") or None
                    plevel = _pick(row, "项目级别") or None
                    leader = _pick(row, "项目负责人") or name or None
                    members_raw = (
                        _pick(row, "项目其他成员（请按结项证书排序撰写）", "项目其他成员")
                        or None
                    )
                    advisor = _pick(row, "指导老师") or None
                    result_grade = _pick(row, "结项等级") or None

                    profile = None
                    if sid:
                        profile = await _upsert_contact(
                            student_id=sid, name=name or None, college=college
                        )
                    leader_key = _project_dedupe_key(
                        college.id, sid or f"name:{name}", title, "leader"
                    )
                    if not await StudentProject.get_or_none(
                        college_id=college.id, dedupe_key=leader_key
                    ):
                        await StudentProject.create(
                            college=college,
                            profile=profile,
                            student_id=sid or None,
                            name=name or None,
                            project_type=ptype,
                            project_category=pcat,
                            project_level=plevel,
                            title=title,
                            leader=leader,
                            members=members_raw,
                            advisor=advisor,
                            result_grade=result_grade,
                            member_role="leader",
                            dedupe_key=leader_key,
                            source_file=path.name,
                        )
                        stats["projects"] += 1
                    else:
                        stats["skip"] += 1
                    if sid and ptype and "双百" in ptype:
                        await _ensure_rural_tag(college, sid, profile, title)

                    for mem_name in _split_member_names(members_raw):
                        if mem_name == name:
                            continue
                        mem_sid = _resolve_sid(name_idx, mem_name, "")
                        if not mem_sid:
                            stats["teammate_unmatched"] += 1
                            continue
                        if sid and mem_sid == sid:
                            continue
                        mem_key = _project_dedupe_key(
                            college.id, mem_sid, title, "member"
                        )
                        if await StudentProject.get_or_none(
                            college_id=college.id, dedupe_key=mem_key
                        ):
                            continue
                        mem_profile = await _upsert_contact(
                            student_id=mem_sid, name=mem_name, college=college
                        )
                        await StudentProject.create(
                            college=college,
                            profile=mem_profile,
                            student_id=mem_sid,
                            name=mem_name,
                            project_type=ptype,
                            project_category=pcat,
                            project_level=plevel,
                            title=title,
                            leader=leader,
                            members=None,
                            advisor=advisor,
                            result_grade=result_grade,
                            member_role="member",
                            dedupe_key=mem_key,
                            source_file=path.name,
                        )
                        stats["project_members"] += 1
                        if ptype and "双百" in ptype:
                            await _ensure_rural_tag(college, mem_sid, mem_profile, title)

            elif "论文" in sn:
                for row in rows:
                    sid = _norm_sid(_pick(row, "学号"))
                    title = _pick(row, "论文名称")
                    if not sid or not title:
                        stats["skip"] += 1
                        continue
                    name = _clean_name(_pick(row, "学生姓名", "姓名"))
                    published_on = _pick(row, "发表时间") or None
                    profile = await _upsert_contact(
                        student_id=sid, name=name or None, college=college
                    )
                    paper_key = _paper_dedupe_key(college.id, sid, title, published_on)
                    if await StudentPaper.get_or_none(
                        college_id=college.id, dedupe_key=paper_key
                    ):
                        continue
                    await StudentPaper.create(
                        college=college,
                        profile=profile,
                        student_id=sid,
                        name=name or None,
                        title=title,
                        journal=_pick(row, "发表期刊") or None,
                        published_on=published_on,
                        author_order=_pick(row, "作者排序") or None,
                        indexed_in=_pick(row, "收录情况") or None,
                        dedupe_key=paper_key,
                        source_file=path.name,
                    )
                    stats["papers"] += 1

    await _refresh_competition_wide(touched_award_sids)

    award_sids = await CompetitionAward.filter(college_id=college.id).values_list(
        "student_id", flat=True
    )
    for sid in sorted({s for s in award_sids if s}):
        profile = await StudentProfile.get_or_none(student_no=sid)
        n = await CompetitionAward.filter(student_id=sid).count()
        existing = await StudentTag.get_or_none(
            student_id=sid,
            tag_type="high_potential",
            tag_key="competition",
            grade=None,
        )
        reason = f"竞赛获奖{n}项"
        if existing and existing.source == "import":
            existing.reason = reason
            await existing.save()
        elif existing is None:
            await StudentTag.create(
                college=college,
                profile=profile,
                student_id=sid,
                tag_type="high_potential",
                tag_key="competition",
                reason=reason,
                source="import",
            )
    return stats


# ---------- teaching hours ----------


async def import_teaching_hours(data_root: Path, college: College) -> dict[str, int]:
    stats = {"create": 0, "files": 0, "skip": 0}
    files = list(data_root.glob("*课时数据*.xls")) + list(data_root.glob("*课时数据*.xlsx"))
    files = [p for p in files if not p.name.startswith("~$")]
    if not files:
        return {"missing": 1}
    await TeachingCourseHour.filter(college_id=college.id).delete()
    for path in files:
        stats["files"] += 1
        m = re.search(r"(20\d{2}-20\d{2}-\d)", path.name)
        term = m.group(1) if m else path.stem
        rows = read_tabular(path)
        print(f"[teaching_hours] {path.name} rows={len(rows)} term={term}")
        for row in rows:
            course = _pick(row, "课程名称")
            if not course:
                stats["skip"] += 1
                continue
            await TeachingCourseHour.create(
                college=college,
                term=term,
                course_name=course,
                teacher_name=_pick(row, "授课教师") or None,
                teacher_department=_pick(row, "教师所在部门") or None,
                class_name=_pick(row, "上课班级") or None,
                total_hours=_to_decimal(_pick(row, "总学时（16周）", "总学时")),
                weekly_hours=_to_decimal(_pick(row, "每周学时")),
                source_file=path.name,
            )
            stats["create"] += 1
    return stats


# ---------- internships ----------


def _internship_files(data_root: Path) -> list[Path]:
    files = list(data_root.glob("*实习*.xlsx")) + list(data_root.glob("*实习*.xls"))
    files += list(data_root.rglob("*实习数据*.xlsx"))
    out: list[Path] = []
    seen: set[Path] = set()
    for p in files:
        if p.name.startswith("~$") or not p.is_file():
            continue
        rp = p.resolve()
        if rp in seen:
            continue
        seen.add(rp)
        out.append(p)
    return sorted(out, key=lambda x: x.name)


def _snapshot_month_from_name(name: str) -> str | None:
    m = re.search(r"(20\d{2})\s*年\s*(\d{1,2})\s*月", name)
    if m:
        return f"{m.group(1)}-{int(m.group(2)):02d}"
    m = re.search(r"(20\d{2})\s*届\s*(\d{1,2})\s*月", name)
    if m:
        return f"{m.group(1)}-{int(m.group(2)):02d}"
    m = re.search(r"(20\d{2})[-_/]?(\d{1,2})", name)
    if m and int(m.group(2)) <= 12:
        return f"{m.group(1)}-{int(m.group(2)):02d}"
    return None


async def import_internships(data_root: Path, college: College) -> dict[str, Any]:
    stats: dict[str, Any] = {"create": 0, "files": 0, "skip": 0, "tags": 0}
    paths = _internship_files(data_root)
    if not paths:
        return {"missing": 1}

    # 按本次文件全量替换本学院实习（避免 4月/5月重复叠加同人多快照时可保留 snapshot_month）
    await StudentInternship.filter(college_id=college.id).delete()
    await StudentTag.filter(
        college_id=college.id, tag_key="internship", source="import"
    ).delete()

    tagged: set[str] = set()
    for path in paths:
        stats["files"] += 1
        snap = _snapshot_month_from_name(path.name)
        rows = read_tabular(path)
        print(f"[internships] {path.name} rows={len(rows)} snapshot={snap}")
        for row in rows:
            sid = _norm_sid(_pick(row, "学号"))
            if not sid:
                stats["skip"] += 1
                continue
            name = _clean_name(_pick(row, "学生姓名", "姓名"))
            address = _pick(row, "实习详细地址", "详细地址", "地址") or None
            profile = await _upsert_contact(
                student_id=sid,
                name=name or None,
                class_name=_pick(row, "班级") or None,
                major_name=_pick(row, "专业") or None,
                enrollment_year=_to_int(_pick(row, "入学年份")),
                college=college,
            )
            # 实习地址写到主档 address（若主档尚无家庭地址）
            if address and profile and not profile.address:
                profile.address = address
                await profile.save()

            await StudentInternship.create(
                college=college,
                profile=profile,
                student_id=sid,
                name=name or None,
                enrollment_year=_to_int(_pick(row, "入学年份")),
                department=_pick(row, "院系") or None,
                class_name=_pick(row, "班级") or None,
                major_name=_pick(row, "专业") or None,
                course_name=_pick(row, "课程名称") or None,
                course_code=_pick(row, "课程代码") or None,
                credits=_pick(row, "学分") or None,
                internship_type=_pick(row, "实习类型") or None,
                organization_form=_pick(row, "实习组织形式") or None,
                practice_mode=_pick(row, "实习方式") or None,
                academic_year=_pick(row, "学年") or None,
                school_advisor=_pick(row, "校内指导老师姓名", "校内指导老师") or None,
                company_name=_pick(row, "实习单位名称") or None,
                company_credit_code=_pick(row, "实习单位统一社会信用代码") or None,
                region=_pick(row, "实习地区及代码", "实习地区") or None,
                address=address,
                job_title=_pick(row, "实习岗位") or None,
                start_date=_pick(row, "实习开始时间") or None,
                end_date=_pick(row, "实习结束时间") or None,
                days=_to_int(_pick(row, "实际实习天数")),
                salary=_pick(row, "实习报酬（元/月）", "实习报酬") or None,
                company_mentor=_pick(row, "企业指导人员姓名") or None,
                has_liability_insurance=_pick(row, "是否有实习责任险") or None,
                has_accident_insurance=_pick(row, "是否有人身意外险") or None,
                safety_trained=_pick(row, "是否进行实习安全教育和培训") or None,
                signed_tripartite=_pick(row, "是否签订实习三方协议") or None,
                is_base=_pick(row, "实习单位是否为校级及以上实习基地") or None,
                audit_status=_pick(row, "审核状态") or None,
                snapshot_month=snap,
                source_file=path.name,
            )
            stats["create"] += 1
            if sid not in tagged:
                tagged.add(sid)
                company = _pick(row, "实习单位名称") or "实习"
                await StudentTag.create(
                    college=college,
                    profile=profile,
                    student_id=sid,
                    tag_type="high_potential",
                    tag_key="internship",
                    reason=f"实习经历:{company}"[:500],
                    source="import",
                )
                stats["tags"] += 1
    return stats
