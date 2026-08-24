from decimal import Decimal
from pathlib import Path
from typing import Any

from Utils.DB.Models.student_academic_record_models import StudentAcademicRecord

try:
    import yaml  # type: ignore
except ImportError:  # pragma: no cover
    yaml = None

_CONFIG_DIR = Path(__file__).resolve().parents[2] / "scripts" / "config"

# level → 会议 1–3 级（1 最严重）
_LEVEL_TO_GRADE = {"high": 1, "medium": 2, "low": 3}
_GRADE_LABEL = {1: "1级预警", 2: "2级预警", 3: "3级预警"}


def _to_float(value: Decimal | float | int | None) -> float:
    if value is None:
        return 0.0
    return float(value)


def _attach_grade(warning: dict[str, Any]) -> dict[str, Any]:
    level = warning.get("level") or "low"
    grade = int(_LEVEL_TO_GRADE.get(level, 3))
    warning["grade"] = grade
    warning["gradeLabel"] = _GRADE_LABEL[grade]
    return warning


def load_student_rule_config() -> dict[str, Any]:
    """学工规则配置位：阈值可热替换。"""
    path = _CONFIG_DIR / "student_rules.yaml"
    defaults = {
        "gpaHigh": 2.0,
        "gpaMedium": 2.5,
        "failedHigh": 10,
        "absentMedium": 2,
        "makeupMedium": 2,
    }
    if yaml is None or not path.exists():
        return defaults
    try:
        data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
        return {**defaults, **(data.get("warnings") or {})}
    except Exception:
        return defaults


def build_academic_warnings(record: StudentAcademicRecord) -> list[dict[str, Any]]:
    """根据学业数据计算预警（含 1–3 级）。"""

    cfg = load_student_rule_config()
    warnings: list[dict[str, Any]] = []
    gpa = _to_float(record.average_credit_gpa)
    failed_credits = _to_float(record.failed_total_credits)

    if gpa and gpa < float(cfg["gpaHigh"]):
        warnings.append(_attach_grade({"type": "academic", "reason": f"GPA {gpa:.2f} 低于 {cfg['gpaHigh']}", "level": "high"}))
    elif gpa and gpa < float(cfg["gpaMedium"]):
        warnings.append(_attach_grade({"type": "academic", "reason": f"GPA {gpa:.2f} 偏低", "level": "medium"}))

    if failed_credits > 0:
        warnings.append(
            _attach_grade(
                {
                    "type": "credit",
                    "reason": f"不及格学分 {failed_credits:.1f}",
                    "level": "medium" if failed_credits < float(cfg["failedHigh"]) else "high",
                }
            )
        )

    if (record.absent_exam_count or 0) >= int(cfg["absentMedium"]):
        warnings.append(
            _attach_grade({"type": "academic", "reason": f"缺考 {record.absent_exam_count} 次", "level": "medium"})
        )

    if (record.makeup_exam_count or 0) >= int(cfg["makeupMedium"]):
        warnings.append(
            _attach_grade({"type": "academic", "reason": f"补考 {record.makeup_exam_count} 次", "level": "medium"})
        )

    if gpa and gpa < float(cfg["gpaHigh"]) and record.grade and record.grade <= 2022:
        warnings.append(_attach_grade({"type": "employment", "reason": "毕业年级学业压力较大", "level": "medium"}))

    # 轻度学业波动 → 3 级（低风险观察）
    if not warnings and gpa and 2.5 <= gpa < 2.8:
        warnings.append(_attach_grade({"type": "academic", "reason": f"GPA {gpa:.2f} 需持续关注", "level": "low"}))

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


def classify_employment_exit(destination: str | None) -> str:
    """就业去向粗分类：考研 / 大厂 / 考公 / 出国 / 其他就业 / 未就业。"""
    text = str(destination or "").strip()
    if not text:
        return "未知"
    if any(k in text for k in ("升学", "考研", "保研", "研究生", "读研")):
        return "考研升学"
    if any(k in text for k in ("出国", "境外", "留学")):
        return "出国升学"
    if any(k in text for k in ("公务员", "选调", "事业单位", "考公", "机关")):
        return "考公事业"
    if any(k in text for k in ("腾讯", "阿里", "字节", "华为", "百度", "美团", "京东", "网易", "大厂")):
        return "进大厂"
    if any(k in text for k in ("待就业", "未就业", "暂不就业", "求职中")):
        return "未就业"
    return "其他就业"


def count_by_dimension(records: list[StudentAcademicRecord], dimension: str) -> int:
    total = 0
    for record in records:
        if any(t["dimension"] == dimension for t in build_high_potential_tags(record)):
            total += 1
    return total
