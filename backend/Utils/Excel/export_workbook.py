"""通用 Excel 导出（openpyxl），供接口层下载任一页面表格。"""

from __future__ import annotations

from io import BytesIO
from typing import Any, Sequence

from openpyxl import Workbook


def build_workbook(sheets: Sequence[dict[str, Any]]) -> bytes:
    """sheets: [{ name, headers: list[str], rows: list[list] }]"""
    wb = Workbook()
    # 删除默认空表
    default = wb.active
    wb.remove(default)

    for sheet in sheets or [{"name": "Sheet1", "headers": ["提示"], "rows": [["暂无数据"]]}]:
        title = str(sheet.get("name") or "Sheet1")[:31]
        ws = wb.create_sheet(title)
        headers = list(sheet.get("headers") or [])
        rows = list(sheet.get("rows") or [])
        if headers:
            ws.append(headers)
        for row in rows:
            ws.append(list(row))

    buf = BytesIO()
    wb.save(buf)
    return buf.getvalue()
