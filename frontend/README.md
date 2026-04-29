# NEET Frontend (React)

Animated, Byju's-inspired UI + navigation for common NEET learning flows (auth, subjects/chapters, videos, quizzes, tests, performance, doubts, notifications, profile/settings, admin).

## Getting started

1. Install dependencies
   - `npm install`
2. Start dev server
   - `npm run dev`
3. Build for production
   - `npm run build`
   - `npm run preview`

## Routes

- Public: `/` (splash), `/onboarding`
- Auth: `/login`, `/signup`, `/forgot-password`, `/otp`
- App: `/app/*`
- Admin: `/admin`

## Screens included

1. SplashScreen
2. OnboardingScreen
3. LoginScreen
4. SignupScreen
5. ForgotPasswordScreen
6. OTPVerificationScreen
7. HomeDashboardScreen
8. SubjectsScreen
9. ChaptersScreen
10. VideoPlayerScreen
11. LiveClassScreen
12. RecordedClassesScreen
13. NotesScreen
14. BookmarksScreen
15. QuizScreen
16. QuizAttemptScreen
17. QuizResultScreen
18. MockTestScreen
19. TestAttemptScreen
20. TestResultScreen
21. PerformanceDashboardScreen
22. DoubtSolvingScreen
23. NotificationsScreen
24. ProfileScreen
25. SettingsScreen
26. AdminDashboardScreen

## Notes

- Backend dev setup:
  - The dev server proxies `/api/*` to the backend (default: `http://localhost:8001`, configurable via `VITE_BACKEND_ORIGIN`).
  - Demo login buttons exist on the login screens:
    - Student: `student@demo.com` / `student123`
    - Admin: `admin@demo.com` / `admin123`
