import os
import sys
from pathlib import Path
from decimal import Decimal
import uuid

# Ensure backend path is in sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.core.config import get_settings
from app.core.database import engine, SessionLocal
from app.core.security import hash_password
import app.models  # Registers all SQLAlchemy models in Base.metadata
from app.models import Base, CarImage, CarListing, ListingStatusEvent, User, UserProfile
from app.models.enums import BodyType, FuelType, ListingStatus, SellerType, TransmissionType, UserRole



SAMPLE_CAR_IMAGES = [
    "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80",
    "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80",
    "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&q=80",
    "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80",
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80",
]

def seed_database():
    settings = get_settings()
    Base.metadata.create_all(bind=engine)

    session: Session = SessionLocal()
    try:
        if settings.app_env == "production":
            print("[SEED] Production environment detected.")
            prod_email = settings.production_admin_email
            prod_pass = settings.production_admin_password or "Carsdream@8954"
            prod_emails = list({prod_email.lower(), "dreamcarsbazzaar@gmail.com", "dreamcarsbazzar@gmail.com", "thxkurmanish@gmail.com"})


            for em in prod_emails:
                admin = session.query(User).filter(User.email == em).first()
                if not admin:
                    admin = User(
                        email=em,
                        password_hash=hash_password(prod_pass),
                        role=UserRole.ADMIN,
                        is_active=True,
                        is_email_verified=True,
                    )
                    session.add(admin)
                    print(f"[SUCCESS] Production Admin user created for {em}")
                else:
                    admin.password_hash = hash_password(prod_pass)
                    admin.role = UserRole.ADMIN
                    admin.is_active = True
                    print(f"[INFO] Production Admin user {em} password updated.")
            session.commit()
            return


        # Development / Testing Seeding Logic
        print("[SEED] Development environment detected. Seeding demo data...")

        # 1. Create or get Admin
        admin = session.query(User).filter(User.email == "admin@dreamcar.com").first()
        if not admin:
            admin = User(
                email="admin@dreamcar.com",
                password_hash=hash_password("Admin@123456"),
                role=UserRole.ADMIN,
                is_active=True,
                is_email_verified=True,
            )
            session.add(admin)

        # 2. Create Sellers & Buyers
        dealer = session.query(User).filter(User.email == "dealer@apexmotors.com").first()
        if not dealer:
            dealer = User(
                email="dealer@apexmotors.com",
                password_hash=hash_password("Dealer@123456"),
                role=UserRole.CUSTOMER,
                is_active=True,
                is_email_verified=True,
            )
            session.add(dealer)

        seller_jane = session.query(User).filter(User.email == "jane.seller@gmail.com").first()
        if not seller_jane:
            seller_jane = User(
                email="jane.seller@gmail.com",
                password_hash=hash_password("Seller@123456"),
                role=UserRole.CUSTOMER,
                is_active=True,
                is_email_verified=True,
            )
            session.add(seller_jane)

        buyer_alex = session.query(User).filter(User.email == "alex.buyer@gmail.com").first()
        if not buyer_alex:
            buyer_alex = User(
                email="alex.buyer@gmail.com",
                password_hash=hash_password("Buyer@123456"),
                role=UserRole.CUSTOMER,
                is_active=True,
                is_email_verified=True,
            )
            session.add(buyer_alex)

        session.commit()

        # 3. Create Sample Car Listings
        raw_listings = [
            {
                "owner": dealer,
                "brand": "BMW",
                "model": "3 Series",
                "variant": "330i M Sport",
                "manufacturing_year": 2023,
                "registration_year": 2023,
                "price": Decimal("4450000.00"),
                "kilometers_driven": 18500,
                "fuel_type": FuelType.PETROL,
                "transmission": TransmissionType.AUTOMATIC,
                "body_type": BodyType.SEDAN,
                "color": "Alpine White",
                "owner_count": 1,
                "city": "Mumbai",
                "state": "Maharashtra",
                "seller_type": SellerType.DEALER,
                "status": ListingStatus.ACTIVE,
                "is_featured": True,
                "features": ["Sunroof", "Leather Seats", "360 Camera", "Apple CarPlay", "Harman Kardon Audio"],
                "description": "Immaculate single-owner BMW 330i M Sport in Alpine White with full service history at BMW authorized dealership.",
                "image_idx": 0,
            },
            {
                "owner": seller_jane,
                "brand": "Toyota",
                "model": "Fortuner",
                "variant": "Legender 4x4",
                "manufacturing_year": 2022,
                "registration_year": 2022,
                "price": Decimal("4150000.00"),
                "kilometers_driven": 32000,
                "fuel_type": FuelType.DIESEL,
                "transmission": TransmissionType.AUTOMATIC,
                "body_type": BodyType.SUV,
                "color": "Attitude Black",
                "owner_count": 1,
                "city": "Bengaluru",
                "state": "Karnataka",
                "seller_type": SellerType.INDIVIDUAL,
                "status": ListingStatus.ACTIVE,
                "is_featured": True,
                "features": ["4x4 Drive", "Ventilated Seats", "JBL Premium Sound", "Power Tailgate"],
                "description": "Meticulously maintained Toyota Fortuner Legender 4x4. Driven mostly on highways for family road trips.",
                "image_idx": 1,
            },
            {
                "owner": seller_jane,
                "brand": "Honda",
                "model": "City",
                "variant": "ZX i-VTEC",
                "manufacturing_year": 2021,
                "registration_year": 2021,
                "price": Decimal("1120000.00"),
                "kilometers_driven": 28000,
                "fuel_type": FuelType.PETROL,
                "transmission": TransmissionType.MANUAL,
                "body_type": BodyType.SEDAN,
                "color": "Lunar Silver",
                "owner_count": 1,
                "city": "Delhi",
                "state": "Delhi",
                "seller_type": SellerType.INDIVIDUAL,
                "status": ListingStatus.ACTIVE,
                "is_featured": False,
                "features": ["Sunroof", "LaneWatch Camera", "LED Headlamps", "Cruise Control"],
                "description": "Pristine Honda City ZX top model. Doctor owned, pristine interior, regular Honda service records.",
                "image_idx": 2,
            },
            {
                "owner": dealer,
                "brand": "Tata",
                "model": "Nexon EV",
                "variant": "Empowered+ Long Range",
                "manufacturing_year": 2024,
                "registration_year": 2024,
                "price": Decimal("1680000.00"),
                "kilometers_driven": 9500,
                "fuel_type": FuelType.ELECTRIC,
                "transmission": TransmissionType.AUTOMATIC,
                "body_type": BodyType.SUV,
                "color": "Ocean Teal",
                "owner_count": 1,
                "city": "Pune",
                "state": "Maharashtra",
                "seller_type": SellerType.DEALER,
                "status": ListingStatus.ACTIVE,
                "is_featured": True,
                "features": ["360 Degree Camera", "Ventilated Seats", "Touchscreen", "V2L Charging"],
                "description": "Like-new 2024 Tata Nexon EV Long Range with 465km claimed range. 7.2kW fast wallbox charger included.",
                "image_idx": 3,
            },
            {
                "owner": dealer,
                "brand": "Hyundai",
                "model": "Creta",
                "variant": "SX (O) 1.5 Turbo DCT",
                "manufacturing_year": 2023,
                "registration_year": 2023,
                "price": Decimal("1750000.00"),
                "kilometers_driven": 15200,
                "fuel_type": FuelType.PETROL,
                "transmission": TransmissionType.DCT,
                "body_type": BodyType.SUV,
                "color": "Titan Grey",
                "owner_count": 1,
                "city": "Hyderabad",
                "state": "Telangana",
                "seller_type": SellerType.DEALER,
                "status": ListingStatus.ACTIVE,
                "is_featured": False,
                "features": ["Panoramic Sunroof", "Bose Audio", "ADAS Level 2", "Ventilated Seats"],
                "description": "Top-end Hyundai Creta Turbo DCT with ADAS Level 2 safety suite. First owner, showroom condition.",
                "image_idx": 4,
            },
            {
                "owner": seller_jane,
                "brand": "Mercedes-Benz",
                "model": "C-Class",
                "variant": "C200 Progressive",
                "manufacturing_year": 2020,
                "registration_year": 2020,
                "price": Decimal("3850000.00"),
                "kilometers_driven": 42000,
                "fuel_type": FuelType.PETROL,
                "transmission": TransmissionType.AUTOMATIC,
                "body_type": BodyType.SEDAN,
                "color": "Cavansite Blue",
                "owner_count": 1,
                "city": "Chennai",
                "state": "Tamil Nadu",
                "seller_type": SellerType.INDIVIDUAL,
                "status": ListingStatus.PENDING_REVIEW,
                "is_featured": False,
                "features": ["Burmester Surround Sound", "Panoramic Glass Roof", "Ambient Lighting"],
                "description": "Elegant Mercedes-Benz C200 Progressive in Cavansite Blue. Fully maintained at Sundaram Motors.",
                "image_idx": 0,
            }
        ]

        created_count = 0
        for item in raw_listings:
            existing = session.query(CarListing).filter(
                CarListing.brand == item["brand"],
                CarListing.model == item["model"],
                CarListing.owner_id == item["owner"].id
            ).first()

            if not existing:
                is_verified = (item["owner"].role == UserRole.ADMIN or item["seller_type"] == SellerType.DEALER)
                listing = CarListing(
                    owner_id=item["owner"].id,
                    brand=item["brand"],
                    model=item["model"],
                    variant=item["variant"],
                    manufacturing_year=item["manufacturing_year"],
                    registration_year=item["registration_year"],
                    price=item["price"],
                    kilometers_driven=item["kilometers_driven"],
                    fuel_type=item["fuel_type"],
                    transmission=item["transmission"],
                    body_type=item["body_type"],
                    color=item["color"],
                    owner_count=item["owner_count"],
                    city=item["city"],
                    state=item["state"],
                    seller_type=item["seller_type"],
                    status=item["status"],
                    is_featured=item["is_featured"],
                    is_verified=is_verified,
                    description=item["description"],
                    features=item["features"],
                )
                session.add(listing)
                session.flush()

                session.add(ListingStatusEvent(
                    listing_id=listing.id,
                    actor_id=item["owner"].id,
                    new_status=item["status"]
                ))

                img_url = f"{SAMPLE_CAR_IMAGES[item['image_idx'] % len(SAMPLE_CAR_IMAGES)]}&id={uuid.uuid4().hex[:6]}"
                car_img = CarImage(
                    listing_id=listing.id,
                    storage_key=img_url,
                    original_filename="sample_car.jpg",
                    content_type="image/jpeg",
                    byte_size=524288,
                    sort_order=0,
                    is_primary=True
                )

                session.add(car_img)
                created_count += 1

        session.commit()
        print(f"[SUCCESS] Seeding complete! Created {created_count} car listings.")
        print("[USERS] Test User Accounts:")
        print("  - Admin:    admin@dreamcar.com / Admin@123456")
        print("  - Dealer:   dealer@apexmotors.com / Dealer@123456")
        print("  - Seller:   jane.seller@gmail.com / Seller@123456")
        print("  - Buyer:    alex.buyer@gmail.com / Buyer@123456")

    except Exception as e:
        session.rollback()
        print(f"[ERROR] Error seeding database: {e}")
        raise
    finally:
        session.close()

if __name__ == "__main__":
    print("[SEED] Initializing database schema & seeding data...")
    seed_database()
