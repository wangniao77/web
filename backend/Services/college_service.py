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

_HP_DIM_LABEL = {
    "academic": "学业卓越",
    "competition": "竞赛创新",
    "leadership": "领导实践",
    "rural": "双百工程",
    "internship": "实习就业",
    "career": "就业升学",
}


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

    async def _hp_evidence_maps(
        self,
        college: Any,
        student_ids: set[str],
    ) -> dict[str, dict[str, str]]:
        """按维度批量拉取成果依据（竞赛/干部/双百/实习）。"""
        from collections import defaultdict

        from Utils.DB.Models.student_extra_models import (
            CompetitionAward,
            StudentInternship,
            StudentLeadershipRole,
            StudentProject,
        )

        out: dict[str, dict[str, str]] = {
            "competition": {},
            "leadership": {},
            "rural": {},
            "internship": {},
        }
        if not student_ids:
            return out

        sids = list(student_ids)

        # 竞赛：取每名学生前 2 条奖项摘要
        award_qs = CompetitionAward.filter(student_id__in=sids)
        if college is not None:
            award_qs = award_qs.filter(college_id=college.id)
        awards = await award_qs.order_by("-id").limit(max(len(sids) * 3, 200))
        award_bucket: dict[str, list[str]] = defaultdict(list)
        for a in awards:
            if not a.student_id or len(award_bucket[a.student_id]) >= 2:
                continue
            title = (a.contest_name or "").strip()
            if len(title) > 28:
                title = title[:26] + "…"
            bits = [x for x in (a.award_level, a.award_rank, title) if x]
            if bits:
                award_bucket[a.student_id].append(" ".join(bits))
        for sid, items in award_bucket.items():
            out["competition"][sid] = "；".join(items)

        # 干部任职
        lead_qs = StudentLeadershipRole.filter(student_id__in=sids)
        if college is not None:
            lead_qs = lead_qs.filter(college_id=college.id)
        roles = await lead_qs.order_by("-id").limit(max(len(sids) * 2, 200))
        role_bucket: dict[str, list[str]] = defaultdict(list)
        for r in roles:
            if not r.student_id or len(role_bucket[r.student_id]) >= 2:
                continue
            title = (r.role_title or "").strip()
            dept = (r.department or "").strip()
            label = f"{dept}{title}" if dept and title and dept not in title else (title or dept)
            if label:
                role_bucket[r.student_id].append(label)
        for sid, items in role_bucket.items():
            out["leadership"][sid] = "；".join(items)

        # 双百 / 课题
        proj_qs = StudentProject.filter(student_id__in=sids)
        if college is not None:
            proj_qs = proj_qs.filter(college_id=college.id)
        projects = await proj_qs.order_by("-id").limit(max(len(sids) * 2, 200))
        rural_bucket: dict[str, list[str]] = defaultdict(list)
        for p in projects:
            if not p.student_id or len(rural_bucket[p.student_id]) >= 2:
                continue
            blob = f"{p.project_type or ''}{p.title or ''}"
            if "双百" not in blob and "三下乡" not in blob and "乡村振兴" not in blob:
                # 非双百课题也可作为补充，但优先双百
                if rural_bucket[p.student_id]:
                    continue
            title = (p.title or "").strip()
            if len(title) > 28:
                title = title[:26] + "…"
            level = (p.project_level or "").strip()
            label = f"{level} {title}".strip() if level else title
            if label:
                rural_bucket[p.student_id].append(label)
        for sid, items in rural_bucket.items():
            out["rural"][sid] = "；".join(items)

        # 实习单位
        intern_qs = StudentInternship.filter(student_id__in=sids)
        if college is not None:
            intern_qs = intern_qs.filter(college_id=college.id)
        interns = await intern_qs.order_by("-id").limit(max(len(sids) * 2, 200))
        intern_bucket: dict[str, list[str]] = defaultdict(list)
        for it in interns:
            if not it.student_id or len(intern_bucket[it.student_id]) >= 2:
                continue
            company = (it.company_name or "").strip()
            job = (it.job_title or "").strip()
            if len(company) > 24:
                company = company[:22] + "…"
            label = f"{company}（{job}）" if company and job else (company or job)
            if label:
                intern_bucket[it.student_id].append(label)
        for sid, items in intern_bucket.items():
            out["internship"][sid] = "；".join(items)

        return out

    @staticmethod
    def _academic_evidence(record: Any) -> str:
        parts: list[str] = []
        gpa = to_float(record.average_credit_gpa)
        if gpa > 0:
            parts.append(f"GPA {gpa:.2f}")
        cet6 = to_float(record.cet6_score)
        cet4 = to_float(record.cet4_score)
        if cet6 >= 500:
            parts.append(f"六级{cet6:.0f}")
        elif cet4 >= 550:
            parts.append(f"四级{cet4:.0f}")
        if to_float(record.failed_total_credits) == 0 and gpa >= 3.0:
            parts.append("无不及格")
        earned = to_float(record.earned_total_credits)
        if earned >= 100:
            parts.append(f"已修{earned:.0f}学分")
        return " · ".join(parts) or "学业表现突出"

    def _module_evidence(
        self,
        *,
        module_id: str,
        record: Any,
        tag_reason: str | None,
        evidence_maps: dict[str, dict[str, str]],
        rule_highlights: dict[str, str],
    ) -> str:
        sid = record.student_id
        if module_id == "academic":
            return self._academic_evidence(record)
        if module_id in evidence_maps:
            concrete = evidence_maps[module_id].get(sid) or ""
            if concrete:
                return concrete
        # 标签原因优先于粗规则文案（如「学业与竞赛双优」）
        if tag_reason and tag_reason not in {"学业与竞赛双优", "学分完成优秀"}:
            return tag_reason
        if rule_highlights.get(module_id) and rule_highlights[module_id] not in {
            "学业与竞赛双优",
            "学分完成优秀",
        }:
            return rule_highlights[module_id]
        # 弱依据：补一条学业快照，避免名单毫无信息
        gpa = to_float(record.average_credit_gpa)
        base = tag_reason or rule_highlights.get(module_id) or _HP_DIM_LABEL.get(module_id, module_id)
        if gpa > 0:
            return f"{base} · GPA {gpa:.2f}"
        return f"{base}表现突出" if "表现" not in base else base

    async def get_hp_roster(
        self,
        *,
        college_id: str | None = None,
        module_id: str | None = None,
    ) -> dict[str, Any]:
        """高潜名单：按维度筛选，并返回该维度的入选依据。"""
        from Utils.Analytics.student_tag_service import (
            HP_KEYS,
            index_tags_by_student,
            load_college_tags,
        )

        college, students = await self._load_students(college_id)
        hp_tags = await load_college_tags(college, tag_type="high_potential")
        tag_index = index_tags_by_student(hp_tags)

        # 候选学号：优先标签表（与概览 byType 口径一致），空则回退规则
        candidate_sids: set[str] = set()
        tag_reason_by_sid: dict[str, str] = {}
        if tag_index:
            for sid, tags in tag_index.items():
                dims = {str(t.tag_key) for t in tags if t.tag_key in HP_KEYS}
                if module_id and module_id not in dims:
                    continue
                if not dims:
                    continue
                candidate_sids.add(sid)
                if module_id:
                    reasons = [
                        str(t.reason)
                        for t in tags
                        if t.tag_key == module_id and t.reason
                    ]
                    if reasons:
                        tag_reason_by_sid[sid] = "；".join(dict.fromkeys(reasons))
                else:
                    # 全部高潜：拼接各维度标签原因
                    parts = []
                    for t in tags:
                        if t.tag_key not in HP_KEYS:
                            continue
                        label = _HP_DIM_LABEL.get(str(t.tag_key), str(t.tag_key))
                        if t.reason:
                            parts.append(f"{label}：{t.reason}")
                        else:
                            parts.append(label)
                    if parts:
                        tag_reason_by_sid[sid] = "；".join(parts[:3])
        else:
            for record in students:
                hp = build_high_potential_tags(record)
                if not hp:
                    continue
                if module_id and not any(t["dimension"] == module_id for t in hp):
                    continue
                candidate_sids.add(record.student_id)

        evidence_maps = await self._hp_evidence_maps(college, candidate_sids)

        rows = []
        for record in students:
            sid = record.student_id
            if sid not in candidate_sids:
                continue
            rule_tags = build_high_potential_tags(record)
            rule_hl = {str(t["dimension"]): str(t.get("highlight") or "") for t in rule_tags}
            dims = list({str(t.tag_key) for t in tag_index.get(sid, []) if t.tag_key in HP_KEYS})
            if not dims:
                dims = [t["dimension"] for t in rule_tags]

            if module_id:
                highlight = self._module_evidence(
                    module_id=module_id,
                    record=record,
                    tag_reason=tag_reason_by_sid.get(sid),
                    evidence_maps=evidence_maps,
                    rule_highlights=rule_hl,
                )
                hp_payload = [{"dimension": d, "highlight": rule_hl.get(d, "")} for d in dims]
            else:
                parts = []
                for d in dims[:3]:
                    ev = self._module_evidence(
                        module_id=d,
                        record=record,
                        tag_reason=None,
                        evidence_maps=evidence_maps,
                        rule_highlights=rule_hl,
                    )
                    if ev:
                        parts.append(ev)
                highlight = "；".join(dict.fromkeys(parts)) or tag_reason_by_sid.get(sid, "")
                hp_payload = [{"dimension": d, "highlight": rule_hl.get(d, "")} for d in dims]

            rows.append(
                record_to_roster(
                    record,
                    hp=hp_payload or rule_tags,
                    warnings=build_academic_warnings(record),
                    highlight=highlight,
                )
            )

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

    async def get_student_dev_quality(
        self,
        *,
        college_id: str | None = None,
        dimension: str = "major",
    ) -> dict[str, Any]:
        from Services.talent_overview_service import talent_overview_service

        return await talent_overview_service.get_student_dev_quality(
            college_id=college_id,
            dimension=dimension,
        )

    async def get_student_dev_detail(self, *, college_id: str | None = None) -> dict[str, Any]:
        from Services.talent_overview_service import talent_overview_service

        return await talent_overview_service.get_student_dev_detail(college_id=college_id)

    async def get_enrollment_employment_overview(
        self, *, college_id: str | None = None
    ) -> dict[str, Any]:
        from Services.talent_overview_service import talent_overview_service

        return await talent_overview_service.get_enrollment_employment_overview(
            college_id=college_id
        )

    async def get_enrollment_employment_detail(
        self,
        *,
        college_id: str | None = None,
        year: str | None = None,
        major: str | None = None,
        education: str | None = None,
    ) -> dict[str, Any]:
        from Services.talent_overview_service import talent_overview_service

        return await talent_overview_service.get_enrollment_employment_detail(
            college_id=college_id, year=year, major=major, education=education
        )

    async def get_enrollment_employment_analysis_snapshot(
        self,
        *,
        college_id: str | None = None,
        year: str | None = None,
        major: str | None = None,
    ) -> dict[str, Any]:
        from Services.talent_overview_service import talent_overview_service

        return await talent_overview_service.build_enrollment_employment_analysis_snapshot(
            college_id=college_id, year=year, major=major
        )

    async def build_graduate_cultivation_snapshot(
        self,
        *,
        college_id: str | None = None,
    ) -> dict[str, Any]:
        from Services.talent_overview_service import talent_overview_service

        return await talent_overview_service.build_graduate_cultivation_snapshot(
            college_id=college_id
        )

    async def get_enrollment_employment_analysis_report(
        self,
        *,
        college_id: str | None = None,
        year: str | None = None,
        major: str | None = None,
    ) -> dict[str, Any]:
        from Services.talent_overview_service import talent_overview_service

        return await talent_overview_service.get_enrollment_employment_analysis_report(
            college_id=college_id, year=year, major=major
        )

    async def get_student_flow_sankey(
        self,
        *,
        college_id: str | None = None,
        year: str | None = None,
        major: str | None = None,
        education_level: str | None = None,
    ) -> dict[str, Any]:
        from Services.talent_overview_service import talent_overview_service

        return await talent_overview_service.get_student_flow_sankey(
            college_id=college_id,
            year=year,
            major=major,
            education_level=education_level,
        )

    async def get_student_evaluation_detail(
        self, *, key: str, college_id: str | None = None
    ) -> dict[str, Any]:
        from Services.talent_overview_service import talent_overview_service

        return await talent_overview_service.get_student_evaluation_detail(
            key=key,
            college_id=college_id,
        )
