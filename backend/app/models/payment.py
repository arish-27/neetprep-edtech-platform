from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
import uuid
from app.db.base import Base


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    # Legacy alias support
    SUCCESS = "approved"
    FAILED = "rejected"


class PaymentMethod(str, enum.Enum):
    UPI = "upi"
    MANUAL = "manual"
    RAZORPAY = "razorpay"


class Payment(Base):
    __tablename__ = "payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # UPI / Transaction details
    transaction_id = Column(String(255), nullable=True, index=True)  # UTR / Transaction ID
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    status = Column(String(50), default="pending", nullable=False, index=True)  # pending | approved | rejected
    payment_method = Column(String(50), default="upi", nullable=True)
    
    # Metadata & verification details
    plan_name = Column(String(255), default="NEET All-Access Pro", nullable=True)
    payment_date = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    screenshot_url = Column(String(500), nullable=True)
    description = Column(String(500), nullable=True)
    receipt = Column(String(255), nullable=True)
    notes = Column(String(1000), nullable=True)
    admin_notes = Column(String(1000), nullable=True)
    
    # Admin review metadata
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Legacy Razorpay fields (nullable)
    razorpay_order_id = Column(String(255), nullable=True, index=True)
    razorpay_payment_id = Column(String(255), nullable=True, index=True)
    razorpay_signature = Column(String(255), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="payments")
    reviewer = relationship("User", foreign_keys=[reviewed_by])
    course = relationship("Course", back_populates="payments")


class CoursePrice(Base):
    __tablename__ = "course_prices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    
    # Pricing
    price = Column(Float, nullable=False)
    original_price = Column(Float, nullable=True)  # For showing discounts
    currency = Column(String(10), default="INR", nullable=False)
    is_free = Column(Boolean, default=False, nullable=False)
    
    # Discount
    discount_percentage = Column(Integer, default=0, nullable=False)
    discount_valid_until = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    
    # Relationships
    course = relationship("Course", back_populates="price")
