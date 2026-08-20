from fastapi import APIRouter

from app.routers.auth import router as auth_router
from app.routers.courses import router as courses_router
from app.routers.dashboard import admin_router, router as dashboard_router
from app.routers.lessons import router as lessons_router
from app.routers.demo_video import router as demo_video_router
from app.routers.payments import router as payments_router
from app.routers.premium import router as premium_router
from app.routers.quizzes import router as quizzes_router
from app.routers.search import router as search_router
from app.routers.teacher import admin_router as teacher_admin_router, router as teacher_router
from app.routers.uploads import router as uploads_router
from app.routers.v2.router import v2_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(courses_router)
api_router.include_router(lessons_router)
api_router.include_router(quizzes_router)
api_router.include_router(uploads_router)
api_router.include_router(dashboard_router)
api_router.include_router(admin_router)
api_router.include_router(search_router)
api_router.include_router(demo_video_router)
api_router.include_router(premium_router)
api_router.include_router(payments_router)
api_router.include_router(teacher_router)
api_router.include_router(teacher_admin_router)
# ── V2 routes (new features, additive only) ───────────────────────────────────
api_router.include_router(v2_router)
