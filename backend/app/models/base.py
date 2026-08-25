from datetime import datetime, timezone
from typing import Any, Optional, Type, TypeVar
from beanie import Document
from pydantic import Field

T = TypeVar("T", bound="SoftDeleteDocument")


def get_link_id(link_or_doc: Any) -> Optional[Any]:
    if link_or_doc is None:
        return None
    if hasattr(link_or_doc, "ref"):
        return link_or_doc.ref.id
    if hasattr(link_or_doc, "id"):
        return link_or_doc.id
    return link_or_doc


def is_same_id(link_or_doc: Any, other_id_or_doc: Any) -> bool:
    id1 = get_link_id(link_or_doc)
    id2 = get_link_id(other_id_or_doc)
    return str(id1) == str(id2) if id1 is not None and id2 is not None else False


class SoftDeleteDocument(Document):
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    deleted_at: Optional[datetime] = None

    async def soft_delete(self):
        self.deleted_at = datetime.now(timezone.utc)
        self.updated_at = datetime.now(timezone.utc)
        await self.save()

    @classmethod
    def active_query(cls: Type[T]):
        return cls.find(cls.deleted_at == None)  # noqa: E711
