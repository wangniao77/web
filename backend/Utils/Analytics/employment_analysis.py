"""就业深度分析：规则洞察（含可核对证据）与报告组装。"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal


EvidenceSource = Literal["db", "openviking", "web"]
InsightTone = Literal["good", "warn", "info"]


def _ev(
    label: str,
    value: str,
    *,
    source: EvidenceSource = "db",
    ref: str | None = None,
) -> dict[str, Any]:
    item: dict[str, Any] = {"source": source, "label": label, "value": value}
    if ref:
        item["ref"] = ref
    return item


def _insight(
    title: str,
    detail: str,
    tone: InsightTone,
    evidence: list[dict[str, Any]],
) -> dict[str, Any]:
    return {
        "title": title,
        "detail": detail,
        "tone": tone,
        "evidence": evidence,
    }


def rule_insights_from_employment(snapshot: dict[str, Any]) -> dict[str, Any]:
    """基于无 PII 就业快照生成结构化报告（规则引擎）。"""
    year = snapshot.get("year") or "本届"
    cohort_n = int(snapshot.get("cohortCount") or 0)
    placement = float(snapshot.get("placementRate") or 0)
    hq_rate = float(snapshot.get("highQualityEmploymentRate") or 0)
    pending = int(snapshot.get("pendingCount") or 0)
    pending_rate = float(snapshot.get("pendingRate") or 0)
    other_emp = int(snapshot.get("otherEmploymentCount") or 0)
    other_rate = float(snapshot.get("otherEmploymentRate") or 0)
    industry_top = snapshot.get("industryTop") or []
    major_compare = snapshot.get("majorCompare") or []
    hq_dest = snapshot.get("highQualityDest") or []
    yearly = snapshot.get("yearlyTrend") or {}
    years = yearly.get("years") or []
    place_trend = yearly.get("placementRate") or []
    hq_trend = yearly.get("highQualityRate") or []
    fingerprint = str(snapshot.get("dataFingerprint") or "")
    filters = snapshot.get("filters") or {}

    insights: list[dict[str, Any]] = []
    sections: list[dict[str, Any]] = []

    # 1) 出口质量总览
    if placement >= 90:
        tone: InsightTone = "good"
        title = f"{year}届落实率处于高位"
    elif placement >= 80:
        tone = "info"
        title = f"{year}届落实率整体稳健"
    else:
        tone = "warn"
        title = f"{year}届落实率仍有提升空间"
    insights.append(
        _insight(
            title,
            (
                f"本届样本 {cohort_n} 人，毕业去向落实率 {placement}%（不含待就业），"
                f"高质量毕业去向率 {hq_rate}%；待就业 {pending} 人（{pending_rate}%）。"
            ),
            tone,
            [
                _ev(f"{year}届落实率", f"{placement}%", ref="graduation.exitQuality.placementRate"),
                _ev(f"{year}届高质量率", f"{hq_rate}%", ref="graduation.exitQuality.highQualityEmploymentRate"),
                _ev("待就业人数", f"{pending}人", ref="snapshot.pendingCount"),
            ],
        )
    )
    sections.append(
        {
            "title": "出口质量",
            "bullets": [
                f"落实率 {placement}% · 高质量率 {hq_rate}% · 样本 {cohort_n} 人",
                f"待就业 {pending} 人（{pending_rate}%）",
            ],
        }
    )

    # 2) 专业差距
    if len(major_compare) >= 2:
        by_hq = sorted(major_compare, key=lambda m: float(m.get("highQualityRate") or 0))
        low, high = by_hq[0], by_hq[-1]
        gap = round(float(high.get("highQualityRate") or 0) - float(low.get("highQualityRate") or 0), 1)
        if gap >= 8:
            insights.append(
                _insight(
                    "专业高质量去向差距明显",
                    (
                        f"「{high.get('major')}」高质量率 {high.get('highQualityRate')}%"
                        f"（n={high.get('count')}），"
                        f"「{low.get('major')}」为 {low.get('highQualityRate')}%"
                        f"（n={low.get('count')}），落差 {gap} 个百分点。"
                    ),
                    "warn",
                    [
                        _ev(
                            f"{high.get('major')}高质量率",
                            f"{high.get('highQualityRate')}%",
                            ref="graduation.majorCompare",
                        ),
                        _ev(
                            f"{low.get('major')}高质量率",
                            f"{low.get('highQualityRate')}%",
                            ref="graduation.majorCompare",
                        ),
                        _ev("专业高质量落差", f"{gap}个百分点", ref="graduation.majorCompare"),
                    ],
                )
            )
            sections.append(
                {
                    "title": "专业差距",
                    "bullets": [
                        f"领先：{high.get('major')} {high.get('highQualityRate')}%",
                        f"垫底：{low.get('major')} {low.get('highQualityRate')}%（落差 {gap}pt）",
                    ],
                }
            )

    # 3) 其他就业 / 结构桶过大
    if other_rate >= 40 and cohort_n >= 30:
        insights.append(
            _insight(
                "「其他就业」占比偏高，结构仍可细化",
                (
                    f"桑基/去向中「其他就业」约 {other_emp} 人、占本届 {other_rate}%，"
                    "多为普通签约与待分类就业；建议按单位类型/行业继续拆解。"
                ),
                "warn",
                [
                    _ev("其他就业人数", f"{other_emp}人", ref="snapshot.otherEmploymentCount"),
                    _ev("其他就业占比", f"{other_rate}%", ref="snapshot.otherEmploymentRate"),
                ],
            )
        )

    # 4) 行业集中度
    if industry_top:
        top = industry_top[0]
        top_name = str(top.get("name") or "")
        top_ratio = float(top.get("ratio") or 0)
        if top_name and top_ratio >= 25:
            insights.append(
                _insight(
                    f"就业行业向「{top_name}」集中",
                    (
                        f"行业分布首位「{top_name}」占比 {top_ratio}%"
                        f"（约 {top.get('count')} 人）；建议拓宽相关岗位池与校企渠道。"
                    ),
                    "info" if top_ratio < 40 else "warn",
                    [
                        _ev("行业Top1", top_name, ref="graduation.distribution.industry"),
                        _ev("行业Top1占比", f"{top_ratio}%", ref="graduation.distribution.industry"),
                    ],
                )
            )
            sections.append(
                {
                    "title": "行业结构",
                    "bullets": [f"{i.get('name')} {i.get('ratio')}%" for i in industry_top[:3]],
                }
            )

    # 5) 高质量六类结构
    if hq_dest:
        top_hq = max(hq_dest, key=lambda x: int(x.get("count") or 0))
        if int(top_hq.get("count") or 0) > 0:
            insights.append(
                _insight(
                    "高质量去向结构可读",
                    (
                        f"六类中「{top_hq.get('label')}」最多（{top_hq.get('count')} 人，"
                        f"占本届 {top_hq.get('ratio')}%）；当前高质量合计率 {hq_rate}%。"
                    ),
                    "info",
                    [
                        _ev(
                            str(top_hq.get("label") or "高质量项"),
                            f"{top_hq.get('count')}人 / {top_hq.get('ratio')}%",
                            ref="graduation.highQualityDest",
                        ),
                        _ev("高质量合计率", f"{hq_rate}%", ref="graduation.exitQuality.highQualityEmploymentRate"),
                    ],
                )
            )

    # 6) 历年趋势（有多届时）
    if len(years) >= 2 and len(place_trend) >= 2:
        prev_p, curr_p = float(place_trend[-2]), float(place_trend[-1])
        delta = round(curr_p - prev_p, 1)
        y_prev, y_curr = years[-2], years[-1]
        insights.append(
            _insight(
                f"落实率较上届{'上升' if delta > 0 else '下降' if delta < 0 else '持平'}",
                (
                    f"{y_prev}届落实率 {prev_p}% → {y_curr}届 {curr_p}%，变化 {delta:+} 个百分点。"
                    + (
                        f"高质量率 {hq_trend[-2]}% → {hq_trend[-1]}%。"
                        if len(hq_trend) >= 2
                        else ""
                    )
                ),
                "good" if delta >= 0 else "warn",
                [
                    _ev(f"{y_prev}落实率", f"{prev_p}%", ref="graduation.yearlyTrend.placementRate"),
                    _ev(f"{y_curr}落实率", f"{curr_p}%", ref="graduation.yearlyTrend.placementRate"),
                ],
            )
        )

    # 控制条数：优先保留 warn，再补齐到 3～5
    warns = [i for i in insights if i["tone"] == "warn"]
    others = [i for i in insights if i["tone"] != "warn"]
    ordered = (warns + others)[:5]
    if len(ordered) < 3:
        ordered = insights[:3]

    actions = [
        "对高质量率偏低专业开展一对一就业摸排，补齐重点单位与升学辅导",
        "拆解「其他就业」桶：按单位类型/行业回填，提升结构可读性",
        "将待就业名单纳入周报，明确辅导员跟进节点",
    ]
    if pending_rate >= 8:
        actions.insert(0, f"优先攻坚 {year} 届待就业群体（约 {pending} 人），分类制定帮扶方案")

    if placement >= 92 and hq_rate >= 25:
        headline = f"{year}届出口质量整体较好（落实率 {placement}% · 高质量 {hq_rate}%），重点转向结构优化与专业均衡。"
    elif pending_rate >= 8 or other_rate >= 45:
        headline = f"{year}届落实基本面尚可，但待就业/其他就业结构仍有明显治理空间。"
    else:
        headline = f"{year}届就业分析已基于真实去向表聚合；建议聚焦专业差距与高质量结构提升。"

    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "source": "rule",
        "dataFingerprint": fingerprint,
        "filters": {
            "year": filters.get("year") or (str(year) if year else None),
            "major": filters.get("major"),
        },
        "headline": headline,
        "insights": ordered,
        "actions": actions[:5],
        "sections": sections[:4],
    }


def validate_agent_report(parsed: dict[str, Any], fallback: dict[str, Any]) -> dict[str, Any] | None:
    """校验 LLM 输出：须含 insights，且尽量保留 db 证据；失败返回 None。"""
    raw_insights = parsed.get("insights")
    if not isinstance(raw_insights, list) or not raw_insights:
        return None

    insights: list[dict[str, Any]] = []
    for item in raw_insights[:5]:
        if not isinstance(item, dict):
            continue
        tone = item.get("tone") if item.get("tone") in {"good", "warn", "info"} else "info"
        evidence_raw = item.get("evidence") if isinstance(item.get("evidence"), list) else []
        evidence: list[dict[str, Any]] = []
        for ev in evidence_raw[:6]:
            if not isinstance(ev, dict):
                continue
            src = ev.get("source") if ev.get("source") in {"db", "openviking", "web"} else "db"
            label = str(ev.get("label") or "").strip()
            value = str(ev.get("value") or "").strip()
            if not label or not value:
                continue
            row: dict[str, Any] = {"source": src, "label": label, "value": value}
            if ev.get("ref"):
                row["ref"] = str(ev["ref"])
            evidence.append(row)
        # 若 LLM 丢掉证据，从同序 fallback 补一条 db 证据
        if not any(e.get("source") == "db" for e in evidence):
            fb = next(
                (
                    fi
                    for fi in (fallback.get("insights") or [])
                    if fi.get("title") == item.get("title")
                ),
                None,
            )
            if not fb and fallback.get("insights"):
                fb = (fallback.get("insights") or [None])[min(len(insights), len(fallback["insights"]) - 1)]
            if fb and fb.get("evidence"):
                evidence = list(fb["evidence"])[:3]
            else:
                evidence = [
                    _ev(
                        "本届落实率",
                        f"{fallback.get('filters', {}).get('year') or ''}届快照",
                        ref="snapshot",
                    )
                ]
                # 用 fallback 第一条 db 证据更稳
                for fi in fallback.get("insights") or []:
                    for e in fi.get("evidence") or []:
                        if e.get("source") == "db":
                            evidence = [e]
                            break
                    if evidence and evidence[0].get("label") != "本届落实率":
                        break

        insights.append(
            {
                "title": str(item.get("title") or "洞察"),
                "detail": str(item.get("detail") or ""),
                "tone": tone,
                "evidence": evidence,
            }
        )

    if not insights:
        return None

    actions = [str(a) for a in (parsed.get("actions") or []) if a][:5] or list(fallback.get("actions") or [])
    sections_raw = parsed.get("sections") if isinstance(parsed.get("sections"), list) else None
    sections: list[dict[str, Any]] = []
    if sections_raw:
        for sec in sections_raw[:6]:
            if not isinstance(sec, dict):
                continue
            bullets = [str(b) for b in (sec.get("bullets") or []) if b][:8]
            title = str(sec.get("title") or "").strip()
            if title and bullets:
                sections.append({"title": title, "bullets": bullets})
    if not sections:
        sections = list(fallback.get("sections") or [])

    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "source": "agent",
        "dataFingerprint": fallback.get("dataFingerprint") or "",
        "filters": fallback.get("filters") or {},
        "headline": str(parsed.get("headline") or fallback.get("headline") or ""),
        "insights": insights,
        "actions": actions,
        "sections": sections,
    }


def report_to_agent_payload(report: dict[str, Any], *, session_id: str, trace_id: str) -> dict[str, Any]:
    """转为 AgentAnalyzeData 兼容字段（含扩展）。"""
    return {
        "insights": [
            {
                "title": i.get("title"),
                "detail": i.get("detail"),
                "tone": i.get("tone") or "info",
                "evidence": i.get("evidence") or [],
            }
            for i in (report.get("insights") or [])
        ],
        "actions": list(report.get("actions") or []),
        "sessionId": session_id,
        "traceId": trace_id,
        "source": report.get("source") or "rule",
        "headline": report.get("headline"),
        "dataFingerprint": report.get("dataFingerprint"),
        "filters": report.get("filters"),
        "sections": report.get("sections"),
        "generatedAt": report.get("generatedAt"),
    }
