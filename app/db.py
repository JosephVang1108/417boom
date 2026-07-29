from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, sessionmaker

from app.config import get_settings


class Base(DeclarativeBase):
    pass


class Business(Base):
    __tablename__ = "businesses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    owner_name: Mapped[str] = mapped_column(String(80))
    phone: Mapped[str] = mapped_column(String(32))
    alert_phone: Mapped[str] = mapped_column(String(32), default="")
    city: Mapped[str] = mapped_column(String(80), default="Springfield")
    trades: Mapped[str] = mapped_column(String(80), default="hvac,plumbing")
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    templates: Mapped[list[ReplyTemplate]] = relationship(back_populates="business")
    leads: Mapped[list[Lead]] = relationship(back_populates="business")


class ReplyTemplate(Base):
    __tablename__ = "reply_templates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    business_id: Mapped[int] = mapped_column(ForeignKey("businesses.id"))
    trade: Mapped[str] = mapped_column(String(40), default="general")
    name: Mapped[str] = mapped_column(String(80))
    body: Mapped[str] = mapped_column(Text)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)

    business: Mapped[Business] = relationship(back_populates="templates")


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    business_id: Mapped[int] = mapped_column(ForeignKey("businesses.id"))
    source: Mapped[str] = mapped_column(String(40), default="manual")
    group_name: Mapped[str] = mapped_column(String(160), default="")
    post_text: Mapped[str] = mapped_column(Text)
    post_url: Mapped[str] = mapped_column(String(500), default="")
    intent: Mapped[str] = mapped_column(String(40))
    trade: Mapped[str | None] = mapped_column(String(40), nullable=True)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    should_alert: Mapped[bool] = mapped_column(Boolean, default=False)
    matched_keywords: Mapped[str] = mapped_column(String(400), default="")
    reasons: Mapped[str] = mapped_column(Text, default="")
    reply_text: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(40), default="new")
    sms_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    sms_error: Mapped[str] = mapped_column(String(400), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    business: Mapped[Business] = relationship(back_populates="leads")


settings = get_settings()
engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False} if settings.database_url.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def init_db() -> None:
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
