"""学院学业风险聚合（仅聚合指标，不含姓名/学号等 PII）。"""

from __future__ import annotations

from collections import defaultdict
from typing import Any

from Utils.Analytics.student_rules import build_academic_warnings, _to_float
from Utils.DB.Models.student_academic_record_models import StudentAcademicRecord


async def build_academic_risk_snapshot(
    students: list[StudentAcademicRecord],
    *,
    warning_type: str | None = None,
) -> dict[str, Any]:
    """从学籍记录生成可供 Agent 使用的聚合快照。"""

    total = len(students)
    warned_ids: set[str] = set()
    by_type: dict[str, int] = defaultdict(int)
    by_level: dict[str, int] = defaultdict(int)
    by_grade: dict[str, dict[str, Any]] = {}
    by_major: dict[str, dict[str, Any]] = {}

    gpa_sum = 0.0
    gpa_n = 0
    failed_sum = 0.0
    cet4_pass = 0
    cet6_pass = 0

    for record in students:
        warnings = build_academic_warnings(record)
        if warning_type:
            warnings = [w for w in warnings if w["type"] == warning_type]

        gpa = _to_float(record.average_credit_gpa)
        if gpa:
            gpa_sum += gpa
            gpa_n += 1
        failed_sum += _to_float(record.failed_total_credits)
        if _to_float(record.cet4_score) >= 425:
            cet4_pass += 1
        if _to_float(record.cet6_score) >= 425:
            cet6_pass += 1

        grade_key = str(record.grade or "未知")
        major_key = (record.major_name or "未知专业").strip() or "未知专业"

        if grade_key not in by_grade:
            by_grade[grade_key] = {
                "grade": grade_key,
                "students": 0,
                "warned": 0,
                "gpaSum": 0.0,
                "gpaN": 0,
                "failedCreditsSum": 0.0,
            }
        g = by_grade[grade_key]
        g["students"] += 1
        g["failedCreditsSum"] += _to_float(record.failed_total_credits)
        if gpa:
            g["gpaSum"] += gpa
            g["gpaN"] += 1

        if major_key not in by_major:
            by_major[major_key] = {
                "major": major_key,
                "students": 0,
                "warned": 0,
                "high": 0,
            }
        m = by_major[major_key]
        m["students"] += 1

        if warnings:
            warned_ids.add(record.student_id)
            g["warned"] += 1
            m["warned"] += 1
            for w in warnings:
                by_type[str(w["type"])] += 1
                by_level[str(w["level"])] += 1
                if w["level"] == "high":
                    m["high"] += 1

    def finalize_grade(item: dict[str, Any]) -> dict[str, Any]:
        n = item["students"] or 1
        gpa_n_local = item["gpaN"] or 0
        return {
            "grade": item["grade"],
            "students": item["students"],
            "warned": item["warned"],
            "warnRate": round(item["warned"] / n * 100, 1),
            "avgGpa": round(item["gpaSum"] / gpa_n_local, 2) if gpa_n_local else None,
            "avgFailedCredits": round(item["failedCreditsSum"] / n, 2),
        }

    def finalize_major(item: dict[str, Any]) -> dict[str, Any]:
        n = item["students"] or 1
        return {
            "major": item["major"],
            "students": item["students"],
            "warned": item["warned"],
            "high": item["high"],
            "warnRate": round(item["warned"] / n * 100, 1),
        }

    grades = sorted((finalize_grade(v) for v in by_grade.values()), key=lambda x: x["grade"])
    majors = sorted(
        (finalize_major(v) for v in by_major.values()),
        key=lambda x: (-x["warnRate"], -x["warned"]),
    )

    warned = len(warned_ids)
    return {
        "warningType": warning_type or "all",
        "summary": {
            "students": total,
            "warned": warned,
            "warnRate": round(warned / total * 100, 1) if total else 0,
            "avgGpa": round(gpa_sum / gpa_n, 2) if gpa_n else None,
            "avgFailedCredits": round(failed_sum / total, 2) if total else 0,
            "cet4PassRate": round(cet4_pass / total * 100, 1) if total else 0,
            "cet6PassRate": round(cet6_pass / total * 100, 1) if total else 0,
            "byType": dict(by_type),
            "byLevel": dict(by_level),
        },
        "byGrade": grades,
        "byMajor": majors[:12],
        "topRiskMajors": [m for m in majors if m["warned"] > 0][:5],
    }


def rule_insights_from_academic_risk(snapshot: dict[str, Any]) -> tuple[list[dict[str, str]], list[str]]:
    summary = snapshot.get("summary") or {}
    grades = snapshot.get("byGrade") or []
    top = snapshot.get("topRiskMajors") or []
    total = int(summary.get("students") or 0)
    warned = int(summary.get("warned") or 0)
    rate = float(summary.get("warnRate") or 0)
    avg_gpa = summary.get("avgGpa")
    by_level = summary.get("byLevel") or {}
    high = int(by_level.get("high") or 0)

    worst_grade = max(grades, key=lambda g: g.get("warnRate") or 0) if grades else None
    top_major = top[0] if top else None

    insights = [
        {
            "title": "预警覆盖面",
            "detail": (
                f"在读 {total} 人中，命中预警规则 {warned} 人（{rate}%）；"
                f"高风险 {high} 人次；学院均 GPA {avg_gpa if avg_gpa is not None else '—'}，"
                f"四级通过率 {summary.get('cet4PassRate')}%，六级 {summary.get('cet6PassRate')}%。"
            ),
            "tone": "warn" if rate >= 15 else "info",
        },
        {
            "title": "年级风险分布",
            "detail": (
                (
                    f"预警率最高年级为 {worst_grade['grade']} 级"
                    f"（{worst_grade['warnRate']}%，{worst_grade['warned']}/{worst_grade['students']}）；"
                    f"均不及格学分 {worst_grade.get('avgFailedCredits')}。"
                )
                if worst_grade
                else "暂无年级分布数据。"
            ),
            "tone": "warn" if worst_grade and worst_grade.get("warnRate", 0) >= 20 else "info",
        },
        {
            "title": "专业集中度",
            "detail": (
                (
                    f"风险最集中专业「{top_major['major']}」："
                    f"预警 {top_major['warned']} 人、高风险 {top_major['high']} 人，"
                    f"预警率 {top_major['warnRate']}%。建议按专业制定补救课与学业辅导。"
                )
                if top_major
                else "各专业预警较分散，可维持常规学业辅导节奏。"
            ),
            "tone": "warn" if top_major and top_major.get("warnRate", 0) >= 20 else "good",
        },
    ]
    actions = [
        "对预警率最高年级召开学业专题会，明确辅导员与班主任双周跟进",
        "针对高风险专业开设补考/重修辅导清单，优先覆盖高风险人次",
        "把 GPA<2.5 与不及格学分双指标学生纳入学院学业帮扶台账（仅院内流转）",
    ]
    return insights, actions
