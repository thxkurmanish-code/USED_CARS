from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.database import get_db_session
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse
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


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def logout() -> Response:
    response = Response(status_code=status.HTTP_204_NO_CONTENT)
    response.delete_cookie(key="session_token", path="/")
    return response
