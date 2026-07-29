from __future__ import annotations

import re

from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import Business, ReplyTemplate


# Short, casual, human. No em dashes. Sounds like a neighbor, not a bot.
DEFAULT_TEMPLATES = [
    {
        "trade": "plumbing",
        "name": "Plumbing casual",
        "is_default": True,
        "body": "Hey, this is {name} with {business} here in {city}. I can help. Text me at {phone} if you want.",
    },
    {
        "trade": "plumbing",
        "name": "Plumbing short",
        "is_default": False,
        "body": "I handle that kind of plumbing work. {name} at {business}, {phone}.",
    },
    {
        "trade": "hvac",
        "name": "HVAC casual",
        "is_default": True,
        "body": "Hey, {name} here with {business}. We work around {city}. Text me at {phone} and I can take a look.",
    },
    {
        "trade": "hvac",
        "name": "HVAC short",
        "is_default": False,
        "body": "I can help with that. {name} at {business}, {phone}.",
    },
]


def format_local_phone(raw: str) -> str:
    """Show local numbers like (417) 555-0199. Strip +1 / leading 1."""
    digits = re.sub(r"\D", "", raw or "")
    if len(digits) == 11 and digits.startswith("1"):
        digits = digits[1:]
    if len(digits) == 10:
        return f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"
    return (raw or "").strip()


def seed_if_empty(db: Session) -> Business:
    business = db.query(Business).first()
    if business:
        _sync_templates(db, business)
        return business

    settings = get_settings()
    business = Business(
        name=settings.default_business_name,
        owner_name=settings.default_owner_name,
        phone=format_local_phone(settings.default_phone),
        alert_phone=format_local_phone(settings.alert_to_number or settings.default_phone),
        city=settings.default_city,
        trades="hvac,plumbing",
    )
    db.add(business)
    db.flush()
    _sync_templates(db, business)
    db.commit()
    db.refresh(business)
    return business


def _sync_templates(db: Session, business: Business) -> None:
    """Keep starter templates human and up to date."""
    existing = (
        db.query(ReplyTemplate).filter(ReplyTemplate.business_id == business.id).all()
    )
    by_name = {t.name: t for t in existing}
    for item in DEFAULT_TEMPLATES:
        row = by_name.get(item["name"])
        if row:
            row.body = item["body"]
            row.trade = item["trade"]
            row.is_default = item["is_default"]
        else:
            # Replace old spammy defaults if present
            db.add(
                ReplyTemplate(
                    business_id=business.id,
                    trade=item["trade"],
                    name=item["name"],
                    body=item["body"],
                    is_default=item["is_default"],
                )
            )
    # Soft-disable obviously old marketing-style templates
    for row in existing:
        if row.name not in {t["name"] for t in DEFAULT_TEMPLATES}:
            if "licensed" in (row.body or "").lower() or "—" in (row.body or ""):
                db.delete(row)
    db.commit()


def render_template(body: str, business: Business) -> str:
    phone = format_local_phone(business.phone)
    return (
        body.replace("{name}", business.owner_name)
        .replace("{business}", business.name)
        .replace("{phone}", phone)
        .replace("{city}", business.city)
        .replace("{offer}", "")
        .replace("—", "-")
        .replace("–", "-")
    )


def pick_template(db: Session, business: Business, trade: str | None) -> ReplyTemplate | None:
    q = db.query(ReplyTemplate).filter(ReplyTemplate.business_id == business.id)
    if trade:
        exact = (
            q.filter(ReplyTemplate.trade == trade, ReplyTemplate.is_default.is_(True))
            .order_by(ReplyTemplate.id)
            .first()
        )
        if exact:
            return exact
        any_trade = q.filter(ReplyTemplate.trade == trade).order_by(ReplyTemplate.id).first()
        if any_trade:
            return any_trade
    return q.order_by(ReplyTemplate.is_default.desc(), ReplyTemplate.id).first()
