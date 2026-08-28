"""按真实表列裁剪查询，避免 ORM 新字段在旧库上 SELECT 失败导致整页 500。"""

from __future__ import annotations

from typing import Any, TypeVar

from tortoise import Tortoise
from tortoise.exceptions import OperationalError
from tortoise.models import Model
from tortoise.queryset import QuerySet

_T = TypeVar("_T", bound=Model)
_COL_CACHE: dict[str, frozenset[str]] = {}


async def table_columns(table: str) -> frozenset[str]:
    cached = _COL_CACHE.get(table)
    if cached is not None:
        return cached
    conn = Tortoise.get_connection("default")
    rows = await conn.execute_query_dict(
        "SELECT column_name FROM information_schema.columns "
        "WHERE table_schema = 'public' AND table_name = $1",
        [table],
    )
    cols = frozenset(str(r["column_name"]) for r in rows)
    _COL_CACHE[table] = cols
    return cols


def _db_column(model: type[Model], field_name: str) -> str:
    field = model._meta.fields_map[field_name]
    source = getattr(field, "source_field", None)
    if source:
        return str(source)
    if field_name in getattr(model._meta, "fk_fields", ()):
        return f"{field_name}_id"
    return field_name


async def compatible_fields(
    model: type[Model], requested: list[str] | None = None
) -> list[str]:
    cols = await table_columns(model._meta.db_table)
    names = requested or list(model._meta.fields_map)
    fk_fields = set(getattr(model._meta, "fk_fields", ()) or ())
    m2m_fields = set(getattr(model._meta, "m2m_fields", ()) or ())
    backward = set(getattr(model._meta, "backward_fk_fields", ()) or ())
    out: list[str] = []
    for name in names:
        if name not in model._meta.fields_map:
            continue
        if name in m2m_fields or name in backward:
            continue
        if name in fk_fields:
            id_name = f"{name}_id"
            if id_name in model._meta.fields_map and _db_column(model, id_name) in cols:
                out.append(id_name)
            continue
        if _db_column(model, name) in cols:
            out.append(name)
    pk = model._meta.pk_attr
    if pk not in out and pk in model._meta.fields_map:
        out.insert(0, pk)
    return out


async def fetch_compat(qs: QuerySet[_T], model: type[_T]) -> list[_T]:
    """只 SELECT 库里存在的列；缺列时对应属性为默认/空。"""
    fields = await compatible_fields(model)
    try:
        return list(await qs.only(*fields))
    except OperationalError:
        _COL_CACHE.pop(model._meta.db_table, None)
        try:
            fields = await compatible_fields(model)
            return list(await qs.only(*fields))
        except OperationalError:
            return []


async def values_list_aligned(
    qs: QuerySet,
    model: type[Model],
    *fields: str,
    flat: bool = False,
) -> list[Any]:
    """values_list 对齐请求字段：库中不存在的列填 None，避免整段 gather 失败。"""
    if not fields:
        return []
    cols = await table_columns(model._meta.db_table)
    usable = [f for f in fields if f in model._meta.fields_map and _db_column(model, f) in cols]
    if flat:
        if len(fields) != 1 or fields[0] not in usable:
            return []
        return list(await qs.values_list(fields[0], flat=True))
    if not usable:
        return []
    raw = list(await qs.values_list(*usable))
    if list(usable) == list(fields):
        return raw
    index = {name: i for i, name in enumerate(usable)}
    aligned: list[tuple[Any, ...]] = []
    for row in raw:
        aligned.append(tuple(row[index[name]] if name in index else None for name in fields))
    return aligned
