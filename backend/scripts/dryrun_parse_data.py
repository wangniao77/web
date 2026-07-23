"""Dry-run parse D:\\UGit\\data without DB."""
from pathlib import Path
import sys

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

from Utils.Excel import read_tabular, list_sheet_names

ROOT = Path(r"D:\UGit\data")


def main() -> None:
    samples = [
        ROOT / "全年级学生成绩学籍数据" / "22级学籍.xls",
        ROOT / "全年级学生成绩学籍数据" / "2022级绩点.xls",
        ROOT / "就业信息20260623.xlsx",
    ]
    for p in samples:
        rows = read_tabular(p)
        print(p.name, "n=", len(rows), "keys=", list(rows[0].keys())[:12] if rows else [])
        if rows:
            print("  sample", {k: rows[0][k] for k in list(rows[0])[:8]})

    research = list(ROOT.glob("科研成果*.xls"))[0]
    print("research sheets", list_sheet_names(research))
    for sheet in ["纵向项目", "横向项目", "科研论文", "知识产权"]:
        rows = read_tabular(research, sheet_name=sheet)
        print(sheet, "n=", len(rows))


if __name__ == "__main__":
    main()
