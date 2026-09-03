from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Query, Response, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.api.dependencies import get_current_user, get_current_user_optional
from app.core.database import get_db_session
from app.models.enums import BodyType, FuelType, TransmissionType, UserRole
from app.models.listing import CarImage, CarListing
from app.models.user import User
from app.schemas.listing import (
    CarImageResponse,
    ListingCreateRequest,
    ListingDetail,
    ListingPage,
    ListingUpdateRequest,
)
from app.services.listings import ListingService
from app.services.storage import StorageService

router = APIRouter(prefix="/listings", tags=["listings"])


@router.get("", response_model=ListingPage)
def browse_listings(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    q: str | None = None,
    brand: str | None = None,
    city: str | None = None,
    fuel_type: FuelType | None = None,
    transmission: TransmissionType | None = None,
    body_type: BodyType | None = None,
    min_price: int | None = Query(None, ge=0),
    max_price: int | None = Query(None, ge=0),
    min_year: int | None = Query(None, ge=1886),
    max_year: int | None = Query(None, le=2100),
    max_km: int | None = Query(None, ge=0),
    sort_by: str | None = None,
    session: Session = Depends(get_db_session),
) -> ListingPage:
    items, total = ListingService.browse(
        session,
        page=page,
        page_size=page_size,
        q=q,
        brand=brand,
        city=city,
        fuel_type=fuel_type,
        transmission=transmission,
        body_type=body_type,
        min_price=min_price,
        max_price=max_price,
        min_year=min_year,
        max_year=max_year,
        max_km=max_km,
        sort_by=sort_by,
    )
    return ListingPage(items=items, total=total, page=page, page_size=page_size)



@router.get("/mine", response_model=list[ListingDetail])
def get_my_listings(
    session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> list[CarListing]:
    return list(
        session.scalars(
            select(CarListing)
            .options(joinedload(CarListing.images))
            .where(CarListing.owner_id == current_user.id, CarListing.is_archived.is_(False))
            .order_by(CarListing.created_at.desc())
        ).unique().all()
    )


@router.get("/{listing_id}", response_model=ListingDetail)
def get_listing(listing_id: UUID, session: Session = Depends(get_db_session)) -> CarListing:
    listing = session.scalar(
        select(CarListing)
        .options(joinedload(CarListing.images))
        .where(CarListing.id == listing_id)
    )
    if listing is None or listing.is_archived or listing.status.value != "active":
        raise HTTPException(status_code=404, detail="Listing not found")
    return listing




@router.post("", response_model=ListingDetail, status_code=status.HTTP_201_CREATED)
def create_listing(
    payload: ListingCreateRequest,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> CarListing:
    listing = ListingService.create(session, current_user, payload)
    session.commit()
    session.refresh(listing)
    return listing


@router.put("/{listing_id}", response_model=ListingDetail)
def update_listing(
    listing_id: UUID,
    payload: ListingUpdateRequest,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> CarListing:
    listing = ListingService.get_owned(session, listing_id, current_user)
    ListingService.update(listing, payload)
    session.commit()
    session.refresh(listing)
    return listing


@router.post("/{listing_id}/images", response_model=list[CarImageResponse])
def upload_listing_images(
    listing_id: UUID,
    files: list[UploadFile] = File(...),
    session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> list[CarImage]:
    listing = ListingService.get_owned(session, listing_id, current_user)
    existing_count = len(listing.images)

    saved_images = []
    for idx, file in enumerate(files):
        storage_key, public_id, content_type, byte_size, width, height = StorageService.save_image(file, listing_id)
        is_primary = (existing_count == 0 and idx == 0)
        image = CarImage(
            listing_id=listing.id,
            storage_key=storage_key,
            public_id=public_id,
            original_filename=file.filename or "image.jpg",
            content_type=content_type,
            byte_size=byte_size,
            width=width,
            height=height,
            sort_order=existing_count + idx,
            is_primary=is_primary,
        )
        session.add(image)
        saved_images.append(image)

    session.commit()
    for image in saved_images:
        session.refresh(image)
    return saved_images


@router.delete("/{listing_id}/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_listing_image(
    listing_id: UUID,
    image_id: UUID,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> Response:
    listing = ListingService.get_owned(session, listing_id, current_user)
    image = session.get(CarImage, image_id)
    if image is None or image.listing_id != listing.id:
        raise HTTPException(status_code=404, detail="Image not found")

    was_primary = image.is_primary
    StorageService.delete_image(image.storage_key, public_id=image.public_id)
    session.delete(image)
    session.flush()

    if was_primary:
        next_image = session.scalar(
            select(CarImage)
            .where(CarImage.listing_id == listing.id)
            .order_by(CarImage.sort_order.asc())
        )
        if next_image:
            next_image.is_primary = True

    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)



@router.post("/{listing_id}/submit", response_model=ListingDetail)
def submit_listing(
    listing_id: UUID,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> CarListing:
    listing = ListingService.get_owned(session, listing_id, current_user)
    ListingService.submit(session, listing, current_user)
    session.commit()
    session.refresh(listing)
    return listing


@router.post("/{listing_id}/sold", response_model=ListingDetail)
def mark_listing_sold(
    listing_id: UUID,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> CarListing:
    listing = ListingService.get_owned(session, listing_id, current_user)
    ListingService.mark_as_sold(session, listing, current_user)
    session.commit()
    session.refresh(listing)
    return listing


@router.delete("/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
def archive_listing(
    listing_id: UUID,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> Response:
    listing = ListingService.get_owned(session, listing_id, current_user)
    ListingService.archive(session, listing, current_user)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

