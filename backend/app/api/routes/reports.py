from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.api.dependencies import get_current_user, require_role
from app.core.database import get_db_session
from app.models.engagement import ListingReport
from app.models.enums import ReportStatus, UserRole
from app.models.listing import CarListing
from app.models.user import User
from app.schemas.reports import ListingReportCreateRequest, ListingReportResponse

router = APIRouter(tags=["reports"])
admin_required = require_role(UserRole.ADMIN)


@router.post("/listings/{listing_id}/report", response_model=ListingReportResponse, status_code=status.HTTP_201_CREATED)
def report_listing(
    listing_id: UUID,
    payload: ListingReportCreateRequest,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> ListingReport:
    listing = session.get(CarListing, listing_id)
    if listing is None or listing.is_archived:
        raise HTTPException(status_code=404, detail="Listing not found")

    report = ListingReport(
        listing_id=listing.id,
        reporter_id=current_user.id,
        reason=payload.reason.strip(),
        details=payload.details.strip() if payload.details else None,
        status=ReportStatus.OPEN,
    )
    session.add(report)
    session.commit()
    session.refresh(report)
    return report


@router.get("/admin/reports", response_model=list[ListingReportResponse])
def list_admin_reports(
    session: Session = Depends(get_db_session),
    admin: User = Depends(admin_required),
) -> list[ListingReport]:
    return list(
        session.scalars(
            select(ListingReport)
            .options(joinedload(ListingReport.listing).joinedload(CarListing.images))
            .order_by(ListingReport.created_at.desc())
        ).unique().all()
    )


@router.post("/admin/reports/{report_id}/resolve", response_model=ListingReportResponse)
def resolve_report(
    report_id: UUID,
    session: Session = Depends(get_db_session),
    admin: User = Depends(admin_required),
) -> ListingReport:
    report = session.get(ListingReport, report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")

    report.status = ReportStatus.RESOLVED
    report.resolved_at = datetime.now(UTC)
    session.commit()
    session.refresh(report)
    return report
