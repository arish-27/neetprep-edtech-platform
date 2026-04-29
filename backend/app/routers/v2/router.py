"""Aggregates all v2 routers under /api/v2/"""
from fastapi import APIRouter

from app.routers.v2.ai_questions import router as ai_questions_router
from app.routers.v2.assignments import router as assignments_router
from app.routers.v2.doubts import router as doubts_router
from app.routers.v2.live_classes import router as live_classes_router
from app.routers.v2.adaptive import router as adaptive_router
from app.routers.v2.ai_chat import router as ai_chat_router
from app.routers.v2.rank_predictor import router as rank_router
from app.routers.v2.teacher_advanced import (
    content_router, qbank_router, mocktest_router,
    announce_router, resource_router, settings_router,
)

v2_router = APIRouter(prefix="/v2")
v2_router.include_router(ai_questions_router)
v2_router.include_router(assignments_router)
v2_router.include_router(doubts_router)
v2_router.include_router(live_classes_router)
v2_router.include_router(adaptive_router)
v2_router.include_router(ai_chat_router)
v2_router.include_router(rank_router)
# ── Advanced teacher features ─────────────────────────────────────────────────
v2_router.include_router(content_router)
v2_router.include_router(qbank_router)
v2_router.include_router(mocktest_router)
v2_router.include_router(announce_router)
v2_router.include_router(resource_router)
v2_router.include_router(settings_router)
