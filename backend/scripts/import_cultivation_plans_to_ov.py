"""将本地培养方案 txt 导入 OpenViking。

默认源目录：D:/UGit/data/培养方案/2024
目标 URI：viking://resources/college/cultivation-plans/（源目录名 2024 会保留为子路径）

用法：
  cd backend
  python scripts/import_cultivation_plans_to_ov.py
  python scripts/import_cultivation_plans_to_ov.py --college 信息学院
  python scripts/import_cultivation_plans_to_ov.py --no-wait
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

import httpx

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

from core.config import get_settings  # noqa: E402

DEFAULT_SOURCE = Path(r"D:\UGit\data\培养方案\2024")
# parent 不含年份目录名：SDK 会保留源文件夹名 2024，得到
# viking://resources/college/cultivation-plans/2024/{学院}/...
DEFAULT_PARENT = "viking://resources/college/cultivation-plans/"


def _headers(api_key: str | None) -> dict[str, str]:
    headers: dict[str, str] = {}
    if api_key:
        headers["X-API-Key"] = api_key
        headers["Authorization"] = f"Bearer {api_key}"
    return headers


def _unwrap(data):
    if isinstance(data, dict) and "result" in data:
        return data.get("result")
    return data


def health(base: str, api_key: str | None) -> bool:
    try:
        r = httpx.get(f"{base}/health", headers=_headers(api_key), timeout=5.0)
        return r.status_code < 500
    except Exception as exc:
        print(f"health failed: {exc}")
        return False


def mkdir(base: str, api_key: str | None, uri: str) -> None:
    target = uri if uri.endswith("/") else uri + "/"
    r = httpx.post(
        f"{base}/api/v1/fs/mkdir",
        headers={**_headers(api_key), "Content-Type": "application/json"},
        json={"uri": target},
        timeout=30.0,
    )
    if r.status_code >= 400:
        # 已存在等情况不视为致命
        print(f"mkdir warn {r.status_code}: {r.text[:200]}")


def temp_upload(base: str, api_key: str | None, file_path: Path) -> str:
    with file_path.open("rb") as f:
        r = httpx.post(
            f"{base}/api/v1/resources/temp_upload",
            headers=_headers(api_key),
            files={"file": (file_path.name, f, "text/plain")},
            timeout=120.0,
        )
    r.raise_for_status()
    data = _unwrap(r.json()) or {}
    tid = data.get("temp_file_id") if isinstance(data, dict) else None
    if not tid:
        raise RuntimeError(f"temp_upload missing id: {r.text[:300]}")
    return str(tid)


def add_resource(
    base: str,
    api_key: str | None,
    *,
    temp_file_id: str,
    to: str,
    reason: str,
    wait: bool,
    timeout: float,
) -> dict:
    payload = {
        "temp_file_id": temp_file_id,
        "to": to,
        "create_parent": True,
        "reason": reason,
        "wait": wait,
        "timeout": timeout if wait else None,
    }
    # 去掉 None，避免部分版本校验失败
    payload = {k: v for k, v in payload.items() if v is not None}
    r = httpx.post(
        f"{base}/api/v1/resources",
        headers={**_headers(api_key), "Content-Type": "application/json"},
        json=payload,
        timeout=max(120.0, timeout + 30.0) if wait else 180.0,
    )
    if r.status_code >= 400:
        raise RuntimeError(f"add_resource failed {r.status_code}: {r.text[:400]}")
    data = _unwrap(r.json())
    return data if isinstance(data, dict) else {"raw": data}


def try_sdk_dir_import(
    base: str,
    api_key: str | None,
    source: Path,
    parent: str,
    *,
    wait: bool,
    timeout: float,
    reason: str,
) -> dict | None:
    """优先用 SDK 整目录导入（自动 temp_upload + 保留结构）。"""
    try:
        from openviking import SyncHTTPClient
    except Exception as exc:
        print(f"SDK unavailable, fallback per-file: {exc}")
        return None

    mkdir(base, api_key, parent)
    client = SyncHTTPClient(url=base, api_key=api_key or None, timeout=max(180.0, timeout))
    try:
        if hasattr(client, "initialize"):
            client.initialize()
        result = client.add_resource(
            path=str(source),
            parent=parent,
            reason=reason,
            wait=wait,
            timeout=timeout if wait else None,
            include="*.txt",
            preserve_structure=True,
        )
        return result if isinstance(result, dict) else {"raw": result}
    finally:
        close = getattr(client, "close", None)
        if callable(close):
            close()


def collect_txt(source: Path, college: str | None) -> list[Path]:
    root = source / college if college else source
    if not root.exists():
        raise FileNotFoundError(f"source not found: {root}")
    files = sorted(p for p in root.rglob("*.txt") if p.is_file())
    return files


def to_uri(source: Path, file_path: Path, parent: str) -> str:
    """拼出目标 URI；parent 为 cultivation-plans/ 时保留年份目录段。"""
    rel = file_path.relative_to(source).as_posix()
    base = parent.rstrip("/")
    if base.endswith("cultivation-plans") and source.name.isdigit():
        return f"{base}/{source.name}/{rel}"
    return f"{base}/{rel}"


def verify_search(base: str, api_key: str | None, parent: str) -> None:
    target = parent
    if parent.rstrip("/").endswith("cultivation-plans"):
        target = parent.rstrip("/") + "/2024/"
    r = httpx.post(
        f"{base}/api/v1/search/find",
        headers={**_headers(api_key), "Content-Type": "application/json"},
        json={"query": "软件工程 培养方案", "target_uri": target},
        timeout=60.0,
    )
    print(f"search status={r.status_code} target={target}")
    if r.status_code < 400:
        data = _unwrap(r.json()) or {}
        resources = []
        if isinstance(data, dict):
            resources = data.get("resources") or data.get("memories") or []
        print(f"search hits={len(resources)}")
        for item in resources[:3]:
            if isinstance(item, dict):
                print(" -", item.get("uri") or item.get("path"), (item.get("abstract") or "")[:80])


def main() -> None:
    parser = argparse.ArgumentParser(description="Import cultivation plans into OpenViking")
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--parent", default=DEFAULT_PARENT)
    parser.add_argument("--college", default=None, help="仅导入某个学院子目录，如 信息学院")
    parser.add_argument("--no-wait", action="store_true", help="不等待语义处理完成")
    parser.add_argument("--timeout", type=float, default=1800.0)
    parser.add_argument("--per-file", action="store_true", help="强制逐文件上传（不用 SDK 整目录）")
    parser.add_argument("--limit", type=int, default=0, help="调试用：最多导入 N 个文件")
    args = parser.parse_args()

    get_settings.cache_clear()
    settings = get_settings()
    base = settings.openviking_url.rstrip("/")
    api_key = settings.openviking_api_key or None
    wait = not args.no_wait
    reason = "广东财经大学 2024 培养方案（治理驾驶舱知识库）"

    print("url:", base)
    print("source:", args.source)
    print("parent:", args.parent)
    if args.college:
        print("college filter:", args.college)

    if not health(base, api_key):
        raise SystemExit("OpenViking 不可达，请先启动 openviking-server（默认 127.0.0.1:1933）")

    files = collect_txt(args.source, args.college)
    if args.limit > 0:
        files = files[: args.limit]
    print(f"txt files: {len(files)}")
    if not files:
        raise SystemExit("没有可导入的 .txt 文件")

    # 优先整目录（仅在未筛选学院且未强制 per-file 时）
    if not args.per_file and not args.college and args.limit <= 0:
        print("mode: sdk directory import")
        t0 = time.time()
        try:
            result = try_sdk_dir_import(
                base,
                api_key,
                args.source,
                args.parent,
                wait=wait,
                timeout=args.timeout,
                reason=reason,
            )
            if result is not None:
                print("sdk result:", json.dumps(result, ensure_ascii=False)[:500])
                print(f"elapsed: {time.time() - t0:.1f}s")
                verify_search(base, api_key, args.parent)
                return
        except Exception as exc:
            print(f"sdk directory import failed, fallback per-file: {exc}")

    print("mode: per-file http upload")
    mkdir(base, api_key, args.parent)
    ok = 0
    failed: list[tuple[str, str]] = []
    t0 = time.time()
    for i, fp in enumerate(files, 1):
        uri = to_uri(args.source, fp, args.parent)
        try:
            tid = temp_upload(base, api_key, fp)
            # 逐文件 wait 太慢：默认仅最后一个 wait，或 --no-wait 全不等
            do_wait = wait and (i == len(files) or args.limit > 0)
            add_resource(
                base,
                api_key,
                temp_file_id=tid,
                to=uri,
                reason=f"{reason} | {fp.relative_to(args.source).as_posix()}",
                wait=do_wait,
                timeout=min(args.timeout, 300.0),
            )
            ok += 1
            print(f"[{i}/{len(files)}] ok {uri}")
        except Exception as exc:
            failed.append((str(fp), str(exc)))
            print(f"[{i}/{len(files)}] FAIL {fp}: {exc}")

    print(f"done ok={ok} fail={len(failed)} elapsed={time.time() - t0:.1f}s")
    if failed:
        print("failures:")
        for path, err in failed[:10]:
            print(" -", path, err)
    verify_search(base, api_key, args.parent)
    if failed:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
