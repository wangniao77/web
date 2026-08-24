"""学院驾驶舱中心 Hub：综合发展指数与办学结构（指导办学口径）。

设计原则：
1. 指数按办学职能五维计分（人才培养 / 师资建设 / 科研 / 国际交流 / 社会服务），
   红线指标（生师比）与标志成果可真实拖累总分。
2. 环绕卡展示「办学底座」结构，不再堆孤立科研计数。
3. 底部成果栏突出硕士授予、省部级科技奖、会议等显示度指标。
4. 缺源诚实展示（None → 前端 --），不编假趋势。
"""

from __future__ import annotations

import re
from datetime import datetime
from typing import Any, Literal

KpiStatus = Literal["healthy", "watch", "alert", "neutral"]

# —— 办学参考线（本科教学工作合格/审核评估常用口径）——
RATIO_HEALTHY = 18.0
RATIO_WATCH = 22.0
RATIO_ALERT = 30.0

# 师资结构参考线
PHD_TARGET = 70.0
SENIOR_TARGET = 40.0

# 归一化目标（用于指数，非强制 KPI 达标线）
TARGETS = {
    "teachers": 80,
    "courses": 80,
    "courseHours": 8000,
    "masterDegrees": 80,
    "topPapers": 50,
    "projects": 80,
    "scienceAwards": 8,
    "conferences": 12,
    "intlConferences": 4,
    "patents": 30,
    "serviceItems": 10,
}

_TOP_PAPER_KEYS = (
    "一区",
    "Q1",
    "Top",
    "TOP",
    "CNS",
    "Nature",
    "Science",
    "Cell",
    "权威",
    "SCI一区",
    "SCI 一区",
)

_SCIENCE_AWARD_KEYS = ("科技奖", "科学技术奖", "科技进步", "技术发明", "自然科学奖")
_CONFERENCE_KEYS = ("会议", "学术报告", "论坛", "研讨会", "symposium", "conference", "Conference")
_INTL_KEYS = ("国际", "海外", "境外", "International", "IEEE", "ACM")


def _s(value: Any) -> str:
    return str(value or "").strip()


def extract_year(raw: str | None) -> int | None:
    text = _s(raw)
    if not text:
        return None
    m = re.search(r"(20\d{2}|19\d{2})", text)
    if not m:
        return None
    year = int(m.group(1))
    now = datetime.now().year
    if 1990 <= year <= now + 1:
        return year
    return None


def is_within_years(raw: str | None, *, years: int = 5) -> bool:
    year = extract_year(raw)
    if year is None:
        # 缺年份时保守计入，避免把有 level 的成果整批丢掉
        return True
    return year >= datetime.now().year - years + 1


def is_top_paper(level: str | None, venue: str | None = None) -> bool:
    blob = f"{_s(level)} {_s(venue)}"
    if not blob.strip():
        return False
    if any(k in blob for k in _TOP_PAPER_KEYS):
        return True
    return any(
        k in blob
        for k in ("CSSCI", "管理世界", "中国科学", "经济研究", "中国社会科学")
    )


def normalize_level(raw: str | None) -> str:
    text = _s(raw)
    if not text:
        return "其他"
    if any(k in text for k in ("国家", "国级", "国自然", "国赛", "全国", "CN", "SCI", "SSCI", "EI", "CSSCI")):
        if any(k in text for k in ("省", "部", "厅")) and "国家" not in text and "全国" not in text:
            return "省部级"
        return "国家级"
    if any(k in text for k in ("省", "部", "厅", "市")):
        return "省部级"
    if "校" in text:
        return "校级"
    if any(k in text for k in ("院", "系")):
        return "院级"
    return "其他"


def level_bucket(*parts: str | None) -> Literal["province", "school", "college"]:
    """平台/团队层级：省（含国家）/ 校 / 院；level 缺失时回看名称与批准部门。"""
    for part in parts:
        lv = normalize_level(part)
        if lv in ("国家级", "省部级"):
            return "province"
        if lv == "校级":
            return "school"
        if lv == "院级":
            return "college"
    blob = " ".join(_s(p) for p in parts)
    if any(k in blob for k in ("国家", "省", "部", "厅")) and "学院" not in blob:
        return "province"
    if "校" in blob and "学院" not in blob:
        return "school"
    return "college"


def is_provincial_plus(level: str | None) -> bool:
    return normalize_level(level) in ("国家级", "省部级")


def is_quality_course(level: str | None) -> bool:
    """课程建设表：国家级/省级精品或一流课程。"""
    text = _s(level)
    if not text:
        return False
    return is_provincial_plus(level) or any(k in text for k in ("一流", "精品", "示范", "金课"))


def is_team_record(category: str | None, name: str | None = None) -> bool:
    blob = f"{_s(category)} {_s(name)}"
    return "团队" in blob


def is_granted_patent(status: str | None) -> bool:
    text = _s(status)
    if not text:
        return True  # 缺状态时按已入库成果计
    return any(k in text for k in ("授权", "有效", "维持", "granted", "Granted"))


def is_science_award(name: str | None, category: str | None = None) -> bool:
    """成果表 award 分区中的科技类奖项。"""
    blob = f"{_s(name)} {_s(category)}"
    if any(k in blob for k in _SCIENCE_AWARD_KEYS):
        return True
    return "科技" in blob


def is_conference(name: str | None, category: str | None = None) -> bool:
    blob = f"{_s(name)} {_s(category)}"
    return any(k in blob for k in _CONFERENCE_KEYS)


def is_international(*parts: str | None) -> bool:
    blob = " ".join(_s(p) for p in parts)
    return any(k in blob for k in _INTL_KEYS)


def is_graduate_edu(raw: str | None) -> bool:
    return any(k in _s(raw) for k in ("研究生", "硕士", "博士"))


def is_doctoral_edu(raw: str | None) -> bool:
    return "博士" in _s(raw)


def is_master_edu(raw: str | None) -> bool:
    text = _s(raw)
    if is_doctoral_edu(text):
        return False
    return any(k in text for k in ("硕士", "研究生"))


def is_master_conferred(education_level: str | None, education_status: str | None = None) -> bool:
    """就业表中的硕士研究生，视为硕士授予人数。"""
    blob = f"{_s(education_level)} {_s(education_status)}"
    if is_doctoral_edu(blob) and "硕士" not in blob:
        return False
    return is_master_edu(blob) or ("硕士" in blob and "毕业" in blob)


def is_phd_teacher(*, is_phd: bool | None, degree: str | None, education: str | None) -> bool:
    if is_phd is True:
        return True
    if is_phd is False:
        return False
    return "博士" in f"{_s(degree)}{_s(education)}"


def is_professor(title: str | None, title_level: str | None = None) -> bool:
    if _s(title_level) == "正高级":
        return True
    t = _s(title)
    return "教授" in t and "副教授" not in t


def is_associate(title: str | None, title_level: str | None = None) -> bool:
    if _s(title_level) == "副高级":
        return True
    t = _s(title)
    return "副教授" in t or "副研究员" in t


def is_doctoral_supervisor(*parts: str | None) -> bool:
    blob = " ".join(_s(p) for p in parts)
    return any(k in blob for k in ("博导", "博士生导师", "博士导师"))


def is_master_supervisor(*parts: str | None) -> bool:
    blob = " ".join(_s(p) for p in parts)
    if is_doctoral_supervisor(blob):
        return True
    return any(k in blob for k in ("硕导", "硕士生导师", "研究生导师", "硕士导师"))


def score_ratio(ratio: float | None) -> float:
    """生师比得分 0–100：越接近本科参考线越高。"""
    if ratio is None or ratio <= 0:
        return 40.0
    if ratio <= RATIO_HEALTHY:
        return 100.0
    if ratio <= RATIO_WATCH:
        return 100.0 - (ratio - RATIO_HEALTHY) / (RATIO_WATCH - RATIO_HEALTHY) * 30.0
    if ratio <= RATIO_ALERT:
        return 70.0 - (ratio - RATIO_WATCH) / (RATIO_ALERT - RATIO_WATCH) * 40.0
    return max(0.0, 30.0 - (ratio - RATIO_ALERT) * 1.5)


def _clamp01(value: float) -> float:
    return max(0.0, min(1.0, value))


def _pct_score(value: float | None, target: float, *, missing: float = 45.0) -> float:
    """比例类得分：缺源给中性分，避免把指数打穿。"""
    if value is None:
        return missing
    return _clamp01(value / target) * 100.0


def compute_development_index(
    *,
    teachers: int,
    students: int,
    ratio: float | None,
    phd_ratio: float | None,
    senior_ratio: float | None,
    course_count: int,
    course_hours: float,
    master_degrees: int | None,
    top_papers: int,
    projects: int,
    science_awards: int,
    conferences: int,
    intl_conferences: int,
    patents: int,
    service_items: int,
) -> dict[str, Any]:
    """五维办学指数：人才培养 / 师资建设 / 科研 / 国际交流 / 社会服务。"""
    ratio_score = score_ratio(ratio)
    degree_score = (
        50.0
        if master_degrees is None
        else _clamp01(master_degrees / TARGETS["masterDegrees"]) * 100.0
    )
    course_score = (
        _clamp01(course_count / TARGETS["courses"]) * 60.0
        + _clamp01(course_hours / TARGETS["courseHours"]) * 40.0
    )
    talent_score = ratio_score * 0.50 + degree_score * 0.25 + course_score * 0.25

    faculty_score = (
        _clamp01(teachers / TARGETS["teachers"]) * 35.0
        + _pct_score(phd_ratio, PHD_TARGET) * 0.35
        + _pct_score(senior_ratio, SENIOR_TARGET) * 0.30
    )

    research_score = (
        _clamp01(top_papers / TARGETS["topPapers"]) * 40.0
        + _clamp01(projects / TARGETS["projects"]) * 30.0
        + _clamp01(science_awards / TARGETS["scienceAwards"]) * 30.0
    )

    if conferences <= 0 and intl_conferences <= 0:
        # 国际交流源偏薄时给中性分，不因缺会把整维打到 0
        intl_score = 48.0
    else:
        intl_score = (
            _clamp01(conferences / TARGETS["conferences"]) * 55.0
            + _clamp01(intl_conferences / TARGETS["intlConferences"]) * 45.0
        )

    service_score = (
        _clamp01(patents / TARGETS["patents"]) * 55.0
        + _clamp01(service_items / TARGETS["serviceItems"]) * 45.0
    )

    pillars = [
        {"key": "talent", "label": "人才培养", "score": round(talent_score, 1), "weight": 0.26},
        {"key": "faculty", "label": "师资建设", "score": round(faculty_score, 1), "weight": 0.24},
        {"key": "research", "label": "科研", "score": round(research_score, 1), "weight": 0.24},
        {"key": "international", "label": "国际交流", "score": round(intl_score, 1), "weight": 0.12},
        {"key": "service", "label": "社会服务", "score": round(service_score, 1), "weight": 0.14},
    ]
    index = sum(p["score"] * p["weight"] for p in pillars)
    index = round(min(100.0, max(0.0, index)), 1)

    weak = sorted(pillars, key=lambda p: p["score"])[:2]
    diagnosis = _build_index_diagnosis(
        index=index,
        ratio=ratio,
        students=students,
        teachers=teachers,
        master_degrees=master_degrees,
        conferences=conferences,
        science_awards=science_awards,
        weak=weak,
    )
    star = 5 if index >= 85 else 4 if index >= 70 else 3 if index >= 55 else 2
    return {
        "developmentIndex": index,
        "starLevel": star,
        "pillars": pillars,
        "diagnosis": diagnosis,
    }


def _build_index_diagnosis(
    *,
    index: float,
    ratio: float | None,
    students: int,
    teachers: int,
    master_degrees: int | None,
    conferences: int,
    science_awards: int,
    weak: list[dict[str, Any]],
) -> dict[str, Any]:
    status: KpiStatus = "healthy"
    details: list[str] = []
    summary = "运行平稳，持续盯紧过程质量"

    if ratio is not None and ratio > RATIO_ALERT:
        status = "alert"
        summary = f"生师比 {ratio:.1f}:1，优先补师资"
        details.append(f"生师比远超本科评估参考线（>{RATIO_ALERT:.0f}:1）")
        if teachers > 0 and students > 0:
            need = max(0, int(round(students / RATIO_HEALTHY - teachers)))
            if need > 0:
                details.append(f"对标 {RATIO_HEALTHY:.0f}:1 约需再补充 {need} 名专任教师")
    elif ratio is not None and ratio > RATIO_WATCH:
        status = "watch"
        summary = f"生师比 {ratio:.1f}:1，宜控招引才"
        details.append("生师比高于参考区间，建议控制扩招并加快引进")

    if master_degrees is None:
        details.append("硕士授予人数待核对就业/学位数据")
    if conferences <= 0:
        details.append("学术会议记录偏少，国际交流显示度不足")
    if science_awards <= 0:
        details.append("近阶段省部级科技奖待突破")

    if status == "healthy" and weak:
        lowest = weak[0]
        if lowest["score"] < 55:
            status = "watch"
            summary = f"短板在「{lowest['label']}」"
            details.append(f"建议将「{lowest['label']}」作为下一阶段办学重点")

    return {
        "status": status,
        "summary": summary,
        "details": details[:3] or [summary],
        "indexBand": (
            "优秀"
            if index >= 85
            else "良好"
            if index >= 70
            else "达标"
            if index >= 55
            else "待提升"
        ),
    }


def classify_ratio(ratio: float | None) -> tuple[KpiStatus, str]:
    if ratio is None:
        return "neutral", "师资或学籍数据不全"
    if ratio <= RATIO_HEALTHY:
        return "healthy", f"处于本科参考线（≤{RATIO_HEALTHY:.0f}:1）"
    if ratio <= RATIO_WATCH:
        return "watch", "略高于参考线，建议控规模、补师资"
    if ratio <= RATIO_ALERT:
        return "alert", f"明显偏高（>{RATIO_WATCH:.0f}:1），影响培养质量"
    return "alert", f"严重超标（>{RATIO_ALERT:.0f}:1），须纳入办学红线治理"


def classify_count(
    value: int,
    *,
    healthy_at: int,
    watch_at: int,
    empty_hint: str,
    healthy_hint: str,
    watch_hint: str,
    alert_hint: str,
) -> tuple[KpiStatus, str]:
    if value <= 0:
        return "alert" if watch_at > 0 else "neutral", empty_hint
    if value >= healthy_at:
        return "healthy", healthy_hint
    if value >= watch_at:
        return "watch", watch_hint
    return "alert", alert_hint


def _missing_value() -> str:
    return "**"


def build_hub_kpis(
    *,
    teachers: int,
    professors: int,
    associates: int,
    phd_ratio: float | None,
    master_supervisors: int,
    doctoral_supervisors: int,
    students: int,
    masters: int,
    ratio_value: float | str,
    ratio_numeric: float | None,
    course_count: int,
    course_hours: int,
    quality_courses: int,
    undergrad_majors: int,
    master_majors: int | None,
    doctoral_majors: int | None,
    platforms_total: int,
    platforms_by_level: dict[str, int],
    teams_total: int,
    teams_by_level: dict[str, int],
) -> list[dict[str, Any]]:
    """环绕 6 卡：办学底座结构 + 分层拆解。"""
    ratio_status, ratio_hint = classify_ratio(ratio_numeric)
    senior_n = professors + associates

    teacher_status, teacher_hint = classify_count(
        teachers,
        healthy_at=50,
        watch_at=30,
        empty_hint="专任教师数据缺失",
        healthy_hint="师资规模可支撑当前运行",
        watch_hint="师资偏紧，关注引进与稳定",
        alert_hint="专任教师明显不足",
    )
    if ratio_numeric is not None and ratio_numeric > RATIO_ALERT and teachers > 0:
        teacher_status = "alert"
        teacher_hint = "相对在籍规模不足，需加快补充专任教师"
    elif ratio_numeric is not None and ratio_numeric > RATIO_WATCH and teachers > 0:
        if teacher_status == "healthy":
            teacher_status = "watch"
        teacher_hint = "相对在籍规模偏紧，建议同步控招与引才"

    student_status = ratio_status if students > 0 else "neutral"
    student_hint = ratio_hint if students > 0 else "学籍规模待核"

    course_status, course_hint = classify_count(
        course_count,
        healthy_at=40,
        watch_at=10,
        empty_hint="开课/课时台账待补齐",
        healthy_hint="课程运行体量可支撑培养方案",
        watch_hint="开课门数偏少，核对学期课表",
        alert_hint="课程运行数据薄弱",
    )
    if course_count <= 0 and course_hours > 0:
        course_status = "watch"
        course_hint = "有课时无门数，建议核对开课台账"

    major_status, major_hint = classify_count(
        undergrad_majors,
        healthy_at=6,
        watch_at=3,
        empty_hint="本科专业目录待核",
        healthy_hint="本研专业布局相对完整",
        watch_hint="专业点偏少，关注学位点建设",
        alert_hint="专业布局偏窄",
    )

    platform_status, platform_hint = classify_count(
        platforms_total,
        healthy_at=5,
        watch_at=2,
        empty_hint="科研平台台账为空",
        healthy_hint="平台分层布局可支撑有组织科研",
        watch_hint="平台数量有限，宜冲刺更高层级",
        alert_hint="高层次平台偏少",
    )
    team_status, team_hint = classify_count(
        teams_total,
        healthy_at=6,
        watch_at=2,
        empty_hint="稳定科研团队偏少",
        healthy_hint="团队建制相对健全",
        watch_hint="团队数量一般，宜加强有组织科研",
        alert_hint="科研团队力量不足",
    )

    phd_label = f"{phd_ratio:.1f}%" if phd_ratio is not None else _missing_value()
    master_major_label = _missing_value() if master_majors is None else f"{master_majors}个"
    doctoral_major_label = _missing_value() if doctoral_majors is None else f"{doctoral_majors}个"

    return [
        {
            "key": "faculty",
            "label": "师资结构",
            "value": teachers,
            "unit": "人",
            "status": teacher_status,
            "hint": teacher_hint,
            "breakdowns": [
                {"label": "教授+副教授", "value": f"{senior_n}人"},
                {"label": "博士比例", "value": phd_label},
                {"label": "硕/博导", "value": f"{master_supervisors}/{doctoral_supervisors}"},
            ],
        },
        {
            "key": "students",
            "label": "学生规模",
            "value": students,
            "unit": "人",
            "status": student_status,
            "hint": student_hint,
            "breakdowns": [
                {"label": "硕士", "value": f"{masters}人"},
                {
                    "label": "生师比",
                    "value": str(ratio_value),
                    "tone": ratio_status if ratio_status != "neutral" else None,
                },
            ],
        },
        {
            "key": "courses",
            "label": "课程运行",
            "value": course_count,
            "unit": "门",
            "status": course_status,
            "hint": course_hint,
            "breakdowns": [
                {"label": "课时", "value": f"{course_hours}学时"},
                {"label": "精品课", "value": f"{quality_courses}门"},
            ],
        },
        {
            "key": "majors",
            "label": "专业布局",
            "value": undergrad_majors,
            "unit": "个",
            "status": major_status,
            "hint": major_hint,
            "breakdowns": [
                {"label": "硕士点", "value": master_major_label},
                {"label": "博士点", "value": doctoral_major_label},
            ],
        },
        {
            "key": "platforms",
            "label": "科研平台",
            "value": platforms_total,
            "unit": "个",
            "status": platform_status,
            "hint": platform_hint,
            "breakdowns": [
                {"label": "省", "value": str(platforms_by_level.get("province", 0))},
                {"label": "校", "value": str(platforms_by_level.get("school", 0))},
                {"label": "院", "value": str(platforms_by_level.get("college", 0))},
            ],
        },
        {
            "key": "teams",
            "label": "科研团队",
            "value": teams_total,
            "unit": "个",
            "status": team_status,
            "hint": team_hint,
            "breakdowns": [
                {"label": "省", "value": str(teams_by_level.get("province", 0))},
                {"label": "校", "value": str(teams_by_level.get("school", 0))},
                {"label": "院", "value": str(teams_by_level.get("college", 0))},
            ],
        },
    ]


def build_hub_highlights(
    *,
    master_degrees: int | None,
    science_awards: int,
    conferences: int,
) -> list[dict[str, Any]]:
    """底部成果栏：学位授予 / 科技奖 / 会议，突出办学显示度。"""
    if master_degrees is None:
        degree_status, degree_hint = "neutral", "就业/学位库暂无硕士授予口径"
        degree_value: int | str = _missing_value()
        degree_unit = ""
    else:
        degree_status, degree_hint = classify_count(
            master_degrees,
            healthy_at=60,
            watch_at=20,
            empty_hint="近阶段硕士授予人数为 0",
            healthy_hint="硕士培养出口规模正常",
            watch_hint="硕士授予偏少，关注招生与培养周期",
            alert_hint="硕士授予出口偏弱",
        )
        degree_value = master_degrees
        degree_unit = "人"

    award_status, award_hint = classify_count(
        science_awards,
        healthy_at=5,
        watch_at=1,
        empty_hint="尚无省部级以上科技奖",
        healthy_hint="省部级科技奖有显示度",
        watch_hint="科技奖储备一般，宜组织重点申报",
        alert_hint="标志性科技奖偏少",
    )
    conf_status, conf_hint = classify_count(
        conferences,
        healthy_at=8,
        watch_at=2,
        empty_hint="学术会议/报告台账为空",
        healthy_hint="会议与学术交流活跃",
        watch_hint="会议场次一般，宜加强主办/承办",
        alert_hint="学术交流显示度不足",
    )

    return [
        {
            "key": "masterDegrees",
            "label": "硕士授予",
            "value": degree_value,
            "unit": degree_unit,
            "status": degree_status,
            "hint": degree_hint,
        },
        {
            "key": "scienceAwards",
            "label": "省部级科技奖",
            "value": science_awards,
            "unit": "项",
            "status": award_status,
            "hint": award_hint,
        },
        {
            "key": "conferences",
            "label": "会议",
            "value": conferences,
            "unit": "场",
            "status": conf_status,
            "hint": conf_hint,
        },
    ]
