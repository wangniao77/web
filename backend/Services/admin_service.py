from typing import Any

from tortoise.models import Model

from Utils.Admin.model_registry import ADMIN_MODEL_REGISTRY, get_admin_model, model_to_dict
from Utils.DB.Models.account_models import Account
from Utils.Security.password import hash_password


class AdminService:
    def list_resources(self) -> list[str]:
        return sorted(ADMIN_MODEL_REGISTRY.keys())

    async def list_items(
        self,
        resource: str,
        *,
        page: int = 1,
        page_size: int = 20,
    ) -> dict[str, Any]:
        model = get_admin_model(resource)
        total = await model.all().count()
        items = await model.all().offset((page - 1) * page_size).limit(page_size)
        return {
            "items": [model_to_dict(item) for item in items],
            "total": total,
            "page": page,
            "page_size": page_size,
        }

    async def get_item(self, resource: str, item_id: int) -> dict[str, Any]:
        model = get_admin_model(resource)
        item = await model.get_or_none(id=item_id)
        if item is None:
            raise LookupError("记录不存在")
        return model_to_dict(item)

    async def create_item(self, resource: str, payload: dict[str, Any]) -> dict[str, Any]:
        model = get_admin_model(resource)
        data = self._prepare_payload(model, payload, is_create=True)
        item = await model.create(**data)
        return model_to_dict(item)

    async def update_item(
        self,
        resource: str,
        item_id: int,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        model = get_admin_model(resource)
        item = await model.get_or_none(id=item_id)
        if item is None:
            raise LookupError("记录不存在")
        data = self._prepare_payload(model, payload, is_create=False)
        for key, value in data.items():
            setattr(item, key, value)
        await item.save()
        return model_to_dict(item)

    async def delete_item(self, resource: str, item_id: int) -> None:
        model = get_admin_model(resource)
        item = await model.get_or_none(id=item_id)
        if item is None:
            raise LookupError("记录不存在")
        await item.delete()

    def _prepare_payload(
        self,
        model: type[Model],
        payload: dict[str, Any],
        *,
        is_create: bool,
    ) -> dict[str, Any]:
        data = dict(payload)
        if model is Account:
            password = data.pop("password", None)
            data.pop("password_hash", None)
            if password:
                data["password_hash"] = hash_password(password)
            elif is_create:
                raise ValueError("创建账号必须提供 password")
        else:
            data.pop("password", None)
            data.pop("password_hash", None)
        return data
