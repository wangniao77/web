"""专业发展全景：学籍/就业真数 + major_rank_snapshots 排名/对标；缺源用 **。"""

from __future__ import annotations

from collections import Counter, defaultdict
from statistics import median
from typing import Any

from Utils.DB.Models.college_ext_models import AchievementItem, MajorRankSnapshot, Teacher
from Utils.DB.Models.external_data_models import EmploymentRecord
from Utils.DB.Models.major_models import Major
from Utils.DB.Models.student_extra_models import CompetitionAward
from Utils.DB.dept_major import resolve_department_from_major
from Utils.DB.read.college_db import (
    fetch_college_records,
    latest_records_by_student,
    resolve_college,
    to_float,
)
from Utils.DB.read.schema_compat import fetch_compat

MISSING = "**"

_UNPLACED = frozenset(
    {
        "待就业",
        "未就业",
        "暂不就业",
        "不就业拟升学",
        "求职中",
    }
)


def _s(v: Any) -> str:
    return str(v or "").strip()


def _round1(v: float) -> float:
    return round(v, 1)


def _pct(part: int, total: int) -> float | str:
    if total <= 0:
        return MISSING
    return _round1(part * 100.0 / total)


def _norm_major(name: str) -> str:
    n = _s(name).replace("（", "(").replace("）", ")")
    for suffix in ("专业", "（本科）", "(本科)"):
        if n.endswith(suffix):
            n = n[: -len(suffix)]
    return n.strip()


def _is_placed(destination: str | None) -> bool:
    dest = _s(destination)
    return bool(dest) and dest not in _UNPLACED


def _is_further_study(destination: str | None) -> bool:
    dest = _s(destination)
    if not dest:
        return False
    if any(k in dest for k in ("境内升学", "国内升学", "出国升学", "境外升学", "留学")):
        return True
    return "升学" in dest and "拟升学" not in dest


def _match_canonical(raw: str, canonicals: list[str]) -> str | None:
    n = _norm_major(raw)
    if not n:
        return None
    # 优先精确匹配，再匹配「主专业名 ⊆ 方向班名」
    for c in canonicals:
        if n == _norm_major(c):
            return c
    # 主专业优先：先匹配无括号的本科专业名，避免落到「××(实验班)」上
    ordered = sorted(
        canonicals,
        key=lambda c: (1 if _is_track_major(c) else 0, -len(_norm_major(c))),
    )
    for c in ordered:
        cn = _norm_major(c)
        if n == cn or n in cn or cn in n:
            return c
    return None


def _is_graduate_level(edu: str | None) -> bool:
    text = _s(edu)
    return any(k in text for k in ("研究生", "硕士", "博士"))


def _is_track_major(name: str) -> bool:
    """方向班 / 校区班 / 协同项目等，不作为专业发展全景独立卡片。"""
    n = _s(name)
    return "(" in n or "（" in n


# 专业发展全景不展示的专业（样本量过小 / 非本院核心本科专业等）
_EXCLUDED_DISPLAY_MAJORS = frozenset(
    {
        "信息管理与信息系统",
        "大数据管理与应用",
        "电子商务",
    }
)


def _is_excluded_display_major(name: str) -> bool:
    n = _norm_major(name)
    return n in _EXCLUDED_DISPLAY_MAJORS or _s(name) in _EXCLUDED_DISPLAY_MAJORS


def _is_undergrad_record(student: Any) -> bool:
    return not _is_graduate_level(getattr(student, "education_level", None))


def _is_undergrad_employment(row: EmploymentRecord, student: Any | None = None) -> bool:
    if _is_graduate_level(getattr(row, "education_level", None)):
        return False
    if _is_graduate_level(getattr(row, "education_status", None)):
        return False
    if student is not None and _is_graduate_level(getattr(student, "education_level", None)):
        return False
    return True


def _num_or_missing(v: Any) -> float | int | str:
    if v is None:
        return MISSING
    if isinstance(v, (int, float)):
        return v
    return MISSING


def _normalize_soft_dims(raw: Any) -> list[dict[str, Any]]:
    if isinstance(raw, dict):
        # 兼容旧 dict 形态
        raw = raw.get("items") or raw.get("dimensions") or []
    if not isinstance(raw, list):
        return []
    out: list[dict[str, Any]] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        key = _s(item.get("key"))
        label = _s(item.get("label"))
        try:
            score = float(item.get("score"))
            peer = float(item.get("peerAverage"))
        except (TypeError, ValueError):
            continue
        if key and label:
            out.append(
                {"key": key, "label": label, "score": score, "peerAverage": peer}
            )
    return out


def _normalize_peers(raw: Any) -> list[dict[str, Any]]:
    if not isinstance(raw, list):
        return []
    out: list[dict[str, Any]] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        school = _s(item.get("school"))
        try:
            rank = int(item.get("rank"))
        except (TypeError, ValueError):
            continue
        if not school:
            continue
        row: dict[str, Any] = {"school": school, "rank": rank}
        if item.get("isSelf"):
            row["isSelf"] = True
        out.append(row)
    out.sort(key=lambda x: x["rank"])
    return out


class DisciplineService:
    async def get_overview(self, *, college_id: str | None = None) -> dict[str, Any]:
        base = await self._build(college_id=college_id)
        return base["overview"]

    async def get_overview_detail(self, *, college_id: str | None = None) -> dict[str, Any]:
        base = await self._build(college_id=college_id)
        detail = dict(base["overview"])
        detail.update(base["detail"])
        return detail

    async def _load_snapshots(
        self, *, college_id: int | None, major_by_name: dict[str, Major]
    ) -> tuple[dict[str, MajorRankSnapshot], dict[str, list[MajorRankSnapshot]]]:
        """返回 (专业名→最新年快照, 专业名→按年升序全部快照)。"""
        qs = MajorRankSnapshot.all()
        if college_id is not None:
            qs = qs.filter(college_id=college_id)
        rows = list(await qs)
        by_name_all: dict[str, list[MajorRankSnapshot]] = defaultdict(list)
        id_to_name = {m.id: _s(m.name) for m in major_by_name.values()}
        for snap in rows:
            name = id_to_name.get(snap.major_id) if snap.major_id else None
            if not name:
                continue
            by_name_all[name].append(snap)
        latest: dict[str, MajorRankSnapshot] = {}
        for name, snaps in by_name_all.items():
            snaps.sort(key=lambda s: s.year)
            latest[name] = snaps[-1]
        return latest, by_name_all

    async def _build(self, *, college_id: str | None) -> dict[str, Any]:
        college = await resolve_college(college_id)
        majors_qs = Major.all()
        emp_qs = EmploymentRecord.all()
        if college:
            majors_qs = majors_qs.filter(college_id=college.id)
            emp_qs = emp_qs.filter(college_id=college.id)

        major_rows = list(await majors_qs.order_by("name"))
        major_by_name = {_s(m.name): m for m in major_rows if _s(m.name)}
        canonical_names = list(major_by_name.keys())

        all_records = await fetch_college_records(college)
        students = latest_records_by_student(all_records)
        # 专业发展全景仅统计本科（含普通本科/专升本/培养层次为空）
        enrolled = [
            s
            for s in students
            if (_s(getattr(s, "status", None)) or "active") == "active"
            and _is_undergrad_record(s)
        ]

        by_sid = {_s(s.student_id): s for s in students if _s(s.student_id)}
        emp_rows = [
            r
            for r in await emp_qs
            if _is_undergrad_employment(r, by_sid.get(_s(r.student_id)))
        ]

        # 匹配池含方向班，展示只用无括号的本科主专业
        base_major_names = [n for n in canonical_names if not _is_track_major(n)]
        match_names = list(canonical_names) or list(base_major_names)

        stu_by_major: dict[str, list] = defaultdict(list)
        for s in enrolled:
            canon = _match_canonical(_s(s.major_name), match_names)
            if not canon:
                raw = _s(s.major_name)
                canon = raw if raw and not _is_track_major(raw) else None
            if canon and _is_track_major(canon):
                # 落到方向班时，上收为同名前缀主专业
                parent = next(
                    (
                        b
                        for b in base_major_names
                        if _norm_major(canon).startswith(_norm_major(b))
                    ),
                    None,
                )
                canon = parent
            if canon:
                stu_by_major[canon].append(s)

        if not canonical_names:
            canonical_names = sorted(stu_by_major.keys())
            base_major_names = [n for n in canonical_names if not _is_track_major(n)]
            match_names = list(canonical_names)

        emp_by_major: dict[str, list[EmploymentRecord]] = defaultdict(list)
        for r in emp_rows:
            raw = _s(r.major_name)
            if not raw and _s(r.student_id) in by_sid:
                raw = _s(by_sid[_s(r.student_id)].major_name)
            canon = _match_canonical(raw, match_names) or None
            if canon and _is_track_major(canon):
                parent = next(
                    (
                        b
                        for b in base_major_names
                        if _norm_major(canon).startswith(_norm_major(b))
                    ),
                    None,
                )
                canon = parent
            if not canon:
                n = _norm_major(raw)
                canon = n if n and not _is_track_major(n) else None
            if canon:
                emp_by_major[canon].append(r)

        college_pk = college.id if college else None
        latest_snap, all_snaps = await self._load_snapshots(
            college_id=college_pk, major_by_name=major_by_name
        )

        award_qs = CompetitionAward.filter(member_role="primary")
        teacher_qs = Teacher.filter(status="active")
        ach_qs = AchievementItem.all()
        if college_pk:
            award_qs = award_qs.filter(college_id=college_pk)
            teacher_qs = teacher_qs.filter(college_id=college_pk)
            ach_qs = ach_qs.filter(college_id=college_pk)
        awards = await fetch_compat(award_qs, CompetitionAward)
        teachers = await fetch_compat(teacher_qs, Teacher)
        achievements = await fetch_compat(ach_qs, AchievementItem)

        awards_by_major: dict[str, int] = Counter()
        awards_by_dept: dict[str, int] = Counter()
        for a in awards:
            maj = _match_canonical(_s(a.major_name), match_names) or _s(a.major_name)
            if maj:
                awards_by_major[maj] += 1
            dept = _s(getattr(a, "department", None)) or resolve_department_from_major(
                a.major_name
            )
            if dept:
                awards_by_dept[dept] += 1

        teachers_by_dept: dict[str, list[Teacher]] = defaultdict(list)
        for t in teachers:
            dept = _s(getattr(t, "department", None))
            if dept:
                teachers_by_dept[dept].append(t)

        ach_by_dept: dict[str, int] = Counter(
            _s(getattr(a, "department", None))
            for a in achievements
            if _s(getattr(a, "department", None))
        )

        # 只展示本科主专业卡片（有在校本科生；排除名单外专业）
        display_names = [
            n
            for n in base_major_names
            if stu_by_major.get(n)
            and not _is_track_major(n)
            and not _is_excluded_display_major(n)
        ]
        if not display_names:
            display_names = [
                n
                for n in sorted(stu_by_major.keys())
                if not _is_track_major(n) and not _is_excluded_display_major(n)
            ]
        display_names.sort(key=lambda n: (-len(stu_by_major.get(n, [])), n))

        majors_payload = [
            self._major_card(
                name=name,
                students=stu_by_major.get(name, []),
                emp_rows=emp_by_major.get(name, []),
                snap=latest_snap.get(name),
                history=all_snaps.get(name, []),
            )
            for name in display_names
        ]

        strengths, weaknesses, suggestions = self._insights(majors_payload, latest_snap)
        ranking_hub = self._college_ranking(majors_payload)
        trend_block = self._college_trend(all_snaps, display_names)
        dims = self._college_dimensions(majors_payload)

        overview: dict[str, Any] = {
            "majors": majors_payload,
            "ranking": ranking_hub,
            "trend": trend_block,
            "dimensions": dims,
            "radarConclusion": (
                trend_block.get("conclusion")
                or (
                    "软科五维取各专业最新快照均值对比"
                    if dims
                    else "缺软科五维源数据；排名/对标已接入《排名汇总》多年快照"
                )
            ),
        }

        major_rankings = [
            {
                "major": m["name"],
                "grade": m["grade"],
                "currentRank": m["nationalRank"],
                "yoyChange": m["yoyChange"],
                "provincialRank": m["provincialRank"],
                "peerRank": m["financePeerRank"],
                "financePeerRank": m["financePeerRank"],
            }
            for m in majors_payload
        ]

        major_profiles = [
            self._major_profile(
                name=name,
                students=stu_by_major.get(name, []),
                emp_rows=emp_by_major.get(name, []),
                card=next(m for m in majors_payload if m["name"] == name),
                history=all_snaps.get(name, []),
                competition_n=awards_by_major.get(name)
                or awards_by_dept.get(resolve_department_from_major(name) or "", 0),
                teachers_in_dept=teachers_by_dept.get(
                    resolve_department_from_major(name) or "", []
                ),
                achievement_n=ach_by_dept.get(
                    resolve_department_from_major(name) or "", 0
                ),
            )
            for name in display_names
        ]

        grade_history, rank_trends = self._history_series(all_snaps, display_names)
        provincial, finance_ahead, peer_benchmarks = self._peer_detail_blocks(
            majors_payload
        )
        yearly_details = self._yearly_details(all_snaps, display_names)

        detail: dict[str, Any] = {
            "majorRankings": major_rankings,
            "gradeHistory": grade_history,
            "rankTrends": rank_trends,
            "provincialComparison": provincial,
            "financeAheadSchools": finance_ahead,
            "rankingSystems": (
                [
                    {
                        "system": "软科专业排名",
                        "rank": ranking_hub["current"],
                        "change": ranking_hub["yoyChange"],
                    }
                ]
                if ranking_hub["current"] != MISSING
                else []
            ),
            "yearlyDetails": yearly_details,
            "dimensionBreakdown": (
                [
                    {
                        "dimension": "软科五维",
                        "items": [
                            {"name": d["label"], "score": d["score"]} for d in dims
                        ],
                    }
                ]
                if dims
                else []
            ),
            "strengths": strengths,
            "weaknesses": weaknesses,
            "benchmarkComparison": [
                {
                    "school": p["school"],
                    "rank": p["rank"],
                    "gap": (
                        p["rank"] - ranking_hub["current"]
                        if isinstance(ranking_hub["current"], (int, float))
                        and isinstance(p.get("rank"), (int, float))
                        else MISSING
                    ),
                }
                for p in provincial
                if not p.get("isSelf")
            ][:8],
            "suggestions": suggestions,
            "majorProfiles": major_profiles,
            "peerBenchmarks": peer_benchmarks,
            "benchmarkNote": (
                "对标数据来自《排名汇总》软科口径（major_rank_snapshots）"
                if any(m["peerSchools"] or m["financePeerSchools"] for m in majors_payload)
                else "缺对标院校公开排名源，横向对标暂不可用"
            ),
        }
        return {"overview": overview, "detail": detail}

    def _college_ranking(self, majors: list[dict[str, Any]]) -> dict[str, Any]:
        ranks = [
            int(m["nationalRank"])
            for m in majors
            if isinstance(m.get("nationalRank"), (int, float))
        ]
        prov = [
            int(m["provincialRank"])
            for m in majors
            if isinstance(m.get("provincialRank"), (int, float))
        ]
        fin = [
            int(m["financePeerRank"])
            for m in majors
            if isinstance(m.get("financePeerRank"), (int, float))
        ]
        yoy = [
            int(m["yoyChange"])
            for m in majors
            if isinstance(m.get("yoyChange"), (int, float))
        ]
        if not ranks:
            return {
                "current": MISSING,
                "yoyChange": MISSING,
                "provincial": MISSING,
                "peer": MISSING,
            }
        return {
            "current": int(round(median(ranks))),
            "yoyChange": int(round(sum(yoy) / len(yoy))) if yoy else MISSING,
            "provincial": int(round(median(prov))) if prov else MISSING,
            "peer": int(round(median(fin))) if fin else MISSING,
        }

    def _college_trend(
        self,
        all_snaps: dict[str, list[MajorRankSnapshot]],
        display_names: list[str],
    ) -> dict[str, Any]:
        year_ranks: dict[int, list[int]] = defaultdict(list)
        year_peer_ranks: dict[int, list[int]] = defaultdict(list)
        for name in display_names:
            for snap in all_snaps.get(name, []):
                if snap.national_rank is not None:
                    year_ranks[snap.year].append(int(snap.national_rank))
                peers = _normalize_peers(snap.peer_schools) or _normalize_peers(
                    snap.finance_peer_schools
                )
                for p in peers:
                    if p.get("isSelf"):
                        continue
                    if isinstance(p.get("rank"), (int, float)):
                        year_peer_ranks[snap.year].append(int(p["rank"]))
        years_sorted = sorted(year_ranks.keys())
        if len(years_sorted) < 2:
            return {
                "years": [str(y) for y in years_sorted],
                "ranks": [
                    int(round(median(year_ranks[y]))) for y in years_sorted
                ],
                "peerAvgRanks": [
                    int(round(median(year_peer_ranks[y])))
                    for y in years_sorted
                    if year_peer_ranks.get(y)
                ]
                if any(year_peer_ranks.get(y) for y in years_sorted)
                else [],
                "conclusion": (
                    "仅有单年排名快照，趋势图待补多年数据"
                    if years_sorted
                    else "缺专业排名快照（major_rank_snapshots），暂无法绘制趋势"
                ),
            }
        ranks = [int(round(median(year_ranks[y]))) for y in years_sorted]
        peer_avgs = [
            int(round(median(year_peer_ranks[y]))) if year_peer_ranks.get(y) else None
            for y in years_sorted
        ]
        # 前端折线要求等长；缺年用相邻值或本校位次占位
        filled_peers: list[int] = []
        last = ranks[0]
        for i, v in enumerate(peer_avgs):
            if v is not None:
                last = v
                filled_peers.append(v)
            else:
                filled_peers.append(last if filled_peers else ranks[i])
        delta = ranks[0] - ranks[-1]  # 名次变小=上升
        conclusion = (
            f"近{len(years_sorted)}年学院专业全国位次中位数由 {ranks[0]} 至 {ranks[-1]}"
            + ("，整体上行" if delta > 0 else "，整体下行" if delta < 0 else "，基本持平")
        )
        return {
            "years": [str(y) for y in years_sorted],
            "ranks": ranks,
            "peerAvgRanks": filled_peers,
            "conclusion": conclusion,
        }

    def _college_dimensions(
        self, majors: list[dict[str, Any]]
    ) -> list[dict[str, Any]]:
        buckets: dict[str, list[tuple[float, float]]] = defaultdict(list)
        labels: dict[str, str] = {}
        for m in majors:
            for d in m.get("softDimensions") or []:
                key = _s(d.get("key"))
                if not key:
                    continue
                try:
                    buckets[key].append((float(d["score"]), float(d["peerAverage"])))
                    labels[key] = _s(d.get("label")) or key
                except (TypeError, ValueError, KeyError):
                    continue
        out = []
        for key, pairs in buckets.items():
            score = _round1(sum(a for a, _ in pairs) / len(pairs))
            peer = _round1(sum(b for _, b in pairs) / len(pairs))
            out.append(
                {
                    "key": key,
                    "label": labels.get(key, key),
                    "score": score,
                    "peerAverage": peer,
                }
            )
        order = ["school", "discipline", "source", "employment", "program"]
        out.sort(key=lambda x: order.index(x["key"]) if x["key"] in order else 99)
        return out

    def _history_series(
        self,
        all_snaps: dict[str, list[MajorRankSnapshot]],
        display_names: list[str],
    ) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
        grade_history: list[dict[str, Any]] = []
        rank_trends: list[dict[str, Any]] = []
        for name in display_names:
            snaps = all_snaps.get(name, [])
            if not snaps:
                continue
            years = [str(s.year) for s in snaps]
            grades = [_s(s.grade_label) or MISSING for s in snaps]
            ranks = [
                s.national_rank if s.national_rank is not None else MISSING for s in snaps
            ]
            if any(g != MISSING for g in grades):
                grade_history.append({"major": name, "years": years, "grades": grades})
            if any(isinstance(r, int) for r in ranks):
                rank_trends.append(
                    {"major": name, "years": years, "nationalRanks": ranks}
                )
        return grade_history, rank_trends

    def _yearly_details(
        self,
        all_snaps: dict[str, list[MajorRankSnapshot]],
        display_names: list[str],
    ) -> list[dict[str, Any]]:
        """学院级年度位次摘要（与前端 yearlyDetails: year/rank/note 对齐）。"""
        year_ranks: dict[int, list[int]] = defaultdict(list)
        year_grades: dict[int, list[str]] = defaultdict(list)
        for name in display_names:
            for snap in all_snaps.get(name, []):
                if snap.national_rank is not None:
                    year_ranks[snap.year].append(int(snap.national_rank))
                if _s(snap.grade_label):
                    year_grades[snap.year].append(_s(snap.grade_label))
        out: list[dict[str, Any]] = []
        years_sorted = sorted(year_ranks.keys())
        for i, year in enumerate(years_sorted):
            ranks = year_ranks[year]
            med = int(round(median(ranks)))
            note_parts: list[str] = []
            grades = year_grades.get(year) or []
            if grades:
                top = Counter(grades).most_common(1)[0][0]
                note_parts.append(f"主档 {top}")
            if i > 0:
                prev_med = int(round(median(year_ranks[years_sorted[i - 1]])))
                delta = prev_med - med
                if delta > 0:
                    note_parts.append(f"中位数上升 {delta} 位")
                elif delta < 0:
                    note_parts.append(f"中位数下降 {abs(delta)} 位")
                else:
                    note_parts.append("中位数持平")
            out.append(
                {
                    "year": str(year),
                    "rank": med,
                    "note": "；".join(note_parts) if note_parts else f"{len(ranks)} 个专业有排名",
                }
            )
        return out

    def _peer_detail_blocks(
        self, majors: list[dict[str, Any]]
    ) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
        # 取在校生最多且有对标的专业作为详情默认对标表
        with_peers = [m for m in majors if m.get("peerSchools")]
        if not with_peers:
            return [], [], []
        lead = max(
            with_peers,
            key=lambda m: m["studentCount"] if isinstance(m["studentCount"], int) else 0,
        )
        provincial = list(lead.get("peerSchools") or [])
        finance = list(lead.get("financePeerSchools") or [])
        self_rank = lead.get("nationalRank")
        finance_ahead = [
            {"school": p["school"], "rank": p["rank"]}
            for p in finance
            if not p.get("isSelf")
            and isinstance(self_rank, (int, float))
            and isinstance(p.get("rank"), (int, float))
            and p["rank"] < self_rank
        ]
        peer_benchmarks = [
            {
                "school": p["school"],
                "majorType": lead["name"],
                "eliteProgram": MISSING,
                "sourceScore": MISSING,
                "employmentNote": MISSING,
                "gapNote": (
                    f"全国第{p['rank']}，本校第{self_rank}"
                    if isinstance(self_rank, (int, float))
                    else f"全国第{p['rank']}"
                ),
            }
            for p in provincial
            if not p.get("isSelf")
        ][:8]
        return provincial, finance_ahead, peer_benchmarks

    def _major_card(
        self,
        *,
        name: str,
        students: list,
        emp_rows: list[EmploymentRecord],
        snap: MajorRankSnapshot | None,
        history: list[MajorRankSnapshot],
    ) -> dict[str, Any]:
        student_n = len(students)
        scores = [
            to_float(getattr(s, "admission_score", None))
            for s in students
            if to_float(getattr(s, "admission_score", None)) > 0
        ]
        avg_score: float | str = _round1(sum(scores) / len(scores)) if scores else MISSING

        emp_n = len(emp_rows)
        if emp_n:
            placed = sum(1 for r in emp_rows if _is_placed(r.destination))
            further = sum(1 for r in emp_rows if _is_further_study(r.destination))
            employment_rate: float | str = _pct(placed, emp_n)
            further_rate: float | str = _pct(further, emp_n)
        else:
            employment_rate = MISSING
            further_rate = MISSING

        grade = MISSING
        national = MISSING
        yoy: Any = MISSING
        provincial = MISSING
        finance = MISSING
        soft_dims: list[dict[str, Any]] = []
        peers: list[dict[str, Any]] = []
        fin_peers: list[dict[str, Any]] = []

        if snap:
            grade = _s(snap.grade_label) or MISSING
            national = _num_or_missing(snap.national_rank)
            provincial = _num_or_missing(snap.province_rank)
            finance = _num_or_missing(snap.finance_rank)
            soft_dims = _normalize_soft_dims(snap.soft_dimensions)
            peers = _normalize_peers(snap.peer_schools)
            fin_peers = _normalize_peers(snap.finance_peer_schools)
            if snap.yoy_change is not None:
                yoy = int(snap.yoy_change)
            elif len(history) >= 2:
                prev, cur = history[-2], history[-1]
                if prev.national_rank is not None and cur.national_rank is not None:
                    # 名次变小 = 上升，yoyChange 正数表示上升位数
                    yoy = int(prev.national_rank) - int(cur.national_rank)

        rank_years = [str(s.year) for s in history if s.national_rank is not None]
        rank_vals: list[int] = [
            int(s.national_rank) for s in history if s.national_rank is not None
        ]

        return {
            "name": name,
            "department": resolve_department_from_major(name),
            "grade": grade,
            "nationalRank": national,
            "yoyChange": yoy,
            "provincialRank": provincial,
            "financePeerRank": finance,
            "foundedYears": MISSING,
            "accreditation": MISSING,
            "constructionType": MISSING,
            "enrollmentPlan": MISSING,
            "studentCount": student_n,
            "educationYears": 4,
            "orientation": MISSING,
            "priority": MISSING,
            "teachers": MISSING,
            "phdRatio": MISSING,
            "talentCount": MISSING,
            "papers": MISSING,
            "projects": MISSING,
            "patents": MISSING,
            "avgScore": avg_score,
            "firstChoiceRate": MISSING,
            "employmentRate": employment_rate,
            "furtherStudyRate": further_rate,
            "softDimensions": soft_dims,
            "peerSchools": peers,
            "financePeerSchools": fin_peers,
            "rankTrend": {
                "years": rank_years,
                "ranks": rank_vals,
            },
        }

    def _major_profile(
        self,
        *,
        name: str,
        students: list,
        emp_rows: list[EmploymentRecord],
        card: dict[str, Any],
        history: list[MajorRankSnapshot],
        competition_n: int = 0,
        teachers_in_dept: list | None = None,
        achievement_n: int = 0,
    ) -> dict[str, Any]:
        teachers_in_dept = teachers_in_dept or []
        grade_c: Counter[str] = Counter()
        gpas: list[float] = []
        scores: list[float] = []
        male = 0
        gender_known = 0
        for s in students:
            g = _s(getattr(s, "grade", None))
            if g:
                grade_c[g] += 1
            gpa = to_float(getattr(s, "average_credit_gpa", None))
            if gpa > 0:
                gpas.append(gpa)
            sc = to_float(getattr(s, "admission_score", None))
            if sc > 0:
                scores.append(sc)
            gender = _s(getattr(s, "gender", None))
            if gender:
                gender_known += 1
                if gender in ("男", "M", "male", "Male"):
                    male += 1

        grade_distribution = [
            {"grade": k, "count": v}
            for k, v in sorted(grade_c.items(), key=lambda x: x[0])
        ]

        avg_gpa: float | str = _round1(sum(gpas) / len(gpas)) if gpas else MISSING
        avg_score = card["avgScore"]
        min_score: float | str = _round1(min(scores)) if scores else MISSING
        male_ratio: float | str = _pct(male, gender_known) if gender_known else MISSING

        industry_c: Counter[str] = Counter()
        region_c: Counter[str] = Counter()
        for r in emp_rows:
            ind = _s(getattr(r, "industry", None)) or _s(getattr(r, "unit_type", None))
            if ind:
                industry_c[ind] += 1
            region = _s(getattr(r, "region", None))
            if region:
                region_c[region] += 1
        top_industries = [k for k, _ in industry_c.most_common(5)]
        top_regions = [k for k, _ in region_c.most_common(5)]

        dept = resolve_department_from_major(name)
        t_total = len(teachers_in_dept)
        phd_n = sum(1 for t in teachers_in_dept if getattr(t, "is_phd", None) is True)
        # 职称粗分
        prof_n = sum(1 for t in teachers_in_dept if "教授" in _s(t.title) and "副" not in _s(t.title))
        asso_n = sum(1 for t in teachers_in_dept if "副教授" in _s(t.title))
        lect_n = sum(1 for t in teachers_in_dept if "讲师" in _s(t.title))

        strengths: list[str] = []
        weaknesses: list[str] = []
        priorities: list[str] = []
        if card["studentCount"]:
            strengths.append(f"在校生 {card['studentCount']} 人")
        if isinstance(card["nationalRank"], (int, float)):
            strengths.append(f"软科全国第 {card['nationalRank']} 名（{card['grade']}）")
        else:
            weaknesses.append(
                "本校未进入该专业软科公开发布榜（通常仅发布前50%高校），故全国/省内/财经名次暂缺"
            )
        if isinstance(card["employmentRate"], (int, float)):
            strengths.append(f"去向落实率 {card['employmentRate']}%")
            if card["employmentRate"] < 80:
                weaknesses.append(f"去向落实率 {card['employmentRate']}% 偏低")
                priorities.append("加强就业指导与岗位对接")
        else:
            weaknesses.append("缺本专业就业样本，落实率暂无法统计")
        if isinstance(avg_score, (int, float)):
            strengths.append(f"录取均分约 {avg_score}")
        else:
            weaknesses.append("缺录取分字段，生源质量暂无法量化")
        if not card.get("softDimensions"):
            weaknesses.append("缺软科五维明细（公开接口对本校未返回五维分数）")
        if not card.get("peerSchools"):
            weaknesses.append("缺综合对标院校名单")
        if t_total:
            strengths.append(f"挂靠系部师资 {t_total} 人")
        else:
            weaknesses.append("师资专业归属/认证/建设类型等仍待补源")
        if competition_n:
            strengths.append(f"学生竞赛获奖 {competition_n} 项")
        priorities.append("持续更新排名快照与对标切片")

        if len(history) >= 2 and history[-2].national_rank and history[-1].national_rank:
            trend_summary = (
                f"近{len(history)}年全国位次由 {history[0].national_rank} "
                f"至 {history[-1].national_rank}"
            )
        elif isinstance(card["nationalRank"], (int, float)):
            trend_summary = f"最新软科全国第 {card['nationalRank']} 名"
        else:
            trend_summary = (
                "本校未上该专业软科公开发布榜，排名趋势暂缺；"
                "可查看对标校全国位次作参照"
            )

        soft_rank = card["nationalRank"]
        return {
            "name": name,
            "department": dept,
            "grade": card["grade"],
            "foundedYears": MISSING,
            "accreditation": MISSING,
            "constructionType": MISSING,
            "softRank": soft_rank,
            "officialRank": soft_rank,
            "enrollmentPlan": MISSING,
            "studentCount": card["studentCount"],
            "gradeDistribution": grade_distribution,
            "educationYears": 4,
            "orientation": MISSING,
            "directions": [],
            "faculty": {
                "total": t_total if t_total else MISSING,
                "professor": prof_n if t_total else MISSING,
                "associate": asso_n if t_total else MISSING,
                "lecturer": lect_n if t_total else MISSING,
                "phdCount": phd_n if t_total else MISSING,
                "phdRatio": _pct(phd_n, t_total) if t_total else MISSING,
                "talentCount": MISSING,
                "teachingMasters": MISSING,
                "courseLeaders": MISSING,
                "researchTeams": MISSING,
            },
            "outcomes": {
                "papers": MISSING,
                "representativePapers": [],
                "verticalProjects": MISSING,
                "horizontalProjects": MISSING,
                "keyProjects": [],
                "patents": MISSING,
                "softwares": MISSING,
                "eliteCourses": MISSING,
                "reformProjects": MISSING,
                "teachingAwards": MISSING,
                "teachingTeams": MISSING,
                "textbooks": MISSING,
                "platforms": MISSING,
                "practiceBases": MISSING,
                "achievementItems": achievement_n if achievement_n else MISSING,
            },
            "enrollment": {
                "avgScore": avg_score,
                "minScore": min_score,
                "avgRank": MISSING,
                "firstChoiceRate": MISSING,
                "provinceInRatio": MISSING,
                "maleRatio": male_ratio,
                "freshmanBasis": MISSING,
            },
            "cultivation": {
                "graduationRate": MISSING,
                "degreeRate": MISSING,
                "avgGpa": avg_gpa,
                "competitionAwards": competition_n if competition_n else MISSING,
                "innovationProjects": MISSING,
                "employmentRate": card["employmentRate"],
                "furtherStudyRate": card["furtherStudyRate"],
                "qualityJobRatio": MISSING,
                "topIndustries": top_industries,
                "topRegions": top_regions,
            },
            "judgment": {
                "trendSummary": trend_summary,
                "strengths": strengths,
                "weaknesses": weaknesses,
                "priorities": priorities,
                "dataNote": "排名/对标来自《排名汇总》软科口径（major_rank_snapshots）；师资与成果等字段待补源",
            },
        }

    def _insights(
        self,
        majors: list[dict[str, Any]],
        latest_snap: dict[str, MajorRankSnapshot],
    ) -> tuple[list[str], list[str], list[str]]:
        if not majors:
            return (
                [],
                ["当前无可用专业学籍数据"],
                ["核对 majors 表与学籍 major_name 是否对齐"],
            )
        total_stu = sum(int(m["studentCount"] or 0) for m in majors)
        strengths = [f"覆盖 {len(majors)} 个专业，在校生合计 {total_stu} 人"]
        with_rank = [
            m for m in majors if isinstance(m.get("nationalRank"), (int, float))
        ]
        if with_rank:
            best = min(with_rank, key=lambda m: int(m["nationalRank"]))
            strengths.append(
                f"{best['name']} 软科全国第 {best['nationalRank']}（{best['grade']}）"
            )
        rising = [
            m
            for m in with_rank
            if isinstance(m.get("yoyChange"), (int, float)) and int(m["yoyChange"]) > 0
        ]
        if rising:
            top = max(rising, key=lambda m: int(m["yoyChange"]))
            strengths.append(
                f"{top['name']} 较上年上升 {int(top['yoyChange'])} 位"
            )
        with_emp = [
            m for m in majors if isinstance(m.get("employmentRate"), (int, float))
        ]
        if with_emp:
            best_e = max(with_emp, key=lambda m: float(m["employmentRate"]))
            strengths.append(
                f"{best_e['name']} 去向落实率 {best_e['employmentRate']}%（样本内相对最高）"
            )

        weaknesses: list[str] = []
        falling = [
            m
            for m in with_rank
            if isinstance(m.get("yoyChange"), (int, float)) and int(m["yoyChange"]) < 0
        ]
        if falling:
            worst = min(falling, key=lambda m: int(m["yoyChange"]))
            weaknesses.append(
                f"{worst['name']} 较上年下降 {abs(int(worst['yoyChange']))} 位"
            )
        if len(latest_snap) < len(majors):
            weaknesses.append(
                f"仍有 {len(majors) - len(latest_snap)} 个专业缺少最新年排名快照"
            )
        weaknesses.append("教师未挂接专业，专业级师资结构暂无法统计")
        suggestions = [
            "继续用《排名汇总》或 sync_major_ranks 更新多年快照",
            "导入 enrollment_cohorts 补齐一志愿率与招生计划",
            "补齐教师–专业归属后回填专业师资与博士比",
        ]
        if not latest_snap:
            weaknesses.insert(0, "专业软科排名、五维得分、对标院校尚未导入")
            suggestions.insert(
                0, "导入 major_rank_snapshots（含五维与对标）以恢复 L1 排名轮播诊断"
            )
        return strengths, weaknesses, suggestions


discipline_service = DisciplineService()
