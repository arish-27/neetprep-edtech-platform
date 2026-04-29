"""
V2 — Rank Predictor + Study Planner
No new DB tables needed — uses existing student_performance data.
"""
from __future__ import annotations

import math
from datetime import date, timedelta

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_async_session
from app.dependencies.auth import get_current_user
from app.models.student_performance import StudentPerformance
from app.models.user import User

router = APIRouter(prefix="/rank", tags=["v2-rank"])

# NEET 2024 approximate cutoff data (marks → rank)
_CUTOFFS = [
    (720, 1), (700, 100), (680, 500), (660, 1500), (640, 4000),
    (620, 8000), (600, 15000), (580, 25000), (560, 40000),
    (540, 60000), (520, 85000), (500, 110000), (480, 140000),
    (460, 175000), (440, 210000), (420, 250000), (400, 300000),
]


def _estimate_rank(score: float) -> tuple[int, int]:
    """Return (low_rank, high_rank) estimate for a given NEET score."""
    for i, (marks, rank) in enumerate(_CUTOFFS):
        if score >= marks:
            low = max(1, rank - rank // 3)
            high = rank + rank // 2
            return low, high
    return 500000, 700000


def _accuracy_to_neet_score(accuracy_pct: float) -> float:
    """
    Rough conversion: NEET has 180 questions × 4 marks = 720 max.
    Assume 70% attempt rate, -1 for wrong.
    """
    attempted = 180 * 0.70
    correct = attempted * (accuracy_pct / 100)
    wrong = attempted - correct
    return max(0.0, correct * 4 - wrong * 1)


class RankPrediction(BaseModel):
    estimated_score: float
    rank_low: int
    rank_high: int
    percentile: float
    message: str
    improvement_tips: list[str]


class StudyPlan(BaseModel):
    target_date: date
    days_left: int
    daily_hours: float
    weekly_plan: list[dict]


@router.get("/predict", response_model=RankPrediction)
async def predict_rank(
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(get_current_user),
):
    stmt = select(StudentPerformance).where(StudentPerformance.user_id == user.id)
    perfs = (await session.execute(stmt)).scalars().all()

    if not perfs:
        return RankPrediction(
            estimated_score=0,
            rank_low=500000,
            rank_high=700000,
            percentile=0.0,
            message="No performance data yet. Start practicing to get a rank prediction.",
            improvement_tips=["Complete at least one quiz in each subject to get started."],
        )

    avg_accuracy = sum(p.accuracy_pct for p in perfs) / len(perfs)
    score = _accuracy_to_neet_score(avg_accuracy)
    rank_low, rank_high = _estimate_rank(score)
    total_students = 2_200_000  # approximate NEET 2024 registrations
    percentile = round((1 - rank_high / total_students) * 100, 1)

    tips = []
    for p in sorted(perfs, key=lambda x: x.accuracy_pct):
        if p.accuracy_pct < 60:
            tips.append(f"Improve {p.subject} accuracy (currently {p.accuracy_pct:.0f}%) — target 75%+")
    if not tips:
        tips.append("Maintain consistency and attempt more mock tests.")

    msg = (
        f"Based on your current accuracy ({avg_accuracy:.0f}%), "
        f"your estimated NEET score is ~{score:.0f}/720."
    )

    return RankPrediction(
        estimated_score=round(score, 1),
        rank_low=rank_low,
        rank_high=rank_high,
        percentile=max(0.0, percentile),
        message=msg,
        improvement_tips=tips[:3],
    )


@router.get("/study-plan", response_model=StudyPlan)
async def study_plan(
    target_date_str: str = "2025-05-04",   # NEET 2025 approximate date
    daily_hours: float = 6.0,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(get_current_user),
):
    try:
        target = date.fromisoformat(target_date_str)
    except ValueError:
        target = date.today() + timedelta(days=120)

    days_left = max(1, (target - date.today()).days)
    subjects = ["Physics", "Chemistry", "Biology"]
    weekly_plan = []
    for week in range(min(4, days_left // 7)):
        subj = subjects[week % 3]
        weekly_plan.append({
            "week": week + 1,
            "focus": subj,
            "goal": f"Complete 2 chapters of {subj} + 1 mock section",
            "daily_hours": daily_hours,
        })

    return StudyPlan(
        target_date=target,
        days_left=days_left,
        daily_hours=daily_hours,
        weekly_plan=weekly_plan,
    )
