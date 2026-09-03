import os
import uuid
import pytest
from unittest.mock import patch
from fastapi import HTTPException
from fastapi.testclient import TestClient

os.environ.setdefault("APP_SECRET_KEY", "test-secret-key-for-testing-purposes-12345")

from app.main import app
from app.core.database import SessionLocal, engine
from app.models.base import Base
from app.models.listing import CarListing, CarImage
from app.models.user import User
from app.models.enums import UserRole, FuelType, TransmissionType, BodyType, SellerType, ListingStatus
from app.services.storage import StorageService
from app.services.listings import ListingService

client = TestClient(app)


@pytest.fixture
def test_admin_and_car():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    suffix = uuid.uuid4().hex[:6]
    admin = User(
        email=f"admin_deletion_{suffix}@example.com",
        password_hash="hashed_pw",
        role=UserRole.ADMIN,
        is_active=True,
    )
    session.add(admin)
    session.commit()
    session.refresh(admin)

    car = CarListing(
        owner_id=admin.id,
        brand="BMW",
        model="M3",
        manufacturing_year=2024,
        price=7500000,
        kilometers_driven=5000,
        fuel_type=FuelType.PETROL,
        transmission=TransmissionType.AUTOMATIC,
        body_type=BodyType.SEDAN,
        owner_count=1,
        city="Delhi",
        state="Delhi",
        description="Pristine condition BMW M3 Competition",
        seller_type=SellerType.DEALER,
        status=ListingStatus.ACTIVE,
    )
    session.add(car)
    session.commit()
    session.refresh(car)
    
    yield session, admin, car
    
    session.close()


def test_delete_car_with_no_images(test_admin_and_car):
    session, admin, car = test_admin_and_car
    car_id = car.id

    with patch("app.services.storage.StorageService.delete_image") as mock_delete:
        ListingService.delete(session, car, admin)
        session.commit()

        # Storage delete not called since 0 images
        mock_delete.assert_not_called()

        # Database record must be deleted
        assert session.get(CarListing, car_id) is None


def test_delete_car_with_multiple_images(test_admin_and_car):
    session, admin, car = test_admin_and_car
    car_id = car.id

    img1 = CarImage(
        listing_id=car_id,
        storage_key="https://res.cloudinary.com/demo/image/upload/v1234/test1.jpg",
        public_id="test_pid_1",
        original_filename="front.jpg",
        content_type="image/jpeg",
        byte_size=1024,
        sort_order=0,
        is_primary=True,
    )
    img2 = CarImage(
        listing_id=car_id,
        storage_key="https://res.cloudinary.com/demo/image/upload/v1234/test2.jpg",
        public_id="test_pid_2",
        original_filename="back.jpg",
        content_type="image/jpeg",
        byte_size=2048,
        sort_order=1,
        is_primary=False,
    )
    session.add_all([img1, img2])
    session.commit()

    img1_id, img2_id = img1.id, img2.id

    with patch("app.services.storage.StorageService.delete_image") as mock_delete:
        ListingService.delete(session, car, admin)
        session.commit()

        # Storage delete called for both images with public_ids
        assert mock_delete.call_count == 2
        mock_delete.assert_any_call("https://res.cloudinary.com/demo/image/upload/v1234/test1.jpg", public_id="test_pid_1")
        mock_delete.assert_any_call("https://res.cloudinary.com/demo/image/upload/v1234/test2.jpg", public_id="test_pid_2")

        # Database records must be deleted
        assert session.get(CarListing, car_id) is None
        assert session.get(CarImage, img1_id) is None
        assert session.get(CarImage, img2_id) is None


def test_delete_single_individual_image(test_admin_and_car):
    session, admin, car = test_admin_and_car
    car_id = car.id

    img1 = CarImage(
        listing_id=car_id,
        storage_key="https://res.cloudinary.com/demo/image/upload/v1234/single1.jpg",
        public_id="single_pid_1",
        original_filename="img1.jpg",
        content_type="image/jpeg",
        byte_size=500,
        sort_order=0,
        is_primary=True,
    )
    session.add(img1)
    session.commit()
    img1_id = img1.id

    with patch("app.services.storage.StorageService.delete_image") as mock_delete:
        StorageService.delete_image(img1.storage_key, public_id=img1.public_id)
        session.delete(img1)
        session.commit()

        mock_delete.assert_called_once_with(
            "https://res.cloudinary.com/demo/image/upload/v1234/single1.jpg",
            public_id="single_pid_1",
        )

        assert session.get(CarImage, img1_id) is None
        # Car itself remains intact
        assert session.get(CarListing, car_id) is not None


def test_handle_cloudinary_deletion_failure():
    with patch("app.services.storage.StorageService._configure_cloudinary", return_value=True), \
         patch("cloudinary.uploader.destroy", side_effect=Exception("API connection timeout")):

        with pytest.raises(HTTPException) as exc_info:
            StorageService.delete_image("https://res.cloudinary.com/demo/image/upload/v123/err.jpg", public_id="err_pid")

        assert exc_info.value.status_code == 500
        assert "Cloudinary image deletion failed for err_pid" in exc_info.value.detail
