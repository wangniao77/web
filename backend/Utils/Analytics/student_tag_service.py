"""高潜 / 预警标签批算与读取（对齐前端 tag_key 枚举）。"""

from __future__ import annotations

from collections import defaultdict
from typing import Any

from Utils.Analytics.student_rules import build_academic_warnings, build_high_potential_tags
from Utils.DB.Models.college_ext_models import StudentTag
from Utils.DB.Models.college_models import College
from Utils.DB.Models.college_student_models import AnalysisRuleRun, StudentProfile
from Utils.DB.Models.student_academic_record_models import StudentAcademicRecord

# 前端 HighPotentialModuleId / WarningCategoryType 对齐
HP_KEYS = {"academic", "competition", "leadership", "rural", "internship", "career"}
WARN_KEYS = {"academic", "credit", "psychological", "employment"}


async def load_college_tags(
    college: College | None,
    *,
    tag_type: str | None = None,
) -> list[StudentTag]:
    qs = StudentTag.all()
    if college:
        qs = qs.filter(college_id=college.id)
    if tag_type:
        qs = qs.filter(tag_type=tag_type)
    return await qs


def index_tags_by_student(tags: list[StudentTag]) -> dict[str, list[StudentTag]]:
    out: dict[str, list[StudentTag]] = defaultdict(list)
    for t in tags:
        if t.student_id:
            out[t.student_id].append(t)
    return out


async def rebuild_student_tags(college: College, *, rule_version: str = "v1") -> dict[str, Any]:
    stats: dict[str, Any] = {"warning": 0, "high_potential": 0, "rule_run_id": 0, "skipped_keys": 0}
    await StudentTag.filter(college_id=college.id).delete()

    run = await AnalysisRuleRun.create(
        college=college,
        kind="both",
        rule_version=rule_version,
        note="rebuild_student_tags",
    )
    stats["rule_run_id"] = run.id

    records = await StudentAcademicRecord.filter(college_id=college.id).all()
    if not records:
        records = await StudentAcademicRecord.all()

    profile_cache: dict[str, StudentProfile | None] = {}
    student_seen: set[str] = set()

    for rec in records:
        if rec.student_id not in profile_cache:
            profile_cache[rec.student_id] = await StudentProfile.get_or_none(student_no=rec.student_id)
        profile = profile_cache.get(rec.student_id)
        if rec.student_id:
            student_seen.add(rec.student_id)

        warn_map: dict[str, dict[str, str]] = {}
        for w in build_academic_warnings(rec):
            key = str(w.get("type") or "academic")
            if key not in WARN_KEYS:
                stats["skipped_keys"] += 1
                continue
            reason = str(w.get("reason") or "")
            level = str(w.get("level") or "")
            if key not in warn_map:
                warn_map[key] = {"level": level, "reason": reason}
            else:
                prev = warn_map[key]["reason"]
                if reason and reason not in prev:
                    warn_map[key]["reason"] = f"{prev}; {reason}" if prev else reason
                if level == "high":
                    warn_map[key]["level"] = "high"
        for key, meta in warn_map.items():
            await StudentTag.create(
                college=college,
                profile=profile,
                rule_run=run,
                student_id=rec.student_id,
                grade=rec.grade,
                tag_type="warning",
                tag_key=key,
                level=meta["level"] or None,
                reason=(meta["reason"] or "")[:500] or None,
                source="rule",
            )
            stats["warning"] += 1

        hp_map: dict[str, str] = {}
        for t in build_high_potential_tags(rec):
            key = str(t.get("dimension") or "academic")
            if key not in HP_KEYS:
                stats["skipped_keys"] += 1
                continue
            highlight = str(t.get("highlight") or "")
            if key not in hp_map:
                hp_map[key] = highlight
            elif highlight and highlight not in hp_map[key]:
                hp_map[key] = f"{hp_map[key]}; {highlight}"
        for key, reason in hp_map.items():
            await StudentTag.create(
                college=college,
                profile=profile,
                rule_run=run,
                student_id=rec.student_id,
                grade=rec.grade,
                tag_type="high_potential",
                tag_key=key,
                reason=(reason or "")[:500] or None,
                source="rule",
            )
            stats["high_potential"] += 1

    run.student_count = len(student_seen)
    run.tag_count = int(stats["warning"]) + int(stats["high_potential"])
    await run.save(update_fields=["student_count", "tag_count"])
    return stats
