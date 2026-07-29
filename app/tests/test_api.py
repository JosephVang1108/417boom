from __future__ import annotations

import os

import pytest
from fastapi.testclient import TestClient

# Use an isolated DB for tests
os.environ["DATABASE_URL"] = "sqlite:///./speedlead_test.db"
os.environ["TEXTRAZOR_API_KEY"] = ""
os.environ["TWILIO_ACCOUNT_SID"] = ""

from app.db import Base, engine, SessionLocal  # noqa: E402
from app.main import app  # noqa: E402
from app.seed import seed_if_empty  # noqa: E402


@pytest.fixture(autouse=True)
def fresh_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_if_empty(db)
    db.close()
    yield


@pytest.fixture
def client():
    return TestClient(app)


def test_health(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["ok"] is True


def test_ingest_hire_request(client):
    res = client.post(
        "/api/ingest",
        json={
            "text": "Anyone know a good plumber in Nixa? Toilet overflowing ASAP.",
            "group_name": "Nixa Neighbors",
            "send_sms": False,
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["should_alert"] is True
    assert data["intent"] == "hire_request"
    assert data["trade"] == "plumbing"
    assert "Ozark Comfort Pros" in data["reply_text"] or "Mike" in data["reply_text"]
    assert "—" not in data["reply_text"]
    assert "+1" not in data["reply_text"]
    assert not data["reply_text"].startswith("+")
    # local-looking phone, no country code prefix in the reply
    assert "(417)" in data["reply_text"] or "417" in data["reply_text"]


def test_ingest_complaint_skipped(client):
    res = client.post(
        "/api/ingest",
        json={
            "text": "Stay away from Joe's Plumbing. Worst plumber ever, complete scam.",
            "group_name": "Springfield Moms",
            "send_sms": False,
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["should_alert"] is False
    assert data["intent"] == "complaint"


def test_webhook_requires_secret(client):
    res = client.post(
        "/api/hooks/posts",
        json={"text": "Anyone know a good plumber in Nixa?"},
    )
    assert res.status_code == 401


def test_webhook_ingest(client):
    res = client.post(
        "/api/hooks/posts",
        headers={"X-Speedlead-Secret": "dev-speedlead-hook"},
        json={
            "text": "Looking for HVAC help, AC not working today.",
            "post_url": "https://www.facebook.com/groups/example",
            "source": "chrome_extension",
            "send_sms": False,
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["should_alert"] is True
    assert data["source"] == "chrome_extension"

