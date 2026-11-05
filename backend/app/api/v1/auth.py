from datetime import timedelta
from typing import Any
from urllib.parse import urlparse
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, get_password_hash, verify_password
from app.core.deps import get_current_user
from app.models.user import User, OAuthAccount
from app.schemas.auth import Token, UserLogin, UserRegister, GoogleAuthRequest, GoogleCallbackRequest
from app.schemas.user import UserProfileResponse
from app.services.gamification_service import GamificationService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token)
def register_user(user_in: UserRegister, db: Session = Depends(get_db)) -> Any:
    """Register a new student user with email and password."""
    existing_user = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )

    user = User(
        email=user_in.email.lower(),
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        college=user_in.college,
        branch=user_in.branch,
        graduation_year=user_in.graduation_year,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Initialize gamification profile
    GamificationService.get_or_create_xp_profile(db, user.id)

    access_token = create_access_token(
        subject=user.id,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }


@router.post("/login", response_model=Token)
def login_user(login_in: UserLogin, db: Session = Depends(get_db)) -> Any:
    """Authenticate user with email and password and return JWT."""
    user = db.query(User).filter(User.email == login_in.email.lower()).first()
    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is inactive.",
        )

    access_token = create_access_token(
        subject=user.id,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }


@router.post("/google", response_model=Token)
def google_auth(google_in: GoogleAuthRequest, db: Session = Depends(get_db)) -> Any:
    """Authenticate or register user via Google OAuth."""
    if not google_in.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google email is required for authentication.",
        )

    email = google_in.email.lower()
    user = db.query(User).filter(User.email == email).first()

    if not user:
        # Create user via Google OAuth
        user = User(
            email=email,
            full_name=google_in.full_name or email.split("@")[0].capitalize(),
            avatar_url=google_in.avatar_url,
            college="Engineering College",
            branch="Computer Science",
            graduation_year=2027,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Record OAuth link
        oauth = OAuthAccount(
            user_id=user.id,
            provider="google",
            provider_user_id=google_in.token[:50],
        )
        db.add(oauth)
        db.commit()

        GamificationService.get_or_create_xp_profile(db, user.id)
    else:
        # User already exists - update avatar if present and ensure OAuth link exists
        if google_in.avatar_url and not user.avatar_url:
            user.avatar_url = google_in.avatar_url
            db.commit()

        existing_oauth = (
            db.query(OAuthAccount)
            .filter(
                OAuthAccount.user_id == user.id,
                OAuthAccount.provider == "google",
            )
            .first()
        )
        if not existing_oauth:
            oauth = OAuthAccount(
                user_id=user.id,
                provider="google",
                provider_user_id=google_in.token[:50],
            )
            db.add(oauth)
            db.commit()

    access_token = create_access_token(
        subject=user.id,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }


@router.post("/google/callback", response_model=Token)
async def google_oauth_callback(
    callback_in: GoogleCallbackRequest,
    db: Session = Depends(get_db),
) -> Any:
    """
    Exchanges Google OAuth authorization code for Google user profile,
    creates or retrieves the user account, and returns a CareerFit access token.
    """
    email = None
    full_name = None
    avatar_url = None
    provider_user_id = "google_user"

    # 1. Exchange authorization code with Google's OAuth Token Endpoint
    if settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                token_resp = await client.post(
                    "https://oauth2.googleapis.com/token",
                    data={
                        "code": callback_in.code,
                        "client_id": settings.GOOGLE_CLIENT_ID,
                        "client_secret": settings.GOOGLE_CLIENT_SECRET,
                        "redirect_uri": callback_in.redirect_uri,
                        "grant_type": "authorization_code",
                    },
                )
                if token_resp.status_code != 200:
                    try:
                        token_err = token_resp.json()
                        err_msg = token_err.get("error_description") or token_err.get("error") or token_resp.text
                    except Exception:
                        err_msg = token_resp.text
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Google token exchange failed: {err_msg}",
                    )

                token_data = token_resp.json()
                google_access_token = token_data.get("access_token")

                # 2. Retrieve verified user profile from Google UserInfo
                userinfo_resp = await client.get(
                    "https://www.googleapis.com/oauth2/v3/userinfo",
                    headers={"Authorization": f"Bearer {google_access_token}"},
                )
                if userinfo_resp.status_code == 200:
                    profile_data = userinfo_resp.json()
                    email = profile_data.get("email")
                    full_name = profile_data.get("name")
                    avatar_url = profile_data.get("picture")
                    provider_user_id = profile_data.get("sub") or email
                else:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Unable to fetch profile information from Google.",
                    )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error connecting to Google OAuth servers: {str(e)}",
            )
    else:
        # Fallback when credentials are being configured
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are not configured on the backend. Please configure your Google Cloud Console credentials in backend/.env.",
        )

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to retrieve verified email from Google account.",
        )

    email = email.lower()
    user = db.query(User).filter(User.email == email).first()

    if not user:
        # Create new user via Google OAuth
        user = User(
            email=email,
            full_name=full_name or email.split("@")[0].capitalize(),
            avatar_url=avatar_url,
            college="Engineering College",
            branch="Computer Science",
            graduation_year=2027,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        oauth = OAuthAccount(
            user_id=user.id,
            provider="google",
            provider_user_id=str(provider_user_id)[:50],
        )
        db.add(oauth)
        db.commit()

        GamificationService.get_or_create_xp_profile(db, user.id)
    else:
        if avatar_url and not user.avatar_url:
            user.avatar_url = avatar_url

        existing_oauth = (
            db.query(OAuthAccount)
            .filter(
                OAuthAccount.user_id == user.id,
                OAuthAccount.provider == "google",
            )
            .first()
        )
        if not existing_oauth:
            oauth = OAuthAccount(
                user_id=user.id,
                provider="google",
                provider_user_id=str(provider_user_id)[:50],
            )
            db.add(oauth)
        db.commit()

    access_token = create_access_token(
        subject=user.id,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }


@router.get("/me", response_model=UserProfileResponse)
def get_auth_user(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """Return the profile and gamification status of the currently authenticated user."""
    xp_profile = GamificationService.get_or_create_xp_profile(db, current_user.id)
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "college": current_user.college,
        "branch": current_user.branch,
        "graduation_year": current_user.graduation_year,
        "avatar_url": current_user.avatar_url,
        "is_active": current_user.is_active,
        "is_superuser": current_user.is_superuser,
        "created_at": current_user.created_at,
        "current_xp": xp_profile.current_xp,
        "level": xp_profile.level,
        "level_title": xp_profile.level_title,
    }
