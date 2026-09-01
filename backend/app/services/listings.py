from datetime import UTC, datetime
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func, select, or_
from sqlalchemy.orm import Session, joinedload

from app.models.enums import BodyType, FuelType, ListingStatus, SellerType, TransmissionType, UserRole

from app.models.listing import CarListing, ListingStatusEvent
from app.models.user import User
from app.schemas.listing import ListingCreateRequest, ListingUpdateRequest


class ListingService:
    @staticmethod
    def create(session: Session, owner: User, payload: ListingCreateRequest) -> CarListing:
        is_verified = (owner.role == UserRole.ADMIN or payload.seller_type.value == "dealer")
        status = ListingStatus.ACTIVE if owner.role == UserRole.ADMIN else ListingStatus.DRAFT
        seller_type = SellerType.DEALER if owner.role == UserRole.ADMIN else payload.seller_type

        data = payload.model_dump()
        data["status"] = status
        data["seller_type"] = seller_type

        listing = CarListing(
            owner_id=owner.id,
            is_verified=is_verified,
            **data,
        )
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
    def mark_as_sold(session: Session, listing: CarListing, actor: User) -> CarListing:
        if listing.status != ListingStatus.ACTIVE:
            raise HTTPException(status_code=400, detail="Only active listings can be marked as sold")
        previous_status = listing.status
        listing.status = ListingStatus.SOLD
        session.add(ListingStatusEvent(listing_id=listing.id, actor_id=actor.id, previous_status=previous_status, new_status=ListingStatus.SOLD, reason="Marked sold by seller"))
        return listing

    @staticmethod
    def archive(session: Session, listing: CarListing, actor: User) -> None:
        listing.is_archived = True
        listing.archived_at = datetime.now(UTC)
        session.add(ListingStatusEvent(listing_id=listing.id, actor_id=actor.id, previous_status=listing.status, new_status=listing.status, reason="Archived by owner"))

    @staticmethod
    def browse(
        session: Session,
        *,
        page: int,
        page_size: int,
        q: str | None = None,
        brand: str | None = None,
        city: str | None = None,
        fuel_type: FuelType | None = None,
        transmission: TransmissionType | None = None,
        body_type: BodyType | None = None,
        min_price: int | None = None,
        max_price: int | None = None,
        min_year: int | None = None,
        max_year: int | None = None,
        max_km: int | None = None,
        sort_by: str | None = None,
    ) -> tuple[list[CarListing], int]:
        filters = [CarListing.status == ListingStatus.ACTIVE, CarListing.is_archived.is_(False)]
        
        if q:
            term = f"%{q.strip()}%"
            filters.append(
                or_(
                    CarListing.brand.ilike(term),
                    CarListing.model.ilike(term),
                    CarListing.variant.ilike(term),
                    CarListing.description.ilike(term),
                )
            )
        if brand:
            filters.append(CarListing.brand.ilike(f"%{brand.strip()}%"))
        if city:
            filters.append(CarListing.city.ilike(f"%{city.strip()}%"))
        if fuel_type:
            filters.append(CarListing.fuel_type == fuel_type)
        if transmission:
            filters.append(CarListing.transmission == transmission)
        if body_type:
            filters.append(CarListing.body_type == body_type)
        if min_price is not None:
            filters.append(CarListing.price >= min_price)
        if max_price is not None:
            filters.append(CarListing.price <= max_price)
        if min_year is not None:
            filters.append(CarListing.manufacturing_year >= min_year)
        if max_year is not None:
            filters.append(CarListing.manufacturing_year <= max_year)
        if max_km is not None:
            filters.append(CarListing.kilometers_driven <= max_km)

        total = session.scalar(select(func.count()).select_from(CarListing).where(*filters)) or 0

        query = select(CarListing).options(joinedload(CarListing.images)).where(*filters)

        if sort_by == "price_asc":
            query = query.order_by(CarListing.price.asc())
        elif sort_by == "price_desc":
            query = query.order_by(CarListing.price.desc())
        elif sort_by == "mileage_asc":
            query = query.order_by(CarListing.kilometers_driven.asc())
        elif sort_by == "year_desc":
            query = query.order_by(CarListing.manufacturing_year.desc())
        else:
            query = query.order_by(CarListing.created_at.desc())


        listings = session.scalars(query.offset((page - 1) * page_size).limit(page_size)).unique().all()
        return list(listings), total

