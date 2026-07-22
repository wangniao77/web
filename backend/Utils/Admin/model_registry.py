from typing import Any

from tortoise.models import Model


# superadmin 可管理的资源表
ADMIN_MODEL_REGISTRY: dict[str, type[Model]] = {}


def register_admin_model(key: str, model_cls: type[Model]) -> None:
    ADMIN_MODEL_REGISTRY[key] = model_cls


def get_admin_model(key: str) -> type[Model]:
    if key not in ADMIN_MODEL_REGISTRY:
        raise KeyError(f"未知资源: {key}")
    return ADMIN_MODEL_REGISTRY[key]


def model_to_dict(instance: Model) -> dict[str, Any]:
    """将 Tortoise 模型实例转为可 JSON 序列化的字典。"""

    data: dict[str, Any] = {}
    for name, field in instance._meta.fields_map.items():
        if name == "password_hash":
            continue
        if field.__class__.__name__ == "ForeignKeyFieldInstance":
            data[f"{name}_id"] = getattr(instance, f"{name}_id", None)
            continue
        value = getattr(instance, name, None)
        if hasattr(value, "isoformat"):
            data[name] = value.isoformat()
        else:
            data[name] = value
    return data
