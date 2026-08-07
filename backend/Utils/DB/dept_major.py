"""系部 / 专业归属解析：成果→教师→系部，专业名→系部映射。"""

from __future__ import annotations

import re
from typing import Iterable

# 专业名关键词 → 系部（与通讯录系所口径对齐）
_MAJOR_DEPT_RULES: list[tuple[str, str]] = [
    ("计算机科学与技术", "计算机科学与技术系"),
    ("软件工程", "软件工程系"),
    ("人工智能", "人工智能系"),
    ("大数据管理与应用", "大数据管理与应用系"),
    ("大数据管理", "大数据管理与应用系"),
    ("电子商务", "电子商务系"),
    ("信息管理与信息系统", "大数据管理与应用系"),
]

# 系部名规范化：去掉教研室等后缀噪音
_DEPT_NOISE_RE = re.compile(
    r"(（教研室）|\(教研室\)|教研室|（系）|\(系\))$"
)

# 系部 → 默认挂靠专业（仅在能可靠推断时用于成果 major_name）
_DEPT_TO_MAJOR: dict[str, str] = {
    "计算机科学与技术系": "计算机科学与技术",
    "软件工程系": "软件工程",
    "人工智能系": "人工智能",
    "大数据管理与应用系": "大数据管理与应用",
    "电子商务系": "电子商务",
}


def normalize_department(raw: str | None) -> str | None:
    if not raw:
        return None
    s = str(raw).strip()
    if not s:
        return None
    s = _DEPT_NOISE_RE.sub("", s).strip()
    # 统一全角括号
    s = s.replace("(", "（").replace(")", "）")
    if s in {"学院党政", "办公室", "大数据与人工智能学院"}:
        return s
    if s.endswith("系") or s.endswith("部") or "办公室" in s:
        return s
    # 裸系名补「系」
    for _, dept in _MAJOR_DEPT_RULES:
        if s == dept.rstrip("系") or s == dept:
            return dept
    return s


def resolve_department_from_major(major_name: str | None) -> str | None:
    if not major_name:
        return None
    name = str(major_name).strip()
    if not name:
        return None
    # 去括号内容再匹配关键词
    bare = re.sub(r"[（(].*?[）)]", "", name).strip() or name
    for key, dept in _MAJOR_DEPT_RULES:
        if key in bare or key in name:
            return dept
    return None


def resolve_major_from_department(department: str | None) -> str | None:
    dept = normalize_department(department)
    if not dept:
        return None
    return _DEPT_TO_MAJOR.get(dept)


def _first_person_name(raw: str | None) -> str | None:
    """从负责人字段取第一个可匹配姓名（支持顿号/逗号分隔）。"""
    if not raw:
        return None
    s = str(raw).strip()
    if not s:
        return None
    # 去掉常见前缀噪音
    for sep in ("、", "，", ",", ";", "；", "/", "|", " "):
        if sep in s:
            s = s.split(sep)[0].strip()
            break
    # 过长则不像人名
    if len(s) > 16:
        return None
    return s or None


async def build_teacher_department_map(college_id: int | None) -> dict[str, str]:
    """name → department（仅非空系部）。"""
    from Utils.DB.Models.college_ext_models import Teacher

    qs = Teacher.filter(status="active")
    if college_id is not None:
        qs = qs.filter(college_id=college_id)
    mapping: dict[str, str] = {}
    for t in await qs:
        name = (t.name or "").strip()
        dept = normalize_department(getattr(t, "department", None))
        if name and dept:
            mapping[name] = dept
    return mapping


def resolve_teacher_department(
    person_name: str | None,
    teacher_dept_map: dict[str, str],
) -> str | None:
    name = _first_person_name(person_name)
    if not name:
        return None
    return teacher_dept_map.get(name)


def resolve_achievement_affiliation(
    *,
    leader: str | None,
    explicit_department: str | None = None,
    explicit_major: str | None = None,
    teacher_dept_map: dict[str, str] | None = None,
) -> tuple[str | None, str | None]:
    """返回 (department, major_name)。显式列优先，否则教师主档回填。"""
    dept = normalize_department(explicit_department)
    major = (explicit_major or "").strip() or None

    if not dept and teacher_dept_map:
        dept = resolve_teacher_department(leader, teacher_dept_map)

    if not major and dept:
        major = resolve_major_from_department(dept)

    if not dept and major:
        dept = resolve_department_from_major(major)

    return dept, major


def resolve_competition_department(
    *,
    major_name: str | None,
    explicit_department: str | None = None,
) -> str | None:
    dept = normalize_department(explicit_department)
    if dept:
        return dept
    return resolve_department_from_major(major_name)


def unique_departments(values: Iterable[str | None]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for v in values:
        d = normalize_department(v)
        if d and d not in seen:
            seen.add(d)
            out.append(d)
    return sorted(out)
