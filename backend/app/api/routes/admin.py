from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import require_role
from app.core.database import get_db_session
from app.models.engagement import AuditLog
from app.models.enums import ListingStatus, UserRole
from app.models.listing import CarListing, ListingStatusEvent
from app.models.user import User
from app.schemas.listing import ListingDetail

router = APIRouter(prefix="/admin", tags=["administration"])
admin_required = require_role(UserRole.ADMIN)


@router.get("/listings/pending", response_model=list[ListingDetail])
def pending_listings(session: Session = Depends(get_db_session), admin: User = Depends(admin_required)) -> list[CarListing]:
    return list(session.scalars(select(CarListing).where(CarListing.status == ListingStatus.PENDING_REVIEW).order_by(CarListing.created_at.asc())).all())


def transition(session: Session, admin: User, listing_id: UUID, new_status: ListingStatus, reason: str | None = None) -> CarListing:
    listing = session.get(CarListing, listing_id)
    if listing is None:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.status != ListingStatus.PENDING_REVIEW:
        raise HTTPException(status_code=409, detail="Only pending listings can be reviewed")
    previous_status = listing.status
    listing.status = new_status
    listing.rejection_reason = reason if new_status == ListingStatus.REJECTED else None
    session.add(ListingStatusEvent(listing_id=listing.id, actor_id=admin.id, previous_status=previous_status, new_status=new_status, reason=reason))
    session.add(AuditLog(actor_id=admin.id, action=f"listing.{new_status.value}", target_type="car_listing", target_id=listing.id, metadata_json={"reason": reason} if reason else None))
    session.commit()
    session.refresh(listing)
    return listing


@router.post("/listings/{listing_id}/approve", response_model=ListingDetail)
def approve_listing(listing_id: UUID, session: Session = Depends(get_db_session), admin: User = Depends(admin_required)) -> CarListing:
    return transition(session, admin, listing_id, ListingStatus.ACTIVE)


@router.post("/listings/{listing_id}/reject", response_model=ListingDetail)
def reject_listing(listing_id: UUID, reason: str, session: Session = Depends(get_db_session), admin: User = Depends(admin_required)) -> CarListing:
    if len(reason.strip()) < 5:
        raise HTTPException(status_code=422, detail="A useful rejection reason is required")
    return transition(session, admin, listing_id, ListingStatus.REJECTED, reason.strip())
