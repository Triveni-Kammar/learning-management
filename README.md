# TechLMS - Modern Learning Management System

TechLMS is a full-stack, responsive Learning Management System designed to deliver video courses efficiently.

It uses a decoupled architecture with a high-performance **FastAPI (Python)** backend and a **Vanilla HTML/CSS/JS** frontend.

## 🌟 Key Features

- **No-Framework Frontend**: Uses modern Vanilla JS and CSS with custom design tokens for a premium Glassmorphism look.
- **Role-Based Authentication**: Secure JWT flow (Student, Instructor, Admin).
- **Course & Lesson Engine**: Supports sections and ordered lessons integrating embeddable YouTube links to save storage.
- **Progress Tracking**: Tracks syllabus completion and calculates visual progress bars dynamically.
- **Responsive Design**: Works on desktop and mobile gracefully.

## 🛠️ Stack

**Backend:**
- Python 3.10+
- FastAPI
- SQLAlchemy + SQLite
- Pydantic
- Passlib & Python-JOSE (Authentication)

**Frontend:**
- HTML5
- Vanilla CSS3 (CSS Variables, Flex/Grid)
- Vanilla ES6 JavaScript (Fetch API, LocalStorage)

## 🚀 Getting Started

Follow these steps to run the minimal viable product locally.

### 1. Backend Setup

Open a terminal and navigate to the `backend` folder:
```bash
cd c:\Users\Public\LMS\backend
```

Create a virtual environment:
```bash
python -m venv venv
```

Activate the virtual environment:
- On Windows: `venv\Scripts\activate`
- On macOS/Linux: `source venv/bin/activate`

Install dependencies:
```bash
pip install -r requirements.txt
```

Seed the database with mock data (Users & Courses):
```bash
python -m app.seed
```

Start the FastAPI Server:
```bash
uvicorn app.main:app --reload
```
The API should now be running on `http://127.0.0.1:8000`. You can view the Swagger Docs at `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup

The frontend does not require a build step or NPM!
However, due to CORS policies on `file://` protocols for Modules/Fetch, you should serve it with a basic HTTP server.

Open a **new** terminal, navigate to the frontend folder, and start a basic python server:
```bash
cd c:\Users\Public\LMS\frontend
python -m http.server 8080
```

Open your browser to `http://localhost:8080`.

### 3. Test Credentials

The dummy seed script creates following accounts:
- **Admin**: `admin@lms.com` / `admin123`
- **Instructor**: `instructor@lms.com` / `instructor123`
- **Student**: `student@lms.com` / `student123`

## 📁 Architecture Overview

- **Auth System**: Endpoints for Signup/Login, returning a temporary `access_token` stored in browser `localStorage`. API calls send it recursively.
- **Progress Tracking**: Progress model records `lesson_id` against `user_id`. The backend calculates % completion based on the current course's total lesson tree.
- **Video Rendering**: YouTube IDs are directly appended into `iframe` tags. Uses API variables to auto hide related videos (`rel=0`).
