import { BarChart3, Bell, Bookmark, BookOpen, ClipboardList, CreditCard, Crown, GraduationCap, HelpCircle, Home, NotebookPen, Radio, Settings, User, Video, } from "lucide-react";
export const appNav = [
    { label: "Home", to: "/app", icon: Home },
    { label: "Subjects", to: "/app/subjects", icon: BookOpen },
    { label: "Premium Plan", to: "/app/premium", icon: Crown },
    { label: "Recorded Classes", to: "/app/recorded-classes", icon: Video },
    { label: "Live Class", to: "/app/live-class", icon: Radio },
    { label: "Notes", to: "/app/notes", icon: NotebookPen },
    { label: "Bookmarks", to: "/app/bookmarks", icon: Bookmark },
    { label: "Quizzes", to: "/app/quizzes", icon: ClipboardList },
    { label: "Mock Tests", to: "/app/mock-tests", icon: GraduationCap },
    { label: "Performance", to: "/app/performance", icon: BarChart3 },
    { label: "Doubts", to: "/app/doubts", icon: HelpCircle },
    { label: "Payments", to: "/app/payments", icon: CreditCard },
    { label: "Notifications", to: "/app/notifications", icon: Bell },
    { label: "Profile", to: "/app/profile", icon: User },
    { label: "Settings", to: "/app/settings", icon: Settings },
];
