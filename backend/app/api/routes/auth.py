import uuid
from datetime import UTC, datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.database import get_db_session
from app.core.security import hash_password
from app.models.auth_tokens import PasswordResetToken
from app.models.user import User, UserProfile
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    ProfileUpdateRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserResponse,
)
from app.services.auth import AuthService

router = APIRouter(prefix="/auth", tags=["authentication"])


def set_session_cookie(response: Response, access_token: str) -> None:
    response.set_cookie(
        key="session_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=30 * 60,
        path="/",
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, response: Response, session: Session = Depends(get_db_session)) -> TokenResponse:
    try:
        user = AuthService.register(session, payload)
        session.commit()
    except (IntegrityError, ValueError):
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered",
        ) from None
    result = AuthService.token_response(user)
    set_session_cookie(response, result.access_token)
    return result


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, response: Response, session: Session = Depends(get_db_session)) -> TokenResponse:
    try:
        user = AuthService.authenticate(session, payload)
    except PermissionError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is inactive",
        ) from None
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        ) from None
    result = AuthService.token_response(user)
    set_session_cookie(response, result.access_token)
    return result


@router.get("/me", response_model=UserResponse)
def get_my_account(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
def forgot_password(payload: ForgotPasswordRequest, session: Session = Depends(get_db_session)) -> dict[str, str]:
    user = session.scalar(select(User).where(User.email == payload.email.lower().strip()))
    if user is not None:
        token_str = uuid.uuid4().hex + uuid.uuid4().hex
        reset_token = PasswordResetToken(
            user_id=user.id,
            token=token_str,
            expires_at=datetime.now(UTC) + timedelta(hours=2),
        )
        session.add(reset_token)
        session.commit()
        return {"message": "If an account exists, a reset link/token has been generated.", "reset_token": token_str}
    return {"message": "If an account exists, a reset link/token has been generated."}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(payload: ResetPasswordRequest, session: Session = Depends(get_db_session)) -> dict[str, str]:
    token_record = session.scalar(
        select(PasswordResetToken).where(
            PasswordResetToken.token == payload.token,
            PasswordResetToken.is_used.is_(False),
        )
    )
    if token_record is None or token_record.expires_at < datetime.now(UTC):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token")

    user = session.get(User, token_record.user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.password_hash = hash_password(payload.new_password)
    token_record.is_used = True
    session.commit()
    return {"message": "Password reset successfully. You can now sign in with your new password."}


@router.put("/profile", response_model=UserResponse)
def update_profile(
    payload: ProfileUpdateRequest,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> User:
    profile = session.scalar(select(UserProfile).where(UserProfile.user_id == current_user.id))
    if profile is None:
        profile = UserProfile(user_id=current_user.id, display_name=payload.display_name)
        session.add(profile)
    else:
        profile.display_name = payload.display_name.strip()

    if payload.phone_number is not None:
        profile.phone_number = payload.phone_number.strip()
    if payload.city is not None:
        profile.city = payload.city.strip()
    if payload.state is not None:
        profile.state = payload.state.strip()
    if payload.bio is not None:
        profile.bio = payload.bio.strip()

    session.commit()
    session.refresh(current_user)
    return current_user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def logout() -> Response:
    response = Response(status_code=status.HTTP_204_NO_CONTENT)
    response.delete_cookie(key="session_token", path="/")
    return response

