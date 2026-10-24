from .auth import router as auth_router
from .fdr import router as fdr_router
from .institutions import router as institutions_router

__all__ = ["auth_router", "fdr_router", "institutions_router"]
