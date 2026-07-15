# 从 Datas/*.xlsx 再生成 academicRecords.json（成绩表更新后运行）
# 用法：python scripts/export_academic_records_json.py

from __future__ import annotations

import json
from pathlib import Path
import csv

import openpyxl

ROOT = Path(__file__).resolve().parents[1]
DATAS = ROOT.parent / "Datas"
OUT = ROOT / "src" / "mock" / "student" / "academicRecords.json"
PHOTO_INDEX_OUT = ROOT / "src" / "mock" / "student" / "photoIndex.json"
PHOTO_CSV = Path(r"C:\Users\24603\Desktop\学生学籍照片清洗结果_完整原图嵌入版\姓名照片对应表.csv")


FIELD_MAP = {
    "年级": "grade",
    "学号": "student_id",
    "姓名": "name",
    "性别": "gender",
    "上课院系": "teaching_department",
    "专业名称": "major_name",
    "班级": "class_name",
    "校区": "campus",
    "政治面貌": "political_status",
    "电话": "phone",
    "籍贯": "native_place",
    "楼栋": "building",
    "宿舍名称": "dormitory_name",
    "班主任": "class_teacher",
    "辅导员": "counselor",
    "导师姓名": "supervisor_name",
    "专业课_平均分": "major_course_avg_score",
    "学科基础课_平均分": "subject_basic_course_avg_score",
    "通识课_平均分": "general_course_avg_score",
    "必修_平均分": "required_course_avg_score",
    "选修_平均分": "elective_course_avg_score",
    "全部课程_课程数": "all_course_count",
    "缺考次数": "absent_exam_count",
    "补考次数": "makeup_exam_count",
    "重修次数": "retake_count",
    "获得总学分": "earned_total_credits",
    "不及格总学分": "failed_total_credits",
    "主修总学分": "major_total_credits",
    "平均学分绩点": "average_credit_gpa",
    "四级": "cet4_score",
    "六级": "cet6_score",
    "学科竞赛获奖次数": "competition_award_count",
    "学科竞赛获奖明细": "competition_award_detail",
    "体育达标": "pe_standard",
}


def cell(v):
    if v is None:
        return None
    if isinstance(v, float):
        return round(v, 4) if abs(v) >= 0.0001 else 0
    if isinstance(v, int):
        return v
    s = str(v).strip()
    return s if s else None


def main() -> None:
    rows_out = []
    for xlsx in sorted(DATAS.glob("*级学籍成绩合并_每人一行.xlsx")):
        wb = openpyxl.load_workbook(xlsx, read_only=True, data_only=True)
        ws = wb.active
        raw = list(ws.iter_rows(values_only=True))
        header = [str(h).strip() if h is not None else "" for h in raw[0]]
        idx = {h: i for i, h in enumerate(header)}
        for r in raw[1:]:
            item = {}
            for cn, en in FIELD_MAP.items():
                if cn not in idx:
                    continue
                item[en] = cell(r[idx[cn]])
            if not item.get("student_id"):
                continue
            item["student_id"] = str(item["student_id"]).strip()
            if item.get("grade") is not None:
                try:
                    item["grade"] = int(float(item["grade"]))
                except Exception:
                    pass
            rows_out.append(item)
        wb.close()
        print(xlsx.name, "ok")

    OUT.parent.mkdir(parents=True, exist_ok=True)

    photo_by_id: dict[str, str] = {}
    if PHOTO_CSV.exists():
        with PHOTO_CSV.open(encoding="utf-8-sig", newline="") as f:
            for row in csv.DictReader(f):
                sid = str(row.get("学号") or "").strip()
                name = str(row.get("照片文件名") or "").strip()
                status = str(row.get("状态") or "").strip()
                if sid and name and status.upper() == "OK":
                    photo_by_id[sid] = name
        PHOTO_INDEX_OUT.write_text(
            json.dumps(photo_by_id, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )
        print("photo map", len(photo_by_id))

    hit = 0
    for item in rows_out:
        fn = photo_by_id.get(str(item["student_id"]))
        if fn:
            item["photo_filename"] = fn
            item["student_picture_path"] = f"/student-photos/{fn}"
            hit += 1

    OUT.write_text(json.dumps(rows_out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("wrote", OUT, "n=", len(rows_out), "with_photo=", hit)


if __name__ == "__main__":
    main()
