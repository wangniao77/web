import hashlib
import secrets


def hash_password(password: str) -> str:
    """使用 SHA256 + salt 哈希密码。"""

    salt = secrets.token_hex(16)
    digest = hashlib.sha256(f"{salt}{password}".encode()).hexdigest()
    return f"{salt}${digest}"


def verify_password(password: str, password_hash: str) -> bool:
    """校验密码。"""

    try:
        salt, digest = password_hash.split("$", 1)
    except ValueError:
        return False
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest() == digest
