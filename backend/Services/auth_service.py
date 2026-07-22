from Routers.Auth.auth import create_access_token
from Utils.DB.Models.account_models import Account
from Utils.Security.password import hash_password, verify_password
from core.config import get_settings


class AuthService:
    async def login(self, username: str, password: str) -> dict:
        account = await Account.get_or_none(username=username, is_active=True)
        if account is None or not verify_password(password, account.password_hash):
            raise ValueError("用户名或密码错误")

        token = create_access_token(
            str(account.id),
            extra_claims={
                "account_id": account.id,
                "role": account.role,
                "username": account.username,
            },
        )
        return {
            "token": token,
            "role": account.role,
            "username": account.username,
            "display_name": account.display_name,
        }

    async def get_me(self, account: Account) -> dict:
        college = await account.college
        return {
            "id": account.id,
            "username": account.username,
            "role": account.role,
            "display_name": account.display_name,
            "student_id": account.student_id,
            "college_id": college.id if college else None,
        }

    async def ensure_superadmin(self) -> None:
        settings = get_settings()
        exists = await Account.filter(role=Account.ROLE_SUPERADMIN).exists()
        if exists:
            return
        await Account.create(
            username=settings.superadmin_username,
            password_hash=hash_password(settings.superadmin_password),
            role=Account.ROLE_SUPERADMIN,
            display_name="超级管理员",
        )
