from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, Path, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_async_session
from app.dependencies.auth import get_current_user
from app.dependencies.auth import get_optional_user
from app.models.enums import Subject
from app.models.user import User
from app.schemas.demo_class_progress import DemoClassProgressPublic, DemoClassProgressUpdate
from app.schemas.demo_video import DemoAccessResponse, DemoClassPublic, DemoClassType, DemoVideoSource
from app.services.demo_class_progress_service import get_demo_class_progress, upsert_demo_class_progress

router = APIRouter(tags=["demo"])

NOW = datetime.now(timezone.utc)
LIVE_START = NOW - timedelta(minutes=7)
LIVE_END = NOW + timedelta(hours=2)

# NOTE: Intentionally store only the YouTube IDs here (not full URLs).
_DEMO_YOUTUBE_BY_CLASS_ID: dict[str, str] = {
  # Live (single class)
  "live_neet_crash_course": "4nBpU2IYCC0",

  # Physics
  "rec_phy_kinematics": "K_a09clEnlA",
  "rec_phy_electrostatics": "M7lc1UVf-VE",
  "rec_phy_ray_optics": "aircAruvnKk",
  "rec_phy_current_electricity": "WUvTyaaNkzM",

  # Chemistry
  "rec_chem_goc_basics": "ScMzIvxBSi4",
  "rec_chem_chemical_bonding": "ysz5S6PUM-U",
  "rec_chem_thermodynamics": "E7wJTI-1dvQ",
  "rec_chem_equilibrium": "aqz-KE-bpKQ",

  # Biology
  "rec_bio_human_physiology": "_TpY7RsPHeA",
  "rec_bio_cell_cycle": "QH2-TGUlwu4",
  "rec_bio_genetics": "fLexgOxsZu0",
  "rec_bio_ecology": "M7lc1UVf-VE",
}

_DEMO_CLASSES: list[DemoClassPublic] = [
  DemoClassPublic(
    id="live_neet_crash_course",
    type=DemoClassType.live,
    subject=Subject.chemistry,
    title="Live NEET Crash Course",
    instructor="NEET Faculty • Chemistry",
    duration_min=120,
    starts_at=LIVE_START,
    ends_at=LIVE_END,
  ),
  DemoClassPublic(
    id="rec_phy_kinematics",
    type=DemoClassType.recorded,
    subject=Subject.physics,
    title="NEET Physics • Kinematics (One Shot)",
    instructor="NEET Faculty • Physics",
    duration_min=76,
  ),
  DemoClassPublic(
    id="rec_phy_electrostatics",
    type=DemoClassType.recorded,
    subject=Subject.physics,
    title="NEET Physics • Electrostatics (PYQ Sprint)",
    instructor="NEET Faculty • Physics",
    duration_min=58,
  ),
  DemoClassPublic(
    id="rec_phy_ray_optics",
    type=DemoClassType.recorded,
    subject=Subject.physics,
    title="NEET Physics • Ray Optics (Rapid Revision)",
    instructor="NEET Faculty • Physics",
    duration_min=64,
  ),
  DemoClassPublic(
    id="rec_phy_current_electricity",
    type=DemoClassType.recorded,
    subject=Subject.physics,
    title="NEET Physics • Current Electricity (Concept + PYQs)",
    instructor="NEET Faculty • Physics",
    duration_min=72,
  ),
  DemoClassPublic(
    id="rec_chem_goc_basics",
    type=DemoClassType.recorded,
    subject=Subject.chemistry,
    title="NEET Chemistry • GOC Basics (High Yield)",
    instructor="NEET Faculty • Chemistry",
    duration_min=68,
  ),
  DemoClassPublic(
    id="rec_chem_chemical_bonding",
    type=DemoClassType.recorded,
    subject=Subject.chemistry,
    title="NEET Chemistry • Chemical Bonding (One Shot)",
    instructor="NEET Faculty • Chemistry",
    duration_min=74,
  ),
  DemoClassPublic(
    id="rec_chem_thermodynamics",
    type=DemoClassType.recorded,
    subject=Subject.chemistry,
    title="NEET Chemistry • Thermodynamics (Quick Revision)",
    instructor="NEET Faculty • Chemistry",
    duration_min=62,
  ),
  DemoClassPublic(
    id="rec_chem_equilibrium",
    type=DemoClassType.recorded,
    subject=Subject.chemistry,
    title="NEET Chemistry • Chemical Equilibrium (Practice)",
    instructor="NEET Faculty • Chemistry",
    duration_min=55,
  ),
  DemoClassPublic(
    id="rec_bio_human_physiology",
    type=DemoClassType.recorded,
    subject=Subject.biology,
    title="NEET Biology • Human Physiology (Rapid Revision)",
    instructor="NEET Faculty • Biology",
    duration_min=110,
  ),
  DemoClassPublic(
    id="rec_bio_cell_cycle",
    type=DemoClassType.recorded,
    subject=Subject.biology,
    title="NEET Biology • Cell Cycle & Division",
    instructor="NEET Faculty • Biology",
    duration_min=49,
  ),
  DemoClassPublic(
    id="rec_bio_genetics",
    type=DemoClassType.recorded,
    subject=Subject.biology,
    title="NEET Biology • Genetics (Mendel + PYQs)",
    instructor="NEET Faculty • Biology",
    duration_min=61,
  ),
  DemoClassPublic(
    id="rec_bio_ecology",
    type=DemoClassType.recorded,
    subject=Subject.biology,
    title="NEET Biology • Ecology (Rapid Notes)",
    instructor="NEET Faculty • Biology",
    duration_min=46,
  ),
]


@router.get("/demo/classes", response_model=list[DemoClassPublic])
async def list_demo_classes():
  # Public metadata only: no YouTube IDs here.
  return _DEMO_CLASSES


@router.get("/check-access", response_model=DemoAccessResponse)
async def check_access(
  class_id: str = Query(..., min_length=2, max_length=64),
  x_demo_paid: str | None = Header(default=None, alias="X-Demo-Paid"),
  user: User | None = Depends(get_optional_user),
):
  # `x_demo_paid` is kept only for backwards compatibility with older demos. We no longer use
  # premium/free access checks; only login is required.
  _ = x_demo_paid

  youtube_id = _DEMO_YOUTUBE_BY_CLASS_ID.get(class_id)
  if not youtube_id:
    return DemoAccessResponse(access=False, reason="not_found")

  # Login-only access (no premium/free checks). If the user isn't authenticated,
  # return 401 so the frontend can redirect to /login.
  if not user:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Login required")

  return DemoAccessResponse(access=True, reason="ok", video=DemoVideoSource(youtube_id=youtube_id))


@router.get("/demo/classes/{class_id}/progress", response_model=DemoClassProgressPublic)
async def resume_demo_class_progress(
  class_id: str = Path(..., min_length=2, max_length=64),
  session: AsyncSession = Depends(get_async_session),
  user: User = Depends(get_current_user),
):
  if class_id not in _DEMO_YOUTUBE_BY_CLASS_ID:
    raise HTTPException(status_code=404, detail="Class not found")

  progress = await get_demo_class_progress(session, user_id=user.id, class_id=class_id)
  if not progress:
    progress = await upsert_demo_class_progress(session, user_id=user.id, class_id=class_id, watched_seconds=0, completed=False)
  return progress


@router.put("/demo/classes/{class_id}/progress", response_model=DemoClassProgressPublic)
async def update_demo_class_progress(
  class_id: str = Path(..., min_length=2, max_length=64),
  data: DemoClassProgressUpdate = ...,
  session: AsyncSession = Depends(get_async_session),
  user: User = Depends(get_current_user),
):
  if class_id not in _DEMO_YOUTUBE_BY_CLASS_ID:
    raise HTTPException(status_code=404, detail="Class not found")

  return await upsert_demo_class_progress(
    session,
    user_id=user.id,
    class_id=class_id,
    watched_seconds=data.watched_seconds,
    completed=data.completed,
  )
