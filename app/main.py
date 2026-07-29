from __future__ import annotations

from datetime import datetime

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import Business, Lead, ReplyTemplate, get_db, init_db
from app.schemas import (
    BusinessOut,
    BusinessUpdate,
    IngestRequest,
    LeadOut,
    StatusUpdate,
    TemplateOut,
)
from app.seed import pick_template, render_template, seed_if_empty
from app.sms import send_lead_sms
from matcher import classify_post

settings = get_settings()
app = FastAPI(title=settings.app_name, version="0.1.0")


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    db = next(get_db())
    try:
        seed_if_empty(db)
    finally:
        db.close()


def lead_to_out(lead: Lead) -> LeadOut:
    return LeadOut(
        id=lead.id,
        business_id=lead.business_id,
        source=lead.source,
        group_name=lead.group_name,
        post_text=lead.post_text,
        post_url=lead.post_url,
        intent=lead.intent,
        trade=lead.trade,
        confidence=lead.confidence,
        should_alert=lead.should_alert,
        matched_keywords=[k for k in lead.matched_keywords.split(",") if k],
        reasons=[r for r in lead.reasons.split(" | ") if r],
        reply_text=lead.reply_text,
        status=lead.status,
        sms_sent=lead.sms_sent,
        sms_error=lead.sms_error,
        created_at=lead.created_at,
    )


@app.get("/api/health")
def health():
    return {
        "ok": True,
        "app": settings.app_name,
        "textrazor": bool(settings.textrazor_api_key and settings.textrazor_api_key != "your_textrazor_api_key_here"),
        "twilio": bool(settings.twilio_account_sid and settings.twilio_auth_token and settings.twilio_from_number),
    }


@app.get("/api/business", response_model=BusinessOut)
def get_business(db: Session = Depends(get_db)):
    business = seed_if_empty(db)
    return business


@app.patch("/api/business", response_model=BusinessOut)
def update_business(payload: BusinessUpdate, db: Session = Depends(get_db)):
    business = seed_if_empty(db)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(business, key, value)
    db.commit()
    db.refresh(business)
    return business


@app.get("/api/templates", response_model=list[TemplateOut])
def list_templates(db: Session = Depends(get_db)):
    business = seed_if_empty(db)
    return (
        db.query(ReplyTemplate)
        .filter(ReplyTemplate.business_id == business.id)
        .order_by(ReplyTemplate.trade, ReplyTemplate.id)
        .all()
    )


@app.get("/api/leads", response_model=list[LeadOut])
def list_leads(
    alerts_only: bool = Query(False),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    business = seed_if_empty(db)
    q = db.query(Lead).filter(Lead.business_id == business.id)
    if alerts_only:
        q = q.filter(Lead.should_alert.is_(True))
    leads = q.order_by(Lead.created_at.desc()).limit(limit).all()
    return [lead_to_out(lead) for lead in leads]


@app.post("/api/ingest", response_model=LeadOut)
def ingest_post(payload: IngestRequest, db: Session = Depends(get_db)):
    business = seed_if_empty(db)
    if payload.business_id and payload.business_id != business.id:
        found = db.query(Business).filter(Business.id == payload.business_id).first()
        if not found:
            raise HTTPException(status_code=404, detail="Business not found")
        business = found

    result = classify_post(payload.text)
    template = pick_template(db, business, result.trade)
    reply_text = render_template(template.body, business) if template else ""

    lead = Lead(
        business_id=business.id,
        source=payload.source,
        group_name=payload.group_name.strip(),
        post_text=payload.text.strip(),
        post_url=payload.post_url.strip(),
        intent=result.intent.value,
        trade=result.trade,
        confidence=result.confidence,
        should_alert=result.should_alert,
        matched_keywords=",".join(result.matched_keywords),
        reasons=" | ".join(result.reasons),
        reply_text=reply_text if result.should_alert else "",
        status="alerted" if result.should_alert else "skipped",
    )

    if result.should_alert and payload.send_sms:
        ok, detail = send_lead_sms(
            to_number=business.alert_phone,
            group_name=lead.group_name,
            snippet=lead.post_text,
            reply_text=reply_text,
            post_url=lead.post_url,
        )
        lead.sms_sent = ok
        lead.sms_error = "" if ok else detail
        if ok:
            lead.status = "sms_sent"

    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead_to_out(lead)


@app.post("/api/leads/{lead_id}/status", response_model=LeadOut)
def update_lead_status(lead_id: int, payload: StatusUpdate, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    allowed = {"new", "alerted", "sms_sent", "replied", "won", "lost", "skipped", "ignored"}
    if payload.status not in allowed:
        raise HTTPException(status_code=400, detail=f"status must be one of {sorted(allowed)}")
    lead.status = payload.status
    lead.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(lead)
    return lead_to_out(lead)


@app.get("/")
def dashboard():
    return FileResponse("app/static/index.html")


app.mount("/static", StaticFiles(directory="app/static"), name="static")
