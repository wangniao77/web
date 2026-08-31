"""Agent 分析工作流：按 page 分发 + OpenViking 上下文 + 规则/LLM。"""

from __future__ import annotations

import json
import uuid
from typing import Any

from Routers.Models.req.agent_model import AgentAnalyzeContext
from Routers.Models.resp.agent_model import AgentAnalyzeData, AgentEvidence, AgentInsight, AgentReportSection
from Services.college_service import CollegeService
from Utils.Agent.API.llm import LLMClient
from Utils.Agent.OpenViking import get_openviking_client
from Utils.Agent.OpenViking.paths import (
    ACADEMIC_RISK_SKILL_DOC,
    EMPLOYMENT_SKILL_DOC,
    BENCHMARK_OVERVIEW_SKILL_DOC,
    BENCHMARK_SWOT_SKILL_DOC,
    DISCIPLINE_OVERVIEW_SKILL_DOC,
    GRADUATE_CULTIVATION_SKILL_DOC,
    KEY_TASKS_SKILL_DOC,
    resource_academic_risk,
    resource_benchmark_overview,
    resource_benchmark_swot,
    resource_discipline_overview,
    resource_enrollment_employment,
    resource_enrollment_employment_report,
    resource_graduate_cultivation,
    resource_key_tasks,
    skill_academic_risk_analysis,
    skill_benchmark_overview_analysis,
    skill_benchmark_swot_analysis,
    skill_discipline_overview_analysis,
    skill_enrollment_employment_analysis,
    skill_graduate_cultivation_analysis,
    skill_key_tasks_analysis,
)
from Utils.Analytics.academic_risk_aggregate import rule_insights_from_academic_risk
from Utils.Analytics.employment_analysis import (
    report_to_agent_payload,
    rule_insights_from_employment,
    validate_agent_report,
)
from Utils.Analytics.graduate_analysis import rule_insights_from_graduate


def _rule_insights_from_key_tasks(snapshot: dict[str, Any]) -> AgentAnalyzeData:
    summary = snapshot.get("summary") or {}
    tasks = snapshot.get("tasks") or []
    total = int(summary.get("total") or len(tasks) or 0)
    completed = int(summary.get("completed") or 0)
    ongoing = int(summary.get("ongoing") or 0)
    delayed = int(summary.get("delayed") or 0)
    completion_rate = summary.get("completionRate")
    if completion_rate is None and total:
        completion_rate = round(completed / total * 100, 1)
    completion_rate = float(completion_rate or 0)

    attention_share = round(delayed / total * 100) if total else 0

    def _cat(t: dict) -> str:
        return str(t.get("category") or "")

    research = [t for t in tasks if _cat(t) == "research"]
    teaching = [t for t in tasks if _cat(t) == "teaching"]

    def avg(items: list[dict]) -> int:
        if not items:
            return 0
        return round(sum(float(t.get("progress") or 0) for t in items) / len(items))

    research_avg = avg(research)
    teaching_avg = avg(teaching)
    low = sorted(tasks, key=lambda t: float(t.get("progress") or 0))[:2]
    risk = [
        t
        for t in tasks
        if str(t.get("statusClass") or "") == "delayed"
        or "关注" in str(t.get("statusLabel") or "")
        or str(t.get("status") or "") in {"delayed", "overdue", "attention"}
    ]

    insights = [
        AgentInsight(
            title="总体完成节奏可控",
            detail=(
                f"年度完成率 {completion_rate}%，已完成 {completed} 项、推进中 {ongoing} 项；"
                "主体任务按节点推进。"
            ),
            tone="good",
        ),
        AgentInsight(
            title="风险仍集中在少数任务",
            detail=(
                f"需关注 {delayed} 项，占比约 {attention_share}%。"
                + (f"当前最紧的是「{risk[0].get('name')}」。" if risk else "")
            ),
            tone="warn",
        ),
        AgentInsight(
            title="科研与教学进度差可拆解",
            detail=(
                f"科研均进度 {research_avg}%、教学均进度 {teaching_avg}%，"
                f"差距 {abs(research_avg - teaching_avg)} 个百分点；低进度任务："
                f"{'、'.join(str(t.get('name')) for t in low) or '暂无'}。"
            ),
            tone="info",
        ),
    ]
    actions = [
        "对「需关注」任务建立双周督导清单，明确责任人与补救节点",
        "把低进度科研任务与学院科研例会绑定，提前预审材料",
        "教学竞赛类任务提前锁定参赛教师课表，避免报名窗口冲突",
    ]
    return AgentAnalyzeData(
        insights=insights,
        actions=actions,
        sessionId="",
        traceId="",
        source="rule",
    )


def _rule_insights_academic_risk(snapshot: dict[str, Any]) -> AgentAnalyzeData:
    insights_raw, actions = rule_insights_from_academic_risk(snapshot)
    insights = [
        AgentInsight(
            title=str(i["title"]),
            detail=str(i["detail"]),
            tone=i["tone"] if i.get("tone") in {"good", "warn", "info"} else "info",  # type: ignore[arg-type]
        )
        for i in insights_raw
    ]
    return AgentAnalyzeData(
        insights=insights,
        actions=actions,
        sessionId="",
        traceId="",
        source="rule",
    )


def _payload_to_analyze_data(payload: dict[str, Any]) -> AgentAnalyzeData:
    insights: list[AgentInsight] = []
    for item in payload.get("insights") or []:
        evidence = [
            AgentEvidence(
                source=e.get("source") if e.get("source") in {"db", "openviking", "web"} else "db",  # type: ignore[arg-type]
                label=str(e.get("label") or ""),
                value=str(e.get("value") or ""),
                ref=str(e["ref"]) if e.get("ref") else None,
            )
            for e in (item.get("evidence") or [])
            if isinstance(e, dict) and e.get("label") and e.get("value")
        ]
        tone = item.get("tone") if item.get("tone") in {"good", "warn", "info"} else "info"
        insights.append(
            AgentInsight(
                title=str(item.get("title") or "洞察"),
                detail=str(item.get("detail") or ""),
                tone=tone,  # type: ignore[arg-type]
                evidence=evidence,
            )
        )
    sections = None
    if payload.get("sections"):
        sections = [
            AgentReportSection(title=str(s.get("title") or ""), bullets=[str(b) for b in (s.get("bullets") or [])])
            for s in payload["sections"]
            if isinstance(s, dict) and s.get("title")
        ]
    return AgentAnalyzeData(
        insights=insights,
        actions=[str(a) for a in (payload.get("actions") or []) if a],
        sessionId=str(payload.get("sessionId") or ""),
        traceId=str(payload.get("traceId") or ""),
        source=payload.get("source") if payload.get("source") in {"agent", "rule", "mock"} else "rule",  # type: ignore[arg-type]
        headline=payload.get("headline"),
        dataFingerprint=payload.get("dataFingerprint"),
        filters=payload.get("filters"),
        sections=sections,
        generatedAt=payload.get("generatedAt"),
    )


def _is_academic_risk_page(page: str) -> bool:
    return page in {"academic-risk", "warning", "warnings"}


def _is_employment_page(page: str) -> bool:
    return page in {"enrollment-employment", "employment"}


def _is_graduate_page(page: str) -> bool:
    return page in {"graduate-cultivation", "graduate", "student-dev-graduate"}


def _is_benchmark_swot_page(page: str) -> bool:
    return page in {"college-benchmark-swot", "benchmark-swot"}


def _is_benchmark_overview_page(page: str) -> bool:
    return page in {"college-benchmark-overview", "benchmark-overview", "benchmark-achievements"}


def _is_discipline_overview_page(page: str) -> bool:
    return page in {"college-discipline-overview", "discipline-overview", "discipline"}


_BENCHMARK_PILLAR_KEYS = ("research", "teaching", "talent", "discipline", "party")
_BENCHMARK_TITLE_ALIASES = {
    "research": "research",
    "teaching": "teaching",
    "talent": "talent",
    "discipline": "discipline",
    "party": "party",
    "科研": "research",
    "教学": "teaching",
    "人才培养": "talent",
    "人才": "talent",
    "学科建设": "discipline",
    "学科": "discipline",
    "党建": "party",
}


def _normalize_benchmark_key(title: str, snapshot: dict[str, Any]) -> str | None:
    raw = (title or "").strip()
    if raw in _BENCHMARK_TITLE_ALIASES:
        return _BENCHMARK_TITLE_ALIASES[raw]
    items = snapshot.get("items") if isinstance(snapshot.get("items"), list) else []
    for item in items:
        if not isinstance(item, dict):
            continue
        key = str(item.get("key") or "")
        if key not in _BENCHMARK_PILLAR_KEYS:
            continue
        label = str(item.get("label") or "")
        metric = str(item.get("metricLabel") or "")
        if raw in {label, metric} or (label and raw.startswith(label)) or (metric and metric in raw):
            return key
    return None


def _strip_repeated_metric(detail: str, item: dict[str, Any]) -> str:
    text = (detail or "").strip()
    names = [str(item.get("metricLabel") or ""), str(item.get("label") or "")]
    names = [n for n in names if n]
    value, target, gap = item.get("value"), item.get("target"), item.get("gap")
    unit = str(item.get("unit") or "")
    prefixes = []
    for name in names:
        prefixes.extend(
            [
                f"{name}{value}/{target}{unit}",
                f"{name} {value}/{target}{unit}",
                f"{name}{value}/{target}",
                f"{name} {value}/{target}",
            ]
        )
    for prefix in prefixes:
        if text.startswith(prefix):
            text = text[len(prefix) :].lstrip(" ，,、：:")
            break
    for lead in (f"缺口{gap}{unit}", f"还差{gap}{unit}", f"缺口{gap}", f"还差{gap}"):
        if text.startswith(lead):
            text = text[len(lead) :].lstrip(" ，,、：:")
            break
    return text.strip() or (detail or "").strip()


def _snapshot_item(snapshot: dict[str, Any], key: str) -> dict[str, Any]:
    items = snapshot.get("items") if isinstance(snapshot.get("items"), list) else []
    for raw in items:
        if isinstance(raw, dict) and str(raw.get("key") or "") == key:
            return raw
    return {}


def _rule_note_benchmark_item(item: dict[str, Any]) -> str:
    unit = str(item.get("unit") or "")
    status = str(item.get("status") or "")
    gap = item.get("gap")
    value = item.get("value")
    target = item.get("target")
    if status == "empty":
        return "台账或口径缺失，需先补齐"
    if status == "near":
        return f"再补{gap}{unit}即可达标"
    try:
        ratio = float(value) / float(target) if target else 0.0
    except (TypeError, ValueError, ZeroDivisionError):
        ratio = 0.0
    if ratio <= 0.25:
        return "培育与申报明显滞后"
    if ratio < 0.7:
        return "尚未达到对标门槛，申报与培育要加力"
    return "补齐缺口要进计划"


def _rule_insights_benchmark_swot(snapshot: dict[str, Any]) -> AgentAnalyzeData:
    items = snapshot.get("items") if isinstance(snapshot.get("items"), list) else []
    insights: list[AgentInsight] = []
    actions: list[str] = []
    for raw in items:
        if not isinstance(raw, dict):
            continue
        status = str(raw.get("status") or "")
        if status not in {"gap", "near", "empty"}:
            continue
        key = str(raw.get("key") or "")
        if not key:
            continue
        insights.append(
            AgentInsight(
                title=key,
                detail=_rule_note_benchmark_item(raw),
                tone="warn",
            )
        )
        label = str(raw.get("label") or "")
        metric = str(raw.get("metricLabel") or "")
        if status == "empty":
            actions.append(f"补齐{label}「{metric}」口径与台账")
        else:
            actions.append(
                f"把{label}「{metric}」从 {raw.get('value')} 补到 {raw.get('target')}{raw.get('unit') or ''}"
            )
    return AgentAnalyzeData(
        insights=insights,
        actions=actions[:3],
        sessionId="",
        traceId="",
        source="rule",
        headline=str(snapshot.get("headline") or ""),
    )


def _rule_insights_benchmark_overview(snapshot: dict[str, Any]) -> AgentAnalyzeData:
    gauges = snapshot.get("gauges") if isinstance(snapshot.get("gauges"), list) else []
    rows = [g for g in gauges if isinstance(g, dict)]
    met = [g for g in rows if str(g.get("status") or "") == "met"]
    weak = [g for g in rows if str(g.get("status") or "") in {"gap", "near", "empty"}]
    worst = sorted(weak, key=lambda g: int(g.get("gap") or 0), reverse=True)
    worst_item = worst[0] if worst else None
    summary = snapshot.get("summary") if isinstance(snapshot.get("summary"), dict) else {}
    insights: list[AgentInsight] = []
    if met:
        insights.append(
            AgentInsight(
                title="高光已形成支点",
                detail="、".join(
                    f"{g.get('metricLabel')}{g.get('value')}{g.get('unit') or ''}" for g in met
                )
                + "已过门槛，可固化为可复制机制。",
                tone="good",
            )
        )
    if worst_item:
        status = str(worst_item.get("status") or "")
        label = str(worst_item.get("label") or "")
        metric = str(worst_item.get("metricLabel") or "")
        if status == "empty":
            insights.append(
                AgentInsight(
                    title=f"{label}台账待补",
                    detail=f"{metric}可展示条目为0，先补口径再谈对标。",
                    tone="warn",
                )
            )
        else:
            insights.append(
                AgentInsight(
                    title=f"{label}是最紧缺口",
                    detail=(
                        f"{metric}{worst_item.get('value')}/{worst_item.get('target')}"
                        f"{worst_item.get('unit') or ''}，申报与培育要提速。"
                    ),
                    tone="warn",
                )
            )
    insights.append(
        AgentInsight(
            title="对标结构不均衡",
            detail=(
                f"达标{summary.get('met', 0)}项、接近{summary.get('near', 0)}项、"
                f"缺口{summary.get('gap', 0)}项、数据不足{summary.get('empty', 0)}项。"
            ),
            tone="info",
        )
    )
    actions: list[str] = []
    for raw in weak[:3]:
        label = str(raw.get("label") or "")
        metric = str(raw.get("metricLabel") or "")
        if str(raw.get("status") or "") == "empty":
            actions.append(f"补齐{label}「{metric}」口径与台账")
        else:
            actions.append(
                f"把{label}「{metric}」从 {raw.get('value')} 补到 {raw.get('target')}{raw.get('unit') or ''}"
            )
    return AgentAnalyzeData(
        insights=insights[:5],
        actions=actions,
        sessionId="",
        traceId="",
        source="rule",
        headline=str(snapshot.get("headline") or ""),
    )


def _rule_insights_graduate(snapshot: dict[str, Any]) -> AgentAnalyzeData:
    payload = rule_insights_from_graduate(snapshot)
    return _payload_to_analyze_data(payload)


def _num(v: Any) -> float | None:
    try:
        if v is None or v == "**":
            return None
        return float(v)
    except (TypeError, ValueError):
        return None


def _rule_insights_discipline_overview(snapshot: dict[str, Any]) -> AgentAnalyzeData:
    majors = [m for m in (snapshot.get("majors") or []) if isinstance(m, dict)]
    ranked = [m for m in majors if _num(m.get("nationalRank")) is not None]
    best = min(ranked, key=lambda m: _num(m.get("nationalRank")) or 0) if ranked else None
    worst = max(ranked, key=lambda m: _num(m.get("nationalRank")) or 0) if ranked else None
    rising = [m for m in majors if (_num(m.get("yoyChange")) or 0) > 0]
    falling = [m for m in majors if (_num(m.get("yoyChange")) or 0) < 0]

    dim_gaps: list[dict[str, Any]] = []
    for d in snapshot.get("dimensions") or []:
        if not isinstance(d, dict):
            continue
        score, peer = _num(d.get("score")), _num(d.get("peerAverage"))
        if score is None or peer is None:
            continue
        dim_gaps.append(
            {
                "label": str(d.get("label") or ""),
                "score": score,
                "peer": peer,
                "gap": score - peer,
            }
        )
    dim_gaps.sort(key=lambda x: x["gap"])
    weakest = dim_gaps[0] if dim_gaps else None
    strongest = max(dim_gaps, key=lambda x: x["gap"]) if dim_gaps else None

    weak_major = None
    if weakest:
        rows = []
        for m in majors:
            for dim in m.get("softDimensions") or []:
                if not isinstance(dim, dict) or str(dim.get("label") or "") != weakest["label"]:
                    continue
                score = _num(dim.get("score"))
                if score is None:
                    continue
                rows.append(
                    {
                        "major": str(m.get("name") or ""),
                        "score": score,
                        "peer": _num(dim.get("peerAverage")) or weakest["peer"],
                    }
                )
        if rows:
            weak_major = min(rows, key=lambda x: x["score"])

    insights: list[AgentInsight] = []
    if best:
        yoy = _num(best.get("yoyChange"))
        yoy_txt = f"↑{int(yoy)}" if yoy and yoy > 0 else f"↓{int(abs(yoy))}" if yoy and yoy < 0 else "持平" if yoy == 0 else "**"
        insights.append(
            AgentInsight(
                title="头部专业稳住矩阵",
                detail=(
                    f"{best.get('name')} 全国第 {int(_num(best.get('nationalRank')) or 0)}、"
                    f"{best.get('grade') or '**'} 级，较上年 {yoy_txt}，"
                    f"落实率 {best.get('employmentRate', '**')}%，是学院专业矩阵的压舱石。"
                ),
                tone="good",
            )
        )
    if rising or falling:
        rise_txt = "、".join(f"{m.get('name')}↑{int(_num(m.get('yoyChange')) or 0)}" for m in rising) or "暂无上行"
        fall_txt = "；" + "、".join(
            f"{m.get('name')}↓{int(abs(_num(m.get('yoyChange')) or 0))}" for m in falling
        ) if falling else ""
        insights.append(
            AgentInsight(
                title="位次通道仍在打开" if rising else "排名波动需盯紧",
                detail=f"{rise_txt}{fall_txt}。建议把增量资源投向可冲击更高等级的赛道。",
                tone="warn" if falling else "info",
            )
        )
    if strongest and weakest:
        wm = (
            f"；短板主要落在「{weak_major['major']}」（{weak_major['score']} / 对标 {weak_major['peer']}）"
            if weak_major
            else ""
        )
        insights.append(
            AgentInsight(
                title=f"{weakest['label']}是最紧五维",
                detail=(
                    f"学院{strongest['label']} {strongest['score']} 分（对标 {strongest['peer']}），"
                    f"{weakest['label']} {weakest['score']} 分（对标 {weakest['peer']}）{wm}。"
                ),
                tone="warn" if weakest["gap"] < 0 else "info",
            )
        )
    if worst and best and worst.get("name") != best.get("name"):
        gap = int((_num(worst.get("nationalRank")) or 0) - (_num(best.get("nationalRank")) or 0))
        insights.append(
            AgentInsight(
                title="梯队差距可拆到专业",
                detail=(
                    f"{best.get('name')} 与 {worst.get('name')} 全国位次相差约 {gap} 位；"
                    f"{worst.get('name')} 省内第 {worst.get('provincialRank', '**')}、"
                    f"财经类第 {worst.get('financePeerRank', '**')}。"
                ),
                tone="info",
            )
        )

    actions: list[str] = []
    if weak_major:
        actions.append(
            f"优先补齐「{weak_major['major']}」的{weakest['label'] if weakest else '弱维'}"
            f"（当前 {weak_major['score']}，对标 {weak_major['peer']}）"
        )
    if falling:
        actions.append(f"对「{falling[0].get('name')}」建立排名回落复盘")
    if rising:
        actions.append(f"把「{rising[0].get('name')}」的增量资源锁定在可冲击更高等级的赛道")
    if not actions:
        actions.append("继续更新软科快照与五维明细，补齐缺源专业后再做横向对标")

    headline = (
        f"{best.get('name')} 领跑（全国第 {int(_num(best.get('nationalRank')) or 0)}）"
        + (f" · {weakest['label']}待补" if weakest else "")
        if best
        else str(snapshot.get("radarConclusion") or "专业排名与五维待补源后研判")
    )
    return AgentAnalyzeData(
        insights=insights[:4],
        actions=actions[:3],
        sessionId="",
        traceId="",
        source="rule",
        headline=headline,
    )


async def _load_snapshot(context: AgentAnalyzeContext, college_service: CollegeService) -> dict[str, Any]:
    if context.summarySnapshot:
        return context.summarySnapshot
    if _is_academic_risk_page(context.page):
        warning_type = (context.filters or {}).get("warningType") or None
        if warning_type in {"all", ""}:
            warning_type = None
        return await college_service.get_academic_risk_aggregate(
            college_id=context.collegeId,
            warning_type=warning_type,
        )
    if _is_employment_page(context.page):
        filters = context.filters or {}
        return await college_service.get_enrollment_employment_analysis_snapshot(
            college_id=context.collegeId,
            year=filters.get("year") or None,
            major=filters.get("major") or None,
        )
    if _is_graduate_page(context.page):
        return await college_service.build_graduate_cultivation_snapshot(
            college_id=context.collegeId
        )
    if context.page == "key-tasks":
        return await college_service.get_key_tasks_detail(college_id=context.collegeId)
    if _is_benchmark_swot_page(context.page) or _is_benchmark_overview_page(context.page):
        return context.summarySnapshot or {"items": [], "gauges": [], "headline": ""}
    if _is_discipline_overview_page(context.page):
        return context.summarySnapshot or {"majors": [], "dimensions": [], "ranking": {}}
    return {"summary": {}}


async def run_analyze(
    *,
    context: AgentAnalyzeContext,
    session_id: str | None,
    refresh: bool,
    college_service: CollegeService | None = None,
    llm: LLMClient | None = None,
) -> AgentAnalyzeData:
    college_service = college_service or CollegeService()
    llm = llm or LLMClient()
    viking = get_openviking_client()

    sid = session_id or f"sess-{uuid.uuid4().hex[:12]}"
    trace_id = f"trace-{uuid.uuid4().hex[:12]}"
    college_id = context.collegeId or "default"
    snapshot = await _load_snapshot(context, college_service)

    employment_report: dict[str, Any] | None = None

    if _is_academic_risk_page(context.page):
        skill_path = skill_academic_risk_analysis()
        resource_path = resource_academic_risk(college_id)
        skill_doc = ACADEMIC_RISK_SKILL_DOC
        result = _rule_insights_academic_risk(snapshot)
    elif _is_employment_page(context.page):
        skill_path = skill_enrollment_employment_analysis()
        resource_path = resource_enrollment_employment(college_id)
        skill_doc = EMPLOYMENT_SKILL_DOC
        employment_report = rule_insights_from_employment(snapshot)
        result = _payload_to_analyze_data(
            report_to_agent_payload(employment_report, session_id=sid, trace_id=trace_id)
        )
    elif _is_graduate_page(context.page):
        skill_path = skill_graduate_cultivation_analysis()
        resource_path = resource_graduate_cultivation(college_id)
        skill_doc = GRADUATE_CULTIVATION_SKILL_DOC
        result = _rule_insights_graduate(snapshot)
    elif _is_benchmark_overview_page(context.page):
        skill_path = skill_benchmark_overview_analysis()
        resource_path = resource_benchmark_overview(college_id)
        skill_doc = BENCHMARK_OVERVIEW_SKILL_DOC
        result = _rule_insights_benchmark_overview(snapshot)
    elif _is_benchmark_swot_page(context.page):
        skill_path = skill_benchmark_swot_analysis()
        resource_path = resource_benchmark_swot(college_id)
        skill_doc = BENCHMARK_SWOT_SKILL_DOC
        result = _rule_insights_benchmark_swot(snapshot)
    elif _is_discipline_overview_page(context.page):
        skill_path = skill_discipline_overview_analysis()
        resource_path = resource_discipline_overview(college_id)
        skill_doc = DISCIPLINE_OVERVIEW_SKILL_DOC
        result = _rule_insights_discipline_overview(snapshot)
    else:
        skill_path = skill_key_tasks_analysis()
        resource_path = resource_key_tasks(college_id)
        skill_doc = KEY_TASKS_SKILL_DOC
        result = _rule_insights_from_key_tasks(snapshot)

    await viking.store(skill_path, skill_doc)
    await viking.store(
        resource_path,
        snapshot,
        metadata={"page": context.page, "scope": context.scope},
    )
    await viking.ensure_session(sid)
    await viking.add_session_message(
        sid,
        "user",
        f"[analyze] page={context.page} refresh={refresh} snapshot_keys={list(snapshot.keys())}",
    )
    skill_text = await viking.read(skill_path) or skill_doc

    source = "rule"
    if llm.enabled:
        if _is_employment_page(context.page):
            system = (
                "你是高校治理驾驶舱就业分析助手。严格按技能说明输出 JSON，"
                "必须包含 headline/insights/actions，insights 中每条须带 evidence；"
                "tone 只能是 good|warn|info；evidence.source 为 db|openviking|web。"
                "禁止输出任何学生姓名或学号；数值须来自快照。"
            )
        elif _is_graduate_page(context.page):
            system = (
                "你是高校治理驾驶舱研究生培养分析助手。严格按技能说明输出 JSON，"
                "必须包含 headline/insights/actions，insights 中每条须带 evidence；"
                "tone 只能是 good|warn|info；evidence.source 为 db|openviking|web。"
                "禁止输出任何学生姓名或学号；数值须来自快照。"
            )
        elif _is_benchmark_overview_page(context.page):
            system = (
                "你是学院精品成果总览分析助手。严格按技能说明输出 JSON。"
                "insights.title 用中文；detail 40～80字，必须引用快照原数字；"
                "禁止改数或编造成果。"
            )
        elif _is_benchmark_swot_page(context.page):
            system = (
                "你是学院精品成果短板分析助手。严格按技能说明输出 JSON。"
                "insights.title 必须是 research|teaching|talent|discipline|party；"
                "detail 只写研判和补齐方向，不超过28字；"
                "不要重复指标名或 x/y（卡片上已有「教学成果 1/8项」）；"
                "禁止只输出「不足」「差3」这类标签；禁止改数或编造成果。"
            )
        elif _is_discipline_overview_page(context.page):
            system = (
                "你是学院专业发展全景首席研判助手。严格按技能说明输出 JSON。"
                "headline 必须是一句带数字的总判断；"
                "insights 3 条：第一条写矩阵总势，后两条落到具体专业；"
                "每条 insight 必须带 evidence（source=db，数值来自快照）；"
                "禁止改数或编造未上榜名次。"
            )
        else:
            system = (
                "你是高校治理驾驶舱分析助手。严格按技能说明输出 JSON，"
                "字段仅限 insights/actions，tone 只能是 good|warn|info。"
                "禁止输出任何学生姓名或学号。"
            )
        user = (
            f"技能说明:\n{skill_text}\n\n"
            f"页面: {context.scope}/{context.page}\n"
            f"聚合快照:\n{json.dumps(snapshot, ensure_ascii=False)[:8000]}"
        )
        parsed = await llm.complete_json(system, user)
        if parsed and isinstance(parsed.get("insights"), list):
            if _is_employment_page(context.page) and employment_report is not None:
                validated = validate_agent_report(parsed, employment_report)
                if validated:
                    employment_report = validated
                    result = _payload_to_analyze_data(
                        report_to_agent_payload(employment_report, session_id=sid, trace_id=trace_id)
                    )
                    source = "agent"
            elif _is_graduate_page(context.page):
                merged = {
                    **rule_insights_from_graduate(snapshot),
                    **{k: v for k, v in parsed.items() if v is not None},
                    "dataFingerprint": snapshot.get("dataFingerprint"),
                    "filters": snapshot.get("filters") or {},
                    "source": "agent",
                    "sessionId": sid,
                    "traceId": trace_id,
                }
                if isinstance(merged.get("insights"), list) and merged["insights"]:
                    result = _payload_to_analyze_data(merged)
                    source = "agent"
            elif _is_benchmark_swot_page(context.page):
                insights = []
                seen: set[str] = set()
                for item in parsed["insights"][:8]:
                    if not isinstance(item, dict):
                        continue
                    key = _normalize_benchmark_key(str(item.get("title") or ""), snapshot)
                    detail = _strip_repeated_metric(str(item.get("detail") or ""), _snapshot_item(snapshot, key or ""))
                    if not key or key in seen or not detail:
                        continue
                    seen.add(key)
                    insights.append(AgentInsight(title=key, detail=detail[:28], tone="warn"))
                if insights:
                    result = AgentAnalyzeData(
                        insights=insights,
                        actions=[str(a) for a in (parsed.get("actions") or []) if a][:5] or result.actions,
                        sessionId=sid,
                        traceId=trace_id,
                        source="agent",
                        headline=str(parsed.get("headline") or result.headline or ""),
                    )
                    source = "agent"
            else:
                insights = []
                for item in parsed["insights"][:5]:
                    if not isinstance(item, dict):
                        continue
                    tone = item.get("tone") if item.get("tone") in {"good", "warn", "info"} else "info"
                    evidence = [
                        AgentEvidence(
                            source=e.get("source") if e.get("source") in {"db", "openviking", "web"} else "db",
                            label=str(e.get("label") or ""),
                            value=str(e.get("value") or ""),
                            ref=str(e["ref"]) if e.get("ref") else None,
                        )
                        for e in (item.get("evidence") or [])
                        if isinstance(e, dict) and e.get("label") and e.get("value")
                    ]
                    insights.append(
                        AgentInsight(
                            title=str(item.get("title") or "洞察"),
                            detail=str(item.get("detail") or ""),
                            tone=tone,
                            evidence=evidence,
                        )
                    )
                actions = [str(a) for a in (parsed.get("actions") or []) if a][:5]
                if insights:
                    result = AgentAnalyzeData(
                        insights=insights,
                        actions=actions or result.actions,
                        sessionId=sid,
                        traceId=trace_id,
                        source="agent",
                        headline=str(parsed.get("headline") or result.headline or ""),
                    )
                    source = "agent"

    if source != "agent":
        result.sessionId = sid
        result.traceId = trace_id
        result.source = "rule"

    if _is_employment_page(context.page) and employment_report is not None:
        employment_report["source"] = result.source
        employment_report["sessionId"] = sid
        employment_report["traceId"] = trace_id
        await viking.store(
            resource_enrollment_employment_report(college_id),
            employment_report,
            metadata={"page": context.page, "scope": context.scope, "kind": "analysis-report"},
        )

    await viking.add_session_message(
        sid,
        "assistant",
        json.dumps(
            {
                "type": "analyze",
                "traceId": trace_id,
                "source": result.source,
                "insights": [i.title for i in result.insights],
                "actions": result.actions,
                "headline": result.headline,
            },
            ensure_ascii=False,
        ),
    )
    return result
