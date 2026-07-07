from decimal import Decimal
from typing import Any

from Utils.DB.Models.student_academic_record_models import StudentAcademicRecord


def _to_float(value: Decimal | float | int | None) -> float:
    if value is None:
        return 0.0
    return float(value)


def build_academic_warnings(record: StudentAcademicRecord) -> list[dict[str, Any]]:
    """根据学业数据计算预警。"""

    warnings: list[dict[str, Any]] = []
    gpa = _to_float(record.average_credit_gpa)
    failed_credits = _to_float(record.failed_total_credits)

    if gpa and gpa < 2.0:
        warnings.append({"type": "academic", "reason": f"GPA {gpa:.2f} 低于 2.0", "level": "high"})
    elif gpa and gpa < 2.5:
        warnings.append({"type": "academic", "reason": f"GPA {gpa:.2f} 偏低", "level": "medium"})

    if failed_credits > 0:
        warnings.append(
            {
                "type": "credit",
                "reason": f"不及格学分 {failed_credits:.1f}",
                "level": "medium" if failed_credits < 10 else "high",
            }
        )

    if (record.absent_exam_count or 0) >= 2:
        warnings.append(
            {"type": "academic", "reason": f"缺考 {record.absent_exam_count} 次", "level": "medium"}
        )

    if (record.makeup_exam_count or 0) >= 2:
        warnings.append(
            {"type": "academic", "reason": f"补考 {record.makeup_exam_count} 次", "level": "medium"}
        )

    if gpa and gpa < 2.0 and record.grade and record.grade <= 2022:
        warnings.append({"type": "employment", "reason": "毕业年级学业压力较大", "level": "medium"})

    return warnings


def build_high_potential_tags(record: StudentAcademicRecord) -> list[dict[str, Any]]:
    """根据学业数据计算高潜维度。"""

    tags: list[dict[str, Any]] = []
    gpa = _to_float(record.average_credit_gpa)
    cet6 = _to_float(record.cet6_score)
    cet4 = _to_float(record.cet4_score)
    awards = record.competition_award_count or 0
    earned = _to_float(record.earned_total_credits)
    failed = _to_float(record.failed_total_credits)

    if gpa >= 3.5:
        tags.append({"dimension": "academic", "highlight": f"GPA {gpa:.2f}"})
    elif gpa >= 3.0 and failed == 0:
        tags.append({"dimension": "academic", "highlight": f"GPA {gpa:.2f} · 无不及格"})

    if awards > 0:
        tags.append({"dimension": "competition", "highlight": f"竞赛获奖 {awards} 项"})

    if cet6 >= 500 or cet4 >= 550:
        tags.append({"dimension": "academic", "highlight": f"英语优秀（四级{cet4:.0f}/六级{cet6:.0f}）"})

    if earned >= 100 and failed == 0:
        tags.append({"dimension": "career", "highlight": "学分完成优秀"})

    if gpa >= 3.2 and awards >= 1:
        tags.append({"dimension": "internship", "highlight": "学业与竞赛双优"})

    return tags


def count_by_dimension(records: list[StudentAcademicRecord], dimension: str) -> int:
    total = 0
    for record in records:
        if any(t["dimension"] == dimension for t in build_high_potential_tags(record)):
            total += 1
    return total
