from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from Routers.Auth.auth import decode_access_token
from Utils.DB.Models.account_models import Account

security = HTTPBearer(auto_error=False)


async def get_current_account(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> Account:
    """解析 JWT 并返回当前账号。"""

    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="未提供认证令牌")

    payload = decode_access_token(credentials.credentials)
    account_id = payload.get("account_id")
    if not account_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="无效令牌")

    account = await Account.get_or_none(id=account_id, is_active=True)
    if account is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="账号不存在或已禁用")
    return account


def require_roles(*roles: str):
    """角色校验依赖工厂。"""

    async def checker(account: Account = Depends(get_current_account)) -> Account:
        if account.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="权限不足")
        return account

    return checker


async def get_optional_account(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> Account | None:
    if credentials is None:
        return None
    try:
        return await get_current_account(credentials)
    except HTTPException:
        return None
