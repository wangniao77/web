from datetime import datetime
from typing import Any

from Utils.DB.Models.key_task_models import KeyTask
from Utils.DB.Models.school_event_models import SchoolEvent


_DEFAULT_STUDENT_COUNT = 28654
_DEFAULT_OVERDUE = 3
_DEFAULT_STUB_TASKS = [
    {"name": "一流学科建设提升工程", "dept": "发展规划处", "progress": 85.0, "status": "推进中"},
    {"name": "申博建设专项", "dept": "研究生院", "progress": 62.0, "status": "需关注"},
    {"name": "专业认证攻坚", "dept": "教务处", "progress": 92.0, "status": "已完成"},
    {"name": "本科教育教学审核评估", "dept": "教务处", "progress": 71.0, "status": "推进中"},
]


class UniversityService:
    async def get_overview(
        self,
        *,
        academic_year: str | None = None,
        semester: str | None = None,
        stats_period: str | None = None,
        school_scope: str | None = None,
    ) -> dict[str, Any]:
        student_count, tasks, events, overdue = await self._load_overview_source()
        completed = sum(1 for t in tasks if t.status == "completed")
        total_tasks = len(tasks) or 1

        return {
            "meta": {
                "dataUpdatedAt": datetime.now().isoformat(),
                "dataScope": "全校汇总数据",
                "academicYear": academic_year or "2024-2025",
                "semester": semester or "2",
                "statsPeriod": stats_period or "semester",
                "schoolScope": school_scope or "all",
            },
            "schoolPosture": {
                "enrolledStudents": student_count,
                "collegeCount": 18,
                "majorCount": 63,
                "disciplineCount": 12,
                "facultyCount": 1680,
                "researchPlatforms": 16,
                "enrollment": 5820,
                "graduation": 6892,
                "developmentIndex": 82.5,
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
            "benchmark": {
                "nationalRank": 156,
                "provincialRank": 12,
                "financeRank": 8,
                "gapVsPeers": [],
                "attribution": [],
            },
            "research": {
                "nationalProjects": 12,
                "provincialProjects": 36,
                "highLevelPapers": 186,
                "researchAwards": 8,
                "researchFunding": 2.47,
                "keyPlatforms": 16,
                "booksPatents": 0,
                "thinkTankOutputs": 0,
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
                    "department": getattr(t, "lead_dept", None) or "",
                    "currentIssue": getattr(t, "current_issue", None),
                    "nextAction": getattr(t, "next_action", None),
                    "rectifyDeadline": t.deadline.isoformat() if getattr(t, "deadline", None) else "",
                }
                for t in tasks[:8]
            ],
            "disciplines": {
                "risingCount": 2,
                "stableCount": 5,
                "fallingCount": 1,
                "focusCount": 2,
                "keyDisciplines": 4,
                "phdPoints": 3,
                "masterPoints": 12,
                "firstClassMajors": 8,
                "structureOptimization": "",
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
            "teaching": {
                "admissionQuality": 0,
                "courseCount": 0,
                "teachingEval": 0,
                "academicDev": 0,
                "gradRate": 0,
                "degreeRate": 0,
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
                "majorMatchRate": 0,
                "trend": [{"year": "2022", "rate": 92.1}, {"year": "2023", "rate": 93.4}, {"year": "2024", "rate": 94.5}],
                "destinationStructure": [],
                "industryShare": [],
            },
            "faculty": {
                "total": 1680,
                "fullTime": 1426,
                "highLevelTalent": 186,
                "phdRatio": 78.6,
                "professorRatio": 32.4,
                "youngFaculty": 412,
            },
            "riskWarning": {
                "academic": student_count // 20,
                "employment": 0,
                "taskOverdue": overdue,
                "indicatorMiss": 0,
                "fundingSlow": 0,
                "crossDept": [],
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
            "modules": self._modules_stub(student_count, tasks, overdue),
        }

    def _modules_stub(self, student_count: int, tasks: list, overdue: int) -> dict[str, Any]:
        task_rows = [
            {"name": t.name, "dept": getattr(t, "lead_dept", None) or "", "progress": float(t.progress), "status": t.status}
            for t in tasks[:4]
        ]
        return {
            "posture": {
                "developmentIndex": 91.4,
                "yoyChange": 8.6,
                "orbitKpis": [
                    {"key": "students", "label": "在校生", "value": student_count, "unit": "人", "position": "tl"},
                    {"key": "colleges", "label": "学院", "value": 18, "unit": "个", "position": "tr"},
                    {"key": "majors", "label": "专业", "value": 56, "unit": "个", "position": "ml"},
                    {"key": "disciplines", "label": "学科", "value": 12, "unit": "个", "position": "mr"},
                    {"key": "faculty", "label": "专任教师", "value": 1680, "unit": "人", "position": "ll"},
                    {"key": "platforms", "label": "科研平台", "value": 42, "unit": "个", "position": "rr"},
                ],
                "sections": {"overview": {"title": "综合态势总览"}},
            },
            "goals": {
                "completionRate": 78,
                "statusCounts": {"completed": 24, "ongoing": 9, "lagging": overdue or 3},
                "tasks": task_rows,
                "trend": [{"year": "2024", "rate": 74}, {"year": "2025", "rate": 78}],
                "sections": {"overview": {"title": "年度目标总览"}},
            },
            "benchmark": {
                "nationalRank": 128,
                "provincialRank": 6,
                "benchmarkCount": 12,
                "rankChange": 15,
                "financeRank": 8,
                "rankTrend": [{"year": "2024", "rank": 132}, {"year": "2025", "rank": 128}],
                "dimensionGrowth": [{"label": "人才培养", "change": 15}],
                "radar": {"indicators": ["人才培养", "科学研究", "社会服务"], "self": [82, 78, 75], "benchmark": [88, 85, 82]},
                "sections": {"overview": {"title": "排名总览"}},
            },
            "disciplineTalent": {
                "phdPoints": 14,
                "masterPoints": 22,
                "firstClassMajors": 6,
                "satisfaction": 96.8,
                "qualityCompare": {"categories": ["课程", "实践"], "school": [92, 88], "national": [85, 82]},
                "sections": {"overview": {"title": "学科专业总览"}},
            },
            "research": {
                "funding": 36800,
                "horizontalFunding": 24600,
                "patents": 368,
                "awards": 52,
                "contractValue": 2860,
                "fundingTrend": [{"year": "2024", "value": 34200}, {"year": "2025", "value": 36800}],
                "fundingStructure": [{"name": "国家级", "value": 40}, {"name": "省部级", "value": 25}],
                "sections": {"overview": {"title": "科研创新总览"}},
            },
            "employmentRisk": {
                "placementRate": 91.8,
                "furtherStudyRate": 28.6,
                "highQualityRate": 64.2,
                "destination": [{"name": "企业就业", "value": 58.4}],
                "unitTypes": [{"name": "国有企业", "value": 186}],
                "studyLevels": [{"name": "双一流", "value": 86}],
                "risks": [{"label": "学业风险", "value": student_count // 20}, {"label": "任务逾期", "value": overdue}],
                "sections": {"overview": {"title": "就业升学总览"}},
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
