from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List
from uuid import UUID


class PlanInfo(BaseModel):
    id: str
    name: str
    price: float
    original_price: Optional[float] = None
    discount_percentage: int = 0
    currency: str = "INR"
    duration: str = "Full NEET Cycle"
    description: str
    features: List[str]
    is_popular: bool = False


class PaymentConfigResponse(BaseModel):
    upi_id: str
    payee_name: str
    demo_mode: bool = True
    notice: str
    plans: List[PlanInfo]


class PaymentSubmitRequest(BaseModel):
    transaction_id: str = Field(..., min_length=3, max_length=255, description="UPI Transaction ID or UTR number")
    amount: float = Field(..., gt=0, description="Payment amount in INR")
    payment_date: Optional[datetime] = None
    screenshot_url: Optional[str] = None
    plan_name: Optional[str] = "NEET All-Access Pro"
    course_id: Optional[str] = None
    notes: Optional[str] = None


class PaymentReviewRequest(BaseModel):
    status: str = Field(..., pattern="^(approved|rejected)$")
    admin_notes: Optional[str] = None


class PaymentPublic(BaseModel):
    id: str
    user_id: str
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    course_id: Optional[str] = None
    plan_name: Optional[str] = None
    transaction_id: Optional[str] = None
    amount: float
    currency: str = "INR"
    status: str  # pending | approved | rejected
    payment_method: Optional[str] = "upi"
    payment_date: datetime
    screenshot_url: Optional[str] = None
    notes: Optional[str] = None
    admin_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    paid_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class PaymentListResponse(BaseModel):
    items: List[PaymentPublic]
    total: int


class PaymentStatsResponse(BaseModel):
    total_submissions: int
    pending_count: int
    approved_count: int
    rejected_count: int
    total_approved_amount: float


# Course Pricing Schemas (preserved)
class CoursePriceBase(BaseModel):
    price: float = Field(..., ge=0)
    original_price: Optional[float] = Field(None, ge=0)
    currency: str = "INR"
    is_free: bool = False
    discount_percentage: int = Field(0, ge=0, le=100)
    discount_valid_until: Optional[datetime] = None


class CoursePriceCreate(CoursePriceBase):
    course_id: str


class CoursePriceUpdate(BaseModel):
    price: Optional[float] = Field(None, ge=0)
    original_price: Optional[float] = Field(None, ge=0)
    discount_percentage: Optional[int] = Field(None, ge=0, le=100)
    discount_valid_until: Optional[datetime] = None
    is_free: Optional[bool] = None


class CoursePricePublic(CoursePriceBase):
    id: str
    course_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
