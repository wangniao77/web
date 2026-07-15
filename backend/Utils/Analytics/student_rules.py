"""学生预警与高潜规则（兼容入口，实现见 student_derive）。"""

from Utils.Analytics.student_derive import (  # noqa: F401
    build_academic_warnings,
    build_high_potential_tags,
    derive_student_dashboard,
    parse_competition_detail,
)


def count_by_dimension(records: list, dimension: str) -> int:
    total = 0
    for record in records:
        if any(t["dimension"] == dimension for t in build_high_potential_tags(record)):
            total += 1
    return total
