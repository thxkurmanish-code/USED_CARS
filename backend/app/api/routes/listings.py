from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.database import get_db_session
from app.models.listing import CarListing
from app.models.user import User
from app.schemas.listing import (
    ListingCreateRequest,
    ListingDetail,
    ListingPage,
    ListingUpdateRequest,
)
from app.services.listings import ListingService

router = APIRouter(prefix="/listings", tags=["listings"])


@router.get("", response_model=ListingPage)
def browse_listings(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=50), brand: str | None = None, city: str | None = None, min_price: int | None = Query(None, ge=0), max_price: int | None = Query(None, ge=0), session: Session = Depends(get_db_session)) -> ListingPage:
    items, total = ListingService.browse(session, page=page, page_size=page_size, brand=brand, city=city, min_price=min_price, max_price=max_price)
    return ListingPage(items=items, total=total, page=page, page_size=page_size)


@router.get("/{listing_id}", response_model=ListingDetail)
def get_listing(listing_id: UUID, session: Session = Depends(get_db_session)) -> CarListing:
    listing = session.get(CarListing, listing_id)
    if listing is None or listing.is_archived or listing.status.value != "active":
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Listing not found")
    return listing


@router.post("", response_model=ListingDetail, status_code=status.HTTP_201_CREATED)
def create_listing(payload: ListingCreateRequest, session: Session = Depends(get_db_session), current_user: User = Depends(get_current_user)) -> CarListing:
    listing = ListingService.create(session, current_user, payload)
    session.commit()
    session.refresh(listing)
    return listing


@router.put("/{listing_id}", response_model=ListingDetail)
def update_listing(listing_id: UUID, payload: ListingUpdateRequest, session: Session = Depends(get_db_session), current_user: User = Depends(get_current_user)) -> CarListing:
    listing = ListingService.get_owned(session, listing_id, current_user)
    ListingService.update(listing, payload)
    session.commit()
    session.refresh(listing)
    return listing


@router.post("/{listing_id}/submit", response_model=ListingDetail)
def submit_listing(listing_id: UUID, session: Session = Depends(get_db_session), current_user: User = Depends(get_current_user)) -> CarListing:
    listing = ListingService.get_owned(session, listing_id, current_user)
    ListingService.submit(session, listing, current_user)
    session.commit()
    session.refresh(listing)
    return listing


@router.delete("/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
def archive_listing(listing_id: UUID, session: Session = Depends(get_db_session), current_user: User = Depends(get_current_user)) -> Response:
    listing = ListingService.get_owned(session, listing_id, current_user)
    ListingService.archive(session, listing, current_user)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
