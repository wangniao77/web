# 专业排名 inbox（易路径）

## 更省事：直接联网拉取

不必往 inbox 丢文件，在 `backend` 下执行：

```bash
python scripts/sync_major_ranks.py --fetch --year 2025
```

会调用软科站点公开的 bcmr 接口，拉取本院相关专业与对标校，写出 `../2025.json`、`../national_2025_slice.csv` 并入库。

## 手工 Excel/CSV

把软科/校内整理的**本院专业排名** Excel 或 CSV 丢进本目录，然后：

```bash
python scripts/sync_major_ranks.py --from-inbox --year 2025
```

脚本会取本目录**最新修改**的 `.xlsx` / `.xls` / `.csv`，生成 `../2025.json` 并写入数据库。

## 表头（中文，可部分缺失）

| 列名 | 说明 |
|------|------|
| 专业 / 专业名称 | 须与系统专业名一致 |
| 等级 | 如 A / B+ |
| 全国名次 / 全国排名 | 整数 |
| 省内名次 / 省内排名 | 可选 |
| 财经名次 / 财经排名 | 可选 |
| 同比 / 较上年 | 可选，正负整数 |
| 学校条件、学科支撑、专业生源、专业就业、专业条件 | 五维分数 |
| 学校条件对标 … | 五维对标均值（可选） |

也可直接改模板：`template.csv`。

## 可选：全国全量榜切对标校

若另有全国榜 CSV（含 `学校,专业,全国名次`），可：

```bash
python scripts/sync_major_ranks.py --from-inbox --year 2025 --lookup-peers D:\path\national.csv
```

对标校名单见 `backend/scripts/config/peer_schools.yaml`。
