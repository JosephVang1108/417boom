from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class IngestRequest(BaseModel):
    text: str = Field(min_length=3, max_length=8000)
    group_name: str = ""
    post_url: str = ""
    source: str = "manual"
    business_id: int | None = None
    send_sms: bool = True


class LeadOut(BaseModel):
    id: int
    business_id: int
    source: str
    group_name: str
    post_text: str
    post_url: str
    intent: str
    trade: str | None
    confidence: float
    should_alert: bool
    matched_keywords: list[str]
    reasons: list[str]
    reply_text: str
    status: str
    sms_sent: bool
    sms_error: str
    created_at: datetime

    class Config:
        from_attributes = True


class BusinessOut(BaseModel):
    id: int
    name: str
    owner_name: str
    phone: str
    alert_phone: str
    city: str
    trades: str

    class Config:
        from_attributes = True


class BusinessUpdate(BaseModel):
    name: str | None = None
    owner_name: str | None = None
    phone: str | None = None
    alert_phone: str | None = None
    city: str | None = None
    trades: str | None = None


class StatusUpdate(BaseModel):
    status: str


class TemplateOut(BaseModel):
    id: int
    trade: str
    name: str
    body: str
    is_default: bool

    class Config:
        from_attributes = True
