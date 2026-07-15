from datetime import datetime
from typing import Any

from Utils.DB.Models.key_task_models import KeyTask
from Utils.DB.Models.school_event_models import SchoolEvent
from Utils.DB.Models.student_academic_record_models import StudentAcademicRecord


class UniversityService:
    async def get_overview(self) -> dict[str, Any]:
        tasks = await KeyTask.filter(scope=KeyTask.SCOPE_UNIVERSITY).all()
        events = await SchoolEvent.all().order_by("-event_date").limit(8)
        student_count = await StudentAcademicRecord.all().count()
        completed = sum(1 for t in tasks if t.status == "completed")
        total_tasks = len(tasks) or 1

        return {
            "meta": {
                "dataUpdatedAt": datetime.now().isoformat(),
                "dataScope": "全校",
                "academicYear": "2024-2025",
                "semester": "1",
            },
            "goalOverview": {
                "totalTasks": len(tasks),
                "completedTasks": completed,
                "inProgressTasks": sum(1 for t in tasks if t.status == "ongoing"),
                "riskTasks": sum(1 for t in tasks if t.risk_level in {"high", "medium"}),
                "overdueTasks": sum(1 for t in tasks if t.status == "overdue"),
                "monthlyCompleted": completed,
                "completionRate": round(completed / total_tasks * 100, 1),
                "plannedProgress": 68,
                "progressGap": 4.2,
                "formula": "完成率 = 已完成任务 / 总任务",
                "dimensions": [],
            },
            "research": {
                "nationalProjects": 12,
                "provincialProjects": 36,
                "highLevelPapers": 186,
                "researchAwards": 8,
                "researchFunding": 12800,
                "keyPlatforms": 16,
                "phdSupportRate": 82,
                "phdHasGap": True,
                "topContributors": [],
                "fundingTrend": [
                    {"year": "2021", "value": 8200},
                    {"year": "2022", "value": 9600},
                    {"year": "2023", "value": 11200},
                    {"year": "2024", "value": 12800},
                ],
            },
            "keyTasks": [
                {
                    "id": str(t.id),
                    "name": t.name,
                    "progress": float(t.progress),
                    "status": t.status,
                    "plannedNode": t.planned_node or "",
                    "riskLevel": t.risk_level or "low",
                }
                for t in tasks[:8]
            ],
            "disciplines": {
                "risingCount": 2,
                "stableCount": 5,
                "fallingCount": 1,
                "focusCount": 2,
                "topRisers": [],
                "topFallers": [],
                "yearlyTrend": [],
                "competitiveness": {
                    "categories": ["工学", "理学", "管理学"],
                    "rising": [2, 1, 1],
                    "stable": [4, 3, 2],
                    "falling": [1, 0, 1],
                },
            },
            "employment": {
                "placementRate": 94.5,
                "provinceRank": 8,
                "provinceRankChange": 1,
                "furtherStudyRate": 28.6,
                "highQualityRate": 61.2,
                "keyEnterpriseCount": 126,
                "publicSectorCount": 38,
                "topUniversityCount": 52,
                "highSalaryCount": 0,
                "salaryCoverage": 0,
                "trend": [{"year": "2022", "rate": 92.1}, {"year": "2023", "rate": 93.4}, {"year": "2024", "rate": 94.5}],
                "destinationStructure": [],
                "industryShare": [],
            },
            "events": [
                {
                    "id": str(e.id),
                    "category": e.category,
                    "title": e.title,
                    "date": e.event_date.isoformat(),
                    "status": e.status,
                    "needsAttention": e.needs_attention,
                }
                for e in events
            ],
            "academicRisk": {
                "expectedDelayCount": 0,
                "delayRateChange": 0,
                "warningCount": student_count // 20,
                "intervenedCount": 0,
                "riskResolvedRate": 0,
                "highRiskCollegeCount": 1,
            },
        }

    async def get_tasks_detail(self) -> dict[str, Any]:
        tasks = await KeyTask.filter(scope=KeyTask.SCOPE_UNIVERSITY).all()
        return {
            "summary": {
                "total": len(tasks),
                "completed": sum(1 for t in tasks if t.status == "completed"),
                "ongoing": sum(1 for t in tasks if t.status == "ongoing"),
                "attention": sum(1 for t in tasks if t.status == "attention"),
            },
            "tasks": [
                {
                    "id": str(t.id),
                    "name": t.name,
                    "description": t.description or "",
                    "progress": float(t.progress),
                    "status": t.status,
                    "riskLevel": t.risk_level,
                    "leadDept": t.lead_dept or "",
                    "deadline": t.deadline.isoformat() if t.deadline else "",
                    "currentIssue": t.current_issue,
                    "nextAction": t.next_action,
                    "milestones": t.milestones or [],
                }
                for t in tasks
            ],
        }

    async def get_events_detail(self) -> dict[str, Any]:
        events = await SchoolEvent.all().order_by("-event_date")
        return {
            "items": [
                {
                    "id": str(e.id),
                    "category": e.category,
                    "title": e.title,
                    "summary": e.summary or "",
                    "date": e.event_date.isoformat(),
                    "status": e.status,
                    "needsAttention": e.needs_attention,
                    "leadDept": e.lead_dept or "",
                    "nextAction": e.next_action,
                }
                for e in events
            ]
        }

    async def get_employment_detail(self) -> dict[str, Any]:
        return {
            "overview": [
                {"label": "就业率", "value": 94.5, "unit": "%"},
                {"label": "升学率", "value": 28.6, "unit": "%"},
            ],
            "trend": [],
            "distribution": [],
            "byCollege": [],
        }

    async def get_research_detail(self) -> dict[str, Any]:
        return {"projects": [], "papers": [], "platforms": [], "phdIndicators": [], "collegeRanking": [], "fundingTrend": []}

    async def get_discipline_detail(self) -> dict[str, Any]:
        return {"disciplines": []}

    async def get_academic_risk_detail(self) -> dict[str, Any]:
        return {
            "summary": {
                "expectedDelayCount": 0,
                "delayRateChange": 0,
                "warningCount": 0,
                "intervenedCount": 0,
                "riskResolvedRate": 0,
                "highRiskCollegeCount": 0,
            },
            "trend": [],
            "riskTypes": [],
            "collegeDistribution": [],
            "interventionProgress": [],
        }

    async def get_metrics_detail(self) -> dict[str, Any]:
        return {"sections": []}
