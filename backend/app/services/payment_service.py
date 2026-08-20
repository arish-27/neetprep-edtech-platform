from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, or_
from sqlalchemy.orm import selectinload
from fastapi import UploadFile

from app.models.payment import Payment, CoursePrice, PaymentStatus, PaymentMethod
from app.models.user import User
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.schemas.payment import (
    PaymentSubmitRequest,
    PaymentPublic,
    PaymentConfigResponse,
    PlanInfo,
    PaymentStatsResponse
)
from app.core.settings import settings
from app.utils.files import save_upload_file


# Default subscription plans for NEET prep
DEMO_PLANS = [
    PlanInfo(
        id="neet_crash_course",
        name="NEET Crash Course Plan",
        price=999.0,
        original_price=2499.0,
        discount_percentage=60,
        currency="INR",
        duration="3 Months",
        description="Focused high-yield crash course with chapter-wise video lessons, rapid revision notes, and targeted practice quizzes.",
        features=[
            "All Recorded Video Lectures (Phy, Chem, Bio)",
            "Chapter-wise Revision Notes Vault",
            "5,000+ Curated NEET Practice MCQs",
            "10 Full-length Mock Tests with All-India Rank",
            "Basic AI Doubt Solving Assistant",
            "Ad-free learning experience"
        ],
        is_popular=False
    ),
    PlanInfo(
        id="neet_all_access_pro",
        name="NEET All-Access Pro Plan",
        price=1999.0,
        original_price=4999.0,
        discount_percentage=60,
        currency="INR",
        duration="Full 1-Year Cycle",
        description="The ultimate all-inclusive preparation suite. Unlock every single premium lecture, test series, deep analytics, and 24/7 AI tutor.",
        features=[
            "Complete Access to ALL Subjects & Courses",
            "Unlimited Full-Length & Subject Mock Tests",
            "24/7 Unlimited AI NEET Tutor Assistant",
            "Deep Chapter & Subject Performance Analytics",
            "Personalized NEET Rank Predictor Engine",
            "Live Classes & Interactive Doubt Sessions",
            "Downloadable PDF Notes & Formula Sheets",
            "Priority Verification & Teacher Support"
        ],
        is_popular=True
    ),
    PlanInfo(
        id="neet_super_30_elite",
        name="Super 30 Elite Mentorship Plan",
        price=3499.0,
        original_price=7999.0,
        discount_percentage=56,
        currency="INR",
        duration="18 Months Access",
        description="Comprehensive master bundle including 1-on-1 teacher doubt resolution, bespoke study planner, and hard-copy materials support.",
        features=[
            "Everything in All-Access Pro Plan",
            "Dedicated NEET Faculty Mentorship",
            "Personalized AI-driven Adaptive Test Creator",
            "Weekly 1-on-1 Doubt Clearing Sessions",
            "Full Archive of Past 15 Years NEET Papers",
            "Lifetime Revision Vault Access"
        ],
        is_popular=False
    )
]


class PaymentService:
    def get_payment_config(self) -> PaymentConfigResponse:
        """Get UPI configuration, payee information, and subscription plans."""
        return PaymentConfigResponse(
            upi_id=settings.DEMO_UPI_ID or "neetlearning@upi",
            payee_name=settings.DEMO_UPI_PAYEE_NAME or "NEET Learning Platform",
            demo_mode=True,
            notice="This is a DEMO/MANUAL UPI payment system. Scan the QR code or send payment to the UPI ID, then submit your Transaction ID / UTR for admin approval.",
            plans=DEMO_PLANS
        )

    async def submit_manual_payment(
        self,
        db: AsyncSession,
        *,
        user_id: uuid.UUID,
        data: PaymentSubmitRequest
    ) -> Payment:
        """
        Record a manual UPI payment submission from a student.
        Initial status is ALWAYS 'pending'. User is NOT marked as paid.
        """
        # Validate or parse payment date
        p_date = data.payment_date or datetime.now(timezone.utc)
        
        parsed_course_id = None
        if data.course_id:
            try:
                parsed_course_id = uuid.UUID(data.course_id)
            except Exception:
                pass

        payment = Payment(
            user_id=user_id,
            course_id=parsed_course_id,
            transaction_id=data.transaction_id.strip(),
            amount=float(data.amount),
            currency="INR",
            status="pending",
            payment_method="upi",
            plan_name=data.plan_name or "NEET All-Access Pro",
            payment_date=p_date,
            screenshot_url=data.screenshot_url,
            notes=data.notes,
            receipt=f"UPI_{data.transaction_id.strip()[:16]}_{int(datetime.now(timezone.utc).timestamp())}"
        )

        db.add(payment)
        await db.commit()
        await db.refresh(payment)
        return payment

    async def upload_screenshot(self, file: UploadFile) -> str:
        """Upload and save payment proof screenshot."""
        file_url, _ = await save_upload_file(file)
        return file_url

    async def get_user_payments(
        self,
        db: AsyncSession,
        *,
        user_id: uuid.UUID,
        limit: int = 50,
        offset: int = 0
    ) -> list[PaymentPublic]:
        """Fetch all payment submissions for a student."""
        stmt = (
            select(Payment)
            .where(Payment.user_id == user_id)
            .order_by(Payment.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        res = await db.execute(stmt)
        payments = res.scalars().all()

        out = []
        for p in payments:
            out.append(PaymentPublic(
                id=str(p.id),
                user_id=str(p.user_id),
                course_id=str(p.course_id) if p.course_id else None,
                plan_name=p.plan_name,
                transaction_id=p.transaction_id or p.razorpay_payment_id,
                amount=p.amount,
                currency=p.currency,
                status=p.status,
                payment_method=p.payment_method or "upi",
                payment_date=p.payment_date or p.created_at,
                screenshot_url=p.screenshot_url,
                notes=p.notes,
                admin_notes=p.admin_notes,
                created_at=p.created_at,
                updated_at=p.updated_at,
                paid_at=p.paid_at,
                reviewed_at=p.reviewed_at
            ))
        return out

    async def list_admin_payments(
        self,
        db: AsyncSession,
        *,
        status_filter: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> tuple[list[PaymentPublic], int]:
        """Fetch payments for admin verification with user details."""
        stmt = select(Payment).options(selectinload(Payment.user)).order_by(Payment.created_at.desc())
        count_stmt = select(func.count(Payment.id))

        if status_filter and status_filter.lower() not in ("all", ""):
            clean_status = status_filter.lower().strip()
            stmt = stmt.where(Payment.status == clean_status)
            count_stmt = count_stmt.where(Payment.status == clean_status)

        total_res = await db.execute(count_stmt)
        total = total_res.scalar() or 0

        res = await db.execute(stmt.limit(limit).offset(offset))
        payments = res.scalars().all()

        out = []
        for p in payments:
            u_name = p.user.username if p.user else None
            u_email = p.user.email if p.user else None
            out.append(PaymentPublic(
                id=str(p.id),
                user_id=str(p.user_id),
                user_name=u_name,
                user_email=u_email,
                course_id=str(p.course_id) if p.course_id else None,
                plan_name=p.plan_name,
                transaction_id=p.transaction_id or p.razorpay_payment_id,
                amount=p.amount,
                currency=p.currency,
                status=p.status,
                payment_method=p.payment_method or "upi",
                payment_date=p.payment_date or p.created_at,
                screenshot_url=p.screenshot_url,
                notes=p.notes,
                admin_notes=p.admin_notes,
                created_at=p.created_at,
                updated_at=p.updated_at,
                paid_at=p.paid_at,
                reviewed_at=p.reviewed_at
            ))
        return out, total

    async def get_payment_stats(self, db: AsyncSession) -> PaymentStatsResponse:
        """Get summary verification metrics for admin dashboard."""
        total_res = await db.execute(select(func.count(Payment.id)))
        total = total_res.scalar() or 0

        pending_res = await db.execute(select(func.count(Payment.id)).where(Payment.status == "pending"))
        pending = pending_res.scalar() or 0

        approved_res = await db.execute(select(func.count(Payment.id)).where(Payment.status == "approved"))
        approved = approved_res.scalar() or 0

        rejected_res = await db.execute(select(func.count(Payment.id)).where(Payment.status == "rejected"))
        rejected = rejected_res.scalar() or 0

        amount_res = await db.execute(select(func.sum(Payment.amount)).where(Payment.status == "approved"))
        approved_amt = amount_res.scalar() or 0.0

        return PaymentStatsResponse(
            total_submissions=total,
            pending_count=pending,
            approved_count=approved,
            rejected_count=rejected,
            total_approved_amount=float(approved_amt)
        )

    async def review_payment(
        self,
        db: AsyncSession,
        *,
        payment_id: uuid.UUID,
        admin_user: User,
        status: str,
        admin_notes: Optional[str] = None
    ) -> PaymentPublic:
        """
        Admin reviews a pending payment:
        - If approved: set status='approved', set user.is_paid=true, optionally enroll in course.
        - If rejected: set status='rejected', keep user.is_paid=false.
        """
        clean_status = status.lower().strip()
        if clean_status not in ("approved", "rejected"):
            raise ValueError("Status must be 'approved' or 'rejected'")

        stmt = select(Payment).options(selectinload(Payment.user)).where(Payment.id == payment_id)
        res = await db.execute(stmt)
        payment = res.scalar_one_or_none()
        if not payment:
            raise ValueError("Payment request not found")

        now = datetime.now(timezone.utc)
        payment.status = clean_status
        payment.admin_notes = admin_notes
        payment.reviewed_by = admin_user.id
        payment.reviewed_at = now
        payment.updated_at = now

        user_stmt = select(User).where(User.id == payment.user_id)
        u_res = await db.execute(user_stmt)
        user = u_res.scalar_one_or_none()

        if clean_status == "approved":
            payment.paid_at = now
            if user:
                user.is_paid = True
                db.add(user)

            # If this payment was tied to a specific course, auto-enroll user
            if payment.course_id and user:
                enr_res = await db.execute(
                    select(Enrollment).where(
                        Enrollment.user_id == user.id,
                        Enrollment.course_id == payment.course_id
                    )
                )
                if not enr_res.scalar_one_or_none():
                    enrollment = Enrollment(user_id=user.id, course_id=payment.course_id)
                    db.add(enrollment)
        else:
            # When rejected, ensure is_paid is false if user has no other approved payments
            if user:
                other_approved = await db.execute(
                    select(Payment.id).where(
                        Payment.user_id == user.id,
                        Payment.id != payment.id,
                        Payment.status == "approved"
                    )
                )
                if not other_approved.scalar_one_or_none():
                    user.is_paid = False
                    db.add(user)

        db.add(payment)
        await db.commit()
        await db.refresh(payment)

        return PaymentPublic(
            id=str(payment.id),
            user_id=str(payment.user_id),
            user_name=payment.user.username if payment.user else None,
            user_email=payment.user.email if payment.user else None,
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

    # Course price management
    async def get_course_price(
        self,
        db: AsyncSession,
        course_id: uuid.UUID
    ) -> Optional[CoursePrice]:
        result = await db.execute(
            select(CoursePrice).where(CoursePrice.course_id == course_id)
        )
        return result.scalar_one_or_none()

    async def set_course_price(
        self,
        db: AsyncSession,
        course_id: uuid.UUID,
        price: float,
        original_price: Optional[float] = None,
        discount_percentage: int = 0,
        is_free: bool = False
    ) -> CoursePrice:
        result = await db.execute(
            select(CoursePrice).where(CoursePrice.course_id == course_id)
        )
        course_price = result.scalar_one_or_none()

        if course_price:
            course_price.price = price
            course_price.original_price = original_price
            course_price.discount_percentage = discount_percentage
            course_price.is_free = is_free
            course_price.updated_at = datetime.now(timezone.utc)
        else:
            course_price = CoursePrice(
                course_id=course_id,
                price=price,
                original_price=original_price,
                discount_percentage=discount_percentage,
                is_free=is_free
            )
            db.add(course_price)

        await db.commit()
        await db.refresh(course_price)
        return course_price


payment_service = PaymentService()
