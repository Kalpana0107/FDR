from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..core.database import get_db
from ..core.security import verify_password, create_access_token
from ..core.deps import get_current_user
from ..models.user import User
from ..schemas.user import LoginRequest, Token, UserProfile

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=Token)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        func.lower(User.email) == request.email.lower(),
        User.is_active == True,
    ).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    return Token(access_token=token)


@router.get("/me", response_model=UserProfile)
def get_me(current_user: User = Depends(get_current_user)):
    profile = UserProfile.model_validate(current_user)
    if current_user.institution:
        profile.institution_name = current_user.institution.name
    return profile


