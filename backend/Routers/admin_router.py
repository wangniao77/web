from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query

from Routers.Auth.deps import require_roles
from Routers.Models.resp.common_model import ApiResponse, ok
from Services.admin_service import AdminService
from Utils.DB.Models.account_models import Account

router = APIRouter(prefix="/admin", tags=["超级管理员"])
admin_service = AdminService()


@router.get("/resources", response_model=ApiResponse)
async def list_resources(
    _: Account = Depends(require_roles(Account.ROLE_SUPERADMIN)),
) -> ApiResponse:
    return ok(admin_service.list_resources())


@router.get("/{resource}", response_model=ApiResponse)
async def list_items(
    resource: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    _: Account = Depends(require_roles(Account.ROLE_SUPERADMIN)),
) -> ApiResponse:
    try:
        return ok(await admin_service.list_items(resource, page=page, page_size=page_size))
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/{resource}/{item_id}", response_model=ApiResponse)
async def get_item(
    resource: str,
    item_id: int,
    _: Account = Depends(require_roles(Account.ROLE_SUPERADMIN)),
) -> ApiResponse:
    try:
        return ok(await admin_service.get_item(resource, item_id))
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/{resource}", response_model=ApiResponse)
async def create_item(
    resource: str,
    payload: dict[str, Any],
    _: Account = Depends(require_roles(Account.ROLE_SUPERADMIN)),
) -> ApiResponse:
    try:
        return ok(await admin_service.create_item(resource, payload))
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.put("/{resource}/{item_id}", response_model=ApiResponse)
async def update_item(
    resource: str,
    item_id: int,
    payload: dict[str, Any],
    _: Account = Depends(require_roles(Account.ROLE_SUPERADMIN)),
) -> ApiResponse:
    try:
        return ok(await admin_service.update_item(resource, item_id, payload))
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete("/{resource}/{item_id}", response_model=ApiResponse)
async def delete_item(
    resource: str,
    item_id: int,
    _: Account = Depends(require_roles(Account.ROLE_SUPERADMIN)),
) -> ApiResponse:
    try:
        await admin_service.delete_item(resource, item_id)
        return ok({"deleted": True})
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
