from typing import Any, Optional
from pydantic import BaseModel


class ErrorResponse(BaseModel):
    detail: str
    code: Optional[str] = None
    data: Optional[Any] = None
