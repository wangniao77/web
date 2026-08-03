"""离线采集/组装专业排名标准 JSON（不写入业务库）。

用法（在 backend 目录）:
  # 推荐：从软科公开接口拉取本院专业 + 对标校
  python scripts/collect_major_ranks.py --fetch --year 2025 -o data/major_ranks/2025.json

  # Excel → 标准 JSON
  python scripts/collect_major_ranks.py --from-excel D:\\UGit\\data\\softke_ranks.xlsx --year 2025 -o data/major_ranks/2025.json

  # 本院明细 Excel + 全国全量榜 CSV/JSON 切片对标校
  python scripts/collect_major_ranks.py --from-excel ranks.xlsx --lookup-peers national.csv --year 2025 -o out.json

Excel 期望列（中文表头，可部分缺失）:
  专业 / 专业名称, 等级, 全国名次/全国排名, 省内名次/省内排名, 财经名次/财经排名,
  同比/较上年, 学校条件, 学科支撑, 专业生源, 专业就业, 专业条件
  （五维可同时提供 对标均值 列：学校条件对标、学科支撑对标…）

全国全量榜 CSV/JSON 期望字段:
  school/学校, major/专业, rank/全国名次
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

BACKEND = Path(__file__).resolve().parents[1]
SCRIPTS = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(SCRIPTS))

try:
    import yaml  # type: ignore
except ImportError:  # pragma: no cover
    yaml = None

from Utils.Excel import read_tabular


DIM_KEYS = [
    ("school", "学校条件"),
    ("discipline", "学科支撑"),
    ("source", "专业生源"),
    ("employment", "专业就业"),
    ("program", "专业条件"),
]


def _pick(row: dict[str, str], *names: str) -> str:
    for n in names:
        if n in row and row[n] != "":
            return str(row[n]).strip()
        for k, v in row.items():
            if (k == n or k.startswith(n)) and v != "":
                return str(v).strip()
    return ""


def _as_int(v: Any) -> int | None:
    if v is None or str(v).strip() in ("", "**", "-", "—"):
        return None
    try:
        return int(float(str(v).strip()))
    except ValueError:
        return None


def _as_float(v: Any) -> float | None:
    if v is None or str(v).strip() in ("", "**", "-", "—"):
        return None
    try:
        return float(str(v).strip())
    except ValueError:
        return None


def load_peer_config(path: Path | None = None) -> dict[str, Any]:
    cfg_path = path or (SCRIPTS / "config" / "peer_schools.yaml")
    default = {
        "selfSchool": "广东财经大学",
        "regional": [
            "华南理工大学",
            "深圳大学",
            "广东工业大学",
            "广东财经大学",
            "广州大学",
            "广东外语外贸大学",
        ],
        "finance": [
            "中央财经大学",
            "上海财经大学",
            "对外经济贸易大学",
            "西南财经大学",
            "广东财经大学",
            "中南财经政法大学",
        ],
    }
    if not cfg_path.is_file():
        return default
    text = cfg_path.read_text(encoding="utf-8")
    if yaml is None:
        # 极简回退：无 PyYAML 时用默认
        print("[warn] PyYAML not installed, using built-in peer school lists")
        return default
    data = yaml.safe_load(text) or {}
    return {
        "selfSchool": data.get("selfSchool") or default["selfSchool"],
        "regional": list(data.get("regional") or default["regional"]),
        "finance": list(data.get("finance") or default["finance"]),
    }


def _soft_from_row(row: dict[str, str]) -> list[dict[str, Any]]:
    dims: list[dict[str, Any]] = []
    for key, label in DIM_KEYS:
        score = _as_float(_pick(row, label, f"{label}得分", f"{label}分数"))
        peer = _as_float(_pick(row, f"{label}对标", f"{label}均值", f"{label}peer"))
        if score is None:
            continue
        dims.append(
            {
                "key": key,
                "label": label,
                "score": score,
                "peerAverage": peer if peer is not None else score,
            }
        )
    return dims


def majors_from_excel(path: Path) -> list[dict[str, Any]]:
    rows = read_tabular(path)
    majors: list[dict[str, Any]] = []
    for row in rows:
        name = _pick(row, "专业名称", "专业", "专业名")
        if not name:
            continue
        majors.append(
            {
                "name": name,
                "grade": _pick(row, "等级", "软科等级") or None,
                "nationalRank": _as_int(_pick(row, "全国名次", "全国排名", "全国")),
                "yoyChange": _as_int(_pick(row, "同比", "较上年", "名次变化")),
                "provincialRank": _as_int(_pick(row, "省内名次", "省内排名", "省内")),
                "financePeerRank": _as_int(_pick(row, "财经名次", "财经排名", "财经类")),
                "softDimensions": _soft_from_row(row),
                "peerSchools": [],
                "financePeerSchools": [],
            }
        )
    return majors


def _load_national_table(path: Path) -> list[dict[str, Any]]:
    """返回 [{school, major, rank}]。"""
    if path.suffix.lower() == ".json":
        data = json.loads(path.read_text(encoding="utf-8"))
        rows = data if isinstance(data, list) else data.get("rows") or data.get("items") or []
        out = []
        for r in rows:
            if not isinstance(r, dict):
                continue
            school = str(r.get("school") or r.get("学校") or "").strip()
            major = str(r.get("major") or r.get("专业") or r.get("专业名称") or "").strip()
            rank = _as_int(r.get("rank") or r.get("全国名次") or r.get("全国排名"))
            if school and major and rank is not None:
                out.append({"school": school, "major": major, "rank": rank})
        return out

    # CSV
    out = []
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            school = _pick(row, "学校", "school", "院校")
            major = _pick(row, "专业", "专业名称", "major")
            rank = _as_int(_pick(row, "全国名次", "全国排名", "rank", "名次"))
            if school and major and rank is not None:
                out.append({"school": school, "major": major, "rank": rank})
    return out


def _norm(s: str) -> str:
    return (s or "").strip().replace("（", "(").replace("）", ")")


def lookup_peers_for_major(
    *,
    major_name: str,
    national: list[dict[str, Any]],
    school_names: list[str],
    self_school: str,
) -> list[dict[str, Any]]:
    mn = _norm(major_name)
    by_school: dict[str, int] = {}
    for row in national:
        if _norm(row["major"]) != mn and mn not in _norm(row["major"]) and _norm(row["major"]) not in mn:
            continue
        by_school[row["school"]] = row["rank"]

    peers: list[dict[str, Any]] = []
    for school in school_names:
        rank = by_school.get(school)
        if rank is None:
            # 模糊校名
            for k, v in by_school.items():
                if school in k or k in school:
                    rank = v
                    break
        if rank is None:
            continue
        item: dict[str, Any] = {"school": school, "rank": rank}
        if school == self_school:
            item["isSelf"] = True
        peers.append(item)
    peers.sort(key=lambda x: x["rank"])
    return peers


def attach_peers(
    majors: list[dict[str, Any]],
    national_path: Path,
    cfg: dict[str, Any],
) -> None:
    national = _load_national_table(national_path)
    self_school = cfg["selfSchool"]
    for m in majors:
        m["peerSchools"] = lookup_peers_for_major(
            major_name=m["name"],
            national=national,
            school_names=list(cfg["regional"]),
            self_school=self_school,
        )
        m["financePeerSchools"] = lookup_peers_for_major(
            major_name=m["name"],
            national=national,
            school_names=list(cfg["finance"]),
            self_school=self_school,
        )
        # 若本院全国名次缺失，用 peer 中 isSelf 回填
        if m.get("nationalRank") is None:
            for p in m["peerSchools"]:
                if p.get("isSelf"):
                    m["nationalRank"] = p["rank"]
                    break


def build_payload(
    *,
    year: int,
    majors: list[dict[str, Any]],
    source: str,
    self_school: str,
) -> dict[str, Any]:
    # 清理 None grade → 省略或空串由导入侧处理
    cleaned = []
    for m in majors:
        item = dict(m)
        if item.get("grade") is None:
            item["grade"] = ""
        cleaned.append(item)
    return {
        "year": year,
        "source": source,
        "selfSchool": self_school,
        "majors": cleaned,
    }


BCMR_BASE = "https://www.shanghairanking.cn/api/pub/v1/bcmr"
DEFAULT_FETCH_MAJORS = [
    "计算机科学与技术",
    "软件工程",
    "人工智能",
    "大数据管理与应用",
    "电子商务",
    "信息管理与信息系统",
]
IND_CODE_TO_DIM = {
    "22": ("school", "学校条件"),
    "23": ("discipline", "学科支撑"),
    "24": ("source", "专业生源"),
    "25": ("employment", "专业就业"),
    "26": ("program", "专业条件"),
}
GRADE_TO_SCORE = {
    "A+": 95.0,
    "A": 90.0,
    "B+": 85.0,
    "B": 80.0,
    "C+": 75.0,
    "C": 70.0,
    "D+": 65.0,
    "D": 60.0,
}


def _http_get_json(url: str, *, retries: int = 3, delay: float = 0.8) -> dict[str, Any]:
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        ),
        "Referer": "https://www.shanghairanking.cn/rankings/bcmr/2025",
        "Accept": "application/json,text/plain,*/*",
    }
    last_err: Exception | None = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=60) as resp:
                raw = resp.read().decode("utf-8")
            data = json.loads(raw)
            if isinstance(data, dict) and data.get("code") not in (None, 200, "200"):
                raise RuntimeError(f"API code={data.get('code')} msg={data.get('msg')}")
            return data if isinstance(data, dict) else {"data": data}
        except (urllib.error.URLError, TimeoutError, RuntimeError, json.JSONDecodeError) as exc:
            last_err = exc
            if attempt < retries - 1:
                time.sleep(delay * (attempt + 1))
    raise RuntimeError(f"请求失败 {url}: {last_err}")


def _parse_rank(v: Any) -> int | None:
    if v is None:
        return None
    s = str(v).strip().replace("*", "").replace("＊", "")
    if not s or s in ("-", "—", "**"):
        return None
    try:
        return int(float(s))
    except ValueError:
        return None


def _flatten_major_tree(nodes: list[dict[str, Any]] | None) -> list[dict[str, str]]:
    out: list[dict[str, str]] = []

    def walk(items: list[dict[str, Any]] | None) -> None:
        for n in items or []:
            children = n.get("children")
            if children:
                walk(children)
                continue
            name = str(n.get("name") or "").strip()
            code = str(n.get("code") or "").strip()
            if name and code:
                out.append({"name": name, "code": code})

    walk(nodes)
    return out


def _match_major_codes(
    leaves: list[dict[str, str]],
    wanted: list[str],
) -> list[tuple[str, str]]:
    """返回 [(专业名 as wanted, majorCode), ...]。"""
    by_name = {x["name"]: x["code"] for x in leaves}
    matched: list[tuple[str, str]] = []
    for name in wanted:
        if name in by_name:
            matched.append((name, by_name[name]))
            continue
        hit = next((x for x in leaves if name in x["name"] or x["name"] in name), None)
        if hit:
            matched.append((name, hit["code"]))
        else:
            print(f"[fetch] 未匹配专业代码: {name}", file=sys.stderr)
    return matched


def _dims_from_ind_grades(ind_grades: dict[str, Any] | None) -> list[dict[str, Any]]:
    if not ind_grades:
        return []
    dims: list[dict[str, Any]] = []
    for code, (key, label) in IND_CODE_TO_DIM.items():
        g = str(ind_grades.get(code) or "").strip()
        score = GRADE_TO_SCORE.get(g)
        if score is None:
            continue
        dims.append(
            {
                "key": key,
                "label": label,
                "score": score,
                "peerAverage": score,
                "grade": g,
            }
        )
    return dims


def _peer_list(
    by_school: dict[str, dict[str, Any]],
    school_names: list[str],
    self_school: str,
) -> list[dict[str, Any]]:
    peers: list[dict[str, Any]] = []
    for school in school_names:
        info = by_school.get(school)
        if info is None:
            for k, v in by_school.items():
                if school in k or k in school:
                    info = v
                    school = k
                    break
        if info is None:
            continue
        item: dict[str, Any] = {"school": school, "rank": info["rank"]}
        if school == self_school:
            item["isSelf"] = True
        peers.append(item)
    peers.sort(key=lambda x: x["rank"])
    return peers


def _provincial_rank(
    by_school: dict[str, dict[str, Any]],
    self_school: str,
    province_keys: tuple[str, ...] = ("广东", "广东省"),
) -> int | None:
    self_info = by_school.get(self_school)
    if not self_info:
        return None
    self_rank = self_info["rank"]
    gd_ranks = [
        v["rank"]
        for v in by_school.values()
        if any(p in str(v.get("province") or "") for p in province_keys)
    ]
    if not gd_ranks:
        return None
    return sum(1 for r in gd_ranks if r < self_rank) + 1


def fetch_majors_from_bcmr(
    *,
    year: int,
    major_names: list[str],
    cfg: dict[str, Any],
    sleep_s: float = 0.35,
    national_csv: Path | None = None,
) -> list[dict[str, Any]]:
    """调用软科公开 bcmr 接口，组装本院专业标准记录；可选写出全国切片 CSV。"""
    tree = _http_get_json(f"{BCMR_BASE}/major?year={year}")
    leaves = _flatten_major_tree(tree.get("data") if isinstance(tree.get("data"), list) else [])
    pairs = _match_major_codes(leaves, major_names)
    if not pairs:
        raise RuntimeError("未能匹配任何专业代码，请检查 --majors 名称")

    self_school = cfg["selfSchool"]
    national_rows: list[dict[str, Any]] = []
    majors: list[dict[str, Any]] = []

    for idx, (name, code) in enumerate(pairs):
        if idx:
            time.sleep(sleep_s)
        print(f"[fetch] {name} ({code})")
        payload = _http_get_json(f"{BCMR_BASE}/rank?year={year}&majorCode={code}")
        data = payload.get("data") or {}
        rankings = data.get("rankings") or []
        by_school: dict[str, dict[str, Any]] = {}
        for r in rankings:
            if not isinstance(r, dict):
                continue
            school = str(r.get("univNameCn") or "").strip()
            rank = _parse_rank(r.get("ranking"))
            if not school or rank is None:
                continue
            by_school[school] = {
                "rank": rank,
                "grade": str(r.get("grade") or "").strip(),
                "score": r.get("score"),
                "province": str(r.get("province") or "").strip(),
                "indGrades": r.get("indGrades") or {},
            }
            national_rows.append(
                {
                    "school": school,
                    "major": name,
                    "rank": rank,
                    "grade": str(r.get("grade") or "").strip(),
                    "score": r.get("score"),
                    "province": str(r.get("province") or "").strip(),
                }
            )

        self_info = by_school.get(self_school)
        peer_schools = _peer_list(by_school, list(cfg["regional"]), self_school)
        finance_peers = _peer_list(by_school, list(cfg["finance"]), self_school)
        finance_rank = None
        for i, p in enumerate(finance_peers, start=1):
            if p.get("isSelf"):
                finance_rank = i
                break
        if self_info is None:
            for p in peer_schools:
                if p.get("isSelf"):
                    # 理论上不会：self 不在榜但 peer 含 isSelf
                    break
            print(f"[fetch] 警告: {self_school} 未出现在「{name}」公开发布榜（通常为前50%）")

        majors.append(
            {
                "name": name,
                "majorCode": code,
                "grade": (self_info or {}).get("grade") or "",
                "nationalRank": (self_info or {}).get("rank"),
                "yoyChange": None,
                "provincialRank": _provincial_rank(by_school, self_school),
                "financePeerRank": finance_rank,
                "score": (self_info or {}).get("score"),
                "softDimensions": _dims_from_ind_grades((self_info or {}).get("indGrades")),
                "peerSchools": peer_schools,
                "financePeerSchools": finance_peers,
            }
        )

    if national_csv is not None:
        national_csv.parent.mkdir(parents=True, exist_ok=True)
        with national_csv.open("w", encoding="utf-8-sig", newline="") as f:
            writer = csv.DictWriter(
                f,
                fieldnames=["school", "major", "rank", "grade", "score", "province"],
            )
            writer.writeheader()
            writer.writerows(national_rows)
        print(f"[fetch] national slice → {national_csv} rows={len(national_rows)}")

    return majors


def main() -> None:
    parser = argparse.ArgumentParser(description="Collect major rank exchange JSON")
    parser.add_argument("--year", type=int, required=True)
    parser.add_argument("--source", type=str, default="softke")
    parser.add_argument("--from-excel", type=Path, default=None)
    parser.add_argument("--lookup-peers", type=Path, default=None, help="全国全量榜 CSV/JSON")
    parser.add_argument("--peer-config", type=Path, default=None)
    parser.add_argument(
        "--fetch",
        action="store_true",
        help="从软科公开 bcmr 接口拉取（仅本院相关专业，非全站爬取）",
    )
    parser.add_argument(
        "--majors",
        type=str,
        default="",
        help="逗号分隔专业名；默认本院 6 个本科专业",
    )
    parser.add_argument(
        "--national-csv",
        type=Path,
        default=None,
        help="--fetch 时写出全国切片 CSV（默认 data/major_ranks/national_<year>_slice.csv）",
    )
    parser.add_argument("-o", "--output", type=Path, required=False)
    args = parser.parse_args()

    cfg = load_peer_config(args.peer_config)
    majors: list[dict[str, Any]]

    if args.fetch:
        names = [x.strip() for x in args.majors.split(",") if x.strip()] or list(
            DEFAULT_FETCH_MAJORS
        )
        nat_csv = args.national_csv or (
            BACKEND / "data" / "major_ranks" / f"national_{args.year}_slice.csv"
        )
        majors = fetch_majors_from_bcmr(
            year=args.year,
            major_names=names,
            cfg=cfg,
            national_csv=nat_csv,
        )
        source = args.source if args.source != "softke" else "softke-bcmr-api"
    elif args.from_excel:
        majors = majors_from_excel(args.from_excel)
        if not majors:
            print("Excel 未解析到专业行", file=sys.stderr)
            sys.exit(1)
        if args.lookup_peers:
            attach_peers(majors, args.lookup_peers, cfg)
        source = args.source
    else:
        print("请使用 --fetch 或 --from-excel", file=sys.stderr)
        sys.exit(2)

    payload = build_payload(
        year=args.year,
        majors=majors,
        source=source,
        self_school=cfg["selfSchool"],
    )

    out = args.output or (BACKEND / "data" / "major_ranks" / f"{args.year}.json")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote {out} majors={len(majors)}")


if __name__ == "__main__":
    main()
