"""
One-shot script — generates frontend/public/ge_courses.json mapping each USC
General Education category to its qualifying courses.

Pulls the canonical list straight from USC's GE endpoint
(/api/Courses/GeCoursesByTerm) so the dropdown the user sees matches the
official catalogue. GESM is included as its own pseudo-category.

Run from the backend directory with the venv active:
    python generate_ge_course_list.py
"""

import asyncio
import json
import os

import httpx

from scraper import BASE_URL, HTTP_HEADERS, TERM_CODE
from ge_finder import CATEGORY_PREFIX_MAP

OUT_PATH = os.path.join(
    os.path.dirname(__file__), "..", "frontend", "public", "ge_courses.json"
)


CONCURRENCY = 3
MAX_RETRIES = 4


async def fetch_category(
    letter: str,
    client: httpx.AsyncClient,
    sem: asyncio.Semaphore,
) -> list[dict]:
    req_prefix, cat_prefix = CATEGORY_PREFIX_MAP[letter]
    params = {
        "termCode": TERM_CODE,
        "geRequirementPrefix": req_prefix,
        "categoryPrefix": cat_prefix,
    }
    data: dict = {}
    async with sem:
        for attempt in range(MAX_RETRIES):
            try:
                r = await client.get(f"{BASE_URL}/Courses/GeCoursesByTerm", params=params)
                r.raise_for_status()
                data = r.json() or {}
                break
            except Exception as e:
                if attempt == MAX_RETRIES - 1:
                    print(f"  FAILED GE {letter}: {e}")
                    return []
                await asyncio.sleep(1.5 * (attempt + 1))
    courses = data.get("courses") or []

    seen: set[str] = set()
    out: list[dict] = []
    for c in courses:
        code = (c.get("fullCourseName") or "").strip().upper()
        if not code or code in seen:
            continue
        seen.add(code)
        title = (c.get("name") or c.get("description") or "").strip()
        out.append({"code": code, "title": title})
    out.sort(key=lambda x: x["code"])
    return out


async def main():
    async with httpx.AsyncClient(headers=HTTP_HEADERS, follow_redirects=True) as client:
        letters = list(CATEGORY_PREFIX_MAP.keys())  # A..H plus GESM
        print(f"Fetching {len(letters)} GE categories from USC...")

        sem = asyncio.Semaphore(CONCURRENCY)
        per_cat = await asyncio.gather(*[fetch_category(l, client, sem) for l in letters])
        results = dict(zip(letters, per_cat))

        print("\nTotals per category:")
        for letter in letters:
            print(f"  GE {letter}: {len(results[letter])} courses")
        print(f"Total entries (sum across cats): {sum(len(v) for v in results.values())}")

        with open(OUT_PATH, "w", encoding="utf-8") as f:
            json.dump(results, f, separators=(",", ":"))
        print(f"\nWritten to {OUT_PATH}")


if __name__ == "__main__":
    asyncio.run(main())
