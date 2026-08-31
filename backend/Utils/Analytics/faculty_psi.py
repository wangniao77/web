"""专业支撑指数（PSI）与六类师资预警口径。

公式：PSI = 0.20 S_ratio + 0.10 S_doctor + 0.20 S_title
           + 0.15 S_course + 0.25 S_research + 0.10 S_new
缺源维跳过并重新归一化权重；不造假数。
"""

from __future__ import annotations

import re
from collections import Counter, defaultdict
from datetime import date
from typing import Any

MISSING = "**"

PSI_WEIGHTS: dict[str, float] = {
    "ratio": 0.20,
    "doctor": 0.10,
    "title": 0.20,
    "course": 0.15,
    "research": 0.25,
    "new": 0.10,
}

PSI_LABELS: dict[str, str] = {
    "ratio": "生师比",
    "doctor": "博士占比",
    "title": "高级职称",
    "course": "课程支撑",
    "research": "科研支撑",
    "new": "近五年新增",
}

# 材料目标
PSI_RATIO_FULL = 15.0
PSI_RATIO_ZERO = 25.0
PSI_PHD_FULL = 80.0
PSI_SENIOR_FULL = 55.0

# 年初指标缺表时的管理口径（接口回传，便于后续替换）
RESEARCH_TARGET_PROJECTS = 8
RESEARCH_TARGET_PAPERS = 40
RESEARCH_TARGET_FUNDING = 500.0  # 万元
NEW_TARGET_PHD = 5
NEW_TARGET_TALENT = 3
NEW_TARGET_SENIOR = 4

STRENGTH_CUTOFF = 80.0
WEAK_CUTOFF = 70.0

_YEAR_RE = re.compile(r"(20\d{2})")
_FUND_RE = re.compile(r"(\d+(?:\.\d+)?)")


def current_year() -> int:
    return date.today().year


def five_year_cutoff(year: int | None = None) -> int:
    """近五年起始年（含）：2026 → 2022。"""
    y = year or current_year()
    return y - 4


def parse_year(text: Any) -> int | None:
    m = _YEAR_RE.search(str(text or ""))
    return int(m.group(1)) if m else None


def parse_funding(text: Any) -> float:
    """经费原文解析为万元；无法解析则 0。"""
    s = str(text or "").strip().replace(",", "")
    if not s:
        return 0.0
    m = _FUND_RE.search(s)
    if not m:
        return 0.0
    val = float(m.group(1))
    if "亿" in s:
        return val * 10000.0
    if "万" in s or val >= 100:
        return val
    # 纯数字且较小：按万元
    return val


def round1(v: float) -> float:
    return round(v, 1)


def score_ratio(stu_ratio: float | None) -> float | None:
    if stu_ratio is None:
        return None
    if stu_ratio <= PSI_RATIO_FULL:
        return 100.0
    if stu_ratio >= PSI_RATIO_ZERO:
        return 0.0
    return round1((PSI_RATIO_ZERO - stu_ratio) / (PSI_RATIO_ZERO - PSI_RATIO_FULL) * 100)


def score_pct(actual: float | None, target: float) -> float | None:
    if actual is None:
        return None
    if target <= 0:
        return 100.0
    return round1(min(actual / target * 100.0, 100.0))


def score_completion(actual: float, target: float) -> float:
    if target <= 0:
        return 100.0 if actual > 0 else 0.0
    return round1(min(actual / target * 100.0, 100.0))


def is_ns_provincial(level: str | None) -> bool:
    blob = str(level or "")
    return any(k in blob for k in ("国家", "省", "部", "国基", "国社", "重点研发"))


def tone_from_score(score: float | None) -> str:
    if score is None:
        return "warn"
    if score >= STRENGTH_CUTOFF:
        return "ok"
    if score >= WEAK_CUTOFF:
        return "warn"
    return "risk"


def grade_from_psi(score: float) -> tuple[str, str, int]:
    """返回 (grade, gradeLabel, stars)。87.6 → 优秀(A) 五星。"""
    if score >= 85:
        return "A", "优秀", 5
    if score >= 70:
        return "B", "良好", 4
    if score >= 55:
        return "C", "中等", 3
    if score >= 40:
        return "D", "及格", 2
    return "E", "薄弱", 1


def health_from_psi(score: float, load: str, risk: str) -> dict[str, Any]:
    if score >= 85:
        structure = "优"
    elif score >= 70:
        structure = "中"
    elif score >= 55:
        structure = "紧"
    else:
        structure = "警"
    return {
        "score": int(round(score)),
        "structure": structure,
        "load": load,
        "risk": risk,
    }


def _dim(
    key: str,
    *,
    raw: Any,
    unit: str,
    score: float | None,
    meaning: str,
    incomplete: bool = False,
) -> dict[str, Any]:
    item: dict[str, Any] = {
        "key": key,
        "label": PSI_LABELS[key],
        "raw": raw if raw is not None else MISSING,
        "unit": unit if raw is not None and raw != MISSING else "",
        "score": round1(score) if score is not None else MISSING,
        "meaning": meaning,
        "tone": tone_from_score(score),
    }
    if incomplete:
        item["incomplete"] = True
    return item


def compose_psi(
    *,
    stu_ratio: float | None,
    phd_ratio: float | None,
    senior_ratio: float | None,
    course_rate: float | None,
    course_incomplete: bool,
    course_meaning: str,
    research_score: float | None,
    research_meaning: str,
    research_incomplete: bool,
    new_score: float | None,
    new_meaning: str,
    new_incomplete: bool,
    research_raw: Any = None,
    new_raw: Any = None,
) -> dict[str, Any]:
    dims = [
        _dim(
            "ratio",
            raw=stu_ratio,
            unit=":1",
            score=score_ratio(stu_ratio),
            meaning=(
                f"目标≤{PSI_RATIO_FULL:g}:1，当前 1:{stu_ratio}"
                if stu_ratio is not None
                else "教师或学生数为 0，无法计算"
            ),
            incomplete=stu_ratio is None,
        ),
        _dim(
            "doctor",
            raw=phd_ratio,
            unit="%",
            score=score_pct(phd_ratio, PSI_PHD_FULL),
            meaning=(
                f"目标{PSI_PHD_FULL:g}%，当前 {phd_ratio}%"
                if phd_ratio is not None
                else "学位字段不足"
            ),
        ),
        _dim(
            "title",
            raw=senior_ratio,
            unit="%",
            score=score_pct(senior_ratio, PSI_SENIOR_FULL),
            meaning=(
                f"目标{PSI_SENIOR_FULL:g}%，当前 {senior_ratio}%"
                if senior_ratio is not None
                else "职称字段不足"
            ),
        ),
        _dim(
            "course",
            raw=course_rate,
            unit="%",
            score=round1(min(course_rate, 100.0)) if course_rate is not None else None,
            meaning=course_meaning,
            incomplete=course_incomplete or course_rate is None,
        ),
        _dim(
            "research",
            raw=research_raw if research_raw is not None else research_score,
            unit="分" if research_score is not None else "",
            score=research_score,
            meaning=research_meaning,
            incomplete=research_incomplete or research_score is None,
        ),
        _dim(
            "new",
            raw=new_raw if new_raw is not None else new_score,
            unit="分" if new_score is not None else "",
            score=new_score,
            meaning=new_meaning,
            incomplete=new_incomplete or new_score is None,
        ),
    ]

    weighted = 0.0
    used = 0.0
    for d in dims:
        sc = d["score"]
        if isinstance(sc, (int, float)):
            w = PSI_WEIGHTS[d["key"]]
            weighted += sc * w
            used += w
    score = round1(weighted / used) if used else 0.0
    grade, grade_label, stars = grade_from_psi(score)

    strengths: list[str] = []
    weaknesses: list[str] = []
    for d in dims:
        sc = d["score"]
        if not isinstance(sc, (int, float)):
            continue
        if sc >= STRENGTH_CUTOFF:
            strengths.append(d["label"])
        elif sc < WEAK_CUTOFF:
            weaknesses.append(d["label"])

    return {
        "score": score,
        "grade": grade,
        "gradeLabel": grade_label,
        "stars": stars,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "formula": (
            "PSI=0.20生师比+0.10博士+0.20高级职称+0.15课程支撑+0.25科研+0.10近五年新增"
        ),
        "targets": {
            "stuTeacher": PSI_RATIO_FULL,
            "phdRatio": PSI_PHD_FULL,
            "seniorRatio": PSI_SENIOR_FULL,
            "researchProjects": RESEARCH_TARGET_PROJECTS,
            "researchPapers": RESEARCH_TARGET_PAPERS,
            "researchFunding": RESEARCH_TARGET_FUNDING,
            "newPhd": NEW_TARGET_PHD,
            "newTalent": NEW_TARGET_TALENT,
            "newSenior": NEW_TARGET_SENIOR,
        },
        "dimensions": dims,
    }


def metrics_from_psi(psi: dict[str, Any]) -> list[dict[str, Any]]:
    out = []
    for d in psi["dimensions"]:
        item: dict[str, Any] = {
            "key": d["key"],
            "label": d["label"],
            "value": d["raw"],
            "unit": d["unit"],
            "meaning": d["meaning"],
            "tone": d.get("tone"),
        }
        sc = d.get("score")
        if isinstance(sc, (int, float)):
            item["target"] = 100
        if d.get("incomplete"):
            item["incomplete"] = True
        out.append(item)
    return out


def scale_target(college_target: float, headcount: int, college_n: int) -> float:
    if college_n <= 0:
        return college_target
    return max(1.0, round(college_target * max(headcount / college_n, 0.12), 1))


def eval_research(
    *,
    project_n: int,
    paper_n: int,
    funding: float,
    project_target: float = RESEARCH_TARGET_PROJECTS,
    paper_target: float = RESEARCH_TARGET_PAPERS,
    funding_target: float = RESEARCH_TARGET_FUNDING,
) -> tuple[float, str, bool]:
    s_p = score_completion(project_n, project_target)
    s_a = score_completion(paper_n, paper_target)
    s_f = score_completion(funding, funding_target)
    score = round1(0.4 * s_p + 0.3 * s_a + 0.3 * s_f)
    meaning = (
        f"项目{project_n}/{project_target:g} · 论文{paper_n}/{paper_target:g} · "
        f"经费{round1(funding)}/{funding_target:g}万（管理口径目标）"
    )
    return score, meaning, True  # 年初指标为常量，标不完整


def eval_new(
    *,
    new_phd: int,
    new_talent: int,
    new_senior: int,
    phd_target: float = NEW_TARGET_PHD,
    talent_target: float = NEW_TARGET_TALENT,
    senior_target: float = NEW_TARGET_SENIOR,
) -> tuple[float, str, bool]:
    s_d = score_completion(new_phd, phd_target)
    s_t = score_completion(new_talent, talent_target)
    s_p = score_completion(new_senior, senior_target)
    score = round1(0.5 * s_d + 0.3 * s_t + 0.2 * s_p)
    meaning = (
        f"新增博士{new_phd}/{phd_target:g} · 人才{new_talent}/{talent_target:g} · "
        f"高级职称{new_senior}/{senior_target:g}（近五年，管理口径目标）"
    )
    return score, meaning, True


def eval_course_support(
    *,
    course_names_with_leader: set[str],
    teachers_by_course: dict[str, set[str]],
) -> tuple[float | None, str, bool]:
    """核心课覆盖：负责人且 ≥2 人可承担。无建设课名册时用开课课代理。"""
    if course_names_with_leader:
        total = len(course_names_with_leader)
        supported = 0
        for name in course_names_with_leader:
            teachers = teachers_by_course.get(name, set())
            if len(teachers) >= 2:
                supported += 1
        rate = round1(supported * 100.0 / total) if total else 0.0
        return (
            rate,
            f"建设课代理：{supported}/{total} 门有负责人且≥2人可承担",
            True,
        )
    names = [n for n in teachers_by_course if n and n != MISSING]
    if not names:
        return None, "无课程名册与学期开课记录", True
    supported = sum(1 for n in names if len(teachers_by_course[n]) >= 2)
    rate = round1(supported * 100.0 / len(names))
    return (
        rate,
        f"开课课代理：{supported}/{len(names)} 门当学期≥2名教师承担",
        True,
    )


def match_student_count(dept: str, student_by_dept: Counter[str]) -> int | None:
    if not dept or dept == MISSING:
        return None
    if dept in student_by_dept:
        return student_by_dept[dept]
    for key, n in student_by_dept.items():
        if dept in key or key in dept:
            return n
    return None


def suggestions_from_scores(scores: dict[str, float | None]) -> list[str]:
    tips: list[str] = []
    mapping = {
        "ratio": "压降生师比：引进专任教师或控制招生规模，目标 ≤15:1",
        "doctor": "提升博士占比：引进博士或支持在职攻读，目标 80%",
        "title": "补齐高级职称：加快副教授/教授晋升与引进，目标 55%",
        "course": "提高课程支撑：为核心课配备负责人，并保证至少 2 人可承担",
        "research": "加强科研支撑：对照年初项目/论文/经费目标补齐短板",
        "new": "加快近五年增量：引进或培养博士、高层次人才与高级职称",
    }
    for key, tip in mapping.items():
        sc = scores.get(key)
        if isinstance(sc, (int, float)) and sc < WEAK_CUTOFF:
            tips.append(tip)
    if not tips:
        tips.append("六维均达到关注线，维持现有引进与培养节奏")
    return tips


# ---------------------------------------------------------------------------
# 预警
# ---------------------------------------------------------------------------


def bottom_share(scores: dict[str, float], name: str) -> float:
    """从低到高累计占比 0–100，越小越差。"""
    if name not in scores or not scores:
        return 100.0
    ordered = sorted(scores.items(), key=lambda x: (x[1], x[0]))
    n = len(ordered)
    idx = next(i for i, (nm, _) in enumerate(ordered) if nm == name)
    return (idx + 1) / n * 100.0


def _teacher_card(
    name: str,
    teacher_by_name: dict[str, Any],
    *,
    detail: str,
    reasons: list[str],
    suggestions: list[str],
    level: str,
    risk_index: int,
) -> dict[str, Any]:
    t = teacher_by_name.get(name)
    dept = ""
    title = MISSING
    if t is not None:
        title = str(getattr(t, "title", None) or "").strip() or MISSING
        dept = str(getattr(t, "department", None) or "").strip() or MISSING
    months = 6 if level == "red" else 12
    return {
        "name": name,
        "title": title,
        "major": dept or MISSING,
        "detail": detail,
        "status": "新发现",
        "riskIndex": risk_index,
        "riskLevel": level,
        "reasons": reasons,
        "suggestions": suggestions,
        "closedLoop": {
            "rectifyMonths": months,
            "outcome": "不变",
            "nextEvaluation": "待接入跟踪表",
        },
    }


def _cat_level(teachers: list[dict[str, Any]], default: str = "yellow") -> str:
    if any(t["riskLevel"] == "red" for t in teachers):
        return "red"
    if any(t["riskLevel"] == "yellow" for t in teachers):
        return "yellow"
    if any(t["riskLevel"] == "blue" for t in teachers):
        return "blue"
    return default


def _rank_warn(
    *,
    this_scores: dict[str, float],
    prev_scores: dict[str, float] | None,
    yellow_this: float,
    yellow_two: float,
    red_this: float,
    red_two: float,
    teacher_by_name: dict[str, Any],
    label: str,
    this_hint: str,
    two_hint: str,
    suggestions: list[str],
) -> list[dict[str, Any]]:
    names = set(this_scores) | set(prev_scores or {})
    out: list[dict[str, Any]] = []
    for name in names:
        if name not in this_scores:
            continue
        this_pct = bottom_share(this_scores, name)
        prev_pct = bottom_share(prev_scores, name) if prev_scores and name in prev_scores else None
        two_year = prev_pct is not None
        is_red = this_pct <= red_this or (two_year and this_pct <= red_two and prev_pct <= red_two)
        is_yellow = this_pct <= yellow_this or (
            two_year and this_pct <= yellow_two and prev_pct <= yellow_two
        )
        if not is_red and not is_yellow:
            continue
        level = "red" if is_red else "yellow"
        reasons = [f"本年度{label}院内从低到高累计 {this_pct:.1f}%（{this_hint}）"]
        if two_year:
            reasons.append(f"上一年累计 {prev_pct:.1f}%（{two_hint}）")
        else:
            reasons.append("缺连续两年考核表，按本年百分位近似")
        risk = 86 if level == "red" else 62
        out.append(
            _teacher_card(
                name,
                teacher_by_name,
                detail=f"{label}落入院内后列",
                reasons=reasons,
                suggestions=suggestions,
                level=level,
                risk_index=risk,
            )
        )
    out.sort(key=lambda x: -x["riskIndex"])
    return out


def build_warning_center(
    *,
    teacher_by_name: dict[str, Any],
    hours_by_name: dict[str, float],
    avg_hours: float | None,
    research_by_year: dict[int, dict[str, float]],
    teaching_by_year: dict[int, dict[str, float]],
    output_years: dict[str, set[int]],
    hire_year_by_name: dict[str, int | None],
) -> dict[str, Any]:
    year = current_year()
    research_years = sorted(y for y, m in research_by_year.items() if m)
    this_r_year = research_years[-1] if research_years else None
    prev_r_year = research_years[-2] if len(research_years) >= 2 else None
    this_research = research_by_year.get(this_r_year or -1, {})
    prev_research = research_by_year.get(prev_r_year, {}) if prev_r_year else None

    teach_years = sorted(y for y, m in teaching_by_year.items() if m)
    this_t_year = teach_years[-1] if teach_years else None
    prev_t_year = teach_years[-2] if len(teach_years) >= 2 else None
    this_teach = teaching_by_year.get(this_t_year or -1, {})
    prev_teach = teaching_by_year.get(prev_t_year, {}) if prev_t_year else None

    research_teachers = _rank_warn(
        this_scores=this_research,
        prev_scores=prev_research,
        yellow_this=15,
        yellow_two=30,
        red_this=10,
        red_two=15,
        teacher_by_name=teacher_by_name,
        label="科研绩效",
        this_hint="本年红≤10% / 黄≤15%",
        two_hint="连续两年红≤15% / 黄≤30%",
        suggestions=[
            "配备科研导师，联合申报省部级项目",
            "压缩超负荷课时，释放科研时间",
            "申请校级培育基金并参加申报培训",
        ],
    )

    teaching_teachers = _rank_warn(
        this_scores=this_teach,
        prev_scores=prev_teach,
        yellow_this=10,
        yellow_two=20,
        red_this=5,
        red_two=10,
        teacher_by_name=teacher_by_name,
        label="教学绩效（课时粗分）",
        this_hint="本年红≤5% / 黄≤10%",
        two_hint="连续两年红≤10% / 黄≤20%",
        suggestions=[
            "安排教学导师听课帮扶",
            "参加教学能力提升工作坊",
            "学期末跟踪评教与课时结构",
        ],
    )

    hour_teachers: list[dict[str, Any]] = []
    if avg_hours and avg_hours > 0:
        for name, hrs in hours_by_name.items():
            red = hrs > avg_hours * 3 or hrs < avg_hours * 0.15
            yellow = hrs > avg_hours * 2 or hrs < avg_hours * 0.25
            if not red and not yellow:
                continue
            level = "red" if red else "yellow"
            if hrs > avg_hours:
                reasons = [f"学期课时 {round1(hrs)}，超过院均 {round1(avg_hours)} 的 {'3' if red else '2'} 倍"]
                suggestions = ["下学期分流课程，压减超负荷课时", "关注身心负荷与备课质量"]
            else:
                reasons = [f"学期课时 {round1(hrs)}，低于院均 {round1(avg_hours)} 的 {'15%' if red else '25%'}"]
                suggestions = ["补齐本科核心课或研究生指导", "核对是否漏报课时"]
            hour_teachers.append(
                _teacher_card(
                    name,
                    teacher_by_name,
                    detail=f"课时 {round1(hrs)}（院均 {round1(avg_hours)}）",
                    reasons=reasons,
                    suggestions=suggestions,
                    level=level,
                    risk_index=84 if level == "red" else 60,
                )
            )
        hour_teachers.sort(key=lambda x: -x["riskIndex"])

    no_output: list[dict[str, Any]] = []
    has_dated_output = any(output_years.values())
    if has_dated_output:
        for name in teacher_by_name:
            hire = hire_year_by_name.get(name)
            if hire and hire >= year - 1:
                continue
            years = output_years.get(name) or set()
            latest = max(years) if years else None
            gap = (year - latest) if latest else 99
            if gap >= 3:
                level = "red"
                reasons = [f"连续{gap if gap < 20 else 3}年无论文/专利/项目/获奖记录"]
            elif gap >= 2:
                level = "yellow"
                reasons = ["连续2年无论文/专利/项目/获奖记录"]
            else:
                continue
            no_output.append(
                _teacher_card(
                    name,
                    teacher_by_name,
                    detail="长期无成果",
                    reasons=reasons,
                    suggestions=["配备科研导师并明确方向", "申请校基金", "季度跟踪产出"],
                    level=level,
                    risk_index=80 if level == "red" else 64,
                )
            )
        no_output.sort(key=lambda x: -x["riskIndex"])

    combo_this: dict[str, float] = {}
    names = set(this_research) | set(this_teach)
    for name in names:
        r = this_research.get(name, 0.0)
        t = this_teach.get(name, 0.0)
        combo_this[name] = (r + t) / 2
    combo_prev: dict[str, float] | None = None
    if prev_research or prev_teach:
        combo_prev = {}
        for name in set(prev_research or {}) | set(prev_teach or {}):
            r = (prev_research or {}).get(name, 0.0)
            t = (prev_teach or {}).get(name, 0.0)
            combo_prev[name] = (r + t) / 2
    low_perf = _rank_warn(
        this_scores=combo_this,
        prev_scores=combo_prev,
        yellow_this=20,
        yellow_two=20,
        red_this=10,
        red_two=10,
        teacher_by_name=teacher_by_name,
        label="综合绩效",
        this_hint="本年红≤10% / 黄≤20%",
        two_hint="连续两年红≤10% / 黄≤20%",
        suggestions=["教学+科研双导师", "减少超负荷课时并申请培育项目", "年度考核再评价"],
    )

    r_note = (
        f"科研按 {this_r_year or '—'} 年论文/项目粗分"
        + (f"，对照 {prev_r_year}" if prev_r_year else "（缺连续两年，按本年百分位）")
    )
    t_note = "教学事故源未接入；教学绩效用课时粗分院内百分位"
    categories = [
        {
            "id": "research-warning",
            "label": "科研预警",
            "level": _cat_level(research_teachers),
            "count": len(research_teachers),
            "description": "连续2年院内后30%或本年后15%为黄；连续2年后15%或本年后10%为红。",
            "sourceNote": r_note,
            "teachers": research_teachers,
        },
        {
            "id": "teaching-warning",
            "label": "教学预警",
            "level": _cat_level(teaching_teachers),
            "count": len(teaching_teachers),
            "description": "一般事故1次为黄；连续2次一般或1次严重为红。教学绩效：本年后10%/连续2年后20%为黄，本年后5%/连续2年后10%为红。",
            "sourceNote": t_note,
            "teachers": teaching_teachers,
        },
        {
            "id": "hours-anomaly",
            "label": "课时异常",
            "level": _cat_level(hour_teachers),
            "count": len(hour_teachers),
            "description": "高于院均2倍或低于25%为黄；高于院均3倍或低于15%为红。",
            "sourceNote": "按当前分析学期课时实算" if avg_hours else "当学期无课时数据",
            "teachers": hour_teachers,
        },
        {
            "id": "no-output",
            "label": "长期无成果",
            "level": _cat_level(no_output),
            "count": len(no_output),
            "description": "连续2年无论文/专利/项目/获奖为黄；连续3年为红。近一年入职教师不纳入。",
            "sourceNote": "成果年从发表/立项/授权/获评日期解析",
            "teachers": no_output,
        },
        {
            "id": "low-performance",
            "label": "连续低绩效",
            "level": _cat_level(low_perf),
            "count": len(low_perf),
            "description": "综合排名连续2年后20%为黄；连续2年后10%为红。缺两年时按本年百分位。",
            "sourceNote": "综合分＝教学课时粗分与科研粗分均值",
            "teachers": low_perf,
        },
        {
            "id": "retirement-gap",
            "label": "即将退休无人接替",
            "level": "blue",
            "count": 0,
            "description": "课程保障率：>80% 正常 · 60–80% 蓝色 · 40–60% 黄色 · <40% 红色。",
            "sourceNote": "缺出生/退休日期与核心课名册，暂无法计算接替名单",
            "teachers": [],
        },
    ]

    red = sum(1 for c in categories for t in c["teachers"] if t["riskLevel"] == "red")
    yellow = sum(1 for c in categories for t in c["teachers"] if t["riskLevel"] == "yellow")
    blue = sum(1 for c in categories for t in c["teachers"] if t["riskLevel"] == "blue")
    return {
        "summary": {
            "totalWarnings": red + yellow + blue,
            "redCount": red,
            "yellowCount": yellow,
            "blueCount": blue,
        },
        "categories": categories,
    }


def collect_output_years(
    *,
    papers: list[Any],
    projects: list[Any],
    ips: list[Any],
    achievements: list[Any],
    honors: list[Any],
    split_names,
) -> tuple[dict[int, dict[str, float]], dict[str, set[int]]]:
    """按年汇总科研粗分，并记录每人有成果的年份。"""
    by_year: dict[int, dict[str, float]] = defaultdict(lambda: defaultdict(float))
    years: dict[str, set[int]] = defaultdict(set)

    def add(name: str, year: int | None, score: float) -> None:
        if not name or year is None:
            return
        by_year[year][name] += score
        years[name].add(year)

    for p in papers:
        y = parse_year(getattr(p, "published_at", None))
        for name in split_names(str(getattr(p, "authors", None) or "")):
            add(name, y, 12.0)
    for p in projects:
        y = parse_year(getattr(p, "start_date", None))
        weight = 15.0 if is_ns_provincial(getattr(p, "level", None)) else 8.0
        for name in split_names(str(getattr(p, "leader", None) or "")):
            add(name, y, weight)
    for p in ips:
        y = parse_year(getattr(p, "grant_date", None))
        for name in split_names(str(getattr(p, "inventor", None) or "")):
            add(name, y, 8.0)
    for a in achievements:
        y = parse_year(getattr(a, "occurred_on", None))
        section = str(getattr(a, "section", None) or "")
        if section not in ("award", "paper", "output", "talent"):
            continue
        for name in split_names(str(getattr(a, "leader", None) or "")):
            add(name, y, 10.0)
    for h in honors:
        y = parse_year(getattr(h, "year", None))
        name = str(getattr(h, "teacher_name", None) or "").strip()
        add(name, y, 6.0)

    plain = {y: dict(m) for y, m in by_year.items()}
    return plain, {k: set(v) for k, v in years.items()}
