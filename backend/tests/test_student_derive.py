"""Smoke test for student derive (no DB)."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from Utils.Analytics.student_derive import (  # noqa: E402
    dense_rank_by_gpa,
    derive_student_dashboard,
    parse_competition_detail,
)


def test_parse_competition():
    items = parse_competition_detail(
        "蓝桥杯（省部级-三等奖），2024年4月；数学建模（国家级-二等奖），2024年9月"
    )
    assert len(items) == 2
    assert items[0]["level"] == "省部级"
    assert items[1]["level"] == "国家级"


def test_dense_rank():
    peers = [
        {"student_id": "a", "average_credit_gpa": 3.9},
        {"student_id": "b", "average_credit_gpa": 3.9},
        {"student_id": "c", "average_credit_gpa": 3.5},
    ]
    ra = dense_rank_by_gpa("a", peers)
    rc = dense_rank_by_gpa("c", peers)
    assert ra.rank == 1 and ra.total == 3
    assert rc.rank == 3


def test_derive_from_export_json():
    path = ROOT.parent / "frontend" / "src" / "mock" / "student" / "academicRecords.json"
    rows = json.loads(path.read_text(encoding="utf-8"))
    target = next(r for r in rows if r["student_id"] == "22251102220")
    grade_peers = [r for r in rows if r["grade"] == target["grade"]]
    major_peers = [r for r in grade_peers if r.get("major_name") == target.get("major_name")]
    class_peers = [r for r in grade_peers if r.get("class_name") == target.get("class_name")]
    dto = derive_student_dashboard(
        target,
        class_peers=class_peers,
        major_peers=major_peers,
        grade_peers=grade_peers,
    )
    assert dto["profile"]["name"] == "刘华杰"
    assert dto["academic"]["gpa"] == 3.89
    assert "竞赛高潜" in (dto["profile"]["highPotentialTags"] or [])
    assert dto["health"]["mentalHealth"] == 70
    assert dto["creditProgress"]["required"] >= 160
    assert dto["creditProgress"]["earned"] == 161
    assert dto["aiPortrait"]["summary"]
    print("OK", dto["profile"]["highPotentialTags"], dto["growthOverview"]["growthIndex"], dto["academic"]["classRank"])


if __name__ == "__main__":
    test_parse_competition()
    test_dense_rank()
    test_derive_from_export_json()
    print("all passed")
