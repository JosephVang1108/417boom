from __future__ import annotations

from app.config import get_settings


def send_lead_sms(*, to_number: str, group_name: str, snippet: str, reply_text: str, post_url: str) -> tuple[bool, str]:
    """Send SMS via Twilio. Returns (ok, detail)."""
    settings = get_settings()
    if not (settings.twilio_account_sid and settings.twilio_auth_token and settings.twilio_from_number):
        return False, "twilio_not_configured"

    if not to_number:
        return False, "missing_alert_phone"

    try:
        from twilio.rest import Client
    except ImportError:
        return False, "twilio_package_missing"

    group = group_name or "Facebook group"
    short = snippet.strip().replace("\n", " ")
    if len(short) > 140:
        short = short[:137] + "..."

    body = f"SpeedLead · {group}\n{short}"
    if post_url:
        body += f"\n{post_url}"
    body += f"\n\nReply ready:\n{reply_text}"
    if len(body) > 1500:
        body = body[:1497] + "..."

    try:
        client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
        message = client.messages.create(
            body=body,
            from_=settings.twilio_from_number,
            to=to_number,
        )
        return True, message.sid
    except Exception as exc:  # noqa: BLE001
        return False, f"{type(exc).__name__}: {exc}"
