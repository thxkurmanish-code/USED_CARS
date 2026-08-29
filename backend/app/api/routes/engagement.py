from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.database import get_db_session
from app.models.engagement import Enquiry, WishlistItem
from app.models.enums import ListingStatus
from app.models.listing import CarListing
from app.models.user import User
from app.schemas.engagement import EnquiryCreateRequest, EnquiryResponse
from app.schemas.listing import ListingSummary

router = APIRouter(tags=["engagement"])


@router.get("/wishlist", response_model=list[ListingSummary])
def get_wishlist(session: Session = Depends(get_db_session), current_user: User = Depends(get_current_user)) -> list[CarListing]:
    return list(session.scalars(select(CarListing).join(WishlistItem).where(WishlistItem.user_id == current_user.id, CarListing.is_archived.is_(False)).order_by(WishlistItem.created_at.desc())).all())


@router.put("/wishlist/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
def save_listing(listing_id: UUID, session: Session = Depends(get_db_session), current_user: User = Depends(get_current_user)) -> None:
    listing = session.get(CarListing, listing_id)
    if listing is None or listing.status != ListingStatus.ACTIVE or listing.is_archived:
        raise HTTPException(status_code=404, detail="Listing not found")
    item = session.scalar(select(WishlistItem).where(WishlistItem.user_id == current_user.id, WishlistItem.listing_id == listing_id))
    if item is None:
        session.add(WishlistItem(user_id=current_user.id, listing_id=listing_id))
        session.commit()


@router.delete("/wishlist/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_saved_listing(listing_id: UUID, session: Session = Depends(get_db_session), current_user: User = Depends(get_current_user)) -> None:
    item = session.scalar(select(WishlistItem).where(WishlistItem.user_id == current_user.id, WishlistItem.listing_id == listing_id))
    if item is not None:
        session.delete(item)
        session.commit()


@router.post("/listings/{listing_id}/enquiries", response_model=EnquiryResponse, status_code=status.HTTP_201_CREATED)
def create_enquiry(listing_id: UUID, payload: EnquiryCreateRequest, session: Session = Depends(get_db_session), current_user: User = Depends(get_current_user)) -> Enquiry:
    listing = session.get(CarListing, listing_id)
    if listing is None or listing.status != ListingStatus.ACTIVE or listing.is_archived:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot enquire about your own listing")
    enquiry = Enquiry(listing_id=listing.id, buyer_id=current_user.id, seller_id=listing.owner_id, message=payload.message.strip())
    session.add(enquiry)
    session.commit()
    session.refresh(enquiry)
    return enquiry


@router.get("/enquiries", response_model=list[EnquiryResponse])
def get_enquiries(session: Session = Depends(get_db_session), current_user: User = Depends(get_current_user)) -> list[Enquiry]:
    return list(session.scalars(select(Enquiry).where((Enquiry.buyer_id == current_user.id) | (Enquiry.seller_id == current_user.id)).order_by(Enquiry.created_at.desc())).all())
