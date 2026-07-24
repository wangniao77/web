from Utils.DB.Models.account_models import Account
from Utils.DB.Models.college_ext_models import (
    AchievementItem,
    CollegeKpiSnapshot,
    EnrollmentCohort,
    MajorRankSnapshot,
    ResearchPlatform,
    StudentTag,
    Teacher,
)
from Utils.DB.Models.college_models import College
from Utils.DB.Models.college_student_models import (
    AcademicSnapshot,
    AnalysisRuleRun,
    StudentAdmission,
    StudentProfile,
)
from Utils.DB.Models.course_models import Course
from Utils.DB.Models.external_data_models import (
    EmploymentRecord,
    ResearchIp,
    ResearchPaper,
    ResearchProject,
    ThesisAdvisor,
)
from Utils.DB.Models.key_task_models import KeyTask
from Utils.DB.Models.major_models import Major
from Utils.DB.Models.school_class_models import SchoolClass
from Utils.DB.Models.school_event_models import SchoolEvent
from Utils.DB.Models.student_academic_record_models import StudentAcademicRecord

Student = StudentAcademicRecord

__all__ = [
    "Account",
    "College",
    "Major",
    "SchoolClass",
    "Student",
    "StudentAcademicRecord",
    "StudentProfile",
    "StudentAdmission",
    "AcademicSnapshot",
    "AnalysisRuleRun",
    "Course",
    "KeyTask",
    "SchoolEvent",
    "EmploymentRecord",
    "ResearchProject",
    "ResearchPaper",
    "ResearchIp",
    "ThesisAdvisor",
    "Teacher",
    "ResearchPlatform",
    "AchievementItem",
    "MajorRankSnapshot",
    "EnrollmentCohort",
    "StudentTag",
    "CollegeKpiSnapshot",
]
