"""学生大屏：从学籍成绩记录「直接取」+「规则计算」生成 StudentDashboardDTO。

LLM 文案延后；此处仅用模板句填事实槽位。
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from decimal import Decimal
from typing import Any, Mapping, Sequence

# 培养方案应修学分未接入前的年级经验分母（入学年级 → 当前理论应修近似）
# 待教务培养方案替换。按 2026 年粗估：22级≈大四、23≈大三、24≈大二、25≈大一。
REQUIRED_CREDITS_BY_ENROLL_YEAR: dict[int, float] = {
    2022: 160,
    2023: 120,
    2024: 80,
    2025: 40,
}
DEFAULT_REQUIRED_CREDITS = 160.0

ACADEMIC_HIGH_POTENTIAL_PERCENTILE = 0.15  # 同年级同专业 GPA 前 15%
CET6_PASS = 425.0


def _f(value: Decimal | float | int | str | None) -> float:
    if value is None or value == "":
        return 0.0
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _i(value: Any) -> int:
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return 0


def record_get(record: Any, key: str, default: Any = None) -> Any:
    if isinstance(record, Mapping):
        return record.get(key, default)
    return getattr(record, key, default)


@dataclass(frozen=True)
class RankResult:
    rank: int
    total: int
    percentile: float  # 0–1，越大越好（排名越靠前）


def dense_rank_by_gpa(
    student_id: str,
    peers: Sequence[Any],
    *,
    gpa_key: str = "average_credit_gpa",
    id_key: str = "student_id",
) -> RankResult:
    """GPA 降序 dense rank（同分同名次，下一名跳号按 dense：1,2,2,3）。"""
    scored: list[tuple[str, float]] = []
    for p in peers:
        sid = str(record_get(p, id_key) or "")
        if not sid:
            continue
        scored.append((sid, _f(record_get(p, gpa_key))))
    if not scored:
        return RankResult(rank=0, total=0, percentile=0.0)

    scored.sort(key=lambda x: (-x[1], x[0]))
    ranks: dict[str, int] = {}
    prev_gpa: float | None = None
    current_rank = 0
    for idx, (sid, gpa) in enumerate(scored, start=1):
        if prev_gpa is None or gpa != prev_gpa:
            current_rank = idx
            prev_gpa = gpa
        ranks[sid] = current_rank

    sid = str(student_id)
    rank = ranks.get(sid, 0)
    total = len(scored)
    if total <= 1 or rank <= 0:
        percentile = 1.0 if rank == 1 else 0.0
    else:
        percentile = max(0.0, min(1.0, 1.0 - (rank - 1) / (total - 1)))
    return RankResult(rank=rank, total=total, percentile=percentile)


def parse_competition_detail(detail: str | None) -> list[dict[str, str | None]]:
    """解析竞赛明细：按换行或分号切分，抽取级别关键词。"""
    if not detail or not str(detail).strip():
        return []

    text = str(detail).replace("\r\n", "\n").replace("；", ";").replace("\n", ";")
    chunks = [c.strip() for c in text.split(";") if c.strip()]
    results: list[dict[str, str | None]] = []
    level_pat = re.compile(r"(国家级|省部级|省级|市级|校级)")
    date_pat = re.compile(r"(20\d{2}\s*年\s*\d{1,2}\s*月|20\d{2}-\d{1,2})")

    for chunk in chunks:
        level_m = level_pat.search(chunk)
        date_m = date_pat.search(chunk)
        level = level_m.group(1) if level_m else "校级"
        if level == "省级":
            level = "省部级"
        date = None
        if date_m:
            date = re.sub(r"\s+", "", date_m.group(1)).replace("年", "-").replace("月", "")
        results.append({"name": chunk[:120], "level": level, "date": date})
    return results


def required_credits_for_grade(grade: int | None) -> float:
    if grade is None:
        return DEFAULT_REQUIRED_CREDITS
    return REQUIRED_CREDITS_BY_ENROLL_YEAR.get(int(grade), DEFAULT_REQUIRED_CREDITS)


def credit_progress(record: Any) -> dict[str, float | int]:
    earned = _f(record_get(record, "earned_total_credits"))
    required = required_credits_for_grade(_i(record_get(record, "grade")) or None)
    # 若主修总学分存在且更大，可作为分母上限参考（模型可能无此字段）
    major_total = _f(record_get(record, "major_total_credits"))
    if major_total > required:
        required = major_total
    percent = round(min(100.0, (earned / required) * 100)) if required > 0 else 0
    return {
        "earned": round(earned, 1),
        "required": required,
        "secondClassroomEarned": 0,
        "secondClassroomRequired": 10,
        "earnedPercent": int(percent),
        "secondPercent": 0,
    }


def academic_risk_level(record: Any) -> str:
    """返回 low | medium | high。"""
    failed = _f(record_get(record, "failed_total_credits"))
    makeup = _i(record_get(record, "makeup_exam_count"))
    retake = _i(record_get(record, "retake_count"))
    absent = _i(record_get(record, "absent_exam_count"))
    gpa = _f(record_get(record, "average_credit_gpa"))

    if failed >= 10 or makeup >= 4 or gpa and 0 < gpa < 2.0:
        return "high"
    if failed > 0 or makeup >= 2 or retake >= 2 or absent >= 2 or (gpa and 0 < gpa < 2.5):
        return "medium"
    return "low"


def build_attention_items(record: Any) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    gpa = _f(record_get(record, "average_credit_gpa"))
    failed = _f(record_get(record, "failed_total_credits"))
    makeup = _i(record_get(record, "makeup_exam_count"))
    retake = _i(record_get(record, "retake_count"))
    absent = _i(record_get(record, "absent_exam_count"))
    risk = academic_risk_level(record)

    if gpa and gpa < 2.0:
        items.append({"label": f"GPA {gpa:.2f} 低于 2.0，存在学业预警风险", "category": "学业预警", "level": "high"})
    elif gpa and gpa < 2.5:
        items.append({"label": f"GPA {gpa:.2f} 偏低，建议加强学业辅导", "category": "学业预警", "level": "medium"})

    if failed > 0:
        level = "high" if failed >= 10 or risk == "high" else "medium"
        items.append(
            {
                "label": f"存在不及格学分 {failed:.1f}，请关注补考/重修闭环",
                "category": "学业预警",
                "level": level,
            }
        )
    if makeup >= 2:
        items.append({"label": f"补考累计 {makeup} 次", "category": "学业预警", "level": "medium"})
    if retake >= 2:
        items.append({"label": f"重修累计 {retake} 次", "category": "学业预警", "level": "medium"})
    if absent >= 2:
        items.append({"label": f"缺考累计 {absent} 次", "category": "学业预警", "level": "medium"})

    # 缺业务数据：实践/心理不瞎造，仅在无学业预警时给一条信息级占位（仍不标高潜）
    if not items:
        items.append({"label": "当前无学业预警信号", "category": "学业预警", "level": "low"})

    items.append({"label": "实习与就业数据暂未接入", "category": "实践提醒", "level": "low"})
    items.append({"label": "心理分级数据暂未接入", "category": "健康提醒", "level": "low"})
    return items


def build_high_potential_label_tags(
    record: Any,
    *,
    major_rank: RankResult,
) -> list[str]:
    """页面高潜标签：学业高潜 / 竞赛高潜。不含干部、双百、公职。"""
    tags: list[str] = []
    gpa = _f(record_get(record, "average_credit_gpa"))
    failed = _f(record_get(record, "failed_total_credits"))
    awards = _i(record_get(record, "competition_award_count"))
    detail = str(record_get(record, "competition_award_detail") or "")

    in_top = (
        major_rank.total > 0
        and major_rank.rank > 0
        and (major_rank.rank / major_rank.total) <= ACADEMIC_HIGH_POTENTIAL_PERCENTILE
    )
    if gpa > 0 and failed == 0 and (in_top or gpa >= 3.5):
        tags.append("学业高潜")

    parsed = parse_competition_detail(detail)
    has_provincial_or_above = any(
        (item.get("level") or "") in ("国家级", "省部级") for item in parsed
    )
    if awards >= 1 and (has_provincial_or_above or "国家级" in detail or "省部级" in detail or "省级" in detail):
        tags.append("竞赛高潜")
    elif awards >= 2:
        tags.append("竞赛高潜")

    return tags


def score_academic(gpa: float, major_percentile: float) -> float:
    """学业表现 0–100：GPA 线性 + 专业百分位。"""
    gpa_score = max(0.0, min(100.0, (gpa / 4.0) * 100)) if gpa > 0 else 0.0
    return round(0.65 * gpa_score + 0.35 * (major_percentile * 100), 1)


def score_quality_proxy(record: Any, *, grade_competition_percentile: float) -> float:
    """综合素质弱代理：竞赛百分位 + 六级是否达标。"""
    cet6 = _f(record_get(record, "cet6_score"))
    cet_part = 85.0 if cet6 >= CET6_PASS else (70.0 if cet6 > 0 else 60.0)
    comp_part = 60.0 + grade_competition_percentile * 35.0
    return round(0.55 * comp_part + 0.45 * cet_part, 1)


def score_employment_proxy(record: Any, academic_score: float, quality_score: float) -> float:
    """就业发展弱代理（无实习意向时），标明估算。"""
    awards = _i(record_get(record, "competition_award_count"))
    bonus = min(8.0, awards * 2.0)
    return round(max(40.0, min(92.0, 0.5 * academic_score + 0.4 * quality_score + bonus * 0.5)), 1)


def recommend_direction(record: Any) -> tuple[str, int, list[dict[str, Any]]]:
    """粗规则岗位推荐 + 匹配分。"""
    major = str(record_get(record, "major_name") or "")
    detail = str(record_get(record, "competition_award_detail") or "")
    gpa = _f(record_get(record, "average_credit_gpa"))
    major_avg = _f(record_get(record, "major_course_avg_score"))
    awards = _i(record_get(record, "competition_award_count"))

    text_blob = major + detail
    jobs: list[tuple[str, int]] = []

    if re.search(r"人工智能|机器学习|深度学习|AI", text_blob, re.I):
        jobs.append(("AI 应用开发工程师", 78 + min(12, awards * 3)))
    if re.search(r"数据|大数据|分析", text_blob):
        jobs.append(("数据分析师", 74 + min(10, awards * 2)))
    if re.search(r"软件|程序|算法|蓝桥|ACM|Java|C\+\+", text_blob, re.I):
        jobs.append(("软件开发工程师", 72 + min(12, awards * 2)))
    if re.search(r"电商|商务|营销", text_blob):
        jobs.append(("电商运营专员", 70 + min(8, awards * 2)))

    if not jobs:
        if "软件" in major or "计算机" in major:
            jobs = [("软件开发工程师", 68), ("数据分析师", 62), ("实施与运维工程师", 58)]
        elif "人工智能" in major:
            jobs = [("AI 应用开发工程师", 70), ("算法工程师（初级）", 64), ("数据分析师", 60)]
        elif "数据" in major:
            jobs = [("数据分析师", 70), ("数据治理专员", 64), ("商务分析助理", 58)]
        else:
            jobs = [("专业技术岗", 60), ("职能支持岗", 55), ("继续学业深造", 58)]

    # GPA / 专业课微调
    adj = 0
    if gpa >= 3.5:
        adj += 6
    elif gpa >= 3.0:
        adj += 3
    if major_avg >= 85:
        adj += 4

    catalog = {
        "AI 应用开发工程师": {
            "city": "深圳 / 广州",
            "salary": "12-20K",
            "requirements": "Python/深度学习基础；有项目作品优先",
            "reason": "专业与竞赛关键词匹配 AI 方向",
        },
        "算法工程师（初级）": {
            "city": "深圳 / 杭州",
            "salary": "15-25K",
            "requirements": "算法与数学基础；刷题/竞赛经历加分",
            "reason": "人工智能专业方向匹配",
        },
        "数据分析师": {
            "city": "广州 / 深圳",
            "salary": "10-18K",
            "requirements": "SQL/Python；业务分析与可视化",
            "reason": "数据类课程与竞赛经历匹配",
        },
        "数据治理专员": {
            "city": "广州 / 深圳",
            "salary": "9-15K",
            "requirements": "数据标准/质量意识；沟通协作",
            "reason": "数据专业路径备选",
        },
        "软件开发工程师": {
            "city": "深圳 / 广州 / 珠海",
            "salary": "10-18K",
            "requirements": "Java/前端或全栈；工程化实践",
            "reason": "软件/程序类能力画像匹配",
        },
        "实施与运维工程师": {
            "city": "广州 / 深圳",
            "salary": "8-14K",
            "requirements": "Linux/部署运维基础；抗压沟通",
            "reason": "工程落地岗位备选",
        },
        "电商运营专员": {
            "city": "广州",
            "salary": "7-12K",
            "requirements": "运营思维；数据分析与内容策划",
            "reason": "电商/商务相关背景匹配",
        },
        "商务分析助理": {
            "city": "广州 / 深圳",
            "salary": "8-13K",
            "requirements": "Excel/SQL；业务报表能力",
            "reason": "数据分析向商务场景迁移",
        },
        "专业技术岗": {
            "city": "粤港澳大湾区",
            "salary": "8-15K",
            "requirements": "专业课程扎实；可展示项目",
            "reason": "通用专业技术方向",
        },
        "职能支持岗": {
            "city": "粤港澳大湾区",
            "salary": "6-10K",
            "requirements": "沟通协作；办公软件熟练",
            "reason": "综合能力备选路径",
        },
        "继续学业深造": {
            "city": "国内重点高校 / 境外",
            "salary": "—",
            "requirements": "GPA与英语达标；科研/竞赛亮点",
            "reason": "学业表现支持深造路径",
        },
    }

    matches = []
    for role, score in jobs[:3]:
        meta = catalog.get(
            role,
            {
                "city": "粤港澳大湾区",
                "salary": "面议",
                "requirements": "待补充岗位画像",
                "reason": "规则推荐参考岗位",
            },
        )
        matches.append(
            {
                "role": role,
                "match": int(max(45, min(95, score + adj))),
                "city": meta["city"],
                "salary": meta["salary"],
                "requirements": meta["requirements"],
                "reason": meta["reason"],
            }
        )
    matches.sort(key=lambda x: -x["match"])
    top = matches[0]
    return top["role"], int(top["match"]), matches


def build_template_copy(
    record: Any,
    *,
    tags: list[str],
    class_rank: RankResult,
    major_rank: RankResult,
    risk: str,
    direction: str,
    match: int,
) -> dict[str, Any]:
    name = str(record_get(record, "name") or "该生")
    gpa = _f(record_get(record, "average_credit_gpa"))
    awards = _i(record_get(record, "competition_award_count"))
    failed = _f(record_get(record, "failed_total_credits"))
    tag_text = "、".join(tags) if tags else "暂无高潜标签"

    summary = (
        f"{name}当前 GPA {gpa:.2f}，班级第 {class_rank.rank}/{class_rank.total or '—'}，"
        f"专业第 {major_rank.rank}/{major_rank.total or '—'}；竞赛获奖 {awards} 项，画像标签：{tag_text}。"
    )
    if failed > 0:
        summary += f"存在不及格学分 {failed:.1f}，建议优先完成补考/重修闭环。"
    else:
        summary += f"学业风险等级为「{ {'low':'低','medium':'中','high':'高'}[risk] }」。"
    summary += (
        f"规则匹配建议优先关注「{direction}」（匹配度约 {match}%）。"
        "当前就业去向类型记为「待实习」，意向城市/期望薪资/简历状态待学生填报后完善岗位匹配。"
    )

    short = (
        f"优先处理不及格学分闭环（当前 {failed:.1f}）。" if failed > 0 else "保持当前学业节奏，巩固核心专业课。"
    )
    if awards == 0:
        short_extra = "可尝试报名 1 项学科竞赛积累作品。"
    else:
        short_extra = "梳理竞赛经历写入可展示履历要点。"
    medium = "在数据接入前，建议自行补充企业实习或项目实践经历。"
    long_term = f"毕业前明确升学或就业路径，并围绕「{direction}」补齐技能栈。"

    pushes: list[dict[str, Any]] = []
    if failed > 0:
        pushes.append({"time": "本学期", "text": f"不及格学分 {failed:.1f}，请尽快确认补考/重修安排。", "type": "warn"})
    if awards > 0:
        pushes.append({"time": "本周", "text": f"已识别竞赛获奖 {awards} 项，可纳入综合素质亮点。", "type": "success"})
    pushes.append({"time": "提示", "text": f"规则推荐方向：{direction}（{match}%）。", "type": "info"})
    pushes.append({"time": "待接入", "text": "第二课堂、心理分级、实习就业数据接入后将自动刷新推送。", "type": "info"})

    match_basis = [
        f"GPA {gpa:.2f}" + (f"（专业前 {major_rank.rank}/{major_rank.total}）" if major_rank.total else ""),
        f"竞赛获奖 {awards} 项",
    ]
    cet6 = _f(record_get(record, "cet6_score"))
    if cet6 > 0:
        match_basis.append(f"六级成绩 {cet6:.0f}")

    return {
        "summary": summary,
        "shortTermSuggestions": [short, short_extra],
        "longTermSuggestions": [medium, long_term, "持续关注培养方案学分进度与毕业审核节点。"],
        "developmentPath": {"short": short, "medium": medium, "long": long_term},
        "pushes": pushes,
        "matchBasis": match_basis,
    }


def competition_percentile_among(record: Any, peers: Sequence[Any]) -> float:
    mine = _i(record_get(record, "competition_award_count"))
    values = sorted((_i(record_get(p, "competition_award_count")) for p in peers), reverse=True)
    if not values:
        return 0.0
    better = sum(1 for v in values if v > mine)
    return max(0.0, min(1.0, 1.0 - better / len(values)))


def dormitory_text(record: Any) -> str:
    building = str(record_get(record, "building") or "").strip()
    dorm = str(record_get(record, "dormitory_name") or "").strip()
    if building and dorm:
        return f"{building} {dorm}"
    return building or dorm or ""


def avatar_url_for(record: Any) -> str | None:
    """优先用姓名照片对应表中的照片文件名，经 /student-photos/ 静态入口访问。"""
    from urllib.parse import quote

    filename = str(record_get(record, "photo_filename") or "").strip()
    if filename:
        return f"/student-photos/{quote(filename)}"

    path = record_get(record, "student_picture_path") or record_get(record, "avatarUrl")
    if path:
        text = str(path).strip()
        if text.startswith("/student-photos/") or text.startswith("http"):
            return text
        # 绝对盘符路径 → 只取文件名
        name = text.replace("\\", "/").rsplit("/", 1)[-1]
        if name and ("." in name or "_" in name):
            return f"/student-photos/{quote(name)}"

    sid = str(record_get(record, "student_id") or "")
    if not sid:
        return None
    # 无文件名时按学号试探（静态服务可匹配 学号_*）
    return f"/student-photos/{quote(sid)}"


def derive_student_dashboard(
    record: Any,
    *,
    class_peers: Sequence[Any],
    major_peers: Sequence[Any],
    grade_peers: Sequence[Any],
    college_name: str | None = None,
) -> dict[str, Any]:
    """生成与前端 StudentDashboardDTO 对齐的 dict。"""
    sid = str(record_get(record, "student_id") or "")
    gpa = _f(record_get(record, "average_credit_gpa"))
    grade = _i(record_get(record, "grade"))
    awards_n = _i(record_get(record, "competition_award_count"))
    failed = _f(record_get(record, "failed_total_credits"))

    class_rank = dense_rank_by_gpa(sid, class_peers or [record])
    major_rank = dense_rank_by_gpa(sid, major_peers or [record])
    grade_rank = dense_rank_by_gpa(sid, grade_peers or [record])

    tags = build_high_potential_label_tags(record, major_rank=major_rank)
    risk = academic_risk_level(record)
    attention_raw = build_attention_items(record)
    credits = credit_progress(record)
    parsed_awards = parse_competition_detail(str(record_get(record, "competition_award_detail") or ""))
    comp_pct = competition_percentile_among(record, grade_peers or [record])

    academic_score = score_academic(gpa, major_rank.percentile)
    quality_score = score_quality_proxy(record, grade_competition_percentile=comp_pct)
    # 心理未接入：中性占位，不装作高精度测评
    mental_score = 70.0
    employment_score = score_employment_proxy(record, academic_score, quality_score)
    growth_index = round(0.45 * academic_score + 0.25 * quality_score + 0.15 * mental_score + 0.15 * employment_score, 1)

    if growth_index >= 88:
        growth_level = "优秀"
    elif growth_index >= 75:
        growth_level = "良好"
    elif growth_index >= 60:
        growth_level = "中等"
    else:
        growth_level = "待提升"

    direction, match, job_matches = recommend_direction(record)
    copy = build_template_copy(
        record,
        tags=tags,
        class_rank=class_rank,
        major_rank=major_rank,
        risk=risk,
        direction=direction,
        match=match,
    )

    major_name = str(record_get(record, "major_name") or "")
    class_name = str(record_get(record, "class_name") or "")
    teaching_dept = str(record_get(record, "teaching_department") or "")
    college = college_name or teaching_dept or "大数据与计算机学院"

    course_grades = []
    for label, key in (
        ("专业课", "major_course_avg_score"),
        ("学科基础课", "subject_basic_course_avg_score"),
        ("通识课", "general_course_avg_score"),
        ("必修课", "required_course_avg_score"),
        ("选修课", "elective_course_avg_score"),
    ):
        score = _f(record_get(record, key))
        if score > 0:
            course_grades.append({"name": label, "score": round(score, 1)})

    failed_critical: list[dict[str, Any]] = []
    if failed > 0:
        failed_critical.append(
            {
                "name": f"不及格学分合计 {failed:.1f}（单科明细待接入）",
                "score": 0,
                "required": True,
            }
        )

    award_profile = [
        {"name": a["name"] or "", "level": a.get("level") or "校级", "date": a.get("date")}
        for a in parsed_awards[:8]
    ]
    competition_highlights = [
        {"label": (a.get("name") or "")[:40], "detail": a.get("date") or a.get("level")}
        for a in parsed_awards[:5]
    ]
    if not competition_highlights and awards_n:
        competition_highlights = [{"label": f"竞赛获奖 {awards_n} 项", "detail": None}]

    pe = str(record_get(record, "pe_standard") or "")
    physical = 0
    if pe:
        m = re.search(r"(\d+(?:\.\d+)?)", pe)
        if m:
            physical = int(float(m.group(1)))

    portrait_tags = list(tags)
    if risk == "low" and gpa >= 3.0:
        portrait_tags.insert(0, "正向成长")
    if failed > 0:
        portrait_tags.append("学业待补")
    portrait_tags.append("实习待接入")

    highlights = []
    for i, a in enumerate(parsed_awards[:5], start=1):
        highlights.append({"id": str(i), "label": a.get("name") or "", "date": a.get("date")})
    if not highlights and tags:
        for i, t in enumerate(tags, start=1):
            highlights.append({"id": str(i), "label": t, "date": None})

    return {
        "profile": {
            "name": str(record_get(record, "name") or ""),
            "gender": str(record_get(record, "gender") or "") or None,
            "studentId": sid,
            "college": college,
            "major": major_name,
            "grade": f"{grade}级" if grade else "",
            "className": class_name,
            "mentor": str(record_get(record, "class_teacher") or ""),
            "counselor": str(record_get(record, "counselor") or ""),
            "dormitory": dormitory_text(record) or "—",
            "motto": "持续学习，勇于探索",
            "mottoSub": "数据驱动成长",
            "avatarUrl": avatar_url_for(record),
            "awards": award_profile,
            "politicalStatus": str(record_get(record, "political_status") or "") or None,
            "phone": str(record_get(record, "phone") or "") or None,
            "address": str(record_get(record, "native_place") or "") or None,
            "onCampusStatus": "在校" if str(record_get(record, "status") or "active") == "active" else str(record_get(record, "status")),
            "highPotentialTags": tags,
            "economicHardship": False,
            "mentalLevel": "未评估",
            "mentalLevelCode": "low",
            "growthTrend": "stable",
            "thesisAdvisor": str(record_get(record, "supervisor_name") or record_get(record, "class_teacher") or "") or None,
            "thesisStatus": "未开始",
            "familySituation": "家庭档案暂未接入",
            "familyMembers": [],
            "difficultyDetail": "暂无特殊困难情况记录",
            "guardianName": None,
            "guardianPhone": None,
        },
        "growthPortrait": {
            "dimensions": [
                {"name": "学业能力", "personal": academic_score, "gradeAvg": 75.0},
                {"name": "专业创新", "personal": round(min(95.0, 65 + awards_n * 5 + comp_pct * 15), 1), "gradeAvg": 72.0},
                {"name": "实践能力", "personal": 60.0, "gradeAvg": 70.0},
                {"name": "身心素质", "personal": mental_score, "gradeAvg": 70.0},
                {"name": "组织协调", "personal": 60.0, "gradeAvg": 70.0},
            ]
        },
        "aiAssistant": {
            "title": "财宝成长助手 AI",
            "recommendedDirection": direction,
            "matchBasis": copy["matchBasis"],
            "shortTermSuggestions": copy["shortTermSuggestions"],
            "longTermSuggestions": copy["longTermSuggestions"],
        },
        "growthOverview": {
            "growthIndex": growth_index,
            "growthLevel": growth_level,
            "overallRank": grade_rank.rank,
            "overallTotal": grade_rank.total,
            "academicRank": major_rank.rank,
            "academicTotal": major_rank.total,
            "qualityScore": quality_score,
            "qualityLevel": "良好+" if quality_score >= 80 else ("良好" if quality_score >= 70 else "中等"),
        },
        "highlights": highlights,
        "attention": [
            {"id": str(i + 1), "label": a["label"], "category": a["category"], "level": a["level"]}
            for i, a in enumerate(attention_raw)
        ],
        "academic": {
            "gpa": round(gpa, 2),
            "classRank": class_rank.rank,
            "classTotal": class_rank.total,
            "departmentRank": grade_rank.rank,
            "departmentTotal": grade_rank.total,
            "majorRank": major_rank.rank,
            "majorTotal": major_rank.total,
            "physicalTestScore": physical,
            "gpaTrend": {"semesters": [f"{grade}级累计"] if grade else ["累计"], "values": [round(gpa, 2)]},
            "classRankTrend": {"semesters": [f"{grade}级累计"] if grade else ["累计"], "values": [class_rank.rank]},
            "departmentRankTrend": {"semesters": [f"{grade}级累计"] if grade else ["累计"], "values": [grade_rank.rank]},
            "majorRankTrend": {"semesters": [f"{grade}级累计"] if grade else ["累计"], "values": [major_rank.rank]},
            "physicalTestTrend": {"semesters": [], "values": []},
            "courseGrades": course_grades,
            "courseCompletionRate": int(credits["earnedPercent"]),
            "excellentCourses": 0,
            "totalCourses": _i(record_get(record, "all_course_count")),
            "yearlyGoals": [],
            "currentCourses": [],
            "failedElective": [],
        },
        "competition": {
            "awardCount": awards_n,
            "researchCount": 0,
            "innovationCount": 0,
            "highlights": competition_highlights or [{"label": "暂无竞赛记录", "detail": None}],
        },
        "quality": {
            "cadreRoles": [],
            "volunteerHours": 0,
            "socialPractices": 0,
            "softSkills": [],
            "disciplineRecords": [],
        },
        "internship": {"internshipCount": 0, "projectCount": 0, "certificateCount": 0, "items": []},
        "health": {
            "healthScore": mental_score,
            "mentalHealth": mental_score,
            "exerciseHabit": "数据未接入",
            "summary30d": {"totalMinutes": 0, "frequency": 0, "calories": 0},
        },
        "employment": {
            "jobReadiness": employment_score,
            "certificateReadiness": 50,
            "careerDirections": [m["role"] for m in job_matches],
            "developmentPath": copy["developmentPath"],
        },
        "footer": {
            "motto": "每一次努力，都是成长的足迹",
            "growthDays": 0,
            "goalCompletionRate": int(credits["earnedPercent"]),
            "milestoneCount": len(highlights),
            "totalAwards": awards_n,
        },
        "creditProgress": {
            "earned": credits["earned"],
            "required": credits["required"],
            "secondClassroomEarned": 0,
            "secondClassroomRequired": 10,
        },
        "failedCritical": failed_critical,
        "timeline": [],
        "aiPortrait": {
            "summary": copy["summary"],
            "portraitTags": portrait_tags,
            "strengthTags": [
                *(["学业基础扎实"] if gpa >= 3.2 else []),
                *([f"竞赛获奖 {awards_n} 项"] if awards_n > 0 else []),
                f"方向潜能：{direction}",
            ][:4],
            "focusTags": [
                *([f"不及格学分 {failed:.1f}"] if failed > 0 else []),
                *(["GPA 偏低"] if 0 < gpa < 2.5 else []),
                "就业填报待完善",
                "项目经历待补充",
            ][:4],
            "pushes": copy["pushes"],
            "jobMatches": job_matches,
        },
        "scholarships": [],
        "annualAssessments": [],
        "careerDev": {
            "practiceBases": [],
            "internshipBases": [],
            "employmentIntention": "待实习",
            "employmentDestination": "待实习",
            "targetCity": "未填报",
            "expectedSalary": "未填报",
            "resumeStatus": "未完善",
            "projectExperiences": [],
            "militaryNote": "无",
        },
        "mentalGrowth": {
            "supportStatus": "心理分级未接入",
            "records": [],
        },
    }


# 兼容旧规则模块调用
def build_academic_warnings(record: Any) -> list[dict[str, Any]]:
    """学院大屏兼容：type 仍为 academic/credit/employment。"""
    out: list[dict[str, Any]] = []
    gpa = _f(record_get(record, "average_credit_gpa"))
    failed = _f(record_get(record, "failed_total_credits"))
    makeup = _i(record_get(record, "makeup_exam_count"))
    retake = _i(record_get(record, "retake_count"))
    absent = _i(record_get(record, "absent_exam_count"))

    if gpa and gpa < 2.0:
        out.append({"type": "academic", "reason": f"GPA {gpa:.2f} 低于 2.0", "level": "high"})
    elif gpa and gpa < 2.5:
        out.append({"type": "academic", "reason": f"GPA {gpa:.2f} 偏低", "level": "medium"})

    if failed > 0:
        out.append(
            {
                "type": "credit",
                "reason": f"不及格学分 {failed:.1f}",
                "level": "medium" if failed < 10 else "high",
            }
        )
    if absent >= 2:
        out.append({"type": "academic", "reason": f"缺考 {absent} 次", "level": "medium"})
    if makeup >= 2:
        out.append({"type": "academic", "reason": f"补考 {makeup} 次", "level": "medium"})
    if retake >= 2:
        out.append({"type": "academic", "reason": f"重修 {retake} 次", "level": "medium"})
    if gpa and gpa < 2.0 and _i(record_get(record, "grade")) and _i(record_get(record, "grade")) <= 2022:
        out.append({"type": "employment", "reason": "毕业年级学业压力较大", "level": "medium"})
    return out


def build_high_potential_tags(record: Any) -> list[dict[str, Any]]:
    # 无 cohort 时用保守规则（与页面标签粗对齐）
    gpa = _f(record_get(record, "average_credit_gpa"))
    failed = _f(record_get(record, "failed_total_credits"))
    awards = _i(record_get(record, "competition_award_count"))
    detail = str(record_get(record, "competition_award_detail") or "")
    tags: list[dict[str, Any]] = []
    if gpa >= 3.5 and failed == 0:
        tags.append({"dimension": "academic", "highlight": f"GPA {gpa:.2f}"})
    elif gpa >= 3.0 and failed == 0:
        tags.append({"dimension": "academic", "highlight": f"GPA {gpa:.2f} · 无不及格"})
    if awards > 0 and ("国家级" in detail or "省部级" in detail or "省级" in detail or awards >= 2):
        tags.append({"dimension": "competition", "highlight": f"竞赛获奖 {awards} 项"})
    elif awards > 0:
        tags.append({"dimension": "competition", "highlight": f"竞赛获奖 {awards} 项"})
    return tags
