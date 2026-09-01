from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.api.dependencies import get_current_user, require_role
from app.core.database import get_db_session
from app.models.enums import ListingStatus, TestDriveStatus, UserRole
from app.models.listing import CarListing
from app.models.test_drive import TestDrive
from app.models.user import User
from app.schemas.test_drive import (
    TestDriveCreateRequest,
    TestDriveResponse,
    TestDriveStatusUpdateRequest,
)

router = APIRouter(tags=["test-drives"])
admin_required = require_role(UserRole.ADMIN)


@router.post("/test-drives", response_model=TestDriveResponse, status_code=status.HTTP_201_CREATED)
def request_test_drive(
    payload: TestDriveCreateRequest,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> TestDrive:
    listing = session.get(CarListing, payload.listing_id)
    if listing is None or listing.status != ListingStatus.ACTIVE or listing.is_archived:
        raise HTTPException(status_code=404, detail="Listing not available for test drive")

    test_drive = TestDrive(
        listing_id=listing.id,
        customer_id=current_user.id,
        preferred_date=payload.preferred_date.strip(),
        preferred_time=payload.preferred_time.strip(),
        contact_phone=payload.contact_phone.strip(),
        message=payload.message.strip() if payload.message else None,
        status=TestDriveStatus.PENDING,
    )
    session.add(test_drive)
    session.commit()
    session.refresh(test_drive)
    return test_drive


@router.get("/test-drives/mine", response_model=list[TestDriveResponse])
def get_my_test_drives(
    session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> list[TestDrive]:
    return list(
        session.scalars(
            select(TestDrive)
            .options(joinedload(TestDrive.listing).joinedload(CarListing.images))
            .where(TestDrive.customer_id == current_user.id)
            .order_by(TestDrive.created_at.desc())
        ).unique().all()
    )


@router.get("/admin/test-drives", response_model=list[TestDriveResponse])
def get_admin_test_drives(
    session: Session = Depends(get_db_session),
    admin: User = Depends(admin_required),
) -> list[TestDrive]:
    return list(
        session.scalars(
            select(TestDrive)
            .options(joinedload(TestDrive.listing).joinedload(CarListing.images))
            .order_by(TestDrive.created_at.desc())
        ).unique().all()
    )


@router.post("/admin/test-drives/{test_drive_id}/status", response_model=TestDriveResponse)
def update_test_drive_status(
    test_drive_id: UUID,
    payload: TestDriveStatusUpdateRequest,
    session: Session = Depends(get_db_session),
    admin: User = Depends(admin_required),
) -> TestDrive:
    test_drive = session.get(TestDrive, test_drive_id)
    if test_drive is None:
        raise HTTPException(status_code=404, detail="Test drive request not found")

    test_drive.status = payload.status
    if payload.admin_notes is not None:
        test_drive.admin_notes = payload.admin_notes.strip()
    if payload.rescheduled_date is not None:
        test_drive.rescheduled_date = payload.rescheduled_date.strip()
    if payload.rescheduled_time is not None:
        test_drive.rescheduled_time = payload.rescheduled_time.strip()

    session.commit()
    session.refresh(test_drive)
    return test_drive
