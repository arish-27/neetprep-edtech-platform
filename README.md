# 🩺 NEETPrep — Full-Stack NEET Learning & Exam Prep Platform

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Online-success?style=for-the-badge&logo=github&logoColor=white)](https://arish-27.github.io/neetprep-edtech-platform/)
[![GitHub Pages Deployment](https://img.shields.io/badge/Deploy-GitHub%20Pages-blue?logo=github&style=flat-square)](https://arish-27.github.io/neetprep-edtech-platform/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi&logoColor=white&style=flat-square)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black&style=flat-square)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white&style=flat-square)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white&style=flat-square)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?logo=postgresql&logoColor=white&style=flat-square)](https://www.postgresql.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white&style=flat-square)](https://python.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

> 🌐 **Live Website Link**: [https://arish-27.github.io/neetprep-edtech-platform/](https://arish-27.github.io/neetprep-edtech-platform/)

An all-in-one, modern, and interactive EdTech web platform designed specifically for **NEET (National Eligibility cum Entrance Test)** aspirants. The platform offers structured video lessons, interactive chapter-wise quizzes, real-time mock test simulations, AI-powered doubt assistance, performance analytics, payment integrations, and comprehensive student/teacher management dashboards.

---

## 🌟 Key Features

### 🎓 Student Learning Experience
- **Interactive Home & Subject Hubs**: Explore Physics, Chemistry, and Biology curated chapter-by-chapter.
- **Smart Video Player**: Seamless video streaming with playback speed control, chapter markers, and integrated lecture notes.
- **Live & Recorded Sessions**: Dedicated portals for real-time live classes and archived recordings.
- **Chapter Notes & Bookmarks**: Download high-yield revision PDFs and save key questions or formulas.

### 🧪 Assessment & Examination Engine
- **Chapter Quizzes**: Practice immediate multiple-choice questions with instant feedback and step-by-step explanations.
- **Full-Length Mock Test Series**: Timed, real NEET exam pattern simulation with negative marking and question palette navigation.
- **Rich Performance Analytics**: Granular score breakdowns, accuracy rates, speed insights, and topic-wise strengths/weaknesses.

### 🤖 AI-Powered Doubt Solver & Tools
- **AI Doubt Assistant**: Get instantaneous conceptual clarifications, formula derivations, and step-by-step problem resolutions.
- **OCR / Question Search**: Fast search across subjects, topics, and question archives.

### 💳 Monetization & Admin Controls
- **Course Subscriptions & Razorpay Integration**: Secure checkout and subscription management for premium crash courses & test series.
- **Instructor & Admin Management**: Manage courses, upload lectures, publish mock tests, track user activity, and moderate content.

---

## 🏗️ Architecture & Tech Stack

```mermaid
graph TD
    Client[React 18 + Vite + Tailwind CSS + Framer Motion]
    API[FastAPI Backend Server - Uvicorn]
    DB[(PostgreSQL Database + SQLAlchemy Async)]
    CacheStorage[Local Uploads / Static Storage]
    PaymentGateway[Razorpay Gateway]
    AIModule[AI Doubt Engine]

    Client -->|REST API / JWT| API
    API --> DB
    API --> CacheStorage
    API --> PaymentGateway
    API --> AIModule
```

### **Frontend**
- **Core**: React 18, Vite, TypeScript/JavaScript
- **Styling & Animations**: Tailwind CSS, Framer Motion, Lottie Animations (`lottie-react`, `@lottiefiles/dotlottie-react`)
- **State Management & Routing**: Zustand, React Router v6
- **UI Components & Utilities**: Lucide Icons, React Player, React Markdown, Remark GFM, QRCode.react

### **Backend**
- **Framework**: FastAPI (Python 3.10+)
- **Database & ORM**: PostgreSQL, SQLAlchemy (Asyncio), asyncpg, Alembic Migrations
- **Security & Auth**: OAuth2 with JWT (Access & Refresh tokens), Password hashing with `bcrypt` (Passlib)
- **Payments**: Razorpay Python SDK
- **File Handling**: Aiofiles & Python Multipart for media/PDF storage

---

## 📁 Repository Structure

```plaintext
neetfullstack/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions CI/CD for GitHub Pages
├── backend/
│   ├── alembic/                # Database migrations
│   ├── app/
│   │   ├── core/               # Security, configuration & settings
│   │   ├── db/                 # Database connection & session setup
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── routers/            # FastAPI API route handlers (Auth, Courses, Quizzes, AI, Payments)
│   │   ├── schemas/            # Pydantic validation models
│   │   ├── services/           # Business logic & integrations
│   │   ├── utils/              # Helper utilities (YouTube, file handlers, etc.)
│   │   ├── main.py             # FastAPI entrypoint
│   │   └── seed.py             # Initial database seeder
│   ├── .env.example            # Environment template for backend
│   ├── dev.ps1                 # Backend startup script
│   └── requirements.txt        # Python dependencies
├── frontend/
│   ├── public/                 # Static assets & icons
│   ├── src/
│   │   ├── assets/             # Images, animations, and icons
│   │   ├── components/         # Reusable UI components
│   │   ├── context/            # Global context providers
│   │   ├── pages/              # 26+ Screen views (Dashboard, Quizzes, Video, Tests, Admin)
│   │   ├── services/           # Axios/Fetch API clients
│   │   ├── store/              # Zustand stores
│   │   └── App.jsx             # Main router & layout configuration
│   ├── package.json            # Node.js dependencies
│   ├── tailwind.config.js      # Custom theme & styling configuration
│   └── vite.config.js          # Vite build & proxy configuration
├── dev.ps1                     # Unified one-command fullstack launcher
└── README.md                   # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.10 or higher
- **PostgreSQL**: v14 or higher (or a cloud PostgreSQL instance)

---

### Quick Start (One Command)

If you are on Windows (PowerShell), you can launch both backend and frontend concurrently:

```powershell
.\dev.ps1
```

---

### Manual Setup

#### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
.\venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your PostgreSQL credentials & secret keys

# Run database migrations / seed demo data
alembic upgrade head
python -m app.seed

# Start FastAPI server
uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

- **Interactive API Documentation (Swagger)**: [http://localhost:8001/docs](http://localhost:8001/docs)
- **Alternative API Docs (ReDoc)**: [http://localhost:8001/redoc](http://localhost:8001/redoc)

#### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Configure environment variables (optional)
cp .env.example .env

# Start Vite development server
npm run dev
```

- **Frontend Application (Local)**: [http://localhost:5173](http://localhost:5173)
- **Live Deployed Application (GitHub Pages)**: [https://arish-27.github.io/neetprep-edtech-platform/](https://arish-27.github.io/neetprep-edtech-platform/)

---

## 🔑 Demo Credentials

The platform comes with pre-seeded accounts for testing:

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Student** | `student@demo.com` | `student123` | Full access to courses, mock tests, doubt solving & analytics |
| **Admin / Instructor** | `admin@demo.com` | `admin123` | Course authoring, test creation, student monitoring & metrics |

---

## ⚙️ Configuration & Environment Variables

### Backend (`backend/.env`)
```env
# Database
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/neet_db

# Security & JWT
SECRET_KEY=your_super_secret_jwt_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# Seed & Debugging
AUTO_SEED_DEMO_DATA=true

# Razorpay (Optional for test payments)
RAZORPAY_KEY_ID=rzp_test_xxxx
RAZORPAY_KEY_SECRET=xxxx
```

### Frontend (`frontend/.env`)
```env
VITE_BACKEND_ORIGIN=http://127.0.0.1:8001
VITE_RAZORPAY_KEY_ID=rzp_test_xxxx
```

---

## 🧪 Testing & Build

```bash
# Frontend build & preview
cd frontend
npm run build
npm run preview

# Backend testing (pytest)
cd backend
pytest
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.
