"""精品成果集萃：从成果事实表 + 科研/竞赛/师资聚合一级 / 详情 / 专题接口。"""

from __future__ import annotations

import re
from collections import Counter, defaultdict
from types import SimpleNamespace
from typing import Any

from Utils.DB.Models.college_ext_models import AchievementItem, ResearchPlatform, Teacher
from Utils.DB.Models.external_data_models import ResearchIp, ResearchPaper, ResearchProject
from Utils.DB.Models.student_extra_models import CompetitionAward
from Utils.DB.read.college_db import resolve_college

# section → 一级页六大类
_SECTION_CATEGORY: dict[str, tuple[str, str]] = {
    "topic": ("research", "科研项目"),
    "output": ("research", "专利成果"),
    "paper": ("research", "高水平论文"),
    "award": ("teaching", "教学成果"),
    "talent": ("faculty", "师资成果"),
    "platform": ("platform", "平台成果"),
    "competition": ("competition", "学生竞赛"),
    "collective": ("teaching", "集体荣誉"),
    "service": ("social", "社会服务"),
}

_CATEGORY_ORDER: list[tuple[str, str]] = [
    ("teaching", "教学成果"),
    ("research", "科研成果"),
    ("competition", "学生竞赛"),
    ("platform", "平台成果"),
    ("faculty", "师资成果"),
    ("social", "社会服务"),
]

_FEATURED_META: list[dict[str, str]] = [
    {
        "key": "topic",
        "name": "攻坚·课题",
        "origin": "源自「攻坚课题」板块",
        "desc": "国家级 / 省部级在研科研项目，突出牵头单位与经费规模。",
        "icon": "🛰️",
    },
    {
        "key": "output",
        "name": "科研产出",
        "origin": "源自「科研成果」板块",
        "desc": "横向到账经费、发明专利与软著等科研产出。",
        "icon": "💡",
    },
    {
        "key": "paper",
        "name": "顶刊·智识",
        "origin": "源自「期刊智识」板块",
        "desc": "CNS / SCI 一区 / 中文权威期刊论文总数与代表性期刊。",
        "icon": "📜",
    },
    {
        "key": "award",
        "name": "科教硕果",
        "origin": "源自「教学成果」板块",
        "desc": "省级以上科技进步奖、教学成果奖（重点突出特等 / 一等奖）。",
        "icon": "🏆",
    },
    {
        "key": "talent",
        "name": "名师·头雁",
        "origin": "源自「名师头雁」板块",
        "desc": "国家级 / 省级人才、教学名师、海外高层次人才。",
        "icon": "👑",
    },
    {
        "key": "platform",
        "name": "平台·基石",
        "origin": "源自「平台成果」板块",
        "desc": "省级以上重点实验室 / 工程中心 / 人文社科基地。",
        "icon": "🏛️",
    },
    {
        "key": "competition",
        "name": "竞攀·巅峰",
        "origin": "源自「竞攀巅峰」板块",
        "desc": "挑战杯、互联网+、大创年会等 A 类赛事国家级奖项。",
        "icon": "🚩",
    },
    {
        "key": "collective",
        "name": "集体·荣光",
        "origin": "源自「集体荣誉」板块",
        "desc": "省级以上先进班集体、五四红旗团委等组织类荣誉。",
        "icon": "🌟",
    },
    {
        "key": "service",
        "name": "智援·社会",
        "origin": "源自「社会服务」板块",
        "desc": "智库报告采纳、横向服务到账经费与社会服务项目。",
        "icon": "🤝",
    },
]

_MAJOR_CONTEST_KEYS = ("挑战杯", "互联网+", "互联网＋", "大创", "创青春", "计算机设计")
_TOP_JOURNALS = (
    "管理世界",
    "中国科学",
    "Nature",
    "Science",
    "Cell",
    "IEEE",
    "ACM",
    "经济研究",
    "中国社会科学",
)


def _s(value: Any) -> str:
    return str(value or "").strip()


# Excel 表头 / 列名误入库时的脏值
_HEADER_NOISE = frozenset(
    {
        "平台名称",
        "批准部门",
        "批准时间",
        "负责人",
        "类型",
        "动态评估通过时间",
        "项目名称",
        "项目编号",
        "项目级别",
        "项目类别",
        "立项日期",
        "论文名称",
        "刊物名称",
        "专利名称",
        "专利号",
        "第一发明人",
        "会议名称",
        "姓名",
        "工号",
        "职称",
        "备注",
        "序号",
    }
)


def _is_header_noise(value: Any) -> bool:
    text = _s(value)
    if not text:
        return True
    if text in _HEADER_NOISE:
        return True
    # 「平台名称（全称）」这类变体
    if text.endswith("名称") and len(text) <= 8:
        return True
    return False


def _year_label(raw: str | None) -> str | None:
    text = _s(raw)
    if not text or _is_header_noise(text):
        return None
    m = re.search(r"(20\d{2})", text)
    # 只返回真实年份，避免把「批准部门」「校级特等奖」截断当年份展示
    return m.group(1) if m else None


def _milestone_side_label(row: dict[str, Any]) -> str | None:
    """里程碑右侧短标：优先年份，其次级别/奖项，过滤表头脏值。"""
    year = _year_label(row.get("occurred_on"))
    if year:
        return year
    for key in ("level", "category", "note"):
        text = _s(row.get(key))
        if not text or _is_header_noise(text):
            continue
        if any(k in text for k in ("奖", "级", "重点", "基地", "实验室", "中心", "平台")):
            return text[:16]
    return None


def _normalize_level(raw: str | None) -> str:
    text = _s(raw)
    if not text:
        return "其他"
    if any(k in text for k in ("国家", "国级", "国自然", "国赛", "全国", "CN", "SCI", "SSCI", "EI", "CSSCI")):
        if any(k in text for k in ("省", "部", "厅")) and "国家" not in text and "全国" not in text:
            return "省部级"
        return "国家级"
    if any(k in text for k in ("省", "部", "厅", "市")):
        return "省部级"
    if "校" in text:
        return "校级"
    return "其他"


def _level_rank(raw: str | None) -> int:
    bucket = _normalize_level(raw)
    return {"国家级": 4, "省部级": 3, "校级": 2, "其他": 1}.get(bucket, 0)


def _parse_funding_wan(raw: str | None) -> float:
    text = _s(raw).replace(",", "").replace("，", "")
    if not text:
        return 0.0
    m = re.search(r"(\d+(?:\.\d+)?)", text)
    if not m:
        return 0.0
    val = float(m.group(1))
    if "万" in text:
        return val
    if "亿" in text:
        return val * 10000
    # 纯数字默认按万元；过大则按元折算
    if val >= 100000:
        return round(val / 10000, 2)
    return val


def _is_first_tier_paper(level: str | None, venue: str | None = None) -> bool:
    blob = f"{_s(level)} {_s(venue)}"
    return any(k in blob for k in ("一区", "Q1", "Top", "TOP", "CNS", "Nature", "Science", "Cell"))


def _is_cns(level: str | None, venue: str | None = None) -> bool:
    blob = f"{_s(level)} {_s(venue)}"
    return any(k in blob for k in ("CNS", "Nature", "Science", "Cell"))


def _is_chinese_authority(level: str | None, venue: str | None = None) -> bool:
    blob = f"{_s(level)} {_s(venue)}"
    return any(k in blob for k in ("权威", "CSSCI", "管理世界", "中国科学", "经济研究", "中国社会科学"))


def _is_major_contest(name: str | None) -> bool:
    text = _s(name)
    return any(k in text for k in _MAJOR_CONTEST_KEYS)


def _is_national_award(level: str | None) -> bool:
    return _normalize_level(level) == "国家级" or any(k in _s(level) for k in ("国家", "全国", "国赛"))


def _is_gold_or_special(rank: str | None) -> bool:
    text = _s(rank)
    return any(k in text for k in ("特等", "金奖", "一等", "冠军", "金牌"))


def _badge_for(item: dict[str, Any]) -> str:
    section = item.get("section")
    cat = _s(item.get("category"))
    if section == "competition":
        return "历史突破"
    if section == "topic":
        return "科研攻坚"
    if section == "paper":
        return "顶刊智识"
    if section == "output":
        return "科研产出"
    if section == "platform":
        return "平台跃升"
    if section in ("award", "collective") or "教学" in cat:
        return "育人高光"
    if section == "talent":
        return "人才荣誉"
    if section == "service":
        return "社会服务"
    return "年度里程碑"


_MILESTONE_SECTIONS = (
    "competition",
    "topic",
    "paper",
    "platform",
    "award",
    "collective",
    "talent",
    "service",
    "output",
)
_MILESTONE_BADGE_ORDER = (
    "历史突破",
    "科研攻坚",
    "顶刊智识",
    "平台跃升",
    "育人高光",
    "人才荣誉",
    "社会服务",
    "科研产出",
    "年度里程碑",
)
_MILESTONES_PER_BADGE = 3


# 赛事阶段词：同系列省赛/国赛等应归并，避免占满里程碑名额
_STAGE_RE = re.compile(r"(国赛|省赛|世赛|决赛|初赛|复赛|区域赛)")
_SESSION_RE = re.compile(r"第[一二三四五六七八九十百零〇两\d]+届")
_CATEGORY_MARK_RE = re.compile(r"[（(]类别[IVXivx\d]+[）)]")
_STAGE_ORDER = {"国赛": 0, "世赛": 1, "决赛": 2, "省赛": 3, "区域赛": 4, "复赛": 5, "初赛": 6}


def _series_key(title: str | None) -> str:
    """归一化成果标题，使同方向（如蓝桥杯省赛/国赛）共享同一系列键。"""
    text = _s(title)
    if not text:
        return ""
    text = _SESSION_RE.sub("", text)
    text = _STAGE_RE.sub("", text)
    text = _CATEGORY_MARK_RE.sub("", text)
    text = re.sub(r"[\s\-_/、，,·.：:（）()【】\[\]]+", "", text)
    return text.casefold()


def _stages_in(title: str | None) -> list[str]:
    found: list[str] = []
    for stage in _STAGE_RE.findall(_s(title)):
        if stage not in found:
            found.append(stage)
    return found


def _merge_series_title(titles: list[str]) -> str:
    """同系列多条成果合并为一条可读标题（突出省赛+国赛等阶段）。"""
    cleaned = [t for t in (_s(x) for x in titles) if t]
    if not cleaned:
        return ""
    if len(cleaned) == 1:
        return cleaned[0]

    primary = next((t for t in cleaned if "国赛" in t or "全国" in t), cleaned[0])
    stages: list[str] = []
    for t in cleaned:
        for stage in _stages_in(t):
            if stage not in stages:
                stages.append(stage)
    stages.sort(key=lambda s: _STAGE_ORDER.get(s, 99))

    if len(stages) >= 2:
        base = _STAGE_RE.sub("", primary)
        base = re.sub(r"\s{2,}", " ", base).strip()
        base = re.sub(r"赛\s*", "赛", base, count=1)
        m = re.search(r"赛", base)
        if m:
            i = m.end()
            return f"{base[:i]}（{'+'.join(stages)}）{base[i:]}".strip()
        return f"{base}（{'+'.join(stages)}）"

    if len(cleaned) > 1:
        return f"{primary} 等 {len(cleaned)} 项"
    return primary


def _interpretation(item: dict[str, Any]) -> str:
    section = item.get("section")
    level = _normalize_level(item.get("level"))
    if section == "award":
        return f"{level}教学 / 科研成果奖，标志育人与科研质量新高度"
    if section == "competition":
        return "学生顶级赛事再创佳绩"
    if section == "platform":
        return "科研平台与产学研协同能力跃升"
    if section == "paper":
        return "高水平论文产出体现学科竞争力"
    if section == "topic":
        return "高层次课题立项支撑学科攻坚"
    if section == "talent":
        return "高层次人才队伍建设取得新进展"
    if section == "service":
        return "智库与社会服务成果获认可"
    return "学院标志性成果"


def _category_of(section: str, category: str | None = None) -> tuple[str, str]:
    if section in _SECTION_CATEGORY:
        return _SECTION_CATEGORY[section]
    cat = _s(category)
    if "竞赛" in cat:
        return "competition", "学生竞赛"
    if "教学" in cat or "奖" in cat:
        return "teaching", "教学成果"
    if "平台" in cat:
        return "platform", "平台成果"
    return "research", "科研成果"


class BenchmarkService:
    async def get_achievements(self, *, college_id: str | None = None) -> dict[str, Any]:
        ctx = await self._load_context(college_id)
        return self._build_overview(ctx)

    async def get_achievements_detail(
        self,
        *,
        college_id: str | None = None,
        department: str | None = None,
        major: str | None = None,
    ) -> dict[str, Any]:
        ctx = await self._load_context(college_id)
        base = self._build_overview(ctx)
        achievements = self._roster(ctx)
        achievements = self._filter_items(achievements, department=department, major=major)
        by_dept = Counter(_s(i.get("department")) for i in achievements if _s(i.get("department")))
        return {
            **base,
            "byCategory": self._by_category_from_items(achievements),
            "byLevel": self._level_distribution(achievements),
            "byDepartment": [
                {"department": k, "count": v}
                for k, v in sorted(by_dept.items(), key=lambda x: (-x[1], x[0]))
            ],
            "filters": {
                "departments": sorted({_s(i.get("department")) for i in self._roster(ctx) if _s(i.get("department"))}),
                "majors": sorted({_s(i.get("majorName")) for i in self._roster(ctx) if _s(i.get("majorName"))}),
                "selectedDepartment": department,
                "selectedMajor": major,
            },
            "achievements": achievements,
            "categoryPanels": self._build_category_panels(ctx),
        }

    def _filter_items(
        self,
        items: list[dict[str, Any]],
        *,
        department: str | None,
        major: str | None,
    ) -> list[dict[str, Any]]:
        out = items
        dept = _s(department)
        maj = _s(major)
        if dept:
            out = [i for i in out if _s(i.get("department")) == dept]
        if maj:
            out = [i for i in out if _s(i.get("majorName")) == maj]
        return out


    async def get_featured(self, *, college_id: str | None = None) -> dict[str, Any]:
        ctx = await self._load_context(college_id)
        overview = self._build_overview(ctx)
        summary = overview["summary"]
        return {
            "overview": [
                {"label": "荣誉奖项", "value": summary["annualHonors"], "unit": "项", "tone": "highlight"},
                {"label": "学生竞赛", "value": summary["competitionAwards"], "unit": "项"},
                {"label": "论文著作", "value": overview["topPapers"]["count"], "unit": "篇"},
                {
                    "label": "科研项目",
                    "value": overview["keyProjects"]["national"] + overview["keyProjects"]["provincial"],
                    "unit": "项",
                    "tone": "gold",
                },
                {"label": "平台成果", "value": summary["platformOutputs"], "unit": "项"},
                {"label": "师资成果", "value": summary["facultyAchievements"], "unit": "项", "tone": "green"},
            ],
            "categoryDistribution": [
                {"label": c["label"], "count": c["count"]} for c in overview["byCategory"]
            ],
            "levelDistribution": [
                {"label": x["level"], "count": x["count"]}
                for x in self._level_distribution(self._roster(ctx))
            ],
            "sections": self._build_featured_sections(ctx, overview),
        }

    async def _load_context(self, college_id: str | None) -> dict[str, Any]:
        college = await resolve_college(college_id)
        cid = college.id if college else None

        ach_qs = AchievementItem.all()
        proj_qs = ResearchProject.all()
        paper_qs = ResearchPaper.all()
        ip_qs = ResearchIp.all()
        plat_qs = ResearchPlatform.all()
        teacher_qs = Teacher.all()
        award_qs = CompetitionAward.all()
        if cid:
            ach_qs = ach_qs.filter(college_id=cid)
            proj_qs = proj_qs.filter(college_id=cid)
            paper_qs = paper_qs.filter(college_id=cid)
            ip_qs = ip_qs.filter(college_id=cid)
            plat_qs = plat_qs.filter(college_id=cid)
            teacher_qs = teacher_qs.filter(college_id=cid)
            award_qs = award_qs.filter(college_id=cid)

        achievements = list(await ach_qs.order_by("-id"))
        projects = list(await proj_qs)
        papers = list(await paper_qs)
        ips = list(await ip_qs)
        platforms = list(await plat_qs)
        teachers = list(await teacher_qs)
        awards = list(await award_qs)

        synth_competition = self._competition_as_achievements(awards)

        by_section: dict[str, list[Any]] = defaultdict(list)
        for a in achievements:
            by_section[_s(a.section) or "other"].append(a)

        return {
            "college": college,
            "achievements": achievements,
            "by_section": by_section,
            "projects": projects,
            "papers": papers,
            "ips": ips,
            "platforms": platforms,
            "teachers": teachers,
            "awards": awards,
            "synth_competition": synth_competition,
        }

    def _competition_as_achievements(self, awards: list[CompetitionAward]) -> list[dict[str, Any]]:
        # 按赛事去重（主获奖人优先）
        seen: set[str] = set()
        items: list[dict[str, Any]] = []
        for a in awards:
            if _s(a.member_role) == "teammate":
                continue
            key = "|".join(
                [
                    _s(a.contest_name),
                    _s(a.awarded_on),
                    _s(a.award_rank),
                    _s(a.primary_student_id or a.student_id),
                ]
            )
            if key in seen:
                continue
            seen.add(key)
            items.append(
                {
                    "id": f"c{a.id}",
                    "section": "competition",
                    "name": _s(a.contest_name),
                    "category": _s(a.contest_category) or "学生竞赛",
                    "level": _s(a.award_level) or "其他",
                    "org": _s(a.organizer) or None,
                    "leader": _s(a.advisor) or _s(a.name) or None,
                    "occurred_on": _s(a.awarded_on) or None,
                    "note": _s(a.award_rank) or None,
                    "department": _s(getattr(a, "department", None)) or None,
                    "major_name": _s(a.major_name) or None,
                }
            )
        return items

    def _iter_section_rows(self, ctx: dict[str, Any], section: str) -> list[dict[str, Any]]:
        rows: list[dict[str, Any]] = []
        for a in ctx["by_section"].get(section, []):
            name = _s(a.name)
            if _is_header_noise(name):
                continue
            rows.append(
                {
                    "id": f"a{a.id}",
                    "section": section,
                    "name": name,
                    "category": _s(a.category) or None,
                    "level": _s(a.level) or None,
                    "org": _s(a.org) or None,
                    "leader": _s(a.leader) or None,
                    "occurred_on": _s(a.occurred_on) or None,
                    "note": _s(a.note) or None,
                    "department": _s(getattr(a, "department", None)) or None,
                    "major_name": _s(getattr(a, "major_name", None)) or None,
                }
            )
        if section == "competition" and not rows:
            rows = [
                r
                for r in (ctx.get("synth_competition") or [])
                if not _is_header_noise(r.get("name"))
            ]
        return rows

    def _build_overview(self, ctx: dict[str, Any]) -> dict[str, Any]:
        key_projects = self._key_projects(ctx)
        top_papers = self._top_papers(ctx)
        competitions = self._competitions(ctx)
        faculty = self._faculty_leaders(ctx)
        gallery = self._build_gallery(ctx, key_projects, top_papers, competitions, faculty)
        milestones = self._build_milestones(ctx)
        roster = self._roster(ctx)
        by_category = self._by_category_from_items(roster)
        summary = self._summary(ctx, by_category, competitions, roster)

        return {
            "subtitle": "科研引领 · 育人为本 · 服务社会",
            "milestones": milestones,
            "facultyLeaders": faculty,
            "keyProjects": key_projects,
            "topPapers": top_papers,
            "competitions": competitions,
            "gallery": gallery,
            "summary": summary,
            "highlights": gallery[:8],
            "byCategory": by_category,
        }

    def _key_projects(self, ctx: dict[str, Any]) -> dict[str, Any]:
        vertical = [p for p in ctx["projects"] if _s(p.kind) == "vertical"]
        national = sum(1 for p in vertical if _normalize_level(p.level) == "国家级")
        provincial = sum(1 for p in vertical if _normalize_level(p.level) == "省部级")
        # 若级别字段缺失，回退 achievement topic
        if national + provincial == 0:
            topics = self._iter_section_rows(ctx, "topic")
            national = sum(1 for t in topics if _normalize_level(t.get("level")) == "国家级")
            provincial = sum(1 for t in topics if _normalize_level(t.get("level")) == "省部级")
            funding = 0.0
        else:
            funding = sum(_parse_funding_wan(p.funding) for p in vertical)
        if funding <= 0:
            funding = sum(_parse_funding_wan(getattr(p, "funding", None)) for p in ctx["projects"])
        return {
            "national": national,
            "provincial": provincial,
            "fundingWan": round(funding, 2),
        }

    def _top_papers(self, ctx: dict[str, Any]) -> dict[str, Any]:
        papers = ctx["papers"]
        count = len(papers) or len(self._iter_section_rows(ctx, "paper"))
        first_tier = sum(1 for p in papers if _is_first_tier_paper(p.level, p.venue))
        if first_tier == 0:
            first_tier = sum(
                1
                for p in self._iter_section_rows(ctx, "paper")
                if _is_first_tier_paper(p.get("level"), p.get("org"))
            )
        venue_counter: Counter[str] = Counter()
        for p in papers:
            v = _s(p.venue)
            if v:
                venue_counter[v] += 1
        journals: list[str] = []
        for name in _TOP_JOURNALS:
            if any(name.lower() in v.lower() for v in venue_counter):
                journals.append(name)
        if len(journals) < 2:
            for v, _ in venue_counter.most_common(6):
                short = v if len(v) <= 16 else v[:16]
                if short not in journals:
                    journals.append(short)
                if len(journals) >= 4:
                    break
        return {
            "count": count,
            "citations": 0,
            "firstTierCount": first_tier,
            "journals": journals[:4],
        }

    def _competitions(self, ctx: dict[str, Any]) -> dict[str, Any]:
        awards = ctx["awards"]
        if awards:
            # 去重主记录
            primary = [a for a in awards if _s(a.member_role) != "teammate"]
            major = [a for a in primary if _is_major_contest(a.contest_name)]
            pool = major or primary
            national = sum(1 for a in pool if _is_national_award(a.award_level))
            gold = sum(
                1
                for a in pool
                if _is_national_award(a.award_level) and _is_gold_or_special(a.award_rank)
            )
            return {"nationalAwards": national, "goldOrSpecial": gold}

        rows = self._iter_section_rows(ctx, "competition")
        national = sum(1 for r in rows if _is_national_award(r.get("level")))
        gold = sum(
            1
            for r in rows
            if _is_national_award(r.get("level")) and _is_gold_or_special(r.get("note"))
        )
        return {"nationalAwards": national, "goldOrSpecial": gold}

    def _faculty_leaders(self, ctx: dict[str, Any]) -> dict[str, Any]:
        teachers = ctx["teachers"]
        talent_rows = self._iter_section_rows(ctx, "talent")

        doctoral = [
            t
            for t in teachers
            if any(k in f"{_s(t.title)} {_s(t.degree)} {_s(t.source)}" for k in ("博导", "博士生导师"))
        ]
        esi = [
            t
            for t in teachers
            if any(k in f"{_s(t.title)} {_s(t.source)}" for k in ("ESI", "高被引"))
        ]
        # talent 成果补充
        for row in talent_rows:
            blob = f"{_s(row.get('name'))} {_s(row.get('category'))} {_s(row.get('note'))}"
            if "ESI" in blob or "高被引" in blob:
                esi_name = _s(row.get("leader")) or _s(row.get("name"))
                if esi_name and not any(_s(getattr(t, "name", "")) == esi_name for t in esi):
                    esi.append(
                        SimpleNamespace(
                            name=esi_name,
                            title=_s(row.get("category")) or "ESI 高被引学者",
                        )
                    )
            if "博导" in blob or "博士生导师" in blob:
                name = _s(row.get("leader")) or _s(row.get("name"))
                if name and not any(_s(getattr(t, "name", "")) == name for t in doctoral):
                    doctoral.append(SimpleNamespace(name=name, title="博士生导师"))

        national = sum(
            1
            for r in talent_rows
            if _normalize_level(r.get("level")) == "国家级"
            or any(k in _s(r.get("category")) for k in ("国家", "长江", "杰青", "优青", "万人"))
        )
        provincial = sum(
            1
            for r in talent_rows
            if _normalize_level(r.get("level")) == "省部级"
            or any(k in _s(r.get("category")) for k in ("省", "珠江", "百千万"))
        )

        # 名录只收录高层次人才 / 博导 / 高被引，不用普通专任教师凑数
        roster: list[dict[str, str]] = []
        seen: set[str] = set()
        for t in esi:
            name = _s(getattr(t, "name", ""))
            if name and name not in seen:
                roster.append({"name": name, "honor": "ESI 高被引学者"})
                seen.add(name)
        for t in doctoral:
            name = _s(getattr(t, "name", ""))
            if name and name not in seen:
                roster.append({"name": name, "honor": _s(getattr(t, "title", None)) or "博士生导师"})
                seen.add(name)
        for r in talent_rows:
            name = _s(r.get("leader")) or _s(r.get("name"))
            honor = _s(r.get("category")) or _s(r.get("level")) or "高层次人才"
            # 跳过把成果标题误当成姓名的条目
            if not name or name in seen:
                continue
            if len(name) > 20 or any(k in name for k in ("项目", "课题", "论文", "平台", "奖")):
                continue
            roster.append({"name": name, "honor": honor})
            seen.add(name)

        doctoral_n = len(doctoral)
        esi_n = len(esi)
        # 总人数 = 名录去重人数；若名录空则退回国/省人才计数之和
        total = len(roster) if roster else (national + provincial)
        return {
            "total": total,
            "national": national,
            "provincial": provincial,
            "doctoralSupervisors": doctoral_n,
            "esiHighCited": esi_n,
            "roster": roster[:20],
        }

    def _by_category_from_items(self, items: list[dict[str, Any]]) -> list[dict[str, Any]]:
        counts: Counter[str] = Counter(_s(i.get("category")) for i in items)
        return [
            {"category": key, "label": label, "count": counts.get(key, 0)}
            for key, label in _CATEGORY_ORDER
        ]

    def _summary(
        self,
        ctx: dict[str, Any],
        by_category: list[dict[str, Any]],
        competitions: dict[str, Any],
        roster: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        cat_map = {c["category"]: c["count"] for c in by_category}
        items = roster if roster is not None else self._roster(ctx)
        national_provincial = sum(
            1 for i in items if _normalize_level(i.get("level")) in ("国家级", "省部级")
        )
        return {
            "annualHonors": cat_map.get("teaching", 0),
            "competitionAwards": cat_map.get("competition", 0) or competitions.get("nationalAwards", 0),
            "researchOutputs": cat_map.get("research", 0),
            "nationalProvincial": national_provincial,
            "platformOutputs": cat_map.get("platform", 0),
            "facultyAchievements": cat_map.get("faculty", 0),
        }

    def _dto_item(self, row: dict[str, Any]) -> dict[str, Any]:
        cat, label = _category_of(_s(row.get("section")), row.get("category"))
        # 细分标签
        section = _s(row.get("section"))
        if section == "paper":
            label = "高水平论文"
        elif section == "output":
            label = "专利"
        elif section == "topic":
            label = "科研项目"
        elif section == "collective":
            label = "集体荣誉"
        return {
            "id": _s(row.get("id")),
            "title": _s(row.get("name")),
            "category": cat,
            "categoryLabel": label,
            "level": _s(row.get("level")) or _normalize_level(row.get("level")),
            "date": (_year_label(row.get("occurred_on")) or "")[:10],
            "leader": _s(row.get("leader")) or None,
            "department": _s(row.get("department")) or None,
            "majorName": _s(row.get("major_name") or row.get("majorName")) or None,
        }

    def _build_gallery(
        self,
        ctx: dict[str, Any],
        key_projects: dict[str, Any],
        top_papers: dict[str, Any],
        competitions: dict[str, Any],
        faculty: dict[str, Any],
    ) -> list[dict[str, Any]]:
        picks: list[dict[str, Any]] = []

        def take(section: str, n: int = 2) -> None:
            rows = sorted(
                self._iter_section_rows(ctx, section),
                key=lambda r: (_level_rank(r.get("level")), _s(r.get("occurred_on"))),
                reverse=True,
            )
            for r in rows[:n]:
                if _s(r.get("name")):
                    picks.append(self._dto_item(r))

        take("award", 2)
        take("competition", 2)
        take("paper", 2)
        take("topic", 1)
        take("platform", 1)
        take("service", 1)
        take("talent", 1)
        take("output", 1)
        take("collective", 1)

        # 合成摘要卡（数据充足时补齐展示密度）
        if key_projects["national"] or key_projects["provincial"]:
            picks.insert(
                0,
                {
                    "id": "synth-topic",
                    "title": (
                        f"攻坚课题立项 {key_projects['national'] + key_projects['provincial']} 项"
                        f"（国家级 {key_projects['national']} / 省部级 {key_projects['provincial']}）"
                    ),
                    "category": "research",
                    "categoryLabel": "科研项目",
                    "level": "国家级" if key_projects["national"] else "省部级",
                    "date": "",
                    "leader": "科研团队",
                },
            )
        if top_papers.get("firstTierCount"):
            picks.append(
                {
                    "id": "synth-paper",
                    "title": f"中科院一区论文 {top_papers['firstTierCount']} 篇",
                    "category": "research",
                    "categoryLabel": "高水平论文",
                    "level": "SCI一区",
                    "date": "",
                    "leader": "科研团队",
                }
            )
        if competitions.get("nationalAwards"):
            picks.append(
                {
                    "id": "synth-comp",
                    "title": f"A 类赛事国奖 {competitions['nationalAwards']} 项"
                    + (
                        f"（含特等/一等奖 {competitions['goldOrSpecial']}）"
                        if competitions.get("goldOrSpecial")
                        else ""
                    ),
                    "category": "competition",
                    "categoryLabel": "学生竞赛",
                    "level": "国家级",
                    "date": "",
                    "leader": "参赛队",
                }
            )
        if faculty.get("doctoralSupervisors") or faculty.get("esiHighCited"):
            picks.append(
                {
                    "id": "synth-talent",
                    "title": (
                        f"博导 {faculty.get('doctoralSupervisors') or 0} 人"
                        f" · ESI 高被引 {faculty.get('esiHighCited') or 0} 人"
                    ),
                    "category": "faculty",
                    "categoryLabel": "师资成果",
                    "level": "高层次人才",
                    "date": "",
                    "leader": "师资团队",
                }
            )

        # 去重标题
        seen: set[str] = set()
        gallery: list[dict[str, Any]] = []
        for item in picks:
            title = item["title"]
            if not title or title in seen:
                continue
            seen.add(title)
            gallery.append(item)
            if len(gallery) >= 12:
                break
        return gallery

    def _build_milestones(self, ctx: dict[str, Any]) -> list[dict[str, Any]]:
        """按成果方向构建轮播池；每个方向最多三条，同系列省赛 / 国赛归并。"""
        by_badge: dict[str, list[dict[str, Any]]] = defaultdict(list)

        for section in _MILESTONE_SECTIONS:
            rows = sorted(
                self._iter_section_rows(ctx, section),
                key=lambda r: (_level_rank(r.get("level")), _s(r.get("occurred_on"))),
                reverse=True,
            )
            series: dict[str, list[dict[str, Any]]] = {}
            series_order: list[str] = []
            for row in rows:
                title = _s(row.get("name"))
                if not title or _is_header_noise(title):
                    continue
                key = _series_key(title) or title.casefold()
                if key not in series:
                    series[key] = []
                    series_order.append(key)
                if not any(_s(x.get("name")) == title for x in series[key]):
                    series[key].append(row)

            for key in series_order:
                grouped_rows = series[key]
                top = grouped_rows[0]
                badge = _badge_for(top)
                if len(by_badge[badge]) >= _MILESTONES_PER_BADGE:
                    continue

                titles = [_s(r.get("name")) for r in grouped_rows if _s(r.get("name"))][:4]
                note = _interpretation(top)
                if len(titles) > 1:
                    note = f"{note}；同系列归并 {len(titles)} 项"
                by_badge[badge].append(
                    {
                        "id": f"m-{top.get('id')}",
                        "badge": badge,
                        "title": _merge_series_title(titles),
                        "interpretation": note,
                        "yearLabel": _milestone_side_label(top),
                        "leader": _s(top.get("leader")) or None,
                        "variantCount": len(titles),
                    }
                )

        return [
            item
            for badge in _MILESTONE_BADGE_ORDER
            for item in by_badge.get(badge, [])
        ]

    def _roster(self, ctx: dict[str, Any]) -> list[dict[str, Any]]:
        """清单 / 类别图 / 级别图的唯一事实源（缓存于 ctx）。"""
        cached = ctx.get("_roster")
        if isinstance(cached, list):
            return cached

        items: list[dict[str, Any]] = []
        seen: set[str] = set()

        def _push(dto: dict[str, Any]) -> None:
            title = _s(dto.get("title"))
            key = f"{dto.get('category')}|{title}|{dto.get('date')}|{dto.get('leader')}"
            if not title or key in seen:
                return
            seen.add(key)
            items.append(dto)

        for meta in _FEATURED_META:
            for row in self._iter_section_rows(ctx, meta["key"]):
                if _s(row.get("name")):
                    _push(self._dto_item(row))

        # 缺 talent 板块时，用师资主档补师资成果清单（与人数口径一致）
        if not any(i.get("category") == "faculty" for i in items):
            for t in ctx.get("teachers") or []:
                name = _s(getattr(t, "name", None))
                if not name:
                    continue
                title = _s(getattr(t, "title", None)) or "专任教师"
                _push(
                    {
                        "id": f"t{getattr(t, 'id', name)}",
                        "title": name,
                        "category": "faculty",
                        "categoryLabel": "师资成果",
                        "level": title,
                        "date": _year_label(getattr(t, "hire_date", None)) or "",
                        "leader": title,
                    }
                )

        # 科研事实表兜底（achievement_items 未覆盖时）
        if not any(i.get("category") == "research" for i in items):
            for p in ctx.get("projects") or []:
                _push(
                    self._dto_item(
                        {
                            "id": f"p{getattr(p, 'id', '')}",
                            "section": "topic" if _s(getattr(p, "kind", None)) != "horizontal" else "service",
                            "name": getattr(p, "title", None),
                            "category": getattr(p, "category", None),
                            "level": getattr(p, "level", None),
                            "org": getattr(p, "source_org", None),
                            "leader": getattr(p, "leader", None),
                            "occurred_on": getattr(p, "start_date", None),
                            "note": getattr(p, "project_no", None),
                        }
                    )
                )
            for p in ctx.get("papers") or []:
                _push(
                    self._dto_item(
                        {
                            "id": f"paper{getattr(p, 'id', '')}",
                            "section": "paper",
                            "name": getattr(p, "title", None),
                            "category": getattr(p, "category", None),
                            "level": getattr(p, "level", None),
                            "org": getattr(p, "venue", None),
                            "leader": getattr(p, "authors", None),
                            "occurred_on": getattr(p, "published_at", None),
                        }
                    )
                )
            for ip in ctx.get("ips") or []:
                _push(
                    self._dto_item(
                        {
                            "id": f"ip{getattr(ip, 'id', '')}",
                            "section": "output",
                            "name": getattr(ip, "title", None),
                            "category": getattr(ip, "patent_type", None),
                            "level": getattr(ip, "patent_type", None) or "专利",
                            "leader": getattr(ip, "inventor", None),
                            "occurred_on": getattr(ip, "grant_date", None),
                            "note": getattr(ip, "patent_no", None),
                        }
                    )
                )

        items.sort(
            key=lambda x: (_level_rank(x.get("level")), x.get("date") or "", x.get("title") or ""),
            reverse=True,
        )
        ctx["_roster"] = items
        return items

    def _all_achievement_items(self, ctx: dict[str, Any]) -> list[dict[str, Any]]:
        return self._roster(ctx)

    def _level_distribution(self, items: list[dict[str, Any]]) -> list[dict[str, Any]]:
        counter: Counter[str] = Counter(_normalize_level(i.get("level")) for i in items)
        return [{"level": lv, "count": counter.get(lv, 0)} for lv in ("国家级", "省部级", "校级", "其他")]

    def _build_category_panels(self, ctx: dict[str, Any]) -> list[dict[str, Any]]:
        overview = self._build_overview(ctx)
        kp = overview["keyProjects"]
        tp = overview["topPapers"]
        comp = overview["competitions"]
        faculty = overview["facultyLeaders"]

        horizontal = [p for p in ctx["projects"] if _s(p.kind) == "horizontal"]
        horizontal_fund = round(sum(_parse_funding_wan(p.funding) for p in horizontal), 2)
        invent = sum(1 for ip in ctx["ips"] if "发明" in _s(ip.patent_type) or not ip.patent_type)
        soft = sum(1 for ip in ctx["ips"] if "软" in _s(ip.patent_type) or "软件" in _s(ip.patent_type))

        papers = ctx["papers"]
        cns = sum(1 for p in papers if _is_cns(p.level, p.venue))
        first_tier = tp.get("firstTierCount") or 0
        authority = sum(1 for p in papers if _is_chinese_authority(p.level, p.venue))

        award_rows = self._iter_section_rows(ctx, "award")
        tech_award = sum(1 for r in award_rows if "科技" in _s(r.get("category")) or "科技" in _s(r.get("name")))
        teach_award = sum(
            1 for r in award_rows if "教学" in _s(r.get("category")) or "教学" in _s(r.get("name"))
        )
        if tech_award + teach_award == 0:
            teach_award = len(award_rows)
        special = sum(1 for r in award_rows if "特等" in f"{_s(r.get('level'))}{_s(r.get('note'))}")
        first = sum(1 for r in award_rows if "一等" in f"{_s(r.get('level'))}{_s(r.get('note'))}")

        talent_rows = self._iter_section_rows(ctx, "talent")
        teach_master = sum(1 for r in talent_rows if "名师" in f"{_s(r.get('category'))}{_s(r.get('name'))}")
        overseas = sum(1 for r in talent_rows if "海外" in f"{_s(r.get('category'))}{_s(r.get('name'))}")

        platforms = ctx["platforms"] or [
            type("P", (), {"category": r.get("category"), "name": r.get("name")})()
            for r in self._iter_section_rows(ctx, "platform")
        ]
        lab = sum(1 for p in platforms if "实验室" in f"{_s(getattr(p, 'category', None))}{_s(getattr(p, 'name', None))}")
        eng = sum(1 for p in platforms if "工程" in f"{_s(getattr(p, 'category', None))}{_s(getattr(p, 'name', None))}")
        human = sum(
            1
            for p in platforms
            if any(k in f"{_s(getattr(p, 'category', None))}{_s(getattr(p, 'name', None))}" for k in ("人文", "社科", "基地"))
        )
        if lab + eng + human == 0 and platforms:
            lab = len(platforms)

        collective = self._iter_section_rows(ctx, "collective")
        advanced = sum(1 for r in collective if "班集体" in f"{_s(r.get('category'))}{_s(r.get('name'))}")
        league = sum(1 for r in collective if "团" in f"{_s(r.get('category'))}{_s(r.get('name'))}")
        if advanced + league == 0:
            advanced = len(collective)

        service_rows = self._iter_section_rows(ctx, "service")
        reports = sum(1 for r in service_rows if "报告" in f"{_s(r.get('category'))}{_s(r.get('name'))}")

        topic_highlights = []
        for r in sorted(
            self._iter_section_rows(ctx, "topic"),
            key=lambda x: _level_rank(x.get("level")),
            reverse=True,
        )[:3]:
            topic_highlights.append(
                f"{_s(r.get('name'))}"
                + (f"（{_s(r.get('leader'))}）" if r.get("leader") else "")
            )

        return [
            {
                "key": "project",
                "name": "攻坚・课题",
                "icon": "🛰️",
                "desc": "国家级 / 省部级科研项目，突出牵头单位",
                "metrics": [
                    {"label": "在研国家级项目", "value": kp["national"], "unit": "项"},
                    {"label": "在研省部级项目", "value": kp["provincial"], "unit": "项", "highlight": True},
                    {"label": "累计经费", "value": kp["fundingWan"], "unit": "万元"},
                ],
                "highlights": topic_highlights or None,
            },
            {
                "key": "output",
                "name": "科研产出",
                "icon": "💡",
                "desc": "横向到账经费与发明专利授权",
                "metrics": [
                    {"label": "横向到账经费", "value": horizontal_fund, "unit": "万元", "highlight": True},
                    {"label": "发明专利授权", "value": invent or len(ctx["ips"]), "unit": "件"},
                    {"label": "软著登记", "value": soft, "unit": "件"},
                ],
            },
            {
                "key": "paper",
                "name": "顶刊・智识",
                "icon": "📜",
                "desc": "CNS / SCI 一区 / 中文权威期刊论文总数",
                "metrics": [
                    {"label": "CNS 论文", "value": cns, "unit": "篇"},
                    {"label": "SCI 一区论文", "value": first_tier, "unit": "篇", "highlight": True},
                    {"label": "中文权威期刊", "value": authority, "unit": "篇"},
                    {"label": "论文总数", "value": tp["count"], "unit": "篇"},
                ],
            },
            {
                "key": "award",
                "name": "科教硕果",
                "icon": "🏆",
                "desc": "省级以上科技进步奖、教学成果奖",
                "metrics": [
                    {"label": "科技进步奖", "value": tech_award, "unit": "项"},
                    {"label": "教学成果奖", "value": teach_award, "unit": "项"},
                    {"label": "特等奖", "value": special, "unit": "项", "highlight": True},
                    {"label": "一等奖", "value": first, "unit": "项", "highlight": True},
                ],
            },
            {
                "key": "talent",
                "name": "名师・头雁",
                "icon": "👑",
                "desc": "国家级 / 省级人才、教学名师、海外高层次人才",
                "metrics": [
                    {"label": "国家级人才", "value": faculty["national"], "unit": "人", "highlight": True},
                    {"label": "省级人才", "value": faculty["provincial"], "unit": "人"},
                    {"label": "教学名师", "value": teach_master, "unit": "人"},
                    {"label": "海外高层次人才", "value": overseas, "unit": "人"},
                    {"label": "博导", "value": faculty.get("doctoralSupervisors") or 0, "unit": "人"},
                ],
            },
            {
                "key": "platform",
                "name": "平台・基石",
                "icon": "🏛️",
                "desc": "省级以上重点实验室 / 工程中心 / 人文社科基地",
                "metrics": [
                    {"label": "重点实验室", "value": lab, "unit": "个", "highlight": True},
                    {"label": "工程中心", "value": eng, "unit": "个"},
                    {"label": "人文社科基地", "value": human, "unit": "个"},
                ],
            },
            {
                "key": "competition",
                "name": "竞攀・巅峰",
                "icon": "🚩",
                "desc": "挑战杯、互联网+、大创年会等 A 类赛事国家级奖项",
                "metrics": [
                    {
                        "label": "三大赛国家级奖项",
                        "value": comp["nationalAwards"],
                        "unit": "项",
                        "highlight": True,
                    },
                    {"label": "其中特等/一等奖", "value": comp["goldOrSpecial"], "unit": "项"},
                ],
            },
            {
                "key": "collective",
                "name": "集体・荣光",
                "icon": "🌟",
                "desc": "省级以上先进班集体、五四红旗团委等组织类荣誉",
                "metrics": [
                    {"label": "先进班集体", "value": advanced, "unit": "个", "highlight": True},
                    {"label": "五四红旗团委", "value": league, "unit": "个"},
                ],
            },
            {
                "key": "service",
                "name": "智援・社会",
                "icon": "🤝",
                "desc": "智库报告采纳、横向服务到账经费",
                "metrics": [
                    {"label": "智库报告采纳", "value": reports or len(service_rows), "unit": "份", "highlight": True},
                    {"label": "横向服务到账", "value": horizontal_fund, "unit": "万元"},
                    {"label": "社会服务项目", "value": len(service_rows), "unit": "项"},
                ],
            },
        ]

    def _build_featured_sections(self, ctx: dict[str, Any], overview: dict[str, Any]) -> list[dict[str, Any]]:
        panels = {p["key"]: p for p in self._build_category_panels(ctx)}
        # panel key 与 section key 对齐（project→topic）
        panel_alias = {"topic": "project", **{k: k for k in (
            "output", "paper", "award", "talent", "platform", "competition", "collective", "service"
        )}}

        sections: list[dict[str, Any]] = []
        for meta in _FEATURED_META:
            key = meta["key"]
            rows = self._iter_section_rows(ctx, key)
            panel = panels.get(panel_alias.get(key, key), {})
            metrics = []
            for i, m in enumerate(panel.get("metrics") or []):
                tone = "default"
                if m.get("highlight"):
                    tone = "highlight"
                elif i == 0:
                    tone = "gold"
                metrics.append(
                    {
                        "label": m["label"],
                        "value": m["value"],
                        "unit": m.get("unit"),
                        "tone": tone,
                        "emphasis": bool(m.get("highlight")),
                    }
                )

            level_counter: Counter[str] = Counter(_normalize_level(r.get("level")) for r in rows)
            chart_items = [
                {"label": lv, "value": level_counter.get(lv, 0)}
                for lv in ("国家级", "省部级", "校级", "其他")
                if level_counter.get(lv, 0) > 0
            ]
            if key == "paper":
                chart_items = [
                    {"label": m["label"], "value": int(m["value"]) if isinstance(m["value"], (int, float)) else 0}
                    for m in (panel.get("metrics") or [])[:3]
                ]
            elif key == "output":
                chart_items = [
                    {"label": m["label"], "value": int(m["value"]) if isinstance(m["value"], (int, float)) else 0}
                    for m in (panel.get("metrics") or [])
                ]

            items = []
            ranked = sorted(rows, key=lambda r: (_level_rank(r.get("level")), _s(r.get("occurred_on"))), reverse=True)
            for r in ranked[:100]:
                items.append(
                    {
                        "name": _s(r.get("name")),
                        "category": _s(r.get("category")) or None,
                        "level": _s(r.get("level")) or None,
                        "org": _s(r.get("org")) or None,
                        "leader": _s(r.get("leader")) or None,
                        "date": _year_label(r.get("occurred_on")),
                        "note": _s(r.get("note")) or None,
                    }
                )

            # topic 补充项目表明细
            if key == "topic" and not items:
                for p in sorted(ctx["projects"], key=lambda x: _level_rank(x.level), reverse=True)[:100]:
                    if _s(p.kind) != "vertical":
                        continue
                    items.append(
                        {
                            "name": _s(p.title),
                            "category": _s(p.category) or "纵向课题",
                            "level": _s(p.level) or None,
                            "org": _s(p.source_org) or None,
                            "leader": _s(p.leader) or None,
                            "date": _year_label(p.start_date),
                            "note": _s(p.project_no) or None,
                        }
                    )

            if key == "talent" and not items:
                for t in ctx.get("teachers") or []:
                    name = _s(getattr(t, "name", None))
                    if not name:
                        continue
                    items.append(
                        {
                            "name": name,
                            "category": _s(getattr(t, "title", None)) or "专任教师",
                            "level": _s(getattr(t, "title", None)) or None,
                            "org": None,
                            "leader": _s(getattr(t, "degree", None)) or None,
                            "date": _year_label(getattr(t, "hire_date", None)),
                            "note": _s(getattr(t, "source", None)) or None,
                        }
                    )
                    if len(items) >= 100:
                        break

            if key == "competition" and not items:
                for r in self._iter_section_rows(ctx, "competition")[:100]:
                    items.append(
                        {
                            "name": _s(r.get("name")),
                            "category": _s(r.get("category")) or None,
                            "level": _s(r.get("level")) or None,
                            "org": _s(r.get("org")) or None,
                            "leader": _s(r.get("leader")) or None,
                            "date": _year_label(r.get("occurred_on")),
                            "note": _s(r.get("note")) or None,
                        }
                    )

            highlight = None
            if panel.get("highlights"):
                highlight = panel["highlights"][0]
            elif items:
                highlight = items[0]["name"]

            sections.append(
                {
                    "key": key,
                    "name": meta["name"],
                    "origin": meta["origin"],
                    "desc": meta["desc"],
                    "metrics": metrics,
                    "highlight": highlight,
                    "chart": {"title": f"{meta['name']}分布", "items": chart_items} if chart_items else None,
                    "items": items,
                }
            )
        return sections


benchmark_service = BenchmarkService()
