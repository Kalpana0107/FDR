from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from .database import get_db
from .security import decode_access_token
from ..models.user import User, UserRole

bearer_scheme = HTTPBearer()

# Roles that have "admin / officer" level access (can perform status transitions, etc.)
ADMIN_ROLES = {UserRole.ADMIN, UserRole.OFFICER, UserRole.MANAGEMENT, UserRole.APPROVER}


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = db.query(User).filter(User.id == int(user_id), User.is_active == True).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def get_current_college_user(current_user: User = Depends(get_current_user)) -> User:
    college_roles = {UserRole.COLLEGE_USER, UserRole.COLLEGE}
    if current_user.role not in college_roles | ADMIN_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient privileges")
    return current_user


def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    """Allow admin-level access for ADMIN (legacy), OFFICER, MANAGEMENT, APPROVER."""
    if current_user.role not in ADMIN_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required",
        )
    return current_user
