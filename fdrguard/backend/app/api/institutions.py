from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.deps import get_current_admin
from ..models.user import User
from ..models.institution import Institution
from ..schemas.user import UserOut

router = APIRouter(prefix="/institutions", tags=["Institutions"])


@router.get("/", response_model=list[dict])
def list_institutions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    institutions = db.query(Institution).all()
    return [{"id": i.id, "name": i.name, "code": i.code} for i in institutions]
