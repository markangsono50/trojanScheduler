# Trojan Scheduler

USC course schedule optimizer. Add your courses, set your constraints, and get ranked schedule options with professor ratings built in.

## Features

- Search any USC course by code or name, including GE requirements
- Pin specific professors or sections, or let the solver pick the best
- Set hard constraints: time window, days off, modality (in-person / online), max units
- No back-to-back class toggle
- Schedules ranked by a combination of RateMyProfessors score and scheduling convenience
- Planning mode — ignores seat availability so you can plan ahead before registration opens
- Visual schedule grid with exportable image

## How it works

1. You add must-have courses and optional GE slots
2. The backend scrapes live section data from `classes.usc.edu` for the current term
3. Sections are enriched with RateMyProfessors ratings
4. A backtracking solver with MRV heuristic finds all valid non-conflicting combinations
5. Schedules are scored and the top 3 are returned with a rendered grid image

## Stack

- **Frontend:** Next.js + TypeScript + Tailwind CSS — deployed on Vercel
- **Backend:** FastAPI + Python 3.11 — deployed on Railway via Docker
- **Solver:** Custom backtracking solver (`backend/solver.py`)
- **Data:** USC `classes.usc.edu` API + RateMyProfessors GraphQL

## Local setup

**Backend**
```bash
cd backend
pip install -r requirements.txt
playwright install chromium
cp .env.example .env
python3 -m uvicorn main:app --reload --port 8000
```

**Frontend**
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Frontend runs on `http://localhost:3000`, backend on `http://localhost:8000`.

## Updating course data

The frontend dropdown lists are static JSON files generated from the USC API. Run these at the start of each semester, then commit the output:

```bash
cd backend
python3 generate_course_list.py      # → frontend/public/courses.json
python3 generate_ge_course_list.py   # → frontend/public/ge_courses.json
```

Section data (professors, times, seats) is always fetched live — no manual update needed.

## Environment variables

**Backend (Railway)**
| Variable | Description |
|---|---|
| `ALLOWED_ORIGINS` | Comma-separated frontend URLs — no trailing slashes |
| `TERM_CODE` | USC semester code (e.g. `20263` for Fall 2026) |

**Frontend (Vercel)**
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | Backend URL — no trailing slash |

See `backend/.env.example` and `frontend/.env.example` for templates.

## Project structure

```
backend/
  main.py              # FastAPI app + /generate endpoint
  scraper.py           # USC API section fetcher
  solver.py            # Backtracking schedule solver
  rmp.py               # RateMyProfessors enrichment
  image_gen.py         # Schedule grid image renderer (Playwright)
  generate_course_list.py
  generate_ge_course_list.py

frontend/
  app/page.tsx         # Main page + state machine
  components/
    InputForm.tsx      # Course entry + constraints UI
    LeftPanel.tsx      # Nav + branding
    ScheduleGrid.tsx   # Visual schedule grid
    ScheduleDetail.tsx # Schedule detail + section info
    LoadingScreen.tsx  # Generation progress screen
  public/
    courses.json       # Static course list
    ge_courses.json    # Static GE course list
```
