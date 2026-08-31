"""师资建设图谱：从 teachers / teaching_course_hours / 学生主档 / 成果表聚合。

缺源字段统一用 MISSING='**' 占位，避免 mock 假数。
"""

from __future__ import annotations

from collections import Counter, defaultdict
from decimal import Decimal
from typing import Any

from Utils.Analytics.faculty_psi import (
    NEW_TARGET_PHD,
    NEW_TARGET_SENIOR,
    NEW_TARGET_TALENT,
    RESEARCH_TARGET_FUNDING,
    RESEARCH_TARGET_PAPERS,
    RESEARCH_TARGET_PROJECTS,
    build_warning_center,
    collect_output_years,
    compose_psi,
    current_year,
    eval_course_support,
    eval_new,
    eval_research,
    five_year_cutoff,
    health_from_psi,
    is_ns_provincial,
    match_student_count,
    metrics_from_psi,
    parse_funding,
    parse_year,
    scale_target,
    suggestions_from_scores,
)
from Utils.DB.Models.college_ext_models import AchievementItem, Teacher, TeacherHonor
from Utils.DB.Models.college_student_models import StudentProfile
from Utils.DB.Models.course_models import Course
from Utils.DB.Models.external_data_models import ResearchIp, ResearchPaper, ResearchProject
from Utils.DB.Models.student_extra_models import TeachingCourseHour
from Utils.DB.read.college_db import resolve_college
from Utils.DB.read.schema_compat import fetch_compat

MISSING = "**"

# 教学负荷阈值（学期学时）；超出计为超负荷。学年标准约 240 → 学期约 120；超负荷学年约 320 → 学期 160
STANDARD_HOURS = 120
OVERLOAD_HOURS = 160
# 管理目标（无官方目标表时作诊断口径）
TARGET_PHD_RATIO = 80.0
TARGET_STU_TEACHER = 16.0

# 学期课时分布分箱
HOUR_BINS = (
    ("0-80", 0, 80),
    ("80-120", 80, 120),
    ("120-160", 120, 160),
    ("160+", 160, 10**9),
)


def _s(v: Any) -> str:
    return str(v or "").strip()


def _f(v: Decimal | float | int | None) -> float:
    return float(v or 0)


def _round1(v: float) -> float:
    return round(v, 1)


def _pct(part: int, total: int) -> float:
    if total <= 0:
        return 0.0
    return _round1(part * 100.0 / total)


def _is_senior(t: Teacher) -> bool:
    title = _s(t.title)
    level = _s(getattr(t, "title_level", None))
    if level in ("正高级", "副高级"):
        return True
    return any(k in title for k in ("教授", "副教授", "研究员", "副研究员", "高级"))


def _is_professor(t: Teacher) -> bool:
    title = _s(t.title)
    level = _s(getattr(t, "title_level", None))
    if level == "正高级":
        return True
    return any(k in title for k in ("教授",)) and "副教授" not in title


def _is_associate(t: Teacher) -> bool:
    title = _s(t.title)
    level = _s(getattr(t, "title_level", None))
    if level == "副高级":
        return True
    return "副教授" in title or "副研究员" in title


def _is_phd(t: Teacher) -> bool:
    if t.is_phd is True:
        return True
    if t.is_phd is False:
        return False
    blob = f"{_s(t.degree)}{_s(getattr(t, 'education', None))}"
    return "博士" in blob


def _edu_bucket(t: Teacher) -> str:
    blob = f"{_s(t.degree)}{_s(getattr(t, 'education', None))}"
    if "博士" in blob:
        return "博士"
    if "硕士" in blob:
        return "硕士"
    if "学士" in blob or "本科" in blob:
        return "学士及其他"
    return MISSING


def _hire_year(t: Teacher) -> int | None:
    return parse_year(getattr(t, "school_hire_date", None)) or parse_year(
        getattr(t, "hire_date", None)
    )


def _title_bucket(t: Teacher) -> str:
    if _is_professor(t):
        return "教授"
    if _is_associate(t):
        return "副教授"
    title = _s(t.title)
    if title:
        if "讲师" in title:
            return "讲师"
        if "助教" in title or "助理" in title:
            return "助教/助理"
        return title
    return MISSING


def _health_level_structure(phd_ratio: float, senior_ratio: float) -> str:
    if phd_ratio >= 70 and senior_ratio >= 40:
        return "优"
    if phd_ratio >= 50 and senior_ratio >= 25:
        return "中"
    if phd_ratio >= 30:
        return "紧"
    return "警"


def _health_level_load(avg_hours: float | None, overload_n: int, teacher_n: int) -> str:
    """按单学期平均课时与超负荷占比评级。"""
    if avg_hours is None:
        return "中"
    overload_ratio = (overload_n / teacher_n * 100) if teacher_n else 0
    if avg_hours <= 100 and overload_ratio < 10:
        return "优"
    if avg_hours <= 140 and overload_ratio < 20:
        return "中"
    if avg_hours <= 180:
        return "紧"
    return "警"


def _compose_term(academic_year: str | None, semester: str | None) -> str | None:
    ay = _s(academic_year)
    sem = _s(semester)
    if not ay or not sem:
        return None
    if sem in ("1", "2"):
        return f"{ay}-{sem}"
    if "一" in sem or sem.endswith("-1"):
        return f"{ay}-1"
    if "二" in sem or sem.endswith("-2"):
        return f"{ay}-2"
    return f"{ay}-{sem}"


def _term_sort_key(term: str) -> tuple:
    """YYYY-YYYY-N → 可比较；未知格式靠后。"""
    parts = term.split("-")
    if len(parts) >= 3 and parts[0].isdigit() and parts[1].isdigit() and parts[2].isdigit():
        return (int(parts[0]), int(parts[1]), int(parts[2]))
    return (0, 0, 0)


async def _list_available_terms(*, college_id: int | None) -> list[str]:
    qs = TeachingCourseHour.all()
    if college_id is not None:
        qs = qs.filter(college_id=college_id)
    raw = await qs.distinct().values_list("term", flat=True)
    terms = sorted({_s(t) for t in raw if _s(t)}, key=_term_sort_key, reverse=True)
    return terms


def _resolve_term(
    *,
    requested: str | None,
    available: list[str],
) -> tuple[str | None, bool]:
    """返回 (选用学期, 是否回退到有数据的最新学期)。"""
    req = _s(requested) or None
    if req and req in available:
        return req, False
    if available:
        return available[0], bool(req)
    return req, False


def _health_level_risk(warning_known: bool, overload_n: int, stu_ratio: float | None) -> str:
    if not warning_known:
        # 无预警源时，用负荷与生师比近似
        if stu_ratio is not None and stu_ratio > 22:
            return "警"
        if overload_n >= 10 or (stu_ratio is not None and stu_ratio > 18):
            return "紧"
        return "中"
    return "中"


def _score_from_levels(structure: str, load: str, risk: str) -> int:
    weight = {"优": 92, "中": 78, "紧": 62, "警": 45}
    return int(round((weight[structure] + weight[load] + weight[risk]) / 3))


class FacultyService:
    async def get_analytics(
        self,
        *,
        college_id: str | None = None,
        term: str | None = None,
        academic_year: str | None = None,
        semester: str | None = None,
    ) -> dict[str, Any]:
        base = await self._build_base(
            college_id=college_id,
            term=term,
            academic_year=academic_year,
            semester=semester,
        )
        return base["analytics"]

    async def get_analytics_detail(
        self,
        *,
        college_id: str | None = None,
        term: str | None = None,
        academic_year: str | None = None,
        semester: str | None = None,
    ) -> dict[str, Any]:
        base = await self._build_base(
            college_id=college_id,
            term=term,
            academic_year=academic_year,
            semester=semester,
        )
        detail = dict(base["analytics"])
        detail.update(base["detail"])
        return detail

    async def _build_base(
        self,
        *,
        college_id: str | None,
        term: str | None = None,
        academic_year: str | None = None,
        semester: str | None = None,
    ) -> dict[str, Any]:
        college = await resolve_college(college_id)
        teachers_qs = Teacher.filter(status="active")
        students_qs = StudentProfile.filter(status="active")
        if college:
            teachers_qs = teachers_qs.filter(college_id=college.id)
            students_qs = students_qs.filter(college_id=college.id)

        teachers = await fetch_compat(teachers_qs, Teacher)
        student_n = await students_qs.count()

        college_pk = college.id if college else None
        available_terms = await _list_available_terms(college_id=college_pk)
        requested_term = _s(term) or _compose_term(academic_year, semester)
        active_term, term_fallback = _resolve_term(
            requested=requested_term, available=available_terms
        )

        # 课时：严格按单一学期过滤，禁止跨学期混加
        hours_qs = TeachingCourseHour.all()
        if college:
            hours_qs = hours_qs.filter(college_id=college.id)
        if active_term:
            hours_qs = hours_qs.filter(term=active_term)
        else:
            hours_qs = hours_qs.filter(id=-1)  # 无学期可选时不返回任何课时
        hour_rows = await fetch_compat(hours_qs, TeachingCourseHour)

        talent_qs = AchievementItem.filter(section="talent")
        ach_qs = AchievementItem.all()
        honor_qs = TeacherHonor.all()
        project_qs = ResearchProject.all()
        paper_qs = ResearchPaper.all()
        ip_qs = ResearchIp.all()
        course_qs = Course.all()
        if college:
            talent_qs = talent_qs.filter(college_id=college.id)
            ach_qs = ach_qs.filter(college_id=college.id)
            honor_qs = honor_qs.filter(college_id=college.id)
            project_qs = project_qs.filter(college_id=college.id)
            paper_qs = paper_qs.filter(college_id=college.id)
            ip_qs = ip_qs.filter(college_id=college.id)
            course_qs = course_qs.filter(college_id=college.id)
        talent_n = await talent_qs.count()
        honor_rows = await fetch_compat(honor_qs, TeacherHonor)
        achievements = await fetch_compat(ach_qs, AchievementItem)
        honor_people_n = len({h.teacher_name for h in honor_rows})
        # 高层次人才人数优先按荣誉称号去重人数；无荣誉表数据时回退成果 talent 条目数
        talent_people_n = honor_people_n or talent_n

        projects = await fetch_compat(project_qs, ResearchProject)
        papers = await fetch_compat(paper_qs, ResearchPaper)
        ips = await fetch_compat(ip_qs, ResearchIp)
        courses = await fetch_compat(course_qs, Course)

        student_rows = await students_qs.values_list("teaching_department", "major_name")
        student_by_dept: Counter[str] = Counter()
        for td, mn in student_rows:
            key = _s(td) or _s(mn)
            if key:
                student_by_dept[key] += 1

        total = len(teachers)
        phd_n = sum(1 for t in teachers if _is_phd(t))
        senior_n = sum(1 for t in teachers if _is_senior(t))
        phd_ratio = _pct(phd_n, total) if total else None
        senior_ratio = _pct(senior_n, total) if total else None

        # 课时：仅汇总当前学期内按教师姓名
        hours_by_name: dict[str, float] = defaultdict(float)
        courses_by_name: dict[str, list[dict[str, Any]]] = defaultdict(list)
        teachers_by_course: dict[str, set[str]] = defaultdict(set)
        course_dept: dict[str, set[str]] = defaultdict(set)
        for h in hour_rows:
            name = _s(h.teacher_name)
            cname = _s(h.course_name)
            if name and cname:
                teachers_by_course[cname].add(name)
                dept_hint = _s(getattr(h, "teacher_department", None))
                if dept_hint:
                    course_dept[cname].add(dept_hint)
            if not name:
                continue
            hrs = _f(h.total_hours)
            hours_by_name[name] += hrs
            courses_by_name[name].append(
                {
                    "name": cname or MISSING,
                    "hours": hrs,
                    "studentCount": 0,
                    "semester": _s(h.term) or active_term or MISSING,
                    "className": _s(h.class_name) or MISSING,
                }
            )

        teacher_by_name = {_s(t.name): t for t in teachers if _s(t.name)}
        hour_values = list(hours_by_name.values())
        avg_hours = _round1(sum(hour_values) / len(hour_values)) if hour_values else None
        overload_names = [n for n, v in hours_by_name.items() if v > OVERLOAD_HOURS]
        overload_n = len(overload_names)

        stu_ratio = _round1(student_n / total) if total > 0 else None

        title_counter = Counter(_title_bucket(t) for t in teachers)
        title_structure = [
            {"title": k, "count": v}
            for k, v in sorted(title_counter.items(), key=lambda x: (-x[1], x[0]))
        ]

        load_lv = _health_level_load(avg_hours, overload_n, total or 1)

        year_now = current_year()
        cutoff = five_year_cutoff(year_now)
        ns_projects = [p for p in projects if is_ns_provincial(getattr(p, "level", None))]
        funding_total = sum(parse_funding(getattr(p, "funding", None)) for p in projects)
        research_score, research_meaning, research_incomplete = eval_research(
            project_n=len(ns_projects),
            paper_n=len(papers),
            funding=funding_total,
        )

        new_phd_n = sum(
            1
            for t in teachers
            if _hire_year(t) is not None and _hire_year(t) >= cutoff and _is_phd(t)
        )
        new_senior_n = sum(
            1
            for t in teachers
            if _hire_year(t) is not None and _hire_year(t) >= cutoff and _is_senior(t)
        )
        new_talent_n = len(
            {
                _s(h.teacher_name)
                for h in honor_rows
                if _s(h.teacher_name)
                and parse_year(h.year) is not None
                and parse_year(h.year) >= cutoff
            }
        )
        new_score, new_meaning, new_incomplete = eval_new(
            new_phd=new_phd_n,
            new_talent=new_talent_n,
            new_senior=new_senior_n,
        )

        course_leaders = {
            _s(c.name) for c in courses if _s(c.name) and _s(getattr(c, "leader", None))
        }
        course_rate, course_meaning, course_incomplete = eval_course_support(
            course_names_with_leader=course_leaders,
            teachers_by_course=teachers_by_course,
        )

        psi = compose_psi(
            stu_ratio=stu_ratio,
            phd_ratio=phd_ratio,
            senior_ratio=senior_ratio,
            course_rate=course_rate,
            course_incomplete=course_incomplete,
            course_meaning=course_meaning,
            research_score=research_score,
            research_meaning=research_meaning,
            research_incomplete=research_incomplete,
            new_score=new_score,
            new_meaning=new_meaning,
            new_incomplete=new_incomplete,
            research_raw=research_score,
            new_raw=new_score,
        )
        metrics = metrics_from_psi(psi)

        research_by_year, output_years = collect_output_years(
            papers=papers,
            projects=projects,
            ips=ips,
            achievements=achievements,
            honors=honor_rows,
            split_names=re_split_names,
        )
        term_year = parse_year(active_term) or year_now
        teaching_by_year: dict[int, dict[str, float]] = {
            term_year: {
                n: min(100.0, v * 100.0 / OVERLOAD_HOURS) for n, v in hours_by_name.items()
            }
        }
        hire_year_by_name = {_s(t.name): _hire_year(t) for t in teachers if _s(t.name)}
        warning_center = build_warning_center(
            teacher_by_name=teacher_by_name,
            hours_by_name=hours_by_name,
            avg_hours=avg_hours,
            research_by_year=research_by_year,
            teaching_by_year=teaching_by_year,
            output_years=output_years,
            hire_year_by_name=hire_year_by_name,
        )
        warn_sum = warning_center["summary"]
        risk_lv = _health_level_risk(warn_sum["totalWarnings"] > 0, overload_n, stu_ratio)
        health = health_from_psi(psi["score"], load_lv, risk_lv)

        term_label = active_term or MISSING
        insights = self._build_insights(
            total=total,
            phd_ratio=phd_ratio,
            senior_ratio=senior_ratio,
            avg_hours=avg_hours,
            overload_n=overload_n,
            stu_ratio=stu_ratio,
            talent_n=talent_people_n,
            title_counter=title_counter,
            term=term_label,
            psi=psi,
            warning_summary=warn_sum,
        )

        analytics: dict[str, Any] = {
            "term": active_term or MISSING,
            "requestedTerm": requested_term or MISSING,
            "termFallback": term_fallback,
            "availableTerms": available_terms,
            "standardHours": STANDARD_HOURS,
            "overloadHours": OVERLOAD_HOURS,
            "health": health,
            "supportIndex": psi,
            "warningSummary": warn_sum,
            "metrics": metrics,
            "insights": insights,
            "summary": {
                "totalTeachers": total,
                "phdRatio": phd_ratio if phd_ratio is not None else MISSING,
                "seniorTitleRatio": senior_ratio if senior_ratio is not None else MISSING,
                "avgTeachingHours": avg_hours if avg_hours is not None else MISSING,
                "modelTeacherCount": MISSING,
                "warningCount": warn_sum["totalWarnings"],
                "publicService": {"count": MISSING, "hours": MISSING},
                "highLevelTalentCount": talent_people_n if talent_people_n else MISSING,
                "studentTeacherRatio": f"1:{stu_ratio}" if stu_ratio is not None else MISSING,
                "excellentCount": MISSING,
            },
            "titleStructure": title_structure,
            "profile": {
                "teaching": MISSING,
                "research": MISSING,
                "socialService": MISSING,
            },
            "groups": {
                "excellent": {"count": MISSING, "ratio": MISSING, "momChange": MISSING},
                "warning": {"count": MISSING, "ratio": MISSING, "momChange": MISSING},
            },
            "highlights": self._highlights(
                talent_n=talent_people_n,
                project_n=len(projects),
                paper_n=len(papers),
                overload_n=overload_n,
                term=term_label,
            ),
        }

        detail = self._build_detail(
            teachers=teachers,
            teacher_by_name=teacher_by_name,
            hours_by_name=hours_by_name,
            courses_by_name=courses_by_name,
            title_counter=title_counter,
            total=total,
            phd_n=phd_n,
            phd_ratio=phd_ratio,
            avg_hours=avg_hours,
            overload_names=overload_names,
            projects=projects,
            papers=papers,
            student_n=student_n,
            stu_ratio=stu_ratio,
            talent_n=talent_people_n,
            term=term_label,
            honor_rows=honor_rows,
            teachers_by_course=teachers_by_course,
            course_leaders=course_leaders,
            student_by_dept=student_by_dept,
            warning_center=warning_center,
            cutoff=cutoff,
        )
        return {"analytics": analytics, "detail": detail}

    def _build_metrics(
        self,
        *,
        phd_ratio: float | None,
        senior_ratio: float | None,
        total: int,
        avg_hours: float | None,
        overload_n: int,
        stu_ratio: float | None,
        term: str,
    ) -> list[dict[str, Any]]:
        def metric(
            key: str,
            label: str,
            value: Any,
            unit: str,
            meaning: str,
            tone: str | None = None,
            target: Any = None,
        ) -> dict[str, Any]:
            item: dict[str, Any] = {
                "key": key,
                "label": label,
                "value": value if value is not None else MISSING,
                "unit": unit if value is not None and value != MISSING else "",
                "meaning": meaning,
            }
            if tone:
                item["tone"] = tone
            if target is not None:
                item["target"] = target
            return item

        if phd_ratio is None:
            phd_m = metric("phd", "博士占比", MISSING, "", "学位字段不足，暂无法统计")
        else:
            gap = _round1(TARGET_PHD_RATIO - phd_ratio)
            if gap > 0:
                phd_m = metric(
                    "phd",
                    "博士占比",
                    phd_ratio,
                    "%",
                    f"目标{TARGET_PHD_RATIO:g}%，还差{gap}pp",
                    "warn",
                    TARGET_PHD_RATIO,
                )
            else:
                phd_m = metric(
                    "phd",
                    "博士占比",
                    phd_ratio,
                    "%",
                    f"已达目标{TARGET_PHD_RATIO:g}%",
                    "ok",
                    TARGET_PHD_RATIO,
                )

        if senior_ratio is None:
            senior_m = metric("senior", "高级职称", MISSING, "", "职称字段不足，暂无法统计")
        else:
            senior_m = metric(
                "senior",
                "高级职称",
                senior_ratio,
                "%",
                f"教授/副教授等共占{senior_ratio}%",
                "ok" if senior_ratio >= 40 else "warn",
            )

        head_m = metric(
            "headcount",
            "队伍规模",
            total if total else MISSING,
            "人",
            f"在职专任/教职工花名册 {total} 人" if total else "花名册为空",
            "ok" if total else "warn",
        )

        if avg_hours is None:
            load_m = metric(
                "load",
                "教学负荷",
                MISSING,
                "",
                f"学期 {term} 暂无课时数据" if term != MISSING else "暂无课时数据",
            )
        else:
            load_m = metric(
                "load",
                "教学负荷",
                avg_hours,
                "学时",
                f"{term} 学期均课时；超负荷{overload_n}人（>{OVERLOAD_HOURS}学时/学期）",
                "risk" if overload_n >= 8 else ("warn" if overload_n > 0 else "ok"),
            )

        warn_m = metric(
            "warning",
            "预警态势",
            MISSING,
            "",
            "缺教师考核/预警源表",
            "warn",
        )

        if stu_ratio is None:
            stu_m = metric("stuTeacher", "生师比", MISSING, "", "教师或学生数为 0，无法计算")
        else:
            tone = "ok" if stu_ratio <= TARGET_STU_TEACHER else "warn"
            if stu_ratio > 20:
                tone = "risk"
            meaning = (
                f"目标≤{TARGET_STU_TEACHER:g}，当前偏紧"
                if stu_ratio > TARGET_STU_TEACHER
                else f"目标≤{TARGET_STU_TEACHER:g}，配置充裕"
            )
            stu_m = metric(
                "stuTeacher",
                "生师比",
                stu_ratio,
                ":1",
                meaning,
                tone,
                TARGET_STU_TEACHER,
            )

        return [phd_m, senior_m, head_m, load_m, warn_m, stu_m]

    def _build_insights(
        self,
        *,
        total: int,
        phd_ratio: float | None,
        senior_ratio: float | None,
        avg_hours: float | None,
        overload_n: int,
        stu_ratio: float | None,
        talent_n: int,
        title_counter: Counter,
        term: str,
        psi: dict[str, Any] | None = None,
        warning_summary: dict[str, Any] | None = None,
    ) -> list[str]:
        tips: list[str] = []
        if psi:
            tips.append(
                f"专业支撑指数 {psi['score']}，{psi['gradeLabel']}（{psi['grade']}）{'★' * psi['stars']}"
            )
            if psi.get("strengths"):
                tips.append("优势：" + "、".join(psi["strengths"]))
            if psi.get("weaknesses"):
                tips.append("待提升：" + "、".join(psi["weaknesses"]))
        if warning_summary:
            tips.append(
                f"预警 {warning_summary.get('totalWarnings', 0)} 条"
                f"（红 {warning_summary.get('redCount', 0)} / 黄 {warning_summary.get('yellowCount', 0)}）"
            )
        if total:
            tips.append(f"当前在职教职工/专任花名册共 {total} 人")
        if phd_ratio is not None:
            tips.append(f"博士学位占比 {phd_ratio}%（目标 {TARGET_PHD_RATIO:g}%）")
        else:
            tips.append(f"博士占比：{MISSING}（学位字段不全）")
        if senior_ratio is not None:
            tips.append(f"高级职称占比 {senior_ratio}%")
        prof = title_counter.get("教授", 0)
        asso = title_counter.get("副教授", 0)
        if prof or asso:
            tips.append(f"职称结构：教授 {prof} 人 · 副教授 {asso} 人")
        if avg_hours is not None:
            tips.append(
                f"学期 {term} 有课教师平均课时 {avg_hours}，超负荷 {overload_n} 人（阈值 {OVERLOAD_HOURS} 学时/学期）"
            )
        else:
            tips.append(f"教学负荷：{MISSING}（学期 {term} 无课时明细）")
        if stu_ratio is not None:
            tips.append(f"生师比 1:{stu_ratio}（参考合格线 1:{TARGET_STU_TEACHER:g}）")
        if talent_n:
            tips.append(f"荣誉称号去重登记高层次/荣誉教师 {talent_n} 人")
        else:
            tips.append(f"高层次人才认定清单：{MISSING}")
        tips.append(f"年龄/学缘/培训访学/考核预警等：{MISSING}（待补源）")
        return tips

    def _highlights(
        self,
        *,
        talent_n: int,
        project_n: int,
        paper_n: int,
        overload_n: int,
        term: str,
    ) -> list[dict[str, str]]:
        return [
            {
                "label": "高层次人才",
                "value": f"{talent_n}人" if talent_n else MISSING,
            },
            {
                "label": "科研项目",
                "value": f"{project_n}项" if project_n else MISSING,
            },
            {
                "label": "科研论文",
                "value": f"{paper_n}篇" if paper_n else MISSING,
            },
            {
                "label": f"超负荷({term})",
                "value": f"{overload_n}人" if overload_n else "0人",
            },
        ]

    def _ratio_rows(self, counter: Counter, total: int) -> list[dict[str, Any]]:
        rows = []
        for label, count in sorted(counter.items(), key=lambda x: (-x[1], x[0])):
            rows.append(
                {
                    "label": label,
                    "count": count,
                    "ratio": _pct(count, total) if total else 0,
                }
            )
        return rows

    def _build_detail(
        self,
        *,
        teachers: list[Teacher],
        teacher_by_name: dict[str, Teacher],
        hours_by_name: dict[str, float],
        courses_by_name: dict[str, list[dict[str, Any]]],
        title_counter: Counter,
        total: int,
        phd_n: int,
        phd_ratio: float | None,
        avg_hours: float | None,
        overload_names: list[str],
        projects: list[ResearchProject],
        papers: list[ResearchPaper],
        student_n: int,
        stu_ratio: float | None,
        talent_n: int,
        term: str,
        honor_rows: list[TeacherHonor] | None = None,
        teachers_by_course: dict[str, set[str]] | None = None,
        course_leaders: set[str] | None = None,
        student_by_dept: Counter[str] | None = None,
        warning_center: dict[str, Any] | None = None,
        cutoff: int | None = None,
    ) -> dict[str, Any]:
        edu_counter = Counter(_edu_bucket(t) for t in teachers)
        title_rows = self._ratio_rows(title_counter, total)
        edu_rows = self._ratio_rows(edu_counter, total)

        # 部门分布作为「专业方向」近似
        dept_counter = Counter(_s(getattr(t, "department", None)) or MISSING for t in teachers)
        major_direction = self._ratio_rows(dept_counter, total)

        # 近五年新增（按来校时间）— 预留统计，后续可并入 capacityBuilding
        _ = sum(
            1
            for t in teachers
            if _s(getattr(t, "school_hire_date", None))[:4].isdigit()
            and int(_s(getattr(t, "school_hire_date", None))[:4]) >= 2021
        )
        teaching_hours_detail = []
        for name, hrs in sorted(hours_by_name.items(), key=lambda x: -x[1])[:30]:
            t = teacher_by_name.get(name)
            dept = _s(getattr(t, "department", None)) if t else MISSING
            teaching_hours_detail.append(
                {
                    "name": name,
                    "title": _s(t.title) if t else MISSING,
                    "department": dept,
                    "major": dept,
                    "hours": _round1(hrs),
                }
            )

        # 教学投入（单学期）
        ranked = sorted(hours_by_name.items(), key=lambda x: -x[1])
        max_t = ranked[0] if ranked else None
        min_t = ranked[-1] if ranked else None

        def _teacher_card(name: str | None, hrs: float | None) -> dict[str, Any]:
            if not name:
                return {
                    "name": MISSING,
                    "title": MISSING,
                    "department": MISSING,
                    "major": MISSING,
                    "hours": 0,
                }
            t = teacher_by_name.get(name)
            dept = _s(getattr(t, "department", None)) if t else MISSING
            return {
                "name": name,
                "title": _s(t.title) if t else MISSING,
                "department": dept,
                "major": dept,
                "hours": _round1(hrs or 0),
            }

        dist_counts = [0] * len(HOUR_BINS)
        for v in hours_by_name.values():
            for i, (_, lo, hi) in enumerate(HOUR_BINS):
                if lo <= v < hi:
                    dist_counts[i] += 1
                    break
        hour_n = len(hours_by_name) or 1
        hour_distribution = [
            {"range": label, "count": c, "ratio": _pct(c, hour_n)}
            for (label, _, _), c in zip(HOUR_BINS, dist_counts)
        ]

        overloaded_teachers = []
        for name in overload_names:
            t = teacher_by_name.get(name)
            hrs = hours_by_name[name]
            overloaded_teachers.append(
                {
                    "name": name,
                    "title": _s(t.title) if t else MISSING,
                    "department": _s(getattr(t, "department", None)) if t else MISSING,
                    "major": _s(getattr(t, "department", None)) if t else MISSING,
                    "totalHours": _round1(hrs),
                    "overloadAmount": _round1(hrs - OVERLOAD_HOURS),
                    "courses": [
                        {
                            "name": c["name"],
                            "hours": c["hours"],
                            "className": c.get("className") or MISSING,
                        }
                        for c in courses_by_name.get(name, [])[:8]
                    ],
                    "reason": f"学期 {term} 课时超过基准 {OVERLOAD_HOURS} 学时",
                }
            )

        teacher_courses = []
        for name, hrs in ranked[:40]:
            t = teacher_by_name.get(name)
            teacher_courses.append(
                {
                    "name": name,
                    "title": _s(t.title) if t else MISSING,
                    "major": _s(getattr(t, "department", None)) if t else MISSING,
                    "totalHours": _round1(hrs),
                    "courses": courses_by_name.get(name, []),
                }
            )

        # 科研按姓名粗匹配
        proj_by_leader: Counter[str] = Counter()
        for p in projects:
            for part in re_split_names(_s(p.leader)):
                proj_by_leader[part] += 1
        paper_by_author: Counter[str] = Counter()
        for p in papers:
            for part in re_split_names(_s(p.authors)):
                paper_by_author[part] += 1

        perf_teachers = []
        for t in teachers:
            name = _s(t.name)
            if not name:
                continue
            th = hours_by_name.get(name, 0)
            papers_n = paper_by_author.get(name, 0)
            projects_n = proj_by_leader.get(name, 0)
            teaching_score = min(100, int(th * 100 / OVERLOAD_HOURS)) if th else 0
            research_score = min(100, papers_n * 12 + projects_n * 15)
            if teaching_score >= 70 and research_score >= 70:
                cat = "dual-excellent"
            elif research_score >= 70:
                cat = "research-outstanding"
            elif teaching_score >= 70:
                cat = "teaching-outstanding"
            else:
                cat = "needs-improvement"
            perf_teachers.append(
                {
                    "name": name,
                    "title": _s(t.title) or MISSING,
                    "major": _s(getattr(t, "department", None)) or MISSING,
                    "teachingScore": teaching_score,
                    "researchScore": research_score,
                    "category": cat,
                    "teachingDetail": {
                        "avgHours": _round1(th),
                        "courseCount": len(courses_by_name.get(name, [])),
                        "studentEvalScore": MISSING,
                        "teachingAwards": [],
                    },
                    "researchDetail": {
                        "papers": papers_n,
                        "projects": projects_n,
                        "funding": MISSING,
                        "researchAwards": [],
                    },
                }
            )

        dual = sum(1 for x in perf_teachers if x["category"] == "dual-excellent")
        research_out = sum(1 for x in perf_teachers if x["category"] == "research-outstanding")
        teaching_out = sum(1 for x in perf_teachers if x["category"] == "teaching-outstanding")
        needs = sum(1 for x in perf_teachers if x["category"] == "needs-improvement")

        # 专业对比：按部门聚合（缺专业 FK）
        by_dept: dict[str, list[Teacher]] = defaultdict(list)
        for t in teachers:
            by_dept[_s(getattr(t, "department", None)) or MISSING].append(t)

        honor_rows = honor_rows or []
        teachers_by_course = teachers_by_course or {}
        course_leaders = course_leaders or set()
        student_by_dept = student_by_dept or Counter()
        cutoff = cutoff or five_year_cutoff()

        proj_names_ns = []
        funding_by_name: Counter[str] = Counter()
        for p in projects:
            fund = parse_funding(getattr(p, "funding", None))
            leaders = re_split_names(_s(p.leader))
            if is_ns_provincial(getattr(p, "level", None)):
                proj_names_ns.extend(leaders)
            for name in leaders:
                funding_by_name[name] += fund

        honor_talent_5yr = {
            _s(h.teacher_name)
            for h in honor_rows
            if _s(h.teacher_name)
            and parse_year(h.year) is not None
            and parse_year(h.year) >= cutoff
        }
        honor_all = {_s(h.teacher_name) for h in honor_rows if _s(h.teacher_name)}

        _skip_dept = ("办公室", "学院党政", "行政办", "党委")
        major_comparison = []
        for dept, group in sorted(by_dept.items(), key=lambda x: -len(x[1])):
            if dept == MISSING or any(k in dept for k in _skip_dept):
                continue
            n = len(group)
            phd_r = _pct(sum(1 for t in group if _is_phd(t)), n)
            senior_r = _pct(sum(1 for t in group if _is_senior(t)), n)
            names = {_s(t.name) for t in group if _s(t.name)}
            dept_hours = [hours_by_name[nm] for nm in names if nm in hours_by_name]
            avg_h = _round1(sum(dept_hours) / len(dept_hours)) if dept_hours else MISSING
            stu_n = match_student_count(dept, student_by_dept)
            dept_ratio = _round1(stu_n / n) if stu_n and n else None
            incomplete: list[str] = []
            if dept_ratio is None:
                incomplete.append("ratio")

            dept_courses = {
                cname: {tn for tn in tset if tn in names}
                for cname, tset in teachers_by_course.items()
                if any(tn in names for tn in tset)
            }
            # 建设课若无法按系所对齐，用该系开课课代理
            use_leaders = {c for c in course_leaders if c in dept_courses}
            c_rate, c_meaning, c_inc = eval_course_support(
                course_names_with_leader=use_leaders,
                teachers_by_course=dept_courses,
            )
            if c_inc or c_rate is None:
                incomplete.append("course")

            dept_proj = sum(1 for nm in proj_names_ns if nm in names)
            dept_paper = sum(paper_by_author.get(nm, 0) for nm in names)
            dept_fund = sum(funding_by_name.get(nm, 0) for nm in names)
            r_score, r_meaning, r_inc = eval_research(
                project_n=dept_proj,
                paper_n=dept_paper,
                funding=dept_fund,
                project_target=scale_target(RESEARCH_TARGET_PROJECTS, n, total or n),
                paper_target=scale_target(RESEARCH_TARGET_PAPERS, n, total or n),
                funding_target=scale_target(RESEARCH_TARGET_FUNDING, n, total or n),
            )
            if r_inc:
                incomplete.append("research")

            dept_new_phd = sum(
                1
                for t in group
                if _hire_year(t) is not None and _hire_year(t) >= cutoff and _is_phd(t)
            )
            dept_new_senior = sum(
                1
                for t in group
                if _hire_year(t) is not None and _hire_year(t) >= cutoff and _is_senior(t)
            )
            dept_new_talent = len(names & honor_talent_5yr)
            n_score, n_meaning, n_inc = eval_new(
                new_phd=dept_new_phd,
                new_talent=dept_new_talent,
                new_senior=dept_new_senior,
                phd_target=scale_target(NEW_TARGET_PHD, n, total or n),
                talent_target=scale_target(NEW_TARGET_TALENT, n, total or n),
                senior_target=scale_target(NEW_TARGET_SENIOR, n, total or n),
            )
            if n_inc:
                incomplete.append("new")

            dept_psi = compose_psi(
                stu_ratio=dept_ratio,
                phd_ratio=phd_r,
                senior_ratio=senior_r,
                course_rate=c_rate,
                course_incomplete=c_inc or c_rate is None,
                course_meaning=c_meaning,
                research_score=r_score,
                research_meaning=r_meaning,
                research_incomplete=r_inc,
                new_score=n_score,
                new_meaning=n_meaning,
                new_incomplete=n_inc,
                research_raw=r_score,
                new_raw=n_score,
            )
            score_map = {
                d["key"]: d["score"] if isinstance(d["score"], (int, float)) else None
                for d in dept_psi["dimensions"]
            }
            new_5yr = sum(
                1 for t in group if _hire_year(t) is not None and _hire_year(t) >= cutoff
            )
            major_comparison.append(
                {
                    "major": dept,
                    "department": dept,
                    "headcount": n,
                    "phdRatio": phd_r,
                    "seniorRatio": senior_r,
                    "avgHours": avg_h,
                    "studentTeacherRatio": f"1:{dept_ratio}" if dept_ratio is not None else MISSING,
                    "coreCourseSupportRate": c_rate if c_rate is not None else MISSING,
                    "youngTeacherRatio": MISSING,
                    "highTalentCount": len(names & honor_all) or MISSING,
                    "newTeachers5yr": new_5yr,
                    "supportIndex": dept_psi["score"],
                    "scores": score_map,
                    "incompleteFlags": incomplete,
                    "suggestions": suggestions_from_scores(score_map),
                }
            )

        departments = sorted(
            d for d in by_dept.keys() if d and d != MISSING
        )

        return {
            "structure": {
                "age": [{"label": MISSING, "count": 0, "ratio": 0}],
                "education": edu_rows or [{"label": MISSING, "count": 0, "ratio": 0}],
                "title": title_rows or [{"label": MISSING, "count": 0, "ratio": 0}],
                "academicOrigin": [{"label": MISSING, "count": 0, "ratio": 0}],
                "echelon": [
                    {
                        "label": MISSING,
                        "count": 0,
                        "ratio": 0,
                        "description": "缺年龄/人才称号等梯队判定字段",
                    }
                ],
                "retirementForecast": [],
                "retiringTeachers": [],
                "majorDirection": major_direction,
            },
            "teachingHoursDetail": teaching_hours_detail,
            "modelTeachers": [],
            "warningSamples": [],
            "publicServiceAnalysis": {"byTeacher": [], "byType": [], "byMonth": []},
            "assessmentIndicators": [
                {
                    "key": "phd",
                    "label": "博士占比",
                    "score": phd_ratio if phd_ratio is not None else MISSING,
                    "unit": "%" if phd_ratio is not None else "",
                },
                {
                    "key": "load",
                    "label": "平均课时",
                    "score": avg_hours if avg_hours is not None else MISSING,
                    "unit": "学时" if avg_hours is not None else "",
                },
                {
                    "key": "stuTeacher",
                    "label": "生师比",
                    "score": stu_ratio if stu_ratio is not None else MISSING,
                    "unit": ":1" if stu_ratio is not None else "",
                },
                {
                    "key": "talent",
                    "label": "高层次人才",
                    "score": talent_n if talent_n else MISSING,
                    "unit": "人" if talent_n else "",
                },
            ],
            "majorComparison": major_comparison,
            "filters": {
                "departments": departments,
            },
            "excellentSamples": [],
            "teachingInvestment": {
                "term": term,
                "standardHours": STANDARD_HOURS,
                "overloadHours": OVERLOAD_HOURS,
                "avgHours": avg_hours if avg_hours is not None else MISSING,
                "maxTeacher": _teacher_card(*(max_t if max_t else (None, None))),
                "minTeacher": _teacher_card(*(min_t if min_t else (None, None))),
                "teacherCourses": teacher_courses,
                "hourDistribution": hour_distribution,
                "overloadedTeachers": overloaded_teachers,
            },
            "capacityBuilding": {
                "newPhds": [],
                "newPhdTotal": MISSING,
                "newPhdIntroduced": MISSING,
                "newPhdDeveloped": MISSING,
                "newPhdPeople": [],
                "newProfessors": [],
                "newProfessorTotal": MISSING,
                "newProfessorIntroduced": MISSING,
                "newProfessorDeveloped": MISSING,
                "newProfessorPeople": [],
                "newTalents": [],
                "newTalentTotal": MISSING,
                "newTalentIntroduced": MISSING,
                "newTalentDeveloped": MISSING,
                "trainingCount": MISSING,
                "trainingByType": [],
                "visitingScholars": [],
                "visitingTotal": MISSING,
                "plans": {
                    "newPhd": MISSING,
                    "newProfessor": MISSING,
                    "newTalent": MISSING,
                    "training": MISSING,
                    "visiting": MISSING,
                },
                "mentorshipCoverage": MISSING,
                "mentorshipDetail": [],
                "yearlyTrend": [],
            },
            "performanceAnalysis": {
                "summary": {
                    "researchOutstanding": research_out,
                    "teachingOutstanding": teaching_out,
                    "dualExcellent": dual,
                    "needsImprovement": needs,
                    "avgTeaching": _round1(
                        sum(x["teachingScore"] for x in perf_teachers) / len(perf_teachers)
                    )
                    if perf_teachers
                    else MISSING,
                    "avgResearch": _round1(
                        sum(x["researchScore"] for x in perf_teachers) / len(perf_teachers)
                    )
                    if perf_teachers
                    else MISSING,
                },
                "teachers": perf_teachers[:80],
            },
            "warningCenter": warning_center
            or {
                "summary": {
                    "totalWarnings": 0,
                    "redCount": 0,
                    "yellowCount": 0,
                    "blueCount": 0,
                },
                "categories": [],
            },
        }


def re_split_names(blob: str) -> list[str]:
    import re

    parts = re.split(r"[、,，/;；\s]+", blob)
    return [p.strip() for p in parts if p.strip()]


faculty_service = FacultyService()
