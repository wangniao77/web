from decimal import Decimal
from typing import Any

from Utils.Analytics.student_rules import build_academic_warnings, build_high_potential_tags
from Utils.DB.Models.college_models import College
from Utils.DB.Models.student_academic_record_models import StudentAcademicRecord


def _f(value: Decimal | float | int | None) -> float:
    return float(value or 0)


class StudentService:
    async def get_dashboard(self, student_id: str) -> dict[str, Any]:
        records = await StudentAcademicRecord.filter(student_id=student_id).order_by("-grade")
        if not records:
            raise LookupError("学生不存在")

        latest = records[0]
        college = await latest.college
        major = await latest.major
        school_class = await latest.school_class

        warnings = build_academic_warnings(latest)
        highlights = build_high_potential_tags(latest)
        gpa = _f(latest.average_credit_gpa)

        semesters = [f"{r.grade}级" for r in reversed(records[-4:])]
        gpa_values = [_f(r.average_credit_gpa) for r in reversed(records[-4:])]

        awards = []
        if latest.competition_award_detail:
            for idx, line in enumerate(latest.competition_award_detail.split("\n")[:5], start=1):
                if line.strip():
                    awards.append({"name": line.strip(), "level": "校级", "date": None})

        return {
            "profile": {
                "name": latest.name or "",
                "studentId": latest.student_id,
                "college": college.name if college else (latest.teaching_department or ""),
                "major": major.name if major else (latest.major_name or ""),
                "grade": f"{latest.grade}级" if latest.grade else "",
                "className": school_class.name if school_class else (latest.class_name or ""),
                "mentor": latest.class_teacher or "",
                "counselor": latest.counselor or "",
                "dormitory": "",
                "motto": "持续学习，勇于探索",
                "avatarUrl": latest.student_picture_path,
                "awards": awards,
            },
            "growthPortrait": {
                "dimensions": [
                    {"name": "学业能力", "personal": round(gpa * 25, 1), "gradeAvg": 85.0},
                    {"name": "专业创新", "personal": min(95, 70 + (latest.competition_award_count or 0) * 5), "gradeAvg": 82.5},
                    {"name": "实践能力", "personal": 80.0, "gradeAvg": 80.8},
                    {"name": "身心素质", "personal": 84.0, "gradeAvg": 84.0},
                    {"name": "组织协调", "personal": 82.0, "gradeAvg": 81.6},
                ]
            },
            "aiAssistant": {
                "title": "财宝成长助手 AI",
                "recommendedDirection": "数据分析工程师" if gpa >= 3.0 else "继续夯实学业基础",
                "matchBasis": [f"GPA {gpa:.2f}", f"竞赛获奖 {latest.competition_award_count or 0} 项"],
                "shortTermSuggestions": ["关注薄弱课程，提升核心课成绩"] if warnings else ["保持当前学习节奏"],
                "longTermSuggestions": ["参与学科竞赛或科研训练"],
            },
            "growthOverview": {
                "growthIndex": round(gpa * 23, 1),
                "growthLevel": "优秀" if gpa >= 3.5 else "良好",
                "overallRank": 0,
                "overallTotal": 0,
                "academicRank": 0,
                "academicTotal": 0,
                "qualityScore": 85.0,
                "qualityLevel": "良好",
            },
            "highlights": [
                {"id": str(i), "label": item["highlight"], "date": None}
                for i, item in enumerate(highlights, start=1)
            ],
            "attention": [
                {
                    "id": str(i),
                    "label": w["reason"],
                    "category": w["type"],
                    "level": w["level"],
                }
                for i, w in enumerate(warnings, start=1)
            ],
            "academic": {
                "gpa": gpa,
                "classRank": 0,
                "classTotal": 0,
                "departmentRank": 0,
                "departmentTotal": 0,
                "majorRank": 0,
                "majorTotal": 0,
                "physicalTestScore": 0,
                "gpaTrend": {"semesters": semesters, "values": gpa_values},
                "classRankTrend": {"semesters": semesters, "values": [0] * len(semesters)},
                "departmentRankTrend": {"semesters": semesters, "values": [0] * len(semesters)},
                "majorRankTrend": {"semesters": semesters, "values": [0] * len(semesters)},
                "physicalTestTrend": {"semesters": semesters, "values": [0] * len(semesters)},
                "courseGrades": [
                    {"name": "专业课", "score": _f(latest.major_course_avg_score)},
                    {"name": "学科基础课", "score": _f(latest.subject_basic_course_avg_score)},
                    {"name": "通识课", "score": _f(latest.general_course_avg_score)},
                ],
                "courseCompletionRate": 95.0,
                "excellentCourses": latest.all_course_count or 0,
                "totalCourses": latest.all_course_count or 0,
            },
            "competition": {
                "awardCount": latest.competition_award_count or 0,
                "researchCount": 0,
                "innovationCount": 0,
                "highlights": [{"label": latest.competition_award_detail or "暂无竞赛记录"}],
            },
            "quality": {
                "cadreRoles": [],
                "volunteerHours": 0,
                "socialPractices": 0,
                "softSkills": [],
            },
            "internship": {"internshipCount": 0, "projectCount": 0, "certificateCount": 0, "items": []},
            "employment": {
                "jobReadiness": 75,
                "certificateReadiness": 60,
                "careerDirections": ["技术研发", "数据分析"],
                "developmentPath": {
                    "short": "完善核心课程成绩",
                    "medium": "参与实习与竞赛",
                    "long": "明确升学或就业方向",
                },
            },
            "footer": {
                "motto": "持续学习，勇于探索",
                "growthDays": 365,
                "goalCompletionRate": 72,
                "milestoneCount": len(highlights),
                "totalAwards": latest.competition_award_count or 0,
            },
        }
