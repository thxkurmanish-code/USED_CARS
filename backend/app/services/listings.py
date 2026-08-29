from datetime import UTC, datetime
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.enums import ListingStatus, UserRole
from app.models.listing import CarListing, ListingStatusEvent
from app.models.user import User
from app.schemas.listing import ListingCreateRequest, ListingUpdateRequest


class ListingService:
    @staticmethod
    def create(session: Session, owner: User, payload: ListingCreateRequest) -> CarListing:
        listing = CarListing(owner_id=owner.id, **payload.model_dump())
        session.add(listing)
        session.flush()
        session.add(ListingStatusEvent(listing_id=listing.id, actor_id=owner.id, new_status=listing.status))
        return listing

    @staticmethod
    def get_owned(session: Session, listing_id: UUID, user: User) -> CarListing:
        listing = session.get(CarListing, listing_id)
        if listing is None or listing.is_archived:
            raise HTTPException(status_code=404, detail="Listing not found")
        if listing.owner_id != user.id and user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="You cannot change this listing")
        return listing

    @staticmethod
    def update(listing: CarListing, payload: ListingUpdateRequest) -> CarListing:
        for field, value in payload.model_dump().items():
            setattr(listing, field, value)
        return listing

    @staticmethod
    def submit(session: Session, listing: CarListing, actor: User) -> CarListing:
        if listing.status not in {ListingStatus.DRAFT, ListingStatus.REJECTED}:
            raise HTTPException(status_code=409, detail="This listing cannot be submitted now")
        previous_status = listing.status
        listing.status = ListingStatus.PENDING_REVIEW
        listing.rejection_reason = None
        session.add(ListingStatusEvent(listing_id=listing.id, actor_id=actor.id, previous_status=previous_status, new_status=listing.status))
        return listing

    @staticmethod
    def archive(session: Session, listing: CarListing, actor: User) -> None:
        listing.is_archived = True
        listing.archived_at = datetime.now(UTC)
        session.add(ListingStatusEvent(listing_id=listing.id, actor_id=actor.id, previous_status=listing.status, new_status=listing.status, reason="Archived by owner"))

    @staticmethod
    def browse(session: Session, *, page: int, page_size: int, brand: str | None, city: str | None, min_price: int | None, max_price: int | None) -> tuple[list[CarListing], int]:
        filters = [CarListing.status == ListingStatus.ACTIVE, CarListing.is_archived.is_(False)]
        if brand:
            filters.append(CarListing.brand.ilike(f"%{brand.strip()}%"))
        if city:
            filters.append(CarListing.city.ilike(f"%{city.strip()}%"))
        if min_price is not None:
            filters.append(CarListing.price >= min_price)
        if max_price is not None:
            filters.append(CarListing.price <= max_price)
        total = session.scalar(select(func.count()).select_from(CarListing).where(*filters)) or 0
        listings = session.scalars(select(CarListing).where(*filters).order_by(CarListing.created_at.desc()).offset((page - 1) * page_size).limit(page_size)).all()
        return list(listings), total
