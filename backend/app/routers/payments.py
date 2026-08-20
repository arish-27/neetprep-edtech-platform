from __future__ import annotations

import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.db.database import get_async_session
from app.dependencies.auth import get_current_user, require_admin
from app.models.user import User
from app.schemas.payment import (
    PaymentConfigResponse,
    PaymentSubmitRequest,
    PaymentReviewRequest,
    PaymentPublic,
    PaymentListResponse,
    PaymentStatsResponse,
    CoursePricePublic,
    CoursePriceCreate,
    CoursePriceUpdate
)
from app.services.payment_service import payment_service

router = APIRouter(prefix="/payments", tags=["payments"])


# ── Configuration & Info ──────────────────────────────────────────────────────

@router.get("/config", response_model=PaymentConfigResponse)
async def get_payment_config():
    """Get UPI payment settings, QR code parameters, and subscription plan options."""
    return payment_service.get_payment_config()


# ── Student Payment Endpoints ─────────────────────────────────────────────────

@router.post("/upload-screenshot", response_model=dict)
async def upload_payment_screenshot(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload payment screenshot / receipt image."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing file")
    try:
        url = await payment_service.upload_screenshot(file)
        return {"screenshot_url": url, "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload screenshot: {str(e)}")


@router.post("/submit", response_model=PaymentPublic, status_code=status.HTTP_201_CREATED)
async def submit_payment(
    data: PaymentSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
):
    """
    Submit manual UPI payment details with UTR / Transaction ID for administrator verification.
    The payment initially remains 'pending'. User is NOT automatically marked as paid.
    """
    try:
        payment = await payment_service.submit_manual_payment(
            db=db,
            user_id=current_user.id,
            data=data
        )
        return PaymentPublic(
            id=str(payment.id),
            user_id=str(payment.user_id),
            user_name=current_user.username,
            user_email=current_user.email,
            course_id=str(payment.course_id) if payment.course_id else None,
            plan_name=payment.plan_name,
            transaction_id=payment.transaction_id,
            amount=payment.amount,
            currency=payment.currency,
            status=payment.status,
            payment_method=payment.payment_method or "upi",
            payment_date=payment.payment_date or payment.created_at,
            screenshot_url=payment.screenshot_url,
            notes=payment.notes,
            admin_notes=payment.admin_notes,
            created_at=payment.created_at,
            updated_at=payment.updated_at,
            paid_at=payment.paid_at,
            reviewed_at=payment.reviewed_at
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit payment request: {str(e)}")


@router.get("/my-payments", response_model=PaymentListResponse)
async def get_my_payments(
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
):
    """Get current student's payment history."""
    payments = await payment_service.get_user_payments(
        db=db,
        user_id=current_user.id,
        limit=limit,
        offset=offset
    )
    return PaymentListResponse(
        items=payments,
        total=len(payments)
    )


# ── Administrator Verification Endpoints ─────────────────────────────────────

@router.get("/admin/all", response_model=PaymentListResponse)
async def list_admin_payments(
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_async_session)
):
    """List all submitted payments with student details for administrator verification."""
    payments, total = await payment_service.list_admin_payments(
        db=db,
        status_filter=status_filter,
        limit=limit,
        offset=offset
    )
    return PaymentListResponse(
        items=payments,
        total=total
    )


@router.get("/admin/stats", response_model=PaymentStatsResponse)
async def get_admin_payment_stats(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_async_session)
):
    """Get count metrics for pending, approved, and rejected payments."""
    return await payment_service.get_payment_stats(db)


@router.post("/admin/{payment_id}/review", response_model=PaymentPublic)
async def review_payment(
    payment_id: uuid.UUID,
    review_data: PaymentReviewRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_async_session)
):
    """
    Approve or reject a student payment request:
    - If approved: Payment status becomes 'approved' and User.is_paid becomes True.
    - If rejected: Payment status becomes 'rejected' and User.is_paid remains False.
    """
    try:
        return await payment_service.review_payment(
            db=db,
            payment_id=payment_id,
            admin_user=current_user,
            status=review_data.status,
            admin_notes=review_data.admin_notes
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Payment review failed: {str(e)}")


# ── Course Pricing Endpoints ──────────────────────────────────────────────────

@router.get("/course/{course_id}/price", response_model=CoursePricePublic)
async def get_course_price(
    course_id: str,
    db: AsyncSession = Depends(get_async_session)
):
    """Get price for a specific course."""
    try:
        cid = uuid.UUID(course_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid course ID format")

    course_price = await payment_service.get_course_price(db, cid)
    if not course_price:
        raise HTTPException(status_code=404, detail="Course price not set")

    return CoursePricePublic(
        id=str(course_price.id),
        course_id=str(course_price.course_id),
        price=course_price.price,
        original_price=course_price.original_price,
        currency=course_price.currency,
        is_free=course_price.is_free,
        discount_percentage=course_price.discount_percentage,
        discount_valid_until=course_price.discount_valid_until,
        created_at=course_price.created_at,
        updated_at=course_price.updated_at
    )


@router.post("/course/{course_id}/price", response_model=CoursePricePublic)
async def set_course_price(
    course_id: str,
    price_data: CoursePriceCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_async_session)
):
    """Set course price (Admin only)."""
    try:
        cid = uuid.UUID(course_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid course ID format")

    course_price = await payment_service.set_course_price(
        db=db,
        course_id=cid,
        price=price_data.price,
        original_price=price_data.original_price,
        discount_percentage=price_data.discount_percentage,
        is_free=price_data.is_free
    )
    return CoursePricePublic(
        id=str(course_price.id),
        course_id=str(course_price.course_id),
        price=course_price.price,
        original_price=course_price.original_price,
        currency=course_price.currency,
        is_free=course_price.is_free,
        discount_percentage=course_price.discount_percentage,
        discount_valid_until=course_price.discount_valid_until,
        created_at=course_price.created_at,
        updated_at=course_price.updated_at
    )
