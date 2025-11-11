from typing import List, Optional
from sqlmodel import SQLModel, Field, Relationship


class Provider(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    public: bool = True

    workshops: List["Workshop"] = Relationship(back_populates="provider")


class Workshop(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: Optional[str] = None
    schedule: Optional[str] = None
    max_participants: Optional[int] = None
    status: str = "draft"  # draft | published

    provider_id: Optional[int] = Field(default=None, foreign_key="provider.id")
    provider: Optional[Provider] = Relationship(back_populates="workshops")

    participants: List["Participant"] = Relationship(back_populates="workshop")


class Participant(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str
    workshop_id: Optional[int] = Field(default=None, foreign_key="workshop.id")
    workshop: Optional[Workshop] = Relationship(back_populates="participants")
