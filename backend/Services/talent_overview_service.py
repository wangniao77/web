"""人才培养纵览：真实学籍/就业/标签聚合 + 缺源字段后端 mock。"""

from __future__ import annotations

from collections import Counter, defaultdict
from datetime import date
from typing import Any

from Utils.Analytics.student_rules import (
    build_academic_warnings,
    build_high_potential_tags,
)
from Utils.Analytics.student_tag_service import index_tags_by_student, load_college_tags
from Utils.DB.Models.college_ext_models import StudentTag
from Utils.DB.Models.external_data_models import EmploymentRecord
from Utils.DB.Models.student_academic_record_models import StudentAcademicRecord
from Utils.DB.read.college_db import (
    fetch_college_records,
    latest_records_by_student,
    resolve_college,
    to_float,
)

# —— 缺源字段 mock（招生/研究生/心理/教评等）——
_MOCK_GRADUATE = 86
_MOCK_SOURCE_QUALITY = 86.4
_MOCK_FIRST_CHOICE = 68.4
_MOCK_PSYCHOLOGICAL = 4
_MOCK_LEADERSHIP_HP = 42

_HP_LABELS = {
    "academic": "学业卓越",
    "competition": "竞赛创新",
    "internship": "实习就业",
    "career": "就业升学",
    "leadership": "领导实践",
    "rural": "双百工程",
}

_WARN_LABELS = {
    "academic": "学业预警",
    "credit": "学分预警",
    "psychological": "心理关注",
    "employment": "就业困难",
}

_MOCK_ENTRANCE_TREND = {
    "conclusion": "生源质量指数（示意，待招生库接入）",
    "years": ["2024", "2025", "2026"],
    "values": [82.1, 84.5, 86.4],
}

# 省份短名（前端地图 / 柱图用）
_PROVINCE_ALIASES: list[tuple[str, str]] = [
    ("内蒙古", "内蒙古"),
    ("黑龙江", "黑龙江"),
    ("新疆", "新疆"),
    ("宁夏", "宁夏"),
    ("广西", "广西"),
    ("西藏", "西藏"),
    ("北京", "北京"),
    ("天津", "天津"),
    ("上海", "上海"),
    ("重庆", "重庆"),
    ("河北", "河北"),
    ("山西", "山西"),
    ("辽宁", "辽宁"),
    ("吉林", "吉林"),
    ("江苏", "江苏"),
    ("浙江", "浙江"),
    ("安徽", "安徽"),
    ("福建", "福建"),
    ("江西", "江西"),
    ("山东", "山东"),
    ("河南", "河南"),
    ("湖北", "湖北"),
    ("湖南", "湖南"),
    ("广东", "广东"),
    ("海南", "海南"),
    ("四川", "四川"),
    ("贵州", "贵州"),
    ("云南", "云南"),
    ("陕西", "陕西"),
    ("甘肃", "甘肃"),
    ("青海", "青海"),
    ("台湾", "台湾"),
    ("香港", "香港"),
    ("澳门", "澳门"),
]

# 籍贯常见地市 → 省（学籍籍贯多为「汕头潮阳」这类）
_CITY_TO_PROVINCE: dict[str, str] = {
    "广州": "广东", "深圳": "广东", "珠海": "广东", "汕头": "广东", "佛山": "广东",
    "韶关": "广东", "湛江": "广东", "肇庆": "广东", "江门": "广东", "茂名": "广东",
    "惠州": "广东", "梅州": "广东", "汕尾": "广东", "河源": "广东", "阳江": "广东",
    "清远": "广东", "东莞": "广东", "中山": "广东", "潮州": "广东", "揭阳": "广东",
    "云浮": "广东", "南海": "广东", "顺德": "广东", "潮阳": "广东", "陆丰": "广东",
    "惠阳": "广东", "番禺": "广东", "花都": "广东", "增城": "广东", "从化": "广东",
    "长沙": "湖南", "株洲": "湖南", "湘潭": "湖南", "衡阳": "湖南", "岳阳": "湖南",
    "常德": "湖南", "郴州": "湖南", "永州": "湖南", "怀化": "湖南", "娄底": "湖南",
    "南昌": "江西", "赣州": "江西", "九江": "江西", "上饶": "江西", "宜春": "江西",
    "吉安": "江西", "抚州": "江西", "景德镇": "江西", "萍乡": "江西", "新余": "江西",
    "南宁": "广西", "桂林": "广西", "柳州": "广西", "玉林": "广西", "梧州": "广西",
    "福州": "福建", "厦门": "福建", "泉州": "福建", "漳州": "福建", "莆田": "福建",
    "南平": "福建", "龙岩": "福建", "三明": "福建", "宁德": "福建",
    "杭州": "浙江", "宁波": "浙江", "温州": "浙江", "嘉兴": "浙江", "金华": "浙江",
    "武汉": "湖北", "襄阳": "湖北", "宜昌": "湖北", "荆州": "湖北",
    "成都": "四川", "绵阳": "四川", "德阳": "四川",
    "昆明": "云南", "贵阳": "贵州", "海口": "海南", "三亚": "海南",
    "南京": "江苏", "苏州": "江苏", "无锡": "江苏", "常州": "江苏",
    "济南": "山东", "青岛": "山东", "烟台": "山东",
    "郑州": "河南", "洛阳": "河南", "开封": "河南",
    "石家庄": "河北", "唐山": "河北", "保定": "河北",
    "太原": "山西", "西安": "陕西", "兰州": "甘肃", "西宁": "青海",
    "合肥": "安徽", "芜湖": "安徽", "沈阳": "辽宁", "大连": "辽宁",
    "长春": "吉林", "哈尔滨": "黑龙江", "呼和浩特": "内蒙古", "乌鲁木齐": "新疆",
}


def _normalize_province(text: str | None) -> str | None:
    if not text:
        return None
    s = str(text).strip().replace(" ", "")
    if not s:
        return None
    for alias, short in _PROVINCE_ALIASES:
        if alias in s:
            return short
    for city, prov in _CITY_TO_PROVINCE.items():
        if city in s:
            return prov
    return None


def _is_hmt(student: StudentAcademicRecord) -> bool:
    blob = f"{student.hmt_status or ''}|{student.source_place or ''}|{student.native_place or ''}"
    return any(k in blob for k in ("香港", "澳门", "台湾", "港澳台", "台胞", "华侨"))


def _source_bucket(student: StudentAcademicRecord) -> str:
    """入口桑基左侧节点：广东省内 / 省外生源 / 港澳台。"""
    if _is_hmt(student):
        return "港澳台"
    prov = _normalize_province(student.source_place) or _normalize_province(student.native_place)
    if prov in {"香港", "澳门", "台湾"}:
        return "港澳台"
    if prov == "广东":
        return "广东省内"
    if prov:
        return "省外生源"
    sp = student.source_place or ""
    if "广东" in sp:
        return "广东省内"
    if sp.strip():
        return "省外生源"
    return "未知"


def _student_province(student: StudentAcademicRecord) -> str | None:
    return _normalize_province(student.source_place) or _normalize_province(student.native_place)


def _gaokao_by_major(students: list[StudentAcademicRecord]) -> list[dict[str, Any]]:
    buckets: dict[str, list[float]] = defaultdict(list)
    for s in students:
        score = to_float(s.admission_score)
        if score <= 0 or not s.major_name:
            continue
        buckets[s.major_name].append(score)
    rows = []
    for major, scores in buckets.items():
        rows.append(
            {
                "major": major,
                "avgScore": round(sum(scores) / len(scores), 1),
                "minScore": round(min(scores), 1),
                "maxScore": round(max(scores), 1),
            }
        )
    rows.sort(key=lambda x: -x["avgScore"])
    return rows


def _score_stats(students: list[StudentAcademicRecord]) -> dict[str, float | None]:
    scores = [to_float(s.admission_score) for s in students if to_float(s.admission_score) > 0]
    if not scores:
        return {"avg": None, "min": None, "max": None, "count": 0}
    return {
        "avg": round(sum(scores) / len(scores), 1),
        "min": round(min(scores), 1),
        "max": round(max(scores), 1),
        "count": len(scores),
    }


def _province_structure(students: list[StudentAcademicRecord]) -> dict[str, Any]:
    prov_c: Counter[str] = Counter()
    for s in students:
        p = _student_province(s)
        if p:
            prov_c[p] += 1
        elif (s.source_place or s.native_place or "").strip():
            prov_c["其他"] += 1
    total = sum(prov_c.values()) or 1
    provinces = [
        {"name": name, "count": count, "ratio": round(count / total * 100, 1)}
        for name, count in prov_c.most_common(12)
    ]
    in_gd = prov_c.get("广东", 0)
    known = sum(v for k, v in prov_c.items() if k != "其他")
    in_ratio = round(in_gd / known * 100, 1) if known else 0.0
    out_ratio = round(100 - in_ratio, 1) if known else 0.0
    return {
        "provinces": provinces,
        "inOutProvince": {"inProvince": in_ratio, "outProvince": out_ratio},
        "knownCount": known,
    }


def _entrance_sankey(students: list[StudentAcademicRecord]) -> dict[str, Any]:
    link_c: Counter[tuple[str, str]] = Counter()
    bucket_c: Counter[str] = Counter()
    major_c: Counter[str] = Counter()
    for s in students:
        major = s.major_name or "其他"
        bucket = _source_bucket(s)
        if bucket == "未知":
            continue
        major_c[major] += 1
        bucket_c[bucket] += 1
        link_c[(bucket, major)] += 1

    top_majors = [m for m, _ in major_c.most_common(8)]
    buckets = [b for b in ("广东省内", "省外生源", "港澳台") if bucket_c.get(b, 0) > 0]
    if not buckets:
        buckets = ["广东省内", "省外生源"]

    nodes = [{"name": b} for b in buckets] + [{"name": m} for m in top_majors]
    links = []
    for (src, tgt), val in link_c.items():
        if src not in buckets or tgt not in top_majors:
            continue
        if val > 0:
            links.append({"source": src, "target": tgt, "value": int(val)})

    return {
        "nodes": nodes,
        "links": links,
        "topEntranceRegions": [
            {"name": b, "count": int(bucket_c.get(b, 0))} for b in buckets
        ],
        "bucketCounts": dict(bucket_c),
    }


def _enrolled_by_year(students: list[StudentAcademicRecord]) -> dict[str, Any]:
    year_c: Counter[int] = Counter()
    for s in students:
        y = s.enrollment_year or s.grade
        if y:
            year_c[int(y)] += 1
    years = sorted(year_c.keys())
    if not years:
        return {"years": [], "enrolled": []}
    return {
        "years": [str(y) for y in years],
        "enrolled": [year_c[y] for y in years],
    }


_SHORT_MAJOR = {
    "计算机科学与技术": "计科",
    "软件工程": "软工",
    "人工智能": "人工智能",
    "大数据管理与应用": "大数据",
    "电子商务": "电商",
    "计算机技术": "计技",
    "管理科学与工程": "管科",
    "技术经济及管理": "技经",
}


def _short_major(name: str) -> str:
    if not name:
        return "未知"
    for k, v in _SHORT_MAJOR.items():
        if k in name:
            return v
    return name[:4]


def _major_key(name: str) -> str:
    s = _short_major(name)
    mapping = {"计科": "cs", "软工": "se", "人工智能": "ai", "大数据": "bd", "电商": "ec"}
    return mapping.get(s, "".join(ch for ch in name if ch.isalnum())[:12] or "other")


def _classify_destination(dest: str | None, unit: str | None = None) -> str:
    """粗分去向（桑基/出口预览用，非高质量六类口径）。"""
    text = f"{dest or ''}{unit or ''}"
    if any(k in text for k in ("境外留学", "出国留学", "出境深造")) or (
        any(k in text for k in ("出国", "境外", "海外", "留学"))
        and any(k in text for k in ("升学", "留学", "深造", "硕士", "博士"))
    ):
        return "abroad"
    if any(k in text for k in ("境内升学", "国内升学")) or (
        "升学" in text and "境外" not in text and "出国" not in text
    ):
        return "furtherStudy"
    if any(k in text for k in ("考公", "公务员", "选调", "事业单位", "机关")):
        return "civilService"
    return "employment"


# 高质量毕业去向六类（官方口径映射；互斥主键，计入并集）
HQ_DEST_DEFS: list[tuple[str, str]] = [
    ("key-employer", "重点单位就业"),
    ("gov-institution", "党政机关及事业单位就业"),
    ("domestic-grad", "高质量国内升学"),
    ("abroad-grad", "高质量出国（境）升学"),
    ("grassroots", "基层重点项目"),
    ("startup", "自主创业典型"),
]

_KEY_EMPLOYER_UNIT_KEYWORDS = (
    "阿里", "腾讯", "华为", "字节", "百度", "美团", "京东", "网易", "拼多多",
    "微软", "Google", "Apple", "中兴", "大疆", "OPPO", "vivo", "小米", "比亚迪",
)


def _hq_category(row: EmploymentRecord) -> str | None:
    """判定高质量去向六类主键；不命中则非高质量。

    互斥优先级：基层 → 出国升学 → 国内升学 → 党政机关/事业 → 自主创业 → 重点单位。
    """
    dest = row.destination or ""
    unit = row.unit_name or ""
    ut = row.unit_type or ""
    occ = row.occupation_type or ""
    blob = f"{dest}|{unit}|{ut}|{occ}"

    # 1) 基层重点项目
    if any(k in dest for k in ("国家基层项目", "地方基层项目")) or any(
        k in ut for k in ("西部计划", "三支一扶", "特岗教师", "大学生村官", "农村义务教育")
    ):
        return "grassroots"

    # 2) 高质量出国（境）升学
    if (
        "境外留学" in dest
        or "出国留学" in dest
        or "出境深造" in ut
        or ("出国、出境深造" in ut)
    ):
        return "abroad-grad"

    # 3) 高质量国内升学（现表无院校层次，境内升学/研究生均计入）
    if "境内升学" in dest or "国内升学" in dest or ut == "研究生" or (
        "升学" in dest and "境外" not in dest and "出国" not in dest
    ):
        return "domestic-grad"

    # 4) 党政机关及事业单位
    if any(
        k in ut
        for k in (
            "国家机关",
            "党群系统",
            "党群",
            "事业单位",
            "公务员",
        )
    ) or any(k in blob for k in ("公务员", "选调生", "选调")):
        return "gov-institution"

    # 5) 自主创业典型（缺「典型」白名单时，自主创业去向先全量计入）
    if "自主创业" in dest or any(
        k in ut for k in ("创立公司", "个体工商户创业")
    ):
        return "startup"

    # 6) 重点单位就业：央企/省属及地市国有企业 + 名企关键词
    if any(k in ut for k in ("中央及省", "国有企业")) or any(
        k in unit for k in _KEY_EMPLOYER_UNIT_KEYWORDS
    ):
        return "key-employer"

    return None


def _is_high_quality_row(row: EmploymentRecord) -> bool:
    return _hq_category(row) is not None


def _flat_trend_up(value: float = 1.2, unit: str | None = None) -> dict[str, Any]:
    t: dict[str, Any] = {"direction": "up", "value": value}
    if unit:
        t["unit"] = unit
    return t


def _emp_signed_year(row: EmploymentRecord) -> str:
    raw = (row.signed_at or "").strip()
    return raw[:4] if len(raw) >= 4 and raw[:4].isdigit() else ""


# 未落实去向：有文案但不计入毕业去向落实率分子
_UNPLACED_DESTINATIONS = frozenset(
    {
        "待就业",
        "未就业",
        "暂不就业",
        "不就业拟升学",
        "求职中",
    }
)


def _is_placed(row: EmploymentRecord) -> bool:
    """毕业去向是否已落实（排除待就业等未落实状态）。"""
    dest = (row.destination or "").strip()
    return bool(dest) and dest not in _UNPLACED_DESTINATIONS


def _emp_program_years(
    row: EmploymentRecord,
    stu: StudentAcademicRecord | None = None,
) -> int:
    """学制年数：用于由入学年级推算毕业届次。"""
    edu = f"{row.education_level or ''}{getattr(stu, 'education_level', None) or ''}"
    if "专升本" in edu:
        return 2
    if "博士" in edu:
        return 4
    if "硕士" in edu or "研究生" in edu:
        return 3
    return 4


def _emp_cohort_year(
    row: EmploymentRecord,
    by_sid: dict[str, StudentAcademicRecord] | None = None,
    *,
    default_cohort: str | None = None,
) -> str:
    """毕业届次：学籍年级+学制优先；无学籍时归入主导届（同批就业表），再回退签约年。

    签约年含脏数据/跨年签约，不能直接当「届次」画历年趋势。
    """
    stu = (by_sid or {}).get(row.student_id)
    if stu and stu.grade:
        try:
            return str(int(stu.grade) + _emp_program_years(row, stu))
        except (TypeError, ValueError):
            pass
    if default_cohort:
        return default_cohort
    return _emp_signed_year(row)


def _infer_default_cohort(
    rows: list[EmploymentRecord],
    by_sid: dict[str, StudentAcademicRecord] | None = None,
) -> str | None:
    """由有学籍记录的人数众数推断本批就业表主导毕业届。"""
    counts: Counter[str] = Counter()
    for r in rows:
        stu = (by_sid or {}).get(r.student_id)
        if not (stu and stu.grade):
            continue
        try:
            counts[str(int(stu.grade) + _emp_program_years(r, stu))] += 1
        except (TypeError, ValueError):
            continue
    if not counts:
        return None
    return counts.most_common(1)[0][0]


def _emp_year_min_count(total: int) -> int:
    """历年趋势入图门槛：至少 10 人或总体 5%，避免 1～2 条脏年份撑出 100%。"""
    return max(10, int(total * 0.05))


def _calendar_year_cap() -> int:
    return date.today().year


def _parse_salary(value: Any) -> float | None:
    if value is None:
        return None
    text = str(value).strip().replace(",", "").replace("元", "").replace("/月", "")
    if not text:
        return None
    try:
        if text.lower().endswith("k"):
            return float(text[:-1]) * 1000
        return float(text)
    except ValueError:
        return None


def _salary_distribution(rows: list[EmploymentRecord]) -> list[dict[str, Any]]:
    buckets = [("5k以下", 0), ("5-8k", 0), ("8-12k", 0), ("12k以上", 0)]
    counts = [0, 0, 0, 0]
    for r in rows:
        v = _parse_salary(r.salary)
        if v is None:
            continue
        if v < 5000:
            counts[0] += 1
        elif v < 8000:
            counts[1] += 1
        elif v < 12000:
            counts[2] += 1
        else:
            counts[3] += 1
    total = sum(counts) or 1
    return [
        {"name": name, "count": n, "ratio": round(n / total * 100, 1)}
        for (name, _), n in zip(buckets, counts)
        if n > 0
    ] or [{"name": name, "count": 0, "ratio": 0.0} for name, _ in buckets]


def _cloud_from_counter(counter: Counter[str], *, top: int = 24) -> list[dict[str, Any]]:
    items = [(k, v) for k, v in counter.most_common(top) if k and k != "(空)"]
    if not items:
        return []
    max_w = max(v for _, v in items) or 1
    return [
        {"name": name, "weight": max(18, int(round(v / max_w * 100)))}
        for name, v in items
    ]


def _employment_rates_by_year(
    rows: list[EmploymentRecord],
    by_sid: dict[str, StudentAcademicRecord] | None = None,
) -> dict[str, Any]:
    """按毕业届次汇总落实率 / 高质量率；过滤样本不足与未来脏年份。"""
    default_cohort = _infer_default_cohort(rows, by_sid)
    by_year: dict[str, list[EmploymentRecord]] = defaultdict(list)
    for r in rows:
        y = _emp_cohort_year(r, by_sid, default_cohort=default_cohort)
        if y:
            by_year[y].append(r)
    total = len(rows)
    min_n = _emp_year_min_count(total)
    cap = _calendar_year_cap()
    years = sorted(
        y
        for y, group in by_year.items()
        if y.isdigit() and int(y) <= cap and len(group) >= min_n
    )
    placement: list[float] = []
    hq_rates: list[float] = []
    counts: list[int] = []
    for y in years:
        group = by_year[y]
        n = len(group) or 1
        placed = sum(1 for r in group if _is_placed(r))
        hq = sum(1 for r in group if _is_high_quality_row(r))
        placement.append(round(placed / n * 100, 1))
        hq_rates.append(round(hq / n * 100, 1))
        counts.append(len(group))
    return {
        "years": years,
        "placementRate": placement,
        "highQualityRate": hq_rates,
        "cohortCounts": counts,
    }


def _primary_employment_year(
    rows: list[EmploymentRecord],
    by_sid: dict[str, StudentAcademicRecord] | None = None,
) -> str | None:
    """默认届次：人数足够的毕业届中取最新；否则取人数最多的届次。"""
    default_cohort = _infer_default_cohort(rows, by_sid)
    counts: Counter[str] = Counter()
    for r in rows:
        y = _emp_cohort_year(r, by_sid, default_cohort=default_cohort)
        if y:
            counts[y] += 1
    if not counts:
        return None
    total = sum(counts.values())
    min_n = _emp_year_min_count(total)
    cap = _calendar_year_cap()
    qualified = [
        y for y, n in counts.items() if y.isdigit() and int(y) <= cap and n >= min_n
    ]
    if qualified:
        return max(qualified)
    # 无达标届次时仍避开未来年
    eligible = [(y, n) for y, n in counts.items() if not y.isdigit() or int(y) <= cap]
    if not eligible:
        eligible = list(counts.items())
    return max(eligible, key=lambda x: (x[1], x[0]))[0]


def _filter_employment_rows(
    rows: list[EmploymentRecord],
    *,
    year: str | None = None,
    major: str | None = None,
    by_sid: dict[str, StudentAcademicRecord] | None = None,
) -> list[EmploymentRecord]:
    out = rows
    if year and year not in {"", "全部", "全部年份"}:
        default_cohort = _infer_default_cohort(rows, by_sid)
        out = [
            r
            for r in out
            if _emp_cohort_year(r, by_sid, default_cohort=default_cohort) == year
        ]
    if major and major not in {"", "全部专业"}:
        by_sid = by_sid or {}
        filtered: list[EmploymentRecord] = []
        for r in out:
            if _emp_major_name(r, by_sid) == major:
                filtered.append(r)
        out = filtered
    return out


def _emp_major_name(
    row: EmploymentRecord,
    by_sid: dict[str, StudentAcademicRecord] | None = None,
) -> str:
    """就业专业：优先就业表，再回退学籍，缺省「其他」。"""
    emp_major = (getattr(row, "major_name", None) or "").strip()
    if emp_major:
        return emp_major
    stu = (by_sid or {}).get(row.student_id)
    return (stu.major_name if stu and stu.major_name else None) or "其他"


def _emp_class_name(
    row: EmploymentRecord,
    by_sid: dict[str, StudentAcademicRecord] | None = None,
) -> str:
    """就业班级：优先就业表，再回退学籍；占位班级置空。"""
    emp_class = (getattr(row, "class_name", None) or "").strip()
    if emp_class and emp_class not in {"默认班级", "无", "-"}:
        return emp_class
    stu = (by_sid or {}).get(row.student_id)
    return (stu.class_name if stu and stu.class_name else None) or ""


def _format_salary_label(value: Any) -> str | None:
    parsed = _parse_salary(value)
    if parsed is None:
        raw = str(value or "").strip()
        return raw or None
    if parsed >= 1000 and parsed == int(parsed):
        return f"{int(parsed)}元/月"
    return f"{parsed:g}元/月"


def _emp_flow_dest_name(row: EmploymentRecord) -> str:
    """出口桑基右侧节点名（与 _outcomes_from_employment 一致，未做前端文案映射）。"""
    cat = _classify_destination(row.destination, row.unit_name)
    dest_labels = {
        "employment": "其他就业",
        "furtherStudy": "国内升学",
        "civilService": "考公",
        "abroad": "出国",
    }
    dest_name = dest_labels.get(cat, "其他就业")
    hq_key = _hq_category(row)
    if hq_key == "key-employer":
        return "重点单位"
    if hq_key == "gov-institution":
        return "机关事业"
    if hq_key == "domestic-grad":
        return "国内升学"
    if hq_key == "abroad-grad":
        return "出国升学"
    if hq_key == "grassroots":
        return "基层项目"
    if hq_key == "startup":
        return "自主创业"
    return dest_name


# 桑基展示文案（后端存储名 → 前端节点名）
_SANKY_DEST_DISPLAY = {
    "重点单位": "重点单位",
    "机关事业": "机关事业",
    "国内升学": "升学深造",
    "出国升学": "出国升学",
    "基层项目": "基层项目",
    "自主创业": "自主创业",
    "其他就业": "其他就业",
    "考公": "机关事业",
    "出国": "出国升学",
}


def _emp_flow_major_short(
    row: EmploymentRecord,
    by_sid: dict[str, StudentAcademicRecord] | None = None,
) -> str:
    major = _emp_major_name(row, by_sid)
    if major == "其他":
        major = "其他专业"
    return _short_major(major)


def _sankey_link_key(major_short: str, dest_display: str) -> str:
    return f"{major_short}→{dest_display}"


def _build_emp_drill_samples(
    rows: list[EmploymentRecord],
    by_sid: dict[str, StudentAcademicRecord],
    *,
    limit: int = 8,
    sankey_limit: int = 80,
) -> dict[str, list[dict[str, Any]]]:
    buckets: dict[str, list[dict[str, Any]]] = defaultdict(list)
    further_tags = {"国内升学", "出国升学", "升学", "升学深造"}

    def _push(key: str, row: EmploymentRecord, tag: str, *, max_n: int | None = None) -> None:
        cap = limit if max_n is None else max_n
        if len(buckets[key]) >= cap:
            return
        # 优先就业表专业/班级（硕士等多不在本科花名册），再回退学籍
        major = _emp_major_name(row, by_sid)
        class_name = _emp_class_name(row, by_sid)
        detail = " · ".join(
            x for x in (row.destination or "", row.unit_name or "", row.industry or "") if x
        )
        sample: dict[str, Any] = {
            "name": row.name or row.student_id or "未知",
            "studentId": row.student_id or "",
            "major": major,
            "className": class_name,
            "educationLevel": row.education_level or "",
            "detail": detail[:100],
            "tag": tag,
        }
        if tag not in further_tags:
            sample["salary"] = _format_salary_label(row.salary)
        else:
            sample["salary"] = None
        buckets[key].append(sample)

    for r in rows:
        cat = _classify_destination(r.destination, r.unit_name)
        hq_key = _hq_category(r)
        if hq_key == "domestic-grad":
            _push("高质量国内升学", r, "国内升学")
            _push("domestic-grad", r, "国内升学")
        elif hq_key == "abroad-grad":
            _push("高质量出国（境）升学", r, "出国升学")
            _push("abroad-grad", r, "出国升学")
        elif hq_key == "gov-institution":
            _push("党政机关及事业单位就业", r, "机关事业")
            _push("gov-institution", r, "机关事业")
        elif hq_key == "grassroots":
            _push("基层重点项目", r, "基层")
            _push("grassroots", r, "基层")
        elif hq_key == "startup":
            _push("自主创业典型", r, "创业")
            _push("startup", r, "创业")
        elif hq_key == "key-employer":
            _push("重点单位就业", r, "重点单位")
            _push("key-employer", r, "重点单位")
        elif cat == "furtherStudy":
            _push("国内升学", r, "升学")
        elif cat == "abroad":
            _push("出国", r, "出国")
        if r.industry:
            _push(r.industry, r, "行业")
        if r.region:
            region = r.region.split("/")[0] if "/" in r.region else r.region
            _push(region, r, "地区")
        mname = _emp_major_name(r, by_sid)
        if mname and mname != "其他":
            _push(mname, r, "专业")
        # 薪资分桶下钻
        sal_parsed = _parse_salary(r.salary)
        if sal_parsed is not None:
            if sal_parsed < 5000:
                _push("5k以下", r, "薪资")
            elif sal_parsed < 8000:
                _push("5-8k", r, "薪资")
            elif sal_parsed < 12000:
                _push("8-12k", r, "薪资")
            else:
                _push("12k以上", r, "薪资")

        # 出口桑基连线：专业简称 → 去向展示名
        short = _emp_flow_major_short(r, by_sid)
        dest_raw = _emp_flow_dest_name(r)
        dest_display = _SANKY_DEST_DISPLAY.get(dest_raw, dest_raw)
        link_key = _sankey_link_key(short, dest_display)
        _push(link_key, r, dest_display, max_n=sankey_limit)
        # 兼容未改名的目标节点
        if dest_display != dest_raw:
            _push(_sankey_link_key(short, dest_raw), r, dest_raw, max_n=sankey_limit)

    return dict(buckets)


class TalentOverviewService:
    async def _ctx(self, college_id: str | None) -> tuple[Any, list[StudentAcademicRecord], dict[str, StudentAcademicRecord]]:
        college = await resolve_college(college_id)
        all_records = await fetch_college_records(college)
        students = latest_records_by_student(all_records)
        by_sid = {s.student_id: s for s in students}
        return college, students, by_sid

    async def _employment_rows(self, college: Any) -> list[EmploymentRecord]:
        qs = EmploymentRecord.all()
        if college:
            qs = qs.filter(college_id=college.id)
        rows = await qs
        if not rows and college:
            # 兼容尚未回填 college_id 的历史行：全表读取后由学号交集过滤
            rows = await EmploymentRecord.all()
        return list(rows)

    def _gpa_by_grade(self, students: list[StudentAcademicRecord]) -> list[dict[str, Any]]:
        buckets: dict[int, dict[str, list[float]]] = defaultdict(lambda: defaultdict(list))
        for s in students:
            if not s.grade or not s.major_name:
                continue
            gpa = to_float(s.average_credit_gpa)
            if gpa <= 0:
                continue
            buckets[int(s.grade)][s.major_name].append(gpa)

        out: list[dict[str, Any]] = []
        for grade in sorted(buckets.keys()):
            majors = []
            for major_name, gpas in sorted(buckets[grade].items(), key=lambda x: -len(x[1])):
                majors.append(
                    {
                        "key": _major_key(major_name),
                        "label": major_name,
                        "shortName": _short_major(major_name),
                        "gpa": round(sum(gpas) / len(gpas), 2),
                    }
                )
            out.append(
                {
                    "gradeKey": str(grade),
                    "gradeLabel": f"{grade}级",
                    "majors": majors[:8],
                }
            )
        return out

    def _hp_structure_from_tags(
        self,
        students: list[StudentAcademicRecord],
        hp_tags: list[StudentTag],
    ) -> tuple[int, list[dict[str, Any]], list[dict[str, Any]]]:
        """从 student_tags 聚合高潜结构（对齐批算结果）。"""
        by_sid = {s.student_id: s for s in students}
        dim_students: dict[str, set[str]] = defaultdict(set)
        hp_ids: set[str] = set()
        major_counter: Counter[str] = Counter()

        for t in hp_tags:
            sid = t.student_id
            if not sid or sid not in by_sid:
                continue
            hp_ids.add(sid)
            key = str(t.tag_key or "academic")
            dim_students[key].add(sid)

        for sid in hp_ids:
            major = by_sid[sid].major_name
            if major:
                major_counter[major] += 1

        academic = len(dim_students.get("academic", set()))
        competition = len(dim_students.get("competition", set()))
        internship = len(dim_students.get("internship", set()) | dim_students.get("career", set()))
        structure = [
            {"key": "competition", "label": "竞赛高潜", "count": competition or 0, "flux": 0},
            {"key": "academic", "label": "学业高潜", "count": academic or 0, "flux": 0},
            {
                "key": "research",
                "label": "科研创新",
                "count": _MOCK_LEADERSHIP_HP // 3,
                "flux": 0,
            },
            {
                "key": "practice",
                "label": "实践高潜",
                "count": internship,
                "flux": 0,
            },
        ]
        by_dim = [{"name": name, "count": count} for name, count in major_counter.most_common(8)]
        return len(hp_ids), structure, by_dim

    def _warning_stats_from_tags(
        self,
        students: list[StudentAcademicRecord],
        warn_tags: list[StudentTag],
    ) -> tuple[int, list[dict[str, Any]]]:
        """从 student_tags 聚合预警；心理仅在库内有名单时用真数，否则示意 mock。"""
        by_sid = {s.student_id for s in students}
        academic = credit = psych = 0
        warned: set[str] = set()
        for t in warn_tags:
            if not t.student_id or t.student_id not in by_sid:
                continue
            warned.add(t.student_id)
            key = str(t.tag_key or "")
            if key == "credit":
                credit += 1
            elif key == "academic":
                academic += 1
            elif key == "psychological":
                psych += 1
        breakdown = [
            {"key": "academic", "label": "学业预警", "count": academic},
            {"key": "credit", "label": "学分预警", "count": credit},
            {
                "key": "psychological",
                "label": "心理预警",
                "count": psych if psych > 0 else _MOCK_PSYCHOLOGICAL,
            },
        ]
        return len(warned), breakdown

    def _hp_structure_fallback(
        self, students: list[StudentAcademicRecord]
    ) -> tuple[int, list[dict[str, Any]], list[dict[str, Any]]]:
        """标签表空时：内存规则即时聚合。"""
        dim_students: dict[str, set[str]] = defaultdict(set)
        hp_ids: set[str] = set()
        major_counter: Counter[str] = Counter()
        for s in students:
            tags = build_high_potential_tags(s)
            if not tags:
                continue
            hp_ids.add(s.student_id)
            if s.major_name:
                major_counter[s.major_name] += 1
            for t in tags:
                dim_students[str(t.get("dimension") or "academic")].add(s.student_id)
        academic = len(dim_students.get("academic", set()))
        competition = len(dim_students.get("competition", set()))
        internship = len(dim_students.get("internship", set()) | dim_students.get("career", set()))
        structure = [
            {"key": "competition", "label": "竞赛高潜", "count": competition or 0, "flux": 0},
            {"key": "academic", "label": "学业高潜", "count": academic or 0, "flux": 0},
            {"key": "research", "label": "科研创新", "count": _MOCK_LEADERSHIP_HP // 3, "flux": 0},
            {"key": "practice", "label": "实践高潜", "count": internship, "flux": 0},
        ]
        by_dim = [{"name": name, "count": count} for name, count in major_counter.most_common(8)]
        return len(hp_ids), structure, by_dim

    def _warning_stats_fallback(
        self, students: list[StudentAcademicRecord]
    ) -> tuple[int, list[dict[str, Any]]]:
        academic = credit = 0
        warned: set[str] = set()
        for s in students:
            for w in build_academic_warnings(s):
                warned.add(s.student_id)
                if w.get("type") == "credit":
                    credit += 1
                elif w.get("type") == "academic":
                    academic += 1
        breakdown = [
            {"key": "academic", "label": "学业预警", "count": academic},
            {"key": "credit", "label": "学分预警", "count": credit},
            {"key": "psychological", "label": "心理预警", "count": _MOCK_PSYCHOLOGICAL},
        ]
        return len(warned), breakdown

    def _outcomes_from_employment(
        self,
        rows: list[EmploymentRecord],
        by_sid: dict[str, StudentAcademicRecord],
    ) -> tuple[list[dict[str, Any]], float, float, dict[str, Any]]:
        """返回 outcomesPreview、落实率、高质量就业率、flowPreview。

        以就业表为主；学籍仅用于补全专业名。不因学籍缺失丢弃毕业生。
        """
        total = len(rows)
        cat_counter: Counter[str] = Counter()
        hq = 0
        link_counter: Counter[tuple[str, str]] = Counter()
        major_names: set[str] = set()

        for r in rows:
            cat = _classify_destination(r.destination, r.unit_name)
            if cat == "abroad":
                cat_counter["furtherStudy"] += 1
            elif cat == "civilService":
                cat_counter["civilService"] += 1
            else:
                cat_counter["employment"] += 1
            if _is_high_quality_row(r):
                hq += 1

            short = _emp_flow_major_short(r, by_sid)
            major_names.add(short)
            dest_name = _emp_flow_dest_name(r)
            link_counter[(short, dest_name)] += 1

        outcomes = []
        for key, label in (
            ("employment", "就业"),
            ("civilService", "考公"),
            ("furtherStudy", "升学"),
        ):
            count = cat_counter.get(key, 0)
            outcomes.append(
                {
                    "key": key,
                    "label": label,
                    "count": count,
                    "ratio": round(count / total * 100, 1) if total else 0.0,
                }
            )

        placed = sum(1 for r in rows if _is_placed(r))
        placement_rate = round(placed / total * 100, 1) if total else 0.0
        hq_rate = round(hq / total * 100, 1) if total else 0.0

        dest_nodes = sorted({t for _, t in link_counter.keys()})
        nodes = [{"name": n} for n in sorted(major_names)] + [{"name": n} for n in dest_nodes]
        links = [
            {"source": s, "target": t, "value": v}
            for (s, t), v in link_counter.most_common(40)
            if v > 0
        ]
        flow = {"title": "专业 → 毕业去向流向", "nodes": nodes, "links": links}
        return outcomes, placement_rate, hq_rate, flow

    async def get_student_dev_quality(
        self,
        *,
        college_id: str | None = None,
        dimension: str = "major",
    ) -> dict[str, Any]:
        college, students, by_sid = await self._ctx(college_id)
        emp_rows = await self._employment_rows(college)
        outcomes, placement_rate, _hq, _flow = self._outcomes_from_employment(emp_rows, by_sid)

        undergrad = len(students)
        hp_tags = await load_college_tags(college, tag_type="high_potential")
        warn_tags = await load_college_tags(college, tag_type="warning")
        if not hp_tags and not warn_tags:
            hp_total, structure, by_dim = self._hp_structure_fallback(students)
            warn_total, warn_breakdown = self._warning_stats_fallback(students)
        else:
            hp_total, structure, by_dim = self._hp_structure_from_tags(students, hp_tags)
            warn_total, warn_breakdown = self._warning_stats_from_tags(students, warn_tags)
        gpa_blocks = self._gpa_by_grade(students)
        avg_gpa = (
            sum(to_float(s.average_credit_gpa) for s in students) / undergrad if undergrad else 0
        )
        growth_score = round(min(max(avg_gpa / 4 * 100, 60), 95), 1) if avg_gpa else 78.6

        # byDimension：按 dimension 切换
        if dimension == "grade":
            grade_c: Counter[str] = Counter()
            for s in students:
                if s.grade:
                    grade_c[f"{s.grade}级"] += 1
            by_dimension = [{"name": k, "count": v} for k, v in sorted(grade_c.items())]
        else:
            by_dimension = by_dim or [
                {"name": s.major_name or "未知", "count": 1}
                for s in students[:5]
                if s.major_name
            ]

        excellent = sum(1 for s in students if to_float(s.average_credit_gpa) >= 3.5)

        return {
            "dimension": dimension if dimension in {"major", "grade", "course"} else "major",
            "enrolledUndergrad": undergrad,
            "enrolledGraduate": _MOCK_GRADUATE,
            "employmentRate": placement_rate,
            "employmentRateByYear": {
                "years": ["2022", "2023", "2024", "2025", "2026"],
                "rates": [74.6, 76.1, 77.8, 78.5, placement_rate or 79.2],
            },
            "outcomesPreview": outcomes,
            "growthValue": {
                "score": growth_score,
                "level": "优秀" if growth_score >= 85 else "良好" if growth_score >= 75 else "一般",
                "trend": _flat_trend_up(2.4),
            },
            "undergradGpaByGrade": gpa_blocks,
            "developmentIndex": growth_score,
            "highPotential": {
                "total": hp_total,
                "ratio": round(hp_total / undergrad * 100, 1) if undergrad else 0,
                "ratioTrend": _flat_trend_up(3.2, "%"),
                "structure": structure,
                "byDimension": by_dimension,
                "courseDistribution": [
                    {"course": "数据结构", "count": max(hp_total // 6, 10)},
                    {"course": "机器学习", "count": max(hp_total // 7, 8)},
                    {"course": "软件工程", "count": max(hp_total // 8, 8)},
                    {"course": "数据库系统", "count": max(hp_total // 9, 6)},
                    {"course": "算法设计", "count": max(hp_total // 10, 6)},
                ],
                "trend": {
                    "months": ["9月", "10月", "11月", "12月", "1月", "2月"],
                    "counts": [
                        max(hp_total - 80, 0),
                        max(hp_total - 60, 0),
                        max(hp_total - 40, 0),
                        max(hp_total - 20, 0),
                        max(hp_total - 10, 0),
                        hp_total,
                    ],
                    "developmentIndices": [
                        round(growth_score - 6, 1),
                        round(growth_score - 4.5, 1),
                        round(growth_score - 3, 1),
                        round(growth_score - 2, 1),
                        round(growth_score - 1, 1),
                        growth_score,
                    ],
                },
            },
            "groups": {
                "excellent": {"count": excellent, "momChange": 0},
                "academicWarning": {"count": warn_total, "momChange": 0},
            },
            "warningBreakdown": warn_breakdown,
            "evaluationIndicators": [
                {
                    "key": "academic",
                    "label": "学业成绩",
                    "score": round(avg_gpa / 4 * 100, 1) if avg_gpa else 88.0,
                    "unit": "分",
                    "trend": _flat_trend_up(2.1, "分"),
                },
                {
                    "key": "courseCompletion",
                    "label": "课程完成情况",
                    "score": round(
                        sum(1 for s in students if to_float(s.failed_total_credits) == 0)
                        / undergrad
                        * 100,
                        1,
                    )
                    if undergrad
                    else 90.0,
                    "unit": "%",
                    "trend": _flat_trend_up(1.4, "%"),
                },
                {
                    "key": "comprehensive",
                    "label": "综合素质表现",
                    "score": 86.4,
                    "unit": "分",
                    "trend": _flat_trend_up(1.8, "分"),
                },
                {
                    "key": "innovation",
                    "label": "创新创业成果",
                    "score": 78.5,
                    "unit": "分",
                    "trend": _flat_trend_up(3.2, "分"),
                },
                {
                    "key": "competition",
                    "label": "学科竞赛情况",
                    "score": round(
                        min(
                            sum(s.competition_award_count or 0 for s in students) / max(undergrad, 1) * 40
                            + 70,
                            95,
                        ),
                        1,
                    ),
                    "unit": "分",
                    "trend": _flat_trend_up(4.6, "分"),
                },
                {
                    "key": "employment",
                    "label": "就业与升学情况",
                    "score": placement_rate or 85.7,
                    "unit": "分",
                    "trend": _flat_trend_up(0.8, "分"),
                },
                {
                    "key": "academicRisk",
                    "label": "学业风险情况",
                    "score": round(100 - warn_total / undergrad * 100, 1) if undergrad else 92.0,
                    "unit": "分",
                    "trend": _flat_trend_up(1.2, "分"),
                },
                {
                    "key": "development",
                    "label": "学生发展",
                    "score": growth_score,
                    "unit": "分",
                    "trend": _flat_trend_up(2.0, "分"),
                },
            ],
            "mockFields": [
                "enrolledGraduate",
                "employmentRateByYear.rates.0",
                "employmentRateByYear.rates.1",
                "employmentRateByYear.rates.2",
                "employmentRateByYear.rates.3",
                "highPotential.structure.research",
                "highPotential.courseDistribution",
                "highPotential.trend",
                "warningBreakdown.psychological",
                "evaluationIndicators.comprehensive",
                "evaluationIndicators.innovation",
            ],
        }

    async def get_student_dev_detail(self, *, college_id: str | None = None) -> dict[str, Any]:
        quality = await self.get_student_dev_quality(college_id=college_id, dimension="major")
        college, students, by_sid = await self._ctx(college_id)
        emp_rows = await self._employment_rows(college)
        outcomes, placement_rate, _hq, _flow = self._outcomes_from_employment(emp_rows, by_sid)

        major_c: Counter[str] = Counter()
        grade_c: Counter[str] = Counter()
        for s in students:
            if s.major_name:
                major_c[s.major_name] += 1
            if s.grade:
                grade_c[f"{s.grade}级"] += 1

        hp_by_major: Counter[str] = Counter()
        hp_by_grade: Counter[str] = Counter()
        hp_by_type: Counter[str] = Counter()
        warn_by_type: Counter[str] = Counter()
        warn_by_major: Counter[str] = Counter()
        warn_by_grade: Counter[str] = Counter()

        hp_tags = await load_college_tags(college, tag_type="high_potential")
        warn_tags = await load_college_tags(college, tag_type="warning")
        hp_index = index_tags_by_student(hp_tags)
        warn_index = index_tags_by_student(warn_tags)

        if hp_index or warn_index:
            for s in students:
                sid = s.student_id
                if sid in hp_index:
                    if s.major_name:
                        hp_by_major[s.major_name] += 1
                    if s.grade:
                        hp_by_grade[f"{s.grade}级"] += 1
                    for t in hp_index[sid]:
                        key = str(t.tag_key or "academic")
                        hp_by_type[_HP_LABELS.get(key, key)] += 1
                if sid in warn_index:
                    if s.major_name:
                        warn_by_major[s.major_name] += 1
                    if s.grade:
                        warn_by_grade[f"{s.grade}级"] += 1
                    for t in warn_index[sid]:
                        key = str(t.tag_key or "academic")
                        warn_by_type[_WARN_LABELS.get(key, key)] += 1
        else:
            for s in students:
                tags = build_high_potential_tags(s)
                if tags:
                    if s.major_name:
                        hp_by_major[s.major_name] += 1
                    if s.grade:
                        hp_by_grade[f"{s.grade}级"] += 1
                    for t in tags:
                        key = str(t.get("dimension") or "academic")
                        hp_by_type[_HP_LABELS.get(key, key)] += 1
                warns = build_academic_warnings(s)
                if warns:
                    if s.major_name:
                        warn_by_major[s.major_name] += 1
                    if s.grade:
                        warn_by_grade[f"{s.grade}级"] += 1
                    for w in warns:
                        key = str(w.get("type") or "academic")
                        warn_by_type[_WARN_LABELS.get(key, key)] += 1

        # 心理关注：无库内名单时示意计入（不写假标签）
        if warn_by_type.get("心理关注", 0) <= 0:
            warn_by_type["心理关注"] = _MOCK_PSYCHOLOGICAL

        gaokao = _gaokao_by_major(students)
        score_stats = _score_stats(students)

        return {
            "summary": {
                "enrolledUndergrad": quality["enrolledUndergrad"],
                "enrolledGraduate": quality["enrolledGraduate"],
                "employmentRate": placement_rate,
                "highPotential": quality["highPotential"]["total"],
                # 预警汇总仅用学业/学分真数；心理关注在 breakdown 中单独示意
                "warning": quality["groups"]["academicWarning"]["count"],
            },
            "outcomes": outcomes,
            "salaryByMajor": {
                "years": ["2024", "2025", "2026"],
                "series": [
                    {"name": "计算机科学与技术", "data": [9.2, 9.8, 10.4]},
                    {"name": "软件工程", "data": [8.8, 9.3, 9.9]},
                    {"name": "人工智能", "data": [9.5, 10.1, 10.8]},
                ],
            },
            "gaokaoScores": gaokao
            or [
                {
                    "major": "暂无录取分",
                    "avgScore": score_stats["avg"] or 0,
                    "minScore": score_stats["min"] or 0,
                    "maxScore": score_stats["max"] or 0,
                }
            ],
            "highPotentialBreakdown": {
                "byMajor": [{"name": k, "count": v} for k, v in hp_by_major.most_common(10)],
                "byGrade": [{"name": k, "count": v} for k, v in sorted(hp_by_grade.items())],
                "byType": [{"name": k, "count": v} for k, v in hp_by_type.most_common()],
            },
            "warningBreakdown": {
                "byType": [{"name": k, "count": v} for k, v in warn_by_type.most_common()],
                "byMajor": [{"name": k, "count": v} for k, v in warn_by_major.most_common(10)],
                "byGrade": [{"name": k, "count": v} for k, v in sorted(warn_by_grade.items())],
            },
            "undergradDistribution": {
                "byMajor": [{"name": k, "count": v} for k, v in major_c.most_common(10)],
                "byGrade": [{"name": k, "count": v} for k, v in sorted(grade_c.items())],
            },
            "mockFields": [
                "summary.enrolledGraduate",
                "salaryByMajor",
                "warningBreakdown.byType.心理关注",
                "highPotential.structure.research",
            ],
        }

    async def get_enrollment_employment_overview(
        self, *, college_id: str | None = None
    ) -> dict[str, Any]:
        college, students, by_sid = await self._ctx(college_id)
        emp_rows = await self._employment_rows(college)
        # 默认看最新毕业届次
        year_trend = _employment_rates_by_year(emp_rows, by_sid)
        latest_year = _primary_employment_year(emp_rows, by_sid)
        scoped = _filter_employment_rows(emp_rows, year=latest_year, by_sid=by_sid) if latest_year else emp_rows
        _outcomes, placement_rate, hq_rate, flow = self._outcomes_from_employment(scoped, by_sid)

        enrolled = len(students) or 0

        return {
            "enrolledCount": enrolled,
            "sourceQualityIndex": _MOCK_SOURCE_QUALITY,
            "placementRate": placement_rate,
            "highQualityEmploymentRate": hq_rate,
            "entranceTrend": _MOCK_ENTRANCE_TREND,
            "exitTrend": {
                "conclusion": (
                    f"高质量毕业去向率=六类并集/本届毕业生总数"
                    + (f"；默认届次 {latest_year}" if latest_year else "")
                    + "（按毕业届次，样本不足年份不入图）"
                ),
                "years": year_trend["years"] or ([latest_year] if latest_year else []),
                "values": year_trend["highQualityRate"]
                or ([hq_rate] if hq_rate else []),
            },
            "flowPreview": flow,
            "mockFields": [
                "sourceQualityIndex",
                "entranceTrend",
            ],
        }

    async def get_enrollment_employment_detail(
        self,
        *,
        college_id: str | None = None,
        year: str | None = None,
        major: str | None = None,
    ) -> dict[str, Any]:
        college, students, by_sid = await self._ctx(college_id)
        all_emp = await self._employment_rows(college)
        year_trend = _employment_rates_by_year(all_emp, by_sid)
        available_years = year_trend["years"] or []
        latest_year = _primary_employment_year(all_emp, by_sid)
        effective_year = year if year and year in available_years else latest_year

        emp_rows = _filter_employment_rows(
            all_emp, year=effective_year, major=major, by_sid=by_sid
        )
        outcomes, placement, hq_rate, flow = self._outcomes_from_employment(emp_rows, by_sid)

        overview = {
            "enrolledCount": len(students),
            "sourceQualityIndex": _MOCK_SOURCE_QUALITY,
            "placementRate": placement,
            "highQualityEmploymentRate": hq_rate,
            "entranceTrend": _MOCK_ENTRANCE_TREND,
            "exitTrend": {
                "conclusion": (
                    f"就业历年高质量就业率（按毕业届次）；当前筛选届次 {effective_year or '全部'}"
                ),
                "years": year_trend["years"],
                "values": year_trend["highQualityRate"],
            },
            "flowPreview": flow,
        }

        major_c: Counter[str] = Counter(s.major_name for s in students if s.major_name)
        # 就业侧专业筛选项：优先就业记录可关联到的专业
        emp_major_c: Counter[str] = Counter()
        for r in all_emp:
            m = _emp_major_name(r, by_sid)
            if m and m != "其他":
                emp_major_c[m] += 1
        majors = ["全部专业"] + [
            k for k, _ in (emp_major_c or major_c).most_common(12)
        ]

        total_stu = sum(major_c.values()) or 1
        major_share = [
            {"major": k, "count": v, "ratio": round(v / total_stu * 100, 1)}
            for k, v in major_c.most_common(10)
        ]

        gender_c: Counter[str] = Counter((s.gender or "未知") for s in students)
        male = gender_c.get("男", 0)
        female = gender_c.get("女", 0)
        gtotal = male + female or 1

        industry_c: Counter[str] = Counter()
        region_c: Counter[str] = Counter()
        job_c: Counter[str] = Counter()
        hq_dest: Counter[str] = Counter()
        major_place: dict[str, list[int]] = defaultdict(lambda: [0, 0, 0])

        for r in emp_rows:
            if r.industry:
                industry_c[r.industry] += 1
            if r.job_title:
                job_c[r.job_title.strip()] += 1
            if r.region:
                region_c[r.region.split("/")[0] if "/" in (r.region or "") else r.region] += 1
            hq_key = _hq_category(r)
            if hq_key:
                hq_dest[hq_key] += 1

            mname = _emp_major_name(r, by_sid)
            major_place[mname][0] += 1
            if _is_placed(r):
                major_place[mname][1] += 1
            if hq_key:
                major_place[mname][2] += 1

        cohort_n = len(emp_rows) or 1
        high_quality_dest = [
            {
                "key": key,
                "label": label,
                "count": hq_dest.get(key, 0),
                "ratio": round(hq_dest.get(key, 0) / cohort_n * 100, 1),
            }
            for key, label in HQ_DEST_DEFS
        ]

        def _ratio_list(counter: Counter[str], top: int = 8) -> list[dict[str, Any]]:
            items = counter.most_common(top)
            n = sum(v for _, v in items) or 1
            return [{"name": k, "count": v, "ratio": round(v / n * 100, 1)} for k, v in items]

        major_compare = []
        min_major_n = max(10, _emp_year_min_count(len(emp_rows)) // 2)
        for mname, (tot, placed_n, hq_n) in sorted(major_place.items(), key=lambda x: -x[1][0]):
            if tot < min_major_n:
                continue
            major_compare.append(
                {
                    "major": mname,
                    "count": tot,
                    "placementRate": round(placed_n / tot * 100, 1) if tot else 0,
                    "highQualityRate": round(hq_n / tot * 100, 1) if tot else 0,
                }
            )
            if len(major_compare) >= 8:
                break

        school_c: Counter[str] = Counter()
        for r in emp_rows:
            if _hq_category(r) == "domestic-grad" and r.unit_name:
                school_c[r.unit_name] += 1
        school_n = sum(school_c.values()) or 1
        grad_schools = [
            {"name": k, "count": v, "ratio": round(v / school_n * 100, 1)}
            for k, v in school_c.most_common(8)
        ]

        salary_dist = _salary_distribution(emp_rows)
        industry_cloud = _cloud_from_counter(industry_c)
        job_cloud = _cloud_from_counter(job_c)
        drill_samples = _build_emp_drill_samples(emp_rows, by_sid)

        score_stats = _score_stats(students)
        max_enroll = max((x.enrollment_year or x.grade or 0) for x in students) if students else 0
        prev_scores = [
            to_float(s.admission_score)
            for s in students
            if to_float(s.admission_score) > 0
            and int(s.enrollment_year or s.grade or 0) < max_enroll
        ]
        prev_avg = round(sum(prev_scores) / len(prev_scores), 1) if prev_scores else None
        prev_min = round(min(prev_scores), 1) if prev_scores else None

        source = _province_structure(students)
        year_enroll = _enrolled_by_year(students)
        trend_years = year_enroll["years"] or []
        trend_enrolled = year_enroll["enrolled"] or []
        n_years = len(trend_years)
        mock_qi = [78.6, 80.2, 82.1, 84.5, _MOCK_SOURCE_QUALITY]
        mock_fc = [61.2, 63.8, 65.4, 66.9, _MOCK_FIRST_CHOICE]
        quality_index = (mock_qi[-n_years:] if n_years <= len(mock_qi) else mock_qi)[:n_years]
        first_choice = (mock_fc[-n_years:] if n_years <= len(mock_fc) else mock_fc)[:n_years]
        while len(quality_index) < n_years:
            quality_index.append(_MOCK_SOURCE_QUALITY)
            first_choice.append(_MOCK_FIRST_CHOICE)

        avg_score = score_stats["avg"]
        min_score = score_stats["min"]
        scored_n = int(score_stats["count"] or 0)

        filter_years = available_years or ([effective_year] if effective_year else [])

        return {
            **overview,
            "filters": {
                "years": filter_years,
                "majors": majors,
                "selectedYear": effective_year,
                "selectedMajor": major if major and major != "全部专业" else "全部专业",
            },
            "admission": {
                "scale": {
                    "enrolledCount": overview["enrolledCount"],
                    "firstChoiceRate": _MOCK_FIRST_CHOICE,
                },
                "quality": {
                    "sourceQualityIndex": _MOCK_SOURCE_QUALITY,
                    "avgScore": avg_score if avg_score is not None else 0,
                    "minScore": min_score if min_score is not None else 0,
                    "avgRank": 28640,
                    "prevAvgScore": prev_avg if prev_avg is not None else (avg_score or 0),
                    "prevMinScore": prev_min if prev_min is not None else (min_score or 0),
                    "prevAvgRank": 31280,
                },
                "majorShare": major_share,
                "sourceStructure": {
                    "provinces": source["provinces"],
                    "inOutProvince": source["inOutProvince"],
                    "gender": {
                        "male": round(male / gtotal * 100, 1),
                        "female": round(female / gtotal * 100, 1),
                    },
                },
                "yearlyTrend": {
                    "years": trend_years,
                    "enrolled": trend_enrolled,
                    "qualityIndex": quality_index,
                    "firstChoiceRate": first_choice,
                },
                "insights": [
                    {
                        "title": "生源地与录取分已接入学籍",
                        "detail": (
                            f"在校本科 {overview['enrolledCount']} 人；"
                            f"有录取分 {scored_n} 人"
                            + (f"，均分 {avg_score}" if avg_score is not None else "")
                            + "；省内外结构来自生源所在地/籍贯。"
                        ),
                        "tone": "good",
                    },
                    {
                        "title": "一志愿率与生源质量指数仍缺官方口径",
                        "detail": "待招生队列表接入后替换示意指数。",
                        "tone": "info",
                    },
                ],
                "actions": [
                    "补齐一志愿/位次等招生官方字段",
                    "按录取年份拆分队列，支撑真正招生趋势（当前规模按入学年）",
                ],
                "drillSamples": {},
            },
            "graduation": {
                "exitQuality": {
                    "placementRate": placement,
                    "highQualityEmploymentRate": hq_rate,
                },
                "highQualityDest": high_quality_dest,
                "gradSchools": grad_schools,
                "distribution": {
                    "industry": _ratio_list(industry_c),
                    "region": _ratio_list(region_c),
                    "salary": salary_dist,
                },
                "industryCloud": industry_cloud,
                "jobCloud": job_cloud,
                "majorCompare": major_compare,
                "yearlyTrend": {
                    "years": year_trend["years"],
                    "placementRate": year_trend["placementRate"],
                    "highQualityRate": year_trend["highQualityRate"],
                    "cohortCounts": year_trend.get("cohortCounts") or [],
                },
                "cohort": {
                    "year": effective_year,
                    "count": len(emp_rows),
                    "outcomes": outcomes,
                },
                "insights": [
                    {
                        "title": "就业分析已接最新毕业生去向表",
                        "detail": (
                            f"当前届次 {effective_year or '全部'} 共 {len(emp_rows)} 条记录；"
                            f"落实率 {placement}%（已落实去向/本届总数，不含待就业）· "
                            f"高质量毕业去向率 {hq_rate}%（六类并集/本届毕业生总数）。"
                            f"历年趋势按毕业届次（年级+学制），样本不足或未来年份不入图。"
                        ),
                        "tone": "good",
                    },
                    {
                        "title": "高质量六类口径",
                        "detail": (
                            "重点单位∪党政机关及事业单位∪高质量国内升学∪高质量出国（境）升学"
                            "∪基层重点项目∪自主创业典型；重点单位暂以国有企业/名企关键词近似，"
                            "正式名单到位后替换。"
                        ),
                        "tone": "info",
                    },
                ],
                "actions": [
                    "维护重点单位与「双一流」升学院校白名单，收紧高质量口径",
                    "补齐无签约年份记录的 signed_at，完善多届对比",
                ],
                "drillSamples": drill_samples,
            },
            "mockFields": [
                "sourceQualityIndex",
                "entranceTrend",
                "admission.scale.firstChoiceRate",
                "admission.quality.sourceQualityIndex",
                "admission.quality.avgRank",
                "admission.quality.prevAvgRank",
                "admission.yearlyTrend.qualityIndex",
                "admission.yearlyTrend.firstChoiceRate",
            ],
        }

    async def build_enrollment_employment_analysis_snapshot(
        self,
        *,
        college_id: str | None = None,
        year: str | None = None,
        major: str | None = None,
    ) -> dict[str, Any]:
        """无 PII 就业分析快照，供 Agent / 缓存报告使用。"""
        college, _students, by_sid = await self._ctx(college_id)
        all_emp = await self._employment_rows(college)
        year_trend = _employment_rates_by_year(all_emp, by_sid)
        available_years = year_trend["years"] or []
        latest_year = _primary_employment_year(all_emp, by_sid)
        effective_year = year if year and year in available_years else latest_year
        major_filter = major if major and major != "全部专业" else None

        emp_rows = _filter_employment_rows(
            all_emp, year=effective_year, major=major_filter, by_sid=by_sid
        )
        outcomes, placement, hq_rate, flow = self._outcomes_from_employment(emp_rows, by_sid)

        pending = sum(1 for r in emp_rows if not _is_placed(r))
        cohort_n = len(emp_rows)
        pending_rate = round(pending / cohort_n * 100, 1) if cohort_n else 0.0

        other_emp = 0
        for link in flow.get("links") or []:
            if link.get("target") in {"其他就业", "待就业"}:
                other_emp += int(link.get("value") or 0)
        # 「其他就业」口径与桑基展示名一致
        other_only = sum(
            int(link.get("value") or 0)
            for link in (flow.get("links") or [])
            if link.get("target") == "其他就业"
        )
        other_emp = other_only or other_emp
        other_rate = round(other_emp / cohort_n * 100, 1) if cohort_n else 0.0

        industry_c: Counter[str] = Counter()
        region_c: Counter[str] = Counter()
        hq_dest: Counter[str] = Counter()
        major_place: dict[str, list[int]] = defaultdict(lambda: [0, 0, 0])
        for r in emp_rows:
            if r.industry:
                industry_c[r.industry] += 1
            if r.region:
                region_c[r.region.split("/")[0] if "/" in (r.region or "") else r.region] += 1
            hq_key = _hq_category(r)
            if hq_key:
                hq_dest[hq_key] += 1
            mname = _emp_major_name(r, by_sid)
            major_place[mname][0] += 1
            if _is_placed(r):
                major_place[mname][1] += 1
            if hq_key:
                major_place[mname][2] += 1

        def _ratio_list(counter: Counter[str], top: int = 5) -> list[dict[str, Any]]:
            items = counter.most_common(top)
            n = sum(v for _, v in items) or 1
            return [{"name": k, "count": v, "ratio": round(v / n * 100, 1)} for k, v in items]

        major_compare = []
        min_major_n = max(10, _emp_year_min_count(len(emp_rows)) // 2)
        for mname, (tot, placed_n, hq_n) in sorted(major_place.items(), key=lambda x: -x[1][0]):
            if tot < min_major_n:
                continue
            major_compare.append(
                {
                    "major": mname,
                    "count": tot,
                    "placementRate": round(placed_n / tot * 100, 1) if tot else 0,
                    "highQualityRate": round(hq_n / tot * 100, 1) if tot else 0,
                }
            )
            if len(major_compare) >= 8:
                break

        high_quality_dest = [
            {
                "key": key,
                "label": label,
                "count": hq_dest.get(key, 0),
                "ratio": round(hq_dest.get(key, 0) / max(cohort_n, 1) * 100, 1),
            }
            for key, label in HQ_DEST_DEFS
        ]

        max_updated = ""
        for r in emp_rows:
            ts = getattr(r, "updated_at", None)
            if ts is None:
                continue
            s = ts.isoformat() if hasattr(ts, "isoformat") else str(ts)
            if s > max_updated:
                max_updated = s
        fingerprint = f"{cohort_n}|{max_updated}|{effective_year or ''}|{major_filter or ''}"

        return {
            "year": effective_year,
            "cohortCount": cohort_n,
            "placementRate": placement,
            "highQualityEmploymentRate": hq_rate,
            "pendingCount": pending,
            "pendingRate": pending_rate,
            "otherEmploymentCount": other_emp,
            "otherEmploymentRate": other_rate,
            "outcomes": outcomes,
            "highQualityDest": high_quality_dest,
            "majorCompare": major_compare,
            "industryTop": _ratio_list(industry_c),
            "regionTop": _ratio_list(region_c),
            "yearlyTrend": {
                "years": year_trend.get("years") or [],
                "placementRate": year_trend.get("placementRate") or [],
                "highQualityRate": year_trend.get("highQualityRate") or [],
                "cohortCounts": year_trend.get("cohortCounts") or [],
            },
            "flowPreview": {
                "title": flow.get("title"),
                "linkCount": len(flow.get("links") or []),
                "topLinks": (flow.get("links") or [])[:8],
            },
            "dataFingerprint": fingerprint,
            "filters": {
                "year": effective_year,
                "major": major_filter,
            },
        }

    async def get_enrollment_employment_analysis_report(
        self,
        *,
        college_id: str | None = None,
        year: str | None = None,
        major: str | None = None,
    ) -> dict[str, Any]:
        """读取 OpenViking 缓存报告，并对比当前 fingerprint 是否 stale。"""
        from Utils.Agent.OpenViking import get_openviking_client
        from Utils.Agent.OpenViking.paths import resource_enrollment_employment_report

        snapshot = await self.build_enrollment_employment_analysis_snapshot(
            college_id=college_id, year=year, major=major
        )
        current_fp = str(snapshot.get("dataFingerprint") or "")
        viking = get_openviking_client()
        cid = college_id or "default"
        raw = await viking.read(resource_enrollment_employment_report(cid))
        report: dict[str, Any] | None = None
        if raw:
            try:
                import json

                parsed = json.loads(raw) if isinstance(raw, str) else raw
                if isinstance(parsed, dict) and parsed.get("insights"):
                    report = parsed
            except Exception:
                report = None

        stale = False
        if report:
            stale = str(report.get("dataFingerprint") or "") != current_fp
        return {
            "report": report,
            "stale": stale,
            "dataFingerprint": current_fp,
            "filters": snapshot.get("filters") or {},
        }

    async def get_student_flow_sankey(self, *, college_id: str | None = None) -> dict[str, Any]:
        college, students, by_sid = await self._ctx(college_id)
        emp_all = await self._employment_rows(college)
        year_trend = _employment_rates_by_year(emp_all, by_sid)
        latest_year = _primary_employment_year(emp_all, by_sid)
        emp_rows = (
            _filter_employment_rows(emp_all, year=latest_year, by_sid=by_sid)
            if latest_year
            else emp_all
        )
        outcomes, placement_rate, _hq, flow = self._outcomes_from_employment(emp_rows, by_sid)

        undergrad = len(students) or 1
        entrance = _entrance_sankey(students)
        score_stats = _score_stats(students)

        further = next((o["count"] for o in outcomes if o["key"] == "furtherStudy"), 0)
        further_rate = round(further / max(len(emp_rows), 1) * 100, 1) if emp_rows else 18.6

        # 出口桑基：用真实就业流向，节点名适配前端文案
        outcome_nodes = []
        outcome_links = []
        seen: set[str] = set()
        for link in flow.get("links") or []:
            src = link["source"]
            tgt = _SANKY_DEST_DISPLAY.get(link["target"], link["target"])
            for n in (src, tgt):
                if n not in seen:
                    seen.add(n)
                    outcome_nodes.append({"name": n})
            outcome_links.append(
                {
                    "source": src,
                    "target": tgt,
                    "value": link["value"],
                    "drillKey": f"{src}\u2192{tgt}",
                }
            )

        drill_samples = _build_emp_drill_samples(emp_rows, by_sid)
        # 只下发桑基连线样本，减小载荷
        sankey_drills = {
            k: v for k, v in drill_samples.items() if "→" in k
        }

        avg_score = score_stats["avg"]

        return {
            "entrance": {"nodes": entrance["nodes"], "links": entrance["links"]},
            "outcome": {
                "nodes": outcome_nodes,
                "links": outcome_links,
            },
            "outcomeDrillSamples": sankey_drills,
            "summary": {
                "entranceTotal": undergrad,
                "graduateTotal": len(emp_rows) or undergrad,
                "avgEntranceScore": avg_score if avg_score is not None else 0,
                "employmentRate": placement_rate,
                "firstChoiceRate": _MOCK_FIRST_CHOICE,
                "furtherRate": further_rate,
                "topEntranceRegions": entrance["topEntranceRegions"],
                "topOutcomes": [
                    {"name": o["label"], "count": o["count"]} for o in outcomes if o["count"] > 0
                ],
            },
            "mockFields": [
                "summary.firstChoiceRate",
            ],
        }

    async def get_student_evaluation_detail(
        self,
        *,
        key: str,
        college_id: str | None = None,
    ) -> dict[str, Any]:
        quality = await self.get_student_dev_quality(college_id=college_id, dimension="major")
        ind = next((i for i in quality["evaluationIndicators"] if i["key"] == key), None)
        label = (ind or {}).get("label") or key
        score = float((ind or {}).get("score") or 80)
        unit = (ind or {}).get("unit") or "分"
        mock_keys = {
            "comprehensive",
            "innovation",
            "development",
        }
        return {
            "key": key,
            "label": label,
            "score": score,
            "unit": unit,
            "description": f"{label}综合评估（部分指标为示意口径）。",
            "trend": {
                "months": ["9月", "10月", "11月", "12月", "1月", "2月"],
                "values": [
                    round(score - 5, 1),
                    round(score - 4, 1),
                    round(score - 3, 1),
                    round(score - 2, 1),
                    round(score - 1, 1),
                    score,
                ],
            },
            "highlights": [
                {"label": "当前得分", "value": f"{score}{unit}"},
                {"label": "环比", "value": "+1.2"},
                {"label": "口径", "value": "示意" if key in mock_keys else "学籍/就业聚合"},
            ],
            "mockFields": ["trend", "highlights"] if key in mock_keys else ["trend"],
        }


talent_overview_service = TalentOverviewService()
