from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import require_role
from app.core.database import get_db_session
from app.models.contact import BusinessContact
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.contact import BusinessContactResponse, BusinessContactUpdateRequest

router = APIRouter(tags=["contact"])
admin_required = require_role(UserRole.ADMIN)


def _get_or_create_contact(session: Session) -> BusinessContact:
    contact = session.scalar(select(BusinessContact))
    if contact is None:
        contact = BusinessContact(
            business_name="Dream Car Bazaar",
            phone_number="+91 98765 43210",
            whatsapp_number="+91 98765 43210",
            email="contact@dreamcarbazaar.com",
            address="100 Prime Auto Plaza, Western Express Highway",
            city="Mumbai",
            state="Maharashtra",
            business_hours="Mon - Sat: 9:30 AM - 7:30 PM",
            google_maps_link="https://maps.google.com",
        )
        session.add(contact)
        session.commit()
        session.refresh(contact)
    return contact


@router.get("/contact", response_model=BusinessContactResponse)
def get_business_contact(session: Session = Depends(get_db_session)) -> BusinessContact:
    return _get_or_create_contact(session)


@router.put("/admin/contact", response_model=BusinessContactResponse)
def update_business_contact(
    payload: BusinessContactUpdateRequest,
    session: Session = Depends(get_db_session),
    admin: User = Depends(admin_required),
) -> BusinessContact:
    contact = _get_or_create_contact(session)
    for field, value in payload.model_dump().items():
        setattr(contact, field, value)

    session.commit()
    session.refresh(contact)
    return contact
