from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User, UserProfile
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse


class AuthService:
    @staticmethod
    def register(session: Session, payload: RegisterRequest) -> User:
        email = str(payload.email).lower()
        existing_user = session.scalar(select(User.id).where(User.email == email))
        if existing_user is not None:
            raise ValueError("An account already exists for this email address")

        user = User(email=email, password_hash=hash_password(payload.password))
        user.profile = UserProfile(display_name=payload.display_name.strip())
        session.add(user)
        session.flush()
        return user

    @staticmethod
    def authenticate(session: Session, payload: LoginRequest) -> User:
        user = session.scalar(
            select(User).options(joinedload(User.profile)).where(User.email == str(payload.email).lower())
        )
        if user is None or not verify_password(payload.password, user.password_hash):
            raise ValueError("Incorrect email or password")
        if not user.is_active:
            raise PermissionError("This account is inactive")
        return user

    @staticmethod
    def token_response(user: User) -> TokenResponse:
        return TokenResponse(
            access_token=create_access_token(user.id, user.role, user.auth_version),
            user=UserResponse.model_validate(user),
        )
