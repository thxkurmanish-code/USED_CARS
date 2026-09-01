import os
import uuid
from fastapi.testclient import TestClient

os.environ.setdefault("APP_SECRET_KEY", "test-secret-key-for-testing-purposes-12345")

from app.main import app

client = TestClient(app)


def test_flow_1_customer_listing_approval_lifecycle():
    # 1. Register seller customer with unique email
    suffix = uuid.uuid4().hex[:6]
    seller_email = f"test.seller.{suffix}@example.com"
    reg_resp = client.post("/api/v1/auth/register", json={
        "email": seller_email,
        "password": "Password12345",
        "display_name": "Test Seller"
    })
    assert reg_resp.status_code == 201
    seller_cookie = reg_resp.cookies.get("session_token")

    # 2. Create Draft Listing
    create_resp = client.post(
        "/api/v1/listings",
        headers={"Cookie": f"session_token={seller_cookie}"},
        json={
            "brand": "Audi",
            "model": "A4",
            "variant": "Technology 40 TFSI",
            "manufacturing_year": 2023,
            "registration_year": 2023,
            "price": 3800000,
            "kilometers_driven": 14000,
            "fuel_type": "petrol",
            "transmission": "automatic",
            "body_type": "sedan",
            "color": "Ibis White",
            "owner_count": 1,
            "city": "Mumbai",
            "state": "Maharashtra",
            "description": "Mint condition Audi A4 Technology in Ibis White. Single owner, company maintained.",
            "features": ["Sunroof", "Virtual Cockpit", "Bang & Olufsen Sound"],
            "seller_type": "individual"
        }
    )
    assert create_resp.status_code == 201
    listing = create_resp.json()
    listing_id = listing["id"]
    assert listing["status"] == "draft"

    # Verify not public yet
    public_resp = client.get(f"/api/v1/listings/{listing_id}")
    assert public_resp.status_code == 404

    # 3. Submit listing for review
    submit_resp = client.post(
        f"/api/v1/listings/{listing_id}/submit",
        headers={"Cookie": f"session_token={seller_cookie}"}
    )
    assert submit_resp.status_code == 200
    assert submit_resp.json()["status"] == "pending_review"

    # 4. Register Admin
    admin_email = f"admin.{suffix}@example.com"
    client.post("/api/v1/auth/register", json={
        "email": admin_email,
        "password": "AdminPassword123",
        "display_name": "Admin Tester"
    })

    # Upgrade role to admin directly via DB
    from app.core.database import SessionLocal
    from app.models.user import User
    from app.models.enums import UserRole

    db = SessionLocal()
    admin_user = db.query(User).filter(User.email == admin_email).first()
    if admin_user:
        admin_user.role = UserRole.ADMIN
        db.commit()
    db.close()

    admin_login = client.post("/api/v1/auth/login", json={
        "email": admin_email,
        "password": "AdminPassword123"
    })
    admin_cookie = admin_login.cookies.get("session_token")

    # Admin approves listing
    approve_resp = client.post(
        f"/api/v1/admin/listings/{listing_id}/approve",
        headers={"Cookie": f"session_token={admin_cookie}"}
    )
    assert approve_resp.status_code == 200
    assert approve_resp.json()["status"] == "active"

    # 5. Verify listing is now public
    active_public_resp = client.get(f"/api/v1/listings/{listing_id}")
    assert active_public_resp.status_code == 200
    assert active_public_resp.json()["brand"] == "Audi"


def test_flow_2_test_drive_request_approval():
    suffix = uuid.uuid4().hex[:6]
    buyer_email = f"buyer.td.{suffix}@example.com"
    # 1. Register buyer
    buyer_resp = client.post("/api/v1/auth/register", json={
        "email": buyer_email,
        "password": "Password12345",
        "display_name": "Test Drive Buyer"
    })
    assert buyer_resp.status_code == 201
    buyer_cookie = buyer_resp.cookies.get("session_token")

    # 2. Get active car listing from database
    listings_resp = client.get("/api/v1/listings")
    assert listings_resp.status_code == 200
    items = listings_resp.json()["items"]
    assert len(items) > 0
    target_car_id = items[0]["id"]

    # 3. Buyer requests test drive
    req_resp = client.post(
        "/api/v1/test-drives",
        headers={"Cookie": f"session_token={buyer_cookie}"},
        json={
            "listing_id": target_car_id,
            "preferred_date": "2026-09-05",
            "preferred_time": "11:00 AM",
            "contact_phone": "+91 9988776655",
            "message": "Looking forward to test driving this car."
        }
    )
    assert req_resp.status_code == 201
    test_drive = req_resp.json()
    test_drive_id = test_drive["id"]
    assert test_drive["status"] == "pending"

    # 4. Admin approves request
    admin_email = f"admin.td.{suffix}@example.com"
    client.post("/api/v1/auth/register", json={
        "email": admin_email,
        "password": "AdminPassword123",
        "display_name": "Admin Tester"
    })
    from app.core.database import SessionLocal
    from app.models.user import User
    from app.models.enums import UserRole

    db = SessionLocal()
    admin_user = db.query(User).filter(User.email == admin_email).first()
    if admin_user:
        admin_user.role = UserRole.ADMIN
        db.commit()
    db.close()

    admin_login = client.post("/api/v1/auth/login", json={
        "email": admin_email,
        "password": "AdminPassword123"
    })
    admin_cookie = admin_login.cookies.get("session_token")

    approve_td = client.post(
        f"/api/v1/admin/test-drives/{test_drive_id}/status",
        headers={"Cookie": f"session_token={admin_cookie}"},
        json={
            "status": "approved",
            "admin_notes": "Appointment confirmed. Please arrive 10 minutes early."
        }
    )
    assert approve_td.status_code == 200
    assert approve_td.json()["status"] == "approved"

    # 5. Buyer checks status
    mine_td = client.get(
        "/api/v1/test-drives/mine",
        headers={"Cookie": f"session_token={buyer_cookie}"}
    )
    assert mine_td.status_code == 200
    drives = mine_td.json()
    assert any(d["id"] == test_drive_id and d["status"] == "approved" for d in drives)


def test_flow_3_customer_chat_messaging():
    suffix = uuid.uuid4().hex[:6]
    buyer_email = f"chat.buyer.{suffix}@example.com"
    buyer_resp = client.post("/api/v1/auth/register", json={
        "email": buyer_email,
        "password": "Password12345",
        "display_name": "Chat Buyer"
    })
    assert buyer_resp.status_code == 201
    buyer_cookie = buyer_resp.cookies.get("session_token")

    listings_resp = client.get("/api/v1/listings")
    car_id = listings_resp.json()["items"][0]["id"]

    conv_resp = client.post(
        f"/api/v1/chat/conversations?listing_id={car_id}",
        headers={"Cookie": f"session_token={buyer_cookie}"}
    )
    assert conv_resp.status_code == 201
    conv_id = conv_resp.json()["id"]

    # 2. Buyer posts message
    msg_resp = client.post(
        f"/api/v1/chat/conversations/{conv_id}/messages",
        headers={"Cookie": f"session_token={buyer_cookie}"},
        json={"body": "Hi, is this vehicle available for immediate delivery?"}
    )
    assert msg_resp.status_code == 201

    # 3. Admin replies
    admin_email = f"admin.chat.{suffix}@example.com"
    client.post("/api/v1/auth/register", json={
        "email": admin_email,
        "password": "AdminPassword123",
        "display_name": "Admin Tester"
    })
    from app.core.database import SessionLocal
    from app.models.user import User
    from app.models.enums import UserRole

    db = SessionLocal()
    admin_user = db.query(User).filter(User.email == admin_email).first()
    if admin_user:
        admin_user.role = UserRole.ADMIN
        db.commit()
    db.close()

    admin_login = client.post("/api/v1/auth/login", json={
        "email": admin_email,
        "password": "AdminPassword123"
    })
    admin_cookie = admin_login.cookies.get("session_token")

    admin_reply = client.post(
        f"/api/v1/chat/conversations/{conv_id}/messages",
        headers={"Cookie": f"session_token={admin_cookie}"},
        json={"body": "Hello! Yes, all documentation and vehicle inspection are complete for immediate transfer."}
    )
    assert admin_reply.status_code == 201

    # 4. Buyer fetches conversation thread and sees admin reply
    get_msgs = client.get(
        f"/api/v1/chat/conversations/{conv_id}/messages",
        headers={"Cookie": f"session_token={buyer_cookie}"}
    )
    assert get_msgs.status_code == 200
    messages = get_msgs.json()
    assert len(messages) >= 2
    assert any("all documentation" in m["body"] for m in messages)
