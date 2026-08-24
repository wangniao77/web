"""学院驾驶舱中心 Hub：综合发展指数与环绕 KPI（指导办学口径）。

设计原则：
1. 指标名实相符（过滤顶刊/近五年/省级以上等），无数据时诚实展示而非假趋势。
2. 指数与环绕 KPI 同源计算，生师比等办学红线会真实拖累得分。
3. 每项 KPI 附 status + hint，便于院领导看「是否达标 / 下一步做什么」。
"""

from __future__ import annotations

import re
from datetime import datetime
from typing import Any, Literal

KpiStatus = Literal["healthy", "watch", "alert", "neutral"]

# —— 办学参考线（本科教学工作合格/审核评估常用口径，作驾驶舱预警用）——
RATIO_HEALTHY = 18.0
RATIO_WATCH = 22.0
RATIO_ALERT = 30.0

# 归一化目标（用于指数，非强制 KPI 达标线）
TARGETS = {
    "teachers": 80,
    "courses": 20,
    "topPapers": 50,
    "projects": 80,
    "patents": 30,
    "platforms": 8,
    "teams": 10,
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
    return "其他"


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


def score_ratio(ratio: float | None) -> float:
    """生师比得分 0–100：越接近本科参考线越高。"""
    if ratio is None or ratio <= 0:
        return 40.0
    if ratio <= RATIO_HEALTHY:
        return 100.0
    if ratio <= RATIO_WATCH:
        # 18→22：100→70
        return 100.0 - (ratio - RATIO_HEALTHY) / (RATIO_WATCH - RATIO_HEALTHY) * 30.0
    if ratio <= RATIO_ALERT:
        # 22→30：70→30
        return 70.0 - (ratio - RATIO_WATCH) / (RATIO_ALERT - RATIO_WATCH) * 40.0
    # >30：快速掉到接近 0
    return max(0.0, 30.0 - (ratio - RATIO_ALERT) * 1.5)


def _clamp01(value: float) -> float:
    return max(0.0, min(1.0, value))


def compute_development_index(
    *,
    teachers: int,
    students: int,
    ratio: float | None,
    courses: int,
    top_papers: int,
    projects: int,
    patents: int,
    platforms: int,
    teams: int,
) -> dict[str, Any]:
    """多维办学指数：与环绕 KPI 同源，红线指标可拖累总分。"""
    ratio_score = score_ratio(ratio)
    faculty_score = (
        _clamp01(teachers / TARGETS["teachers"]) * 55.0
        + ratio_score * 0.45
    )
    teaching_score = _clamp01(courses / TARGETS["courses"]) * 100.0
    research_score = (
        _clamp01(top_papers / TARGETS["topPapers"]) * 55.0
        + _clamp01(projects / TARGETS["projects"]) * 45.0
    )
    transfer_score = _clamp01(patents / TARGETS["patents"]) * 100.0
    platform_score = (
        _clamp01(platforms / TARGETS["platforms"]) * 60.0
        + _clamp01(teams / TARGETS["teams"]) * 40.0
    )

    pillars = [
        {"key": "faculty", "label": "师资保障", "score": round(faculty_score, 1), "weight": 0.28},
        {"key": "teaching", "label": "课程建设", "score": round(teaching_score, 1), "weight": 0.18},
        {"key": "research", "label": "科研产出", "score": round(research_score, 1), "weight": 0.28},
        {"key": "transfer", "label": "成果转化", "score": round(transfer_score, 1), "weight": 0.12},
        {"key": "platform", "label": "平台团队", "score": round(platform_score, 1), "weight": 0.14},
    ]
    index = sum(p["score"] * p["weight"] for p in pillars)
    index = round(min(100.0, max(0.0, index)), 1)

    weak = sorted(pillars, key=lambda p: p["score"])[:2]
    diagnosis = _build_index_diagnosis(
        index=index,
        ratio=ratio,
        students=students,
        teachers=teachers,
        courses=courses,
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
    courses: int,
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

    if courses <= 0:
        if status == "healthy":
            status = "watch"
            summary = "课程建设薄弱，宜加快培育"
        details.append("精品课程建设数据不足")

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
        return "watch", f"略高于参考线，建议控规模、补师资"
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


def build_hub_kpis(
    *,
    teachers: int,
    ratio_value: float | str,
    ratio_numeric: float | None,
    courses: int,
    top_papers: int,
    projects: int,
    patents: int,
    platforms: int,
    teams: int,
) -> list[dict[str, Any]]:
    """环绕 8 卡：真实口径 + 办学状态提示（不再用假同比趋势）。"""
    ratio_status, ratio_hint = classify_ratio(ratio_numeric)

    teacher_status, teacher_hint = classify_count(
        teachers,
        healthy_at=50,
        watch_at=30,
        empty_hint="专任教师数据缺失",
        healthy_hint="师资规模可支撑当前运行",
        watch_hint="师资偏紧，关注引进与稳定",
        alert_hint="专任教师明显不足",
    )
    # 生师比红线优先：规模「够数」但配比失衡时，仍提示关注/预警
    if ratio_numeric is not None and ratio_numeric > RATIO_ALERT and teachers > 0:
        teacher_status = "alert"
        teacher_hint = "相对在籍规模不足，需加快补充专任教师"
    elif ratio_numeric is not None and ratio_numeric > RATIO_WATCH and teachers > 0:
        if teacher_status == "healthy":
            teacher_status = "watch"
        teacher_hint = "相对在籍规模偏紧，建议同步控招与引才"
    course_status, course_hint = classify_count(
        courses,
        healthy_at=8,
        watch_at=1,
        empty_hint="待补齐课程建设库",
        healthy_hint="省部级以上课程建设有积累",
        watch_hint="精品课程偏少，宜加快一流课程培育",
        alert_hint="课程建设薄弱",
    )
    paper_status, paper_hint = classify_count(
        top_papers,
        healthy_at=30,
        watch_at=10,
        empty_hint="近五年顶刊成果待突破",
        healthy_hint="近五年顶刊显示度较好",
        watch_hint="顶刊产出一般，建议凝练方向",
        alert_hint="高水平论文偏少",
    )
    project_status, project_hint = classify_count(
        projects,
        healthy_at=40,
        watch_at=15,
        empty_hint="在库科研项目不足",
        healthy_hint="项目体量可支撑科研运行",
        watch_hint="项目储备一般，宜加强申报组织",
        alert_hint="科研项目偏少",
    )
    patent_status, patent_hint = classify_count(
        patents,
        healthy_at=15,
        watch_at=5,
        empty_hint="专利转化储备不足",
        healthy_hint="知识产权积累较好",
        watch_hint="专利数量一般，关注转化应用",
        alert_hint="专利产出偏少",
    )
    platform_status, platform_hint = classify_count(
        platforms,
        healthy_at=5,
        watch_at=2,
        empty_hint="尚无省级以上科研平台",
        healthy_hint="省级以上平台布局较好",
        watch_hint="平台数量有限，宜冲刺更高层级",
        alert_hint="高层次平台偏少",
    )
    team_status, team_hint = classify_count(
        teams,
        healthy_at=6,
        watch_at=2,
        empty_hint="稳定科研团队偏少",
        healthy_hint="团队建制相对健全",
        watch_hint="团队数量一般，宜加强有组织科研",
        alert_hint="科研团队力量不足",
    )

    return [
        {
            "key": "teachers",
            "label": "专任教师",
            "value": teachers,
            "unit": "人",
            "status": teacher_status,
            "hint": teacher_hint,
        },
        {
            "key": "studentRatio",
            "label": "生师比",
            "value": ratio_value,
            "status": ratio_status,
            "hint": ratio_hint,
        },
        {
            "key": "courses",
            "label": "精品课程",
            "value": courses,
            "unit": "门",
            "status": course_status,
            "hint": course_hint,
        },
        {
            "key": "topPapers",
            "label": "顶刊论文",
            "value": top_papers,
            "unit": "篇",
            "status": paper_status,
            "hint": paper_hint,
        },
        {
            "key": "projects",
            "label": "科研项目",
            "value": projects,
            "unit": "项",
            "status": project_status,
            "hint": project_hint,
        },
        {
            "key": "patents",
            "label": "授权专利",
            "value": patents,
            "unit": "项",
            "status": patent_status,
            "hint": patent_hint,
        },
        {
            "key": "platforms",
            "label": "省级平台",
            "value": platforms,
            "unit": "个",
            "status": platform_status,
            "hint": platform_hint,
        },
        {
            "key": "teams",
            "label": "科研团队",
            "value": teams,
            "unit": "个",
            "status": team_status,
            "hint": team_hint,
        },
    ]
