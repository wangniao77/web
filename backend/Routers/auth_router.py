from fastapi import APIRouter, Depends, HTTPException, Query

from Routers.Auth.deps import get_current_account, require_roles
from Routers.Models.req.auth_model import LoginReq
from Routers.Models.resp.common_model import ApiResponse, ok
from Services.auth_service import AuthService
from Utils.DB.Models.account_models import Account

router = APIRouter(prefix="/auth", tags=["认证"])
auth_service = AuthService()


@router.post("/login", response_model=ApiResponse)
async def login(body: LoginReq) -> ApiResponse:
    try:
        data = await auth_service.login(body.username, body.password)
        return ok(data)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc


@router.get("/me", response_model=ApiResponse)
async def me(account: Account = Depends(get_current_account)) -> ApiResponse:
    return ok(await auth_service.get_me(account))
