from collections.abc import Callable
from uuid import UUID

from fastapi import Cookie, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db_session
from app.core.security import decode_access_token
from app.models.enums import UserRole
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    session_token: str | None = Cookie(default=None),
    session: Session = Depends(get_db_session),
) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token or session_token or "")
        user_id = UUID(str(payload["sub"]))
        token_version = int(payload["ver"])
    except (KeyError, TypeError, ValueError):
        raise credentials_error from None

    user = session.get(User, user_id)
    if user is None or not user.is_active or user.auth_version != token_version:
        raise credentials_error
    return user


def require_role(*roles: UserRole) -> Callable[[User], User]:
    def role_guard(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user

    return role_guard


def get_current_user_optional(
    token: str | None = Depends(oauth2_scheme),
    session_token: str | None = Cookie(default=None),
    session: Session = Depends(get_db_session),
) -> User | None:
    try:
        payload = decode_access_token(token or session_token or "")
        user_id = UUID(str(payload["sub"]))
        token_version = int(payload["ver"])
        user = session.get(User, user_id)
        if user and user.is_active and user.auth_version == token_version:
            return user
    except Exception:
        pass
    return None

