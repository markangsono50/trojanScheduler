// CSS/HTML schedule renderer. Two density modes:
//   compact — small thumbnails in the result cards
//   large   — full-bleed schedule visible on the detail page
"use client"

import { Schedule, CourseEntry, LinkedSection } from "@/lib/types"

interface Props {
  schedule: Schedule
  size?: "compact" | "large"
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const
const START_MIN = 8 * 60   // 8:00
const END_MIN = 20 * 60    // 20:00
const SPAN = END_MIN - START_MIN

// Tasteful, distinguishable palette. Cardinal sits at index 0 so the USC
// signature anchors when a schedule has only one course.
const COURSE_PALETTE = [
  "#A30019", // USC cardinal
  "#3730A3", // indigo
  "#047857", // emerald
  "#6D28D9", // violet
  "#B45309", // amber
  "#0E7490", // teal
  "#BE185D", // rose
  "#1D4ED8", // blue
  "#15803D", // green
  "#9333EA", // purple
]
const GE_COLOR = "#C2410C"          // burnt orange
const DOUBLE_COUNT_BG = "#F0B400"   // USC gold for stacked-GE specials
const DOUBLE_COUNT_FG = "#1A1A00"

// Stable hash by course code — used as the *starting* palette index so a course
// tends to keep the same color across all 3 result cards.
function hashIndex(courseCode: string): number {
  let h = 0
  for (const ch of courseCode) h = (h * 31 + ch.charCodeAt(0)) | 0
  return Math.abs(h) % COURSE_PALETTE.length
}

// Assign each course in a schedule a UNIQUE palette color. We seed from the
// stable hash (for cross-card consistency) but linear-probe to the next free
// color on collision, so two different courses in the same schedule never share
// a color (e.g. EE 141 vs CSCI 170). GE / double-count blocks use their own
// dedicated colors and are excluded here.
function buildColorMap(schedule: Schedule): Map<string, string> {
  const map = new Map<string, string>()
  const used = new Set<string>()
  for (const course of schedule.courses) {
    if (course.entry_type === "ge" || course.is_double_count) continue
    if (map.has(course.course)) continue
    let idx = hashIndex(course.course)
    for (let i = 0; i < COURSE_PALETTE.length; i++) {
      const candidate = COURSE_PALETTE[(idx + i) % COURSE_PALETTE.length]
      if (!used.has(candidate)) {
        idx = (idx + i) % COURSE_PALETTE.length
        break
      }
    }
    const color = COURSE_PALETTE[idx]
    used.add(color)
    map.set(course.course, color)
  }
  return map
}

function pos(t: string): number {
  const [h, m] = t.split(":").map(Number)
  return Math.max(0, Math.min(1, (h * 60 + m - START_MIN) / SPAN))
}

// Full-word time formatting: "8am", "12pm", "1:30pm".
function fmt(t: string): string {
  const [h, m] = t.split(":").map(Number)
  const ampm = h >= 12 ? "pm" : "am"
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h
  return m === 0 ? `${hour}${ampm}` : `${hour}:${m.toString().padStart(2, "0")}${ampm}`
}

// Format an instructor name as "Last, First". "Karen S. Reeves" -> "Reeves, Karen S."
// Falls through TBA / single-word names unchanged.
function nameLastFirst(prof: string): string {
  if (!prof || prof === "TBA") return prof || "TBA"
  const parts = prof.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  const last = parts[parts.length - 1]
  const first = parts.slice(0, -1).join(" ")
  return `${last}, ${first}`
}

// Capitalize "discussion" -> "Discussion", "lab" -> "Lab".
function titleCase(s: string): string {
  if (!s) return ""
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

export default function ScheduleGrid({ schedule, size = "compact" }: Props) {
  const isLarge = size === "large"

  // Per-schedule color assignment — guarantees distinct colors per course.
  const colorMap = buildColorMap(schedule)

  // Density-dependent dimensions
  const dayHeaderSize = isLarge ? 11 : 9
  const dayHeaderPad = isLarge ? "12px 0 10px" : "7px 0 6px"
  const timeGutterWidth = isLarge ? 72 : 44
  const timeFontSize = isLarge ? 11 : 9
  const blockRadius = isLarge ? 7 : 4
  const dayGap = isLarge ? 6 : 2

  // Every hour from 8am through 8pm, in both modes.
  const hours: number[] = []
  for (let h = 8; h <= 20; h += 1) hours.push(h)

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-card)",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Day headers */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ width: timeGutterWidth, flexShrink: 0 }} />
        {DAYS.map((day) => {
          const isOn = schedule.days_with_class.includes(day)
          return (
            <div
              key={day}
              style={{
                flex: 1,
                textAlign: "center",
                fontSize: dayHeaderSize,
                fontWeight: 700,
                letterSpacing: "0.10em",
                padding: dayHeaderPad,
                color: isOn ? "var(--text-primary)" : "var(--text-tertiary)",
                opacity: isOn ? 1 : 0.5,
                textTransform: "uppercase",
              }}
            >
              {isLarge ? day.toUpperCase() : day[0]}
            </div>
          )
        })}
      </div>

      {/* Grid body */}
      <div
        style={{
          display: "flex",
          flex: 1,
          position: "relative",
          padding: isLarge ? "10px 8px" : "4px 4px",
        }}
      >
        {/* Time gutter — every hour */}
        <div style={{ width: timeGutterWidth, flexShrink: 0, position: "relative" }}>
          {hours.map((h) => {
            const top = ((h * 60 - START_MIN) / SPAN) * 100
            const ampm = h >= 12 ? "pm" : "am"
            const hour = h > 12 ? h - 12 : h === 0 ? 12 : h
            return (
              <div
                key={h}
                style={{
                  position: "absolute",
                  right: 8,
                  top: `${top}%`,
                  transform: "translateY(-50%)",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: timeFontSize,
                  color: "var(--text-tertiary)",
                  lineHeight: 1,
                  letterSpacing: "0.02em",
                }}
              >
                {`${hour}${ampm}`}
              </div>
            )
          })}
        </div>

        {/* Day columns + overlay gridlines */}
        <div style={{ flex: 1, display: "flex", gap: dayGap, position: "relative" }}>
          {/* Hour gridlines — every hour, span all columns */}
          {hours.slice(1, -1).map((h) => {
            const top = ((h * 60 - START_MIN) / SPAN) * 100
            return (
              <div
                key={h}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: `${top}%`,
                  height: 1,
                  background: "var(--border-subtle)",
                  // every other hour gets a stronger line for readability
                  opacity: h % 2 === 0 ? 0.7 : 0.35,
                  pointerEvents: "none",
                }}
              />
            )
          })}

          {DAYS.map((day) => {
            const isOn = schedule.days_with_class.includes(day)
            return (
              <div
                key={day}
                style={{
                  flex: 1,
                  position: "relative",
                  background: isOn ? "transparent" : "rgba(0,0,0,0.018)",
                  borderRadius: isLarge ? 8 : 4,
                }}
              >
                {/* Lecture blocks */}
                {schedule.courses.map((course) => {
                  if (!course.days.includes(day)) return null
                  return (
                    <CourseBlock
                      key={course.section_id}
                      course={course}
                      color={colorMap.get(course.course) ?? COURSE_PALETTE[0]}
                      isLarge={isLarge}
                      radius={blockRadius}
                    />
                  )
                })}

                {/* Linked sections (discussion / lab / quiz) */}
                {schedule.courses.flatMap((course) =>
                  course.linked_sections
                    .filter((ls) => ls.days.includes(day))
                    .map((ls) => (
                      <LinkedBlock
                        key={`${course.section_id}-${ls.section_id}`}
                        course={course}
                        section={ls}
                        color={colorMap.get(course.course) ?? COURSE_PALETTE[0]}
                        isLarge={isLarge}
                        radius={blockRadius}
                      />
                    ))
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Course block ──────────────────────────────────────────────────────────────

function CourseBlock({
  course,
  color,
  isLarge,
  radius,
}: {
  course: CourseEntry
  color: string
  isLarge: boolean
  radius: number
}) {
  const top = pos(course.start_time)
  const heightPct = pos(course.end_time) - top
  const isGE = course.entry_type === "ge"
  const isDC = course.is_double_count
  const bg = isDC ? DOUBLE_COUNT_BG : isGE ? GE_COLOR : color
  const fg = isDC ? DOUBLE_COUNT_FG : "#ffffff"
  const fgFaded = isDC ? "rgba(26,26,0,0.65)" : "rgba(255,255,255,0.82)"

  const timeRange = `${fmt(course.start_time)} - ${fmt(course.end_time)}`
  const prof = course.professor && course.professor !== "TBA"
    ? nameLastFirst(course.professor)
    : ""

  // Adaptive content based on block height. Same thresholds in both modes
  // since we render the same content hierarchy regardless of grid size.
  const showProf = Boolean(prof) && heightPct > 0.045
  const showTime = heightPct > 0.075

  return (
    <div
      style={{
        position: "absolute",
        left: 2,
        right: 2,
        top: `${top * 100}%`,
        height: `${Math.max(heightPct * 100, isLarge ? 5 : 4)}%`,
        background: bg,
        color: fg,
        borderRadius: radius,
        padding: isLarge ? "9px 12px" : "6px 9px",
        overflow: "hidden",
        boxShadow: isDC
          ? "0 1px 0 rgba(0,0,0,0.15) inset, 0 2px 6px rgba(240,180,0,0.25)"
          : "0 1px 0 rgba(0,0,0,0.15) inset, 0 2px 4px rgba(0,0,0,0.08)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        gap: isLarge ? 3 : 2,
      }}
    >
      {/* Course code */}
      <div
        style={{
          fontSize: isLarge ? 15 : 12,
          fontWeight: 700,
          letterSpacing: "0.02em",
          lineHeight: 1.1,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {course.course}
      </div>

      {/* Instructor — "Last, First" */}
      {showProf && (
        <div
          style={{
            fontSize: isLarge ? 12 : 10,
            fontWeight: 500,
            color: fgFaded,
            lineHeight: 1.15,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {prof}
        </div>
      )}

      {/* Time */}
      {showTime && (
        <div
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: isLarge ? 11 : 9,
            color: fgFaded,
            lineHeight: 1,
            marginTop: isLarge ? 2 : 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {timeRange}
        </div>
      )}
    </div>
  )
}

// ── Linked section (discussion / lab / quiz) ──────────────────────────────────

function LinkedBlock({
  course,
  section,
  color,
  isLarge,
  radius,
}: {
  course: CourseEntry
  section: LinkedSection
  color: string
  isLarge: boolean
  radius: number
}) {
  const top = pos(section.start_time)
  const heightPct = pos(section.end_time) - top

  // Full color matching the parent lecture — same treatment as CourseBlock,
  // so discussions / labs / quizzes read as siblings of the lecture rather
  // than faded satellites. The text content "{COURSE} {Type}" tells them
  // apart visually.
  const bg = color
  const fg = "#ffffff"
  const fgFaded = "rgba(255,255,255,0.82)"

  const typeLabel = titleCase(section.section_type)
  const codeAndType = `${course.course} ${typeLabel}`
  const timeRange = `${fmt(section.start_time)} - ${fmt(section.end_time)}`
  const showTime = heightPct > 0.075

  return (
    <div
      style={{
        position: "absolute",
        left: 2,
        right: 2,
        top: `${top * 100}%`,
        height: `${Math.max(heightPct * 100, isLarge ? 4 : 3)}%`,
        background: bg,
        color: fg,
        borderRadius: radius,
        padding: isLarge ? "9px 12px" : "6px 9px",
        overflow: "hidden",
        boxShadow: "0 1px 0 rgba(0,0,0,0.15) inset, 0 2px 4px rgba(0,0,0,0.08)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        gap: isLarge ? 3 : 2,
      }}
    >
      {/* Course code + type — matches the lecture block's typography */}
      <div
        style={{
          fontSize: isLarge ? 15 : 12,
          fontWeight: 700,
          letterSpacing: "0.02em",
          lineHeight: 1.1,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {codeAndType}
      </div>

      {/* Time */}
      {showTime && (
        <div
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: isLarge ? 11 : 9,
            color: fgFaded,
            lineHeight: 1,
            marginTop: isLarge ? 2 : 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {timeRange}
        </div>
      )}
    </div>
  )
}
