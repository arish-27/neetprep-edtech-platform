from app.services.auth_service import authenticate, create_user, get_user_by_email, register_student
from app.services.course_service import create_course, enroll_user, get_course, list_courses, list_enrolled_courses
from app.services.dashboard_service import admin_students_summary, list_completed_courses, list_user_quiz_results, user_summary
from app.services.lesson_service import create_lesson, get_lesson, list_lessons_by_course
from app.services.progress_service import get_progress, require_progress, upsert_progress
from app.services.quiz_service import add_question, create_quiz, get_quiz, get_quiz_by_course, list_results, submit_quiz
from app.services.search_service import search_courses
from app.services.upload_service import create_upload, list_uploads

__all__ = [
  "authenticate",
  "create_user",
  "get_user_by_email",
  "register_student",
  "list_courses",
  "create_course",
  "get_course",
  "enroll_user",
  "list_enrolled_courses",
  "list_lessons_by_course",
  "create_lesson",
  "get_lesson",
  "get_progress",
  "require_progress",
  "upsert_progress",
  "get_quiz_by_course",
  "get_quiz",
  "create_quiz",
  "add_question",
  "submit_quiz",
  "list_results",
  "create_upload",
  "list_uploads",
  "user_summary",
  "list_completed_courses",
  "list_user_quiz_results",
  "admin_students_summary",
  "search_courses",
]
