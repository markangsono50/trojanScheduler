# TrojanScheduler — Session Handoff

## Project Overview
TrojanScheduler is a full-stack USC course scheduling optimizer.
- **Frontend**: Next.js 16 + TypeScript + Tailwind CSS (port 3000)
- **Backend**: FastAPI + Python 3.11 + Playwright (port 8000)
- **Root**: `/Users/markangsono/Desktop/TrojanScheduler/trojanscheduler/`

---

## Session Summary (2026-05-12)

### What Was Accomplished

#### 1. Dev Environment Opened
- VS Code opened on the project root
- Backend started: `uvicorn main:app --host 0.0.0.0 --port 8000 --reload`
- Frontend started: `npm run dev` (port 3000)
- Backend `.env` created from `.env.example`

#### 2. Planning Mode Feature — Implemented End-to-End

**Problem**: The solver excluded any section with `seats_available == 0`, making it impossible to generate schedules for courses that were fully enrolled. Students who want to plan ahead (seats often open up) had no way to use the tool.

**Solution**: A "Planning Mode" toggle that bypasses seat filtering so the solver includes full sections. Open sections still rank higher (seat scoring unchanged).

---

## Files Changed

| File | What Changed |
|------|-------------|
| `backend/main.py` | Added `planning_mode: bool = False` to `GenerateRequest` Pydantic model; passed to `build_schedules` |
| `backend/solver.py` | Added `planning_mode` param to `filter_and_pin_sections`, `expand_to_pairs`, `_diagnose_over_constrained`, `resolve_must_haves`, `auto_select_ge`, `inject_nice_to_haves`, `build_schedules`. Seat filter skipped when flag is `True`. |
| `frontend/lib/types.ts` | Added `planning_mode?: boolean` to `GenerateRequest` interface |
| `frontend/components/InputForm.tsx` | Added `planningMode` state; Planning Mode toggle UI (top-right, detached from form); toggle included in submit payload |
| `frontend/components/ScheduleImageCard.tsx` | Added `planningMode` prop; shows red "X FULL" pill when planning mode is on and schedule contains full sections |
| `frontend/app/page.tsx` | Added `planningMode` state captured from submitted payload; passed to `ScheduleImageCard` |

---

## Key Technical Decisions

### Seat filtering vs. seat scoring — kept separate
- **Filter** (bypassed in planning mode): `filter_and_pin_sections` ~line 273, `expand_to_pairs` ~line 381
- **Scoring** (unchanged): `_score_seats()` — full sections still score lower, so open sections rank first
- This means planning mode gives you *more* options without reordering the best ones to the bottom

### Where seat filtering lived (3 locations in solver.py)
1. `filter_and_pin_sections()` — primary lecture filter
2. `expand_to_pairs()` — linked section (discussion/lab/quiz) filter
3. `_diagnose_over_constrained()` — diagnostic message when no schedules found

All three needed `planning_mode` threaded through. The call chain:
```
build_schedules → resolve_must_haves → filter_and_pin_sections
                                     → expand_to_pairs
                                     → _diagnose_over_constrained
build_schedules → auto_select_ge     → filter_and_pin_sections
                                     → expand_to_pairs
build_schedules → inject_nice_to_haves → filter_and_pin_sections
                                       → expand_to_pairs
```

### Visual indicators for full sections
- **ScheduleImageCard**: Red "X FULL" pill in the score row — visible at a glance on the results cards
- **ScheduleDetail**: Existing `SeatIndicator` already renders "Full" in red when `seats_available === 0` — no changes needed there

---

## UI Iteration Log (Planning Mode Toggle)

The toggle went through 3 placements before landing on the final design:

| Iteration | Placement | Why Changed |
|-----------|-----------|-------------|
| v1 | Full-width row above Required courses, with title + subtitle | Too prominent — placed too much emphasis on the mode |
| v2 | Inline in the right side of the Required courses header row | Still felt like a per-section option, not a global control |
| v3 ✓ | Top-right of content area, detached from all form sections | Reads as a global mode switch; clearly not part of the form |

**Final design spec:**
- Order: `Planning Mode` (label) → ℹ (icon) → toggle
- Label color transitions to cardinal red when active, muted when off
- Hover tooltip: transparent background, no border, `rgba(255,255,255,0.40)` grey text, right-aligned
- Toggle scaled to 85% — slightly smaller, appropriate for a toolbar item
- Tooltip text: *"Includes sections at capacity in your results. Enrollment fluctuates throughout registration — waitlisting a full section is often a viable path."*

---

## How to Run

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

Backend health check: `curl http://localhost:8000/health`

---

## Known Issues / Pre-existing

- TypeScript errors in `components/ui/pulse-beams.tsx` and `components/ui/spiral-animation.tsx` — pre-existing, unrelated to this session, do not block the build
- Term code (`TERM_CODE = "20263"`) in `backend/scraper.py:3` must be updated each semester manually

---

## Suggested Next Steps

1. **Test Planning Mode end-to-end** — find a course known to be fully enrolled and verify schedules return with the FULL badge visible on the results cards
2. **ScheduleDetail FULL callout** — the existing `SeatIndicator` shows "Full" in red but is small; consider a more prominent per-course warning banner in planning mode
3. **Term code update** — verify `"20263"` is correct for the upcoming registration period
4. **Input validation** — `InputForm` has no client-side validation before submit; empty submissions reach the backend and return a generic error
5. **Test coverage** — only `test_scraper.py` (27 lines) exists; the solver and GE logic have no automated tests
6. **InputForm refactor** — `InputForm.tsx` is 1,700+ lines; the constraints section and course entry block are candidates for extraction into sub-components
7. **Error UX** — backend errors surface as a plain red string; structured errors with suggested fixes (e.g., "Try relaxing your time window") would improve the experience
