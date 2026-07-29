from __future__ import annotations

from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import Business, ReplyTemplate


DEFAULT_TEMPLATES = [
    {
        "trade": "plumbing",
        "name": "Plumbing — fast",
        "is_default": True,
        "body": (
            "Hi! I’m {name} with {business}. We can help with that — licensed & insured, "
            "serving the {city} area. Call/text {phone} and we’ll get you on the schedule ASAP."
        ),
    },
    {
        "trade": "plumbing",
        "name": "Plumbing — emergency",
        "is_default": False,
        "body": (
            "Sorry you’re dealing with that. This is {name} at {business} — we handle "
            "leak/clog emergencies. Text {phone} and we’ll point you on next steps right away."
        ),
    },
    {
        "trade": "hvac",
        "name": "HVAC — down system",
        "is_default": True,
        "body": (
            "Hey! {name} here with {business}. If your system is down, we can usually diagnose fast. "
            "Call/text {phone} — tell us the issue and your zip and we’ll help ASAP."
        ),
    },
    {
        "trade": "hvac",
        "name": "HVAC — recommend",
        "is_default": False,
        "body": (
            "Hi! I’m {name} with {business} — local HVAC, licensed & insured. "
            "Happy to take a look or answer questions. {phone}"
        ),
    },
]


def seed_if_empty(db: Session) -> Business:
    business = db.query(Business).first()
    if business:
        return business

    settings = get_settings()
    business = Business(
        name=settings.default_business_name,
        owner_name=settings.default_owner_name,
        phone=settings.default_phone,
        alert_phone=settings.alert_to_number or settings.default_phone,
        city=settings.default_city,
        trades="hvac,plumbing",
    )
    db.add(business)
    db.flush()

    for item in DEFAULT_TEMPLATES:
        db.add(
            ReplyTemplate(
                business_id=business.id,
                trade=item["trade"],
                name=item["name"],
                body=item["body"],
                is_default=item["is_default"],
            )
        )
    db.commit()
    db.refresh(business)
    return business


def render_template(body: str, business: Business) -> str:
    return (
        body.replace("{name}", business.owner_name)
        .replace("{business}", business.name)
        .replace("{phone}", business.phone)
        .replace("{city}", business.city)
        .replace("{offer}", "")
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
