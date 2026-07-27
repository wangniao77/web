"""研究生培养分析：无 PII 快照规则洞察。"""

from __future__ import annotations

from typing import Any


def rule_insights_from_graduate(snapshot: dict[str, Any]) -> dict[str, Any]:
    """由研究生培养快照生成可核对的规则洞察。"""
    total = int(snapshot.get("graduateCount") or 0)
    undergrad = int(snapshot.get("undergradCount") or 0)
    ratio = float(snapshot.get("graduateShareOfEnrolled") or 0)
    majors = snapshot.get("majors") or []
    top_major = majors[0] if majors else None
    advisor_cov = float(snapshot.get("advisorCoverage") or 0)
    paper_n = int(snapshot.get("paperStudentCount") or 0)
    project_n = int(snapshot.get("projectStudentCount") or 0)
    research_n = int(snapshot.get("researchStudentCount") or 0)
    research_rate = float(snapshot.get("researchParticipationRate") or 0)
    emp = snapshot.get("employment") or {}
    emp_n = int(emp.get("cohortCount") or 0)
    placement = float(emp.get("placementRate") or 0)
    hq = float(emp.get("highQualityRate") or 0)
    by_year = snapshot.get("byEnrollmentYear") or []

    insights: list[dict[str, Any]] = []

    # 1) 规模与层次结构
    if total <= 0:
        insights.append(
            {
                "title": "研究生主档暂无有效规模",
                "detail": "当前学院研究生主档人数为 0，建议先核对学籍导入与培养层次字段。",
                "tone": "warn",
                "evidence": [
                    {"source": "db", "label": "研究生人数", "value": "0"},
                ],
            }
        )
    else:
        tone = "good" if ratio >= 10 else "info"
        insights.append(
            {
                "title": "研究生规模与层次结构",
                "detail": (
                    f"在籍研究生 {total} 人"
                    + (f"，约占在校生 {ratio}%" if undergrad else "")
                    + (
                        f"；本科 {undergrad} 人，研本比约 1:{max(round(undergrad / total), 1)}"
                        if undergrad and total
                        else ""
                    )
                    + "。规模可支撑科研育人观察，需继续看专业与导师覆盖。"
                ),
                "tone": tone,
                "evidence": [
                    {"source": "db", "label": "研究生人数", "value": f"{total}人"},
                    {"source": "db", "label": "占在校生比", "value": f"{ratio}%"},
                ],
            }
        )

    # 2) 专业结构
    if top_major:
        top_name = str(top_major.get("name") or "未知专业")
        top_count = int(top_major.get("count") or 0)
        top_ratio = float(top_major.get("ratio") or 0)
        tone = "warn" if top_ratio >= 55 else "info"
        insights.append(
            {
                "title": "专业集中度需分层培养",
                "detail": (
                    f"研究生第一大专业为「{top_name}」，共 {top_count} 人（{top_ratio}%）。"
                    + (
                        "集中度偏高，建议差异化课程与导师资源配置。"
                        if top_ratio >= 55
                        else "结构相对分散，可按专业制定分段培养目标。"
                    )
                ),
                "tone": tone,
                "evidence": [
                    {"source": "db", "label": "第一大专业", "value": f"{top_name} {top_count}人"},
                    {
                        "source": "db",
                        "label": "专业数",
                        "value": f"{len(majors)}个",
                    },
                ],
            }
        )
    elif total > 0:
        insights.append(
            {
                "title": "专业字段待补齐",
                "detail": "研究生主档缺少可用专业分布，影响精准培养策略落地。",
                "tone": "warn",
                "evidence": [{"source": "db", "label": "有专业记录", "value": "0"}],
            }
        )

    # 3) 科研参与 / 导师
    if total > 0:
        insights.append(
            {
                "title": "科研育人与导师覆盖",
                "detail": (
                    f"有论文/课题记录的研究生 {research_n} 人（参与率 {research_rate}%；"
                    f"论文 {paper_n} 人 · 课题 {project_n} 人）；导师信息覆盖率 {advisor_cov}%。"
                    + (
                        "科研参与偏低，建议把开题/中期与成果台账打通。"
                        if research_rate < 20
                        else "已形成一定科研育人底盘，可继续追踪高水平成果。"
                    )
                ),
                "tone": "warn" if research_rate < 20 or advisor_cov < 50 else "good",
                "evidence": [
                    {"source": "db", "label": "科研参与率", "value": f"{research_rate}%"},
                    {"source": "db", "label": "导师覆盖率", "value": f"{advisor_cov}%"},
                ],
            }
        )

    # 4) 研究生就业出口（若有）
    if emp_n > 0:
        insights.append(
            {
                "title": "研究生就业出口质量",
                "detail": (
                    f"研究生就业样本 {emp_n} 条：落实率 {placement}% · 高质量去向率 {hq}%。"
                    + (
                        "出口质量较好，可沉淀典型案例反哺培养方案。"
                        if hq >= 40
                        else "高质量去向仍有提升空间，建议对齐重点单位与升学辅导。"
                    )
                ),
                "tone": "good" if hq >= 40 else "info",
                "evidence": [
                    {"source": "db", "label": "就业样本", "value": f"{emp_n}条"},
                    {"source": "db", "label": "高质量率", "value": f"{hq}%"},
                ],
            }
        )
    elif len(insights) < 3 and by_year:
        years = "、".join(str(y.get("year")) for y in by_year[:4] if y.get("year"))
        insights.append(
            {
                "title": "入学届次结构可追踪",
                "detail": f"研究生按入学年分布：{years or '暂无'}。可据此规划开题、中期与毕业节点。",
                "tone": "info",
                "evidence": [
                    {"source": "db", "label": "入学年档位数", "value": f"{len(by_year)}"},
                ],
            }
        )

    insights = insights[:4]
    actions = [
        "补齐研究生导师与专业方向字段，支撑导师制与专业画像",
        "把论文/课题台账与研究生学号对齐，提升科研参与监测精度",
        "对高集中专业制定分层培养计划，并联动就业/升学辅导",
    ]
    if emp_n > 0 and hq < 40:
        actions[2] = "针对研究生就业高质量去向偏低专业，开展重点单位与升学双轨辅导"

    top_name = str((top_major or {}).get("name") or "主要专业")
    headline = (
        f"研究生 {total} 人"
        + (f"，占在校生 {ratio}%" if total else "")
        + (f"；科研参与 {research_rate}%" if total else "")
        + (f"；第一大专业 {top_name}" if top_major else "")
    )

    return {
        "headline": headline,
        "insights": insights,
        "actions": actions,
        "sections": [
            {
                "title": "规模结构",
                "bullets": [
                    f"研究生 {total} 人 / 本科 {undergrad} 人",
                    f"研究生占比 {ratio}%",
                    f"有专业分布 {len(majors)} 个",
                ],
            },
            {
                "title": "科研育人",
                "bullets": [
                    f"论文覆盖 {paper_n} 人",
                    f"课题覆盖 {project_n} 人",
                    f"导师覆盖率 {advisor_cov}%",
                ],
            },
        ],
        "dataFingerprint": str(snapshot.get("dataFingerprint") or ""),
        "filters": snapshot.get("filters") or {},
        "source": "rule",
    }
