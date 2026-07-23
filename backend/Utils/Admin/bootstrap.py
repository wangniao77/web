from Utils.Admin.model_registry import register_admin_model
from Utils.DB.Models import (
    Account,
    College,
    Course,
    EmploymentRecord,
    KeyTask,
    Major,
    ResearchIp,
    ResearchPaper,
    ResearchProject,
    SchoolClass,
    SchoolEvent,
    StudentAcademicRecord,
    ThesisAdvisor,
)


def init_admin_registry() -> None:
    """注册 superadmin 可管理的全部资源表。"""

    register_admin_model("accounts", Account)
    register_admin_model("colleges", College)
    register_admin_model("majors", Major)
    register_admin_model("classes", SchoolClass)
    register_admin_model("student_academic_records", StudentAcademicRecord)
    register_admin_model("courses", Course)
    register_admin_model("key_tasks", KeyTask)
    register_admin_model("school_events", SchoolEvent)
    register_admin_model("employment_records", EmploymentRecord)
    register_admin_model("research_projects", ResearchProject)
    register_admin_model("research_papers", ResearchPaper)
    register_admin_model("research_ips", ResearchIp)
    register_admin_model("thesis_advisors", ThesisAdvisor)
