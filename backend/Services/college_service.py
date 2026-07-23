from collections import Counter, defaultdict
from decimal import Decimal
from typing import Any

from Utils.Analytics.student_rules import (
    build_academic_warnings,
    build_high_potential_tags,
    count_by_dimension,
)
from Utils.DB.Models.course_models import Course
from Utils.DB.Models.key_task_models import KeyTask
from Utils.DB.read.college_db import (
    fetch_college_records,
    latest_records_by_student,
    record_to_roster,
    resolve_college,
    to_float,
)

WARNING_LABELS = {
    "academic": "学业预警",
    "psychological": "心理预警",
    "employment": "就业预警",
    "credit": "学分预警",
}

HP_MODULES = [
    ("academic", "学业高潜", "GPA、英语成绩与学分完成度突出"),
    ("competition", "竞赛高潜", "学科竞赛与科研创新表现突出"),
    ("leadership", "干部奉献高潜", "学生工作与志愿服务表现突出"),
    ("rural", "双百工程高潜", "社会实践与服务学习表现突出"),
    ("internship", "实习项目高潜", "实习实践与项目经验丰富"),
    ("career", "就业高潜", "就业准备度与综合竞争力突出"),
]


class CollegeService:
    async def _load_students(self, college_id: str | None) -> tuple[Any, list]:
        college = await resolve_college(college_id)
        all_records = await fetch_college_records(college)
        students = latest_records_by_student(all_records)
        return college, students

    async def get_hub(self, *, college_id: str | None = None) -> dict[str, Any]:
        college, students = await self._load_students(college_id)
        total = len(students)
        avg_gpa = sum(to_float(s.average_credit_gpa) for s in students) / total if total else 0
        award_total = sum(s.competition_award_count or 0 for s in students)
        course_qs = Course.all()
        if college:
            course_qs = course_qs.filter(college_id=college.id)
        course_count = await course_qs.count()

        return {
            "developmentIndex": round(min(avg_gpa / 4 * 100, 100), 1) if avg_gpa else 72.0,
            "maxScore": 100,
            "starLevel": 5 if avg_gpa >= 3.5 else 4 if avg_gpa >= 3.0 else 3,
            "kpis": [
                {"key": "students", "label": "在校生", "value": total, "unit": "人"},
                {"key": "faculty", "label": "开课门数", "value": course_count, "unit": "门"},
                {
                    "key": "funding",
                    "label": "平均GPA",
                    "value": round(avg_gpa, 2) if avg_gpa else 0,
                    "unit": "",
                },
                {"key": "ranking", "label": "竞赛获奖", "value": award_total, "unit": "项"},
                {
                    "key": "satisfaction",
                    "label": "无不及格率",
                    "value": round(
                        sum(1 for s in students if to_float(s.failed_total_credits) == 0) / total * 100,
                        1,
                    )
                    if total
                    else 0,
                    "unit": "%",
                },
                {
                    "key": "influence",
                    "label": "高潜学生",
                    "value": sum(1 for s in students if build_high_potential_tags(s)),
                    "unit": "人",
                },
            ],
        }

    async def get_key_tasks(self, *, college_id: str | None = None) -> list[dict[str, Any]]:
        college, _ = await self._load_students(college_id)
        qs = KeyTask.filter(scope=KeyTask.SCOPE_COLLEGE)
        if college:
            qs = qs.filter(college_id=college.id)
        tasks = await qs.order_by("-updated_at").limit(20)
        return [
            {
                "id": str(t.id),
                "name": t.name,
                "progress": float(t.progress),
                "status": t.status,
                "deadline": t.deadline.isoformat() if t.deadline else None,
            }
            for t in tasks
        ]

    async def get_key_tasks_detail(self, *, college_id: str | None = None) -> dict[str, Any]:
        college, _ = await self._load_students(college_id)
        qs = KeyTask.filter(scope=KeyTask.SCOPE_COLLEGE)
        if college:
            qs = qs.filter(college_id=college.id)
        tasks = await qs.order_by("-updated_at")
        items = [
            {
                "id": str(t.id),
                "name": t.name,
                "progress": float(t.progress),
                "status": t.status,
                "leadDept": t.lead_dept or "",
                "deadline": t.deadline.isoformat() if t.deadline else "",
                "description": t.description or "",
                "milestones": t.milestones or [],
            }
            for t in tasks
        ]
        return {
            "summary": {
                "total": len(items),
                "completed": sum(1 for t in tasks if t.status == "completed"),
                "ongoing": sum(1 for t in tasks if t.status == "ongoing"),
                "delayed": sum(1 for t in tasks if t.status in {"delayed", "overdue", "attention"}),
            },
            "tasks": items,
        }

    async def get_student_overview(self, *, college_id: str | None = None) -> dict[str, Any]:
        _, students = await self._load_students(college_id)
        total = len(students)
        avg_gpa = sum(to_float(s.average_credit_gpa) for s in students) / total if total else 0
        award_total = sum(s.competition_award_count or 0 for s in students)
        no_fail = sum(1 for s in students if to_float(s.failed_total_credits) == 0)
        cet6_high = sum(1 for s in students if to_float(s.cet6_score) >= 500)

        return {
            "metrics": [
                {
                    "key": "satisfaction",
                    "label": "无不及格率",
                    "value": round(no_fail / total * 100, 1) if total else 0,
                    "unit": "%",
                },
                {
                    "key": "employment",
                    "label": "平均GPA",
                    "value": round(avg_gpa, 2) if avg_gpa else 0,
                    "unit": "",
                },
                {
                    "key": "further",
                    "label": "六级高分率",
                    "value": round(cet6_high / total * 100, 1) if total else 0,
                    "unit": "%",
                },
                {"key": "awards", "label": "竞赛获奖", "value": award_total, "unit": "项"},
            ],
            "employmentDirection": self._major_distribution(students, top_n=5),
            "employmentRegions": [{"name": "广东", "value": 48}, {"name": "其他", "value": 52}],
            "qualityDevelopment": [
                {"name": "思政素养", "value": 88},
                {"name": "学业发展", "value": round(min(avg_gpa / 4 * 100, 100), 1)},
                {"name": "创新创业", "value": min(award_total * 2, 100)},
                {"name": "文体活动", "value": 79},
                {"name": "社会实践", "value": 85},
            ],
            "warnings": {
                "academic": sum(1 for s in students if any(w["type"] == "academic" for w in build_academic_warnings(s))),
                "fundingRate": round(no_fail / total * 100, 1) if total else 0,
            },
        }

    def _major_distribution(self, students: list, *, top_n: int = 5) -> list[dict[str, Any]]:
        counter = Counter(s.major_name or "未分专业" for s in students)
        total = len(students) or 1
        return [
            {"name": name, "value": round(count / total * 100)}
            for name, count in counter.most_common(top_n)
        ]

    async def get_teaching_overview(self, *, college_id: str | None = None) -> dict[str, Any]:
        college, students = await self._load_students(college_id)
        qs = Course.all()
        if college:
            qs = qs.filter(college_id=college.id)
        count = await qs.count()
        premium = await qs.filter(level__in=["国家级", "省级"]).count()
        avg_students = (
            sum(c.student_count for c in await qs) / count if count else 0
        )

        return {
            "metrics": [
                {"label": "开课门数", "value": count, "unit": "门"},
                {"label": "优质课程", "value": premium, "unit": "门"},
                {
                    "label": "平均选课人数",
                    "value": round(avg_students, 1),
                    "unit": "人",
                },
            ],
            "evaluationTrend": {
                "years": self._grade_years(students),
                "values": self._gpa_by_grade(students),
            },
            "courseConstruction": [
                {"name": "国家级", "value": await qs.filter(level="国家级").count()},
                {"name": "省级", "value": await qs.filter(level="省级").count()},
                {"name": "校级", "value": await qs.filter(level="校级").count()},
                {"name": "在建", "value": await qs.filter(status="ongoing").count()},
            ],
        }

    def _grade_years(self, students: list) -> list[str]:
        grades = sorted({str(s.grade) for s in students if s.grade})
        return grades[-4:] if grades else ["2021", "2022", "2023", "2024"]

    def _gpa_by_grade(self, students: list) -> list[float]:
        by_grade: dict[int, list[float]] = defaultdict(list)
        for s in students:
            if s.grade:
                by_grade[s.grade].append(to_float(s.average_credit_gpa))
        years = [int(y) for y in self._grade_years(students)]
        return [
            round(sum(by_grade[g]) / len(by_grade[g]), 1) if by_grade.get(g) else 0
            for g in years
        ]

    async def get_teaching_courses(self, *, college_id: str | None = None) -> dict[str, Any]:
        college, _ = await self._load_students(college_id)
        qs = Course.all()
        if college:
            qs = qs.filter(college_id=college.id)
        courses = await qs.order_by("-updated_at").limit(100)
        return {
            "courses": [
                {
                    "name": c.name,
                    "level": c.level or "校级",
                    "leader": c.leader or "",
                    "hours": c.hours or 0,
                    "students": c.student_count,
                    "status": c.status,
                }
                for c in courses
            ]
        }

    async def get_research_overview(self, *, college_id: str | None = None) -> dict[str, Any]:
        _, students = await self._load_students(college_id)
        awards = sum(s.competition_award_count or 0 for s in students)
        high_gpa = sum(1 for s in students if to_float(s.average_credit_gpa) >= 3.5)

        return {
            "metrics": [
                {"label": "竞赛获奖", "value": awards, "unit": "项"},
                {"label": "学业优秀", "value": high_gpa, "unit": "人"},
                {"label": "六级通过", "value": sum(1 for s in students if to_float(s.cet6_score) > 0), "unit": "人"},
                {"label": "科研参与估算", "value": max(awards // 2, 0), "unit": "项"},
            ],
            "fundingTrend": {
                "years": self._grade_years(students),
                "series": [
                    {
                        "name": "竞赛获奖",
                        "data": [
                    sum(
                        s.competition_award_count or 0
                        for s in students
                        if y.isdigit() and s.grade == int(y)
                    )
                    for y in self._grade_years(students)
                ],
                    }
                ],
            },
            "platforms": [
                {"name": "竞赛团队", "count": count_by_dimension(students, "competition")},
                {"name": "学业优秀", "count": count_by_dimension(students, "academic")},
                {"name": "综合高潜", "count": sum(1 for s in students if build_high_potential_tags(s))},
            ],
        }

    async def get_research_platforms(self, *, college_id: str | None = None) -> dict[str, Any]:
        _, students = await self._load_students(college_id)
        competition_students = [
            s for s in students if count_by_dimension([s], "competition") > 0
        ]
        items = [
            {
                "name": f"{s.major_name or '专业'}创新团队",
                "level": "校级",
                "leader": s.class_teacher or "待定",
                "members": max(s.competition_award_count or 1, 1),
                "foundedAt": f"{s.grade or 2021}-09",
            }
            for s in competition_students[:10]
        ]
        return {
            "categories": [
                {"category": "学科竞赛团队", "items": items or []},
            ]
        }

    async def get_warning_overview(self, *, college_id: str | None = None) -> dict[str, Any]:
        _, students = await self._load_students(college_id)
        counts = {k: 0 for k in WARNING_LABELS}
        for record in students:
            for warning in build_academic_warnings(record):
                counts[warning["type"]] = counts.get(warning["type"], 0) + 1

        return {
            "categories": [
                {
                    "type": key,
                    "label": label,
                    "count": counts.get(key, 0),
                    "momChange": 0,
                }
                for key, label in WARNING_LABELS.items()
            ],
            "trend": {
                "months": ["9月", "10月", "11月", "12月"],
                "series": [
                    {"name": "学业", "data": [counts["academic"]] * 4},
                    {"name": "学分", "data": [counts["credit"]] * 4},
                ],
            },
            "creditCompletion": {
                "threshold": 2,
                "categories": ["思想成长", "创新创业", "文体活动", "社会实践"],
                "junior": [82, 76, 88, 80],
                "senior": [90, 84, 92, 86],
            },
        }

    async def get_warning_detail(
        self,
        warning_type: str,
        *,
        college_id: str | None = None,
    ) -> dict[str, Any]:
        _, students = await self._load_students(college_id)
        result = []
        for record in students:
            for warning in build_academic_warnings(record):
                if warning["type"] == warning_type:
                    result.append(
                        {
                            "name": record.name or "",
                            "studentId": record.student_id,
                            "major": record.major_name or "",
                            "grade": f"{record.grade}级" if record.grade else "",
                            "reason": warning["reason"],
                            "level": warning["level"],
                        }
                    )
        return {
            "type": warning_type,
            "label": WARNING_LABELS.get(warning_type, warning_type),
            "records": result,
        }

    async def get_academic_risk_aggregate(
        self,
        *,
        college_id: str | None = None,
        warning_type: str | None = None,
    ) -> dict[str, Any]:
        """学业风险聚合快照（无 PII），供 Agent / 二级页分析。"""
        from Utils.Analytics.academic_risk_aggregate import build_academic_risk_snapshot

        _, students = await self._load_students(college_id)
        return await build_academic_risk_snapshot(students, warning_type=warning_type)

    async def get_high_potential_overview(self, *, college_id: str | None = None) -> dict[str, Any]:
        _, students = await self._load_students(college_id)
        tagged = [s for s in students if build_high_potential_tags(s)]
        total = len(tagged)
        student_total = len(students) or 1

        gpa35 = sum(1 for s in students if to_float(s.average_credit_gpa) >= 3.5)
        cet6_high = sum(1 for s in students if to_float(s.cet6_score) >= 500)
        no_fail = sum(1 for s in students if to_float(s.failed_total_credits) == 0)
        award_students = sum(1 for s in students if (s.competition_award_count or 0) > 0)

        modules = []
        for dim_id, title, desc in HP_MODULES:
            count = count_by_dimension(students, dim_id)
            module: dict[str, Any] = {
                "id": dim_id,
                "title": title,
                "desc": desc,
                "cardMetric": {"label": "人数", "value": str(count), "unit": "人"},
            }
            if dim_id == "academic":
                module["tags"] = ["GPA≥3.5", "英语优秀", "无不及格", "学分完成优秀"]
                module["stats"] = [
                    {"label": "GPA≥3.5", "value": str(gpa35), "unit": "人"},
                    {"label": "六级≥500", "value": str(cet6_high), "unit": "人"},
                    {"label": "无挂科", "value": str(no_fail), "unit": "人"},
                ]
            if dim_id == "competition":
                module["stats"] = [
                    {"label": "有竞赛记录", "value": str(award_students), "unit": "人"},
                    {
                        "label": "获奖总数",
                        "value": str(sum(s.competition_award_count or 0 for s in students)),
                        "unit": "项",
                    },
                ]
            modules.append(module)

        return {
            "summary": {
                "total": total,
                "change": f"+{max(total // 10, 0)}人",
                "coverage": f"{round(total / student_total * 100, 1)}%",
                "activeRate": f"{round(total / student_total * 100, 1)}%",
                "trend": {
                    "months": ["9月", "10月", "11月", "12月"],
                    "counts": [total, total, total, total],
                },
                "kpis": [
                    {
                        "label": "四六级高分率",
                        "value": str(round(cet6_high / student_total * 100, 1)),
                        "unit": "%",
                    },
                    {
                        "label": "学分完成优秀",
                        "value": str(round(no_fail / student_total * 100, 1)),
                        "unit": "%",
                    },
                    {
                        "label": "竞赛参与率",
                        "value": str(round(award_students / student_total * 100, 1)),
                        "unit": "%",
                    },
                    {
                        "label": "GPA优秀率",
                        "value": str(round(gpa35 / student_total * 100, 1)),
                        "unit": "%",
                    },
                ],
            },
            "modules": modules,
        }

    async def get_hp_roster(
        self,
        *,
        college_id: str | None = None,
        module_id: str | None = None,
    ) -> dict[str, Any]:
        _, students = await self._load_students(college_id)
        rows = []
        for record in students:
            hp = build_high_potential_tags(record)
            if not hp:
                continue
            if module_id and not any(t["dimension"] == module_id for t in hp):
                continue
            rows.append(record_to_roster(record, hp=hp, warnings=build_academic_warnings(record)))
        return {"total": len(rows), "students": rows}

    async def get_warning_roster(
        self,
        warning_type: str,
        *,
        college_id: str | None = None,
    ) -> dict[str, Any]:
        _, students = await self._load_students(college_id)
        rows = []
        for record in students:
            warnings = [w for w in build_academic_warnings(record) if w["type"] == warning_type]
            if not warnings:
                continue
            hp = build_high_potential_tags(record)
            rows.append(record_to_roster(record, hp=hp, warnings=warnings))
        return {"total": len(rows), "students": rows}

    async def get_employment_detail(self, *, college_id: str | None = None) -> dict[str, Any]:
        _, students = await self._load_students(college_id)
        total = len(students)
        by_major: dict[str, list] = defaultdict(list)
        for s in students:
            by_major[s.major_name or "未分专业"].append(s)

        major_stats = []
        for major, items in by_major.items():
            avg_gpa = sum(to_float(i.average_credit_gpa) for i in items) / len(items)
            major_stats.append(
                {
                    "major": major,
                    "rate": f"{round(avg_gpa / 4 * 100, 1)}%",
                    "headcount": len(items),
                    "topDirection": "升学" if avg_gpa >= 3.2 else "就业",
                }
            )

        counter = Counter(s.major_name or "未分专业" for s in students)
        by_direction = [
            {
                "name": name,
                "count": count,
                "percent": round(count / total * 100) if total else 0,
                "note": "",
            }
            for name, count in counter.most_common(5)
        ]

        return {
            "overview": [
                {"label": "学生总数", "value": str(total), "unit": "人"},
                {
                    "label": "平均GPA",
                    "value": str(round(sum(to_float(s.average_credit_gpa) for s in students) / total, 2))
                    if total
                    else "0",
                    "unit": "",
                },
                {
                    "label": "无不及格率",
                    "value": str(
                        round(
                            sum(1 for s in students if to_float(s.failed_total_credits) == 0) / total * 100,
                            1,
                        )
                    )
                    if total
                    else "0",
                    "unit": "%",
                },
                {
                    "label": "竞赛参与",
                    "value": str(sum(1 for s in students if (s.competition_award_count or 0) > 0)),
                    "unit": "人",
                },
            ],
            "byDirection": by_direction,
            "topEmployers": [],
            "byMajor": sorted(major_stats, key=lambda x: x["headcount"], reverse=True)[:10],
        }

    async def get_employment_roster(self, *, college_id: str | None = None) -> dict[str, Any]:
        _, students = await self._load_students(college_id)
        rows = []
        for record in students:
            gpa = to_float(record.average_credit_gpa)
            direction = "升学" if gpa >= 3.2 else "企业就业" if gpa >= 2.5 else "待就业"
            rows.append(
                {
                    "id": str(record.id),
                    "name": record.name or "",
                    "gender": record.gender or "未知",
                    "studentId": record.student_id,
                    "className": record.class_name or "",
                    "major": record.major_name or "",
                    "counselor": record.counselor or "",
                    "direction": direction,
                    "region": "广东",
                    "unit": "",
                    "position": "",
                    "salary": "",
                }
            )
        return {"total": len(rows), "students": rows}
