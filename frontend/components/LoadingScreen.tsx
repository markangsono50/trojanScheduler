"use client"
import { useEffect, useState } from "react"

const STEPS = [
  { label: "Reading your courses",                delay: 0 },
  { label: "Scraping USC Schedule of Classes",    delay: 2500 },
  { label: "Fetching RateMyProfessor scores",     delay: 6000 },
  { label: "Finding GE options that fit",         delay: 10000 },
  { label: "Running schedule optimizer",          delay: 14000 },
  { label: "Building your top 3 schedules",       delay: 17000 },
]

const EXPECTED_DURATION_MS = 22000

const DAYS = ["M", "T", "W", "Th", "F"]

type Block = {
  col: number
  row: number
  rowSpan: number
  accent: "cardinal" | "gold"
  delay: number
}

const BLOCKS: Block[] = [
  { col: 4, row: 1, rowSpan: 2, accent: "cardinal", delay: 2700 },
  { col: 1, row: 3, rowSpan: 2, accent: "cardinal", delay: 3000 },
  { col: 3, row: 3, rowSpan: 2, accent: "cardinal", delay: 3300 },
  { col: 5, row: 3, rowSpan: 2, accent: "cardinal", delay: 3600 },
  { col: 2, row: 5, rowSpan: 2, accent: "cardinal", delay: 6300 },
  { col: 4, row: 5, rowSpan: 2, accent: "cardinal", delay: 6600 },
  { col: 1, row: 7, rowSpan: 2, accent: "gold",     delay: 10300 },
  { col: 3, row: 7, rowSpan: 2, accent: "gold",     delay: 10600 },
]

export default function LoadingScreen() {
  const [activeStep, setActiveStep] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timers = STEPS.map((s, i) =>
      setTimeout(() => setActiveStep(i), s.delay)
    )
    const start = Date.now()
    const tick = setInterval(() => {
      const pct = Math.min(95, ((Date.now() - start) / EXPECTED_DURATION_MS) * 100)
      setProgress(pct)
    }, 100)
    return () => {
      timers.forEach(clearTimeout)
      clearInterval(tick)
    }
  }, [])

  return (
    <div
      className="flex flex-col items-center justify-center px-6"
      style={{ minHeight: "100vh" }}
    >
      <p
        className="text-2xl md:text-3xl text-center mb-10"
        style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}
      >
        Building your schedules
      </p>

      <div
        className="flex flex-col md:flex-row items-center md:items-start gap-8 w-full"
        style={{ maxWidth: 640 }}
      >
        {/* Mini schedule card */}
        <div
          className="card"
          style={{
            width: 280,
            padding: 16,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 6,
              marginBottom: 8,
            }}
          >
            {DAYS.map((d) => (
              <div
                key={d}
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--text-tertiary)",
                  textAlign: "center",
                }}
              >
                {d}
              </div>
            ))}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gridTemplateRows: "repeat(8, 14px)",
              gap: 3,
              position: "relative",
            }}
          >
            {Array.from({ length: 40 }).map((_, i) => (
              <div
                key={i}
                style={{
                  background: "var(--bg-subtle)",
                  borderRadius: 2,
                }}
              />
            ))}
            {BLOCKS.map((b, i) => (
              <div
                key={`block-${i}`}
                className="loading-schedule-block"
                style={{
                  gridColumn: b.col,
                  gridRow: `${b.row} / span ${b.rowSpan}`,
                  background:
                    b.accent === "gold" ? "var(--gold)" : "var(--cardinal)",
                  borderRadius: 3,
                  animationDelay: `${b.delay}ms`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Step list */}
        <ul
          role="status"
          aria-live="polite"
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            paddingTop: 24,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            flex: 1,
            minWidth: 0,
          }}
        >
          {STEPS.map((step, i) => {
            const state =
              i < activeStep ? "done" : i === activeStep ? "active" : "pending"
            return (
              <li
                key={i}
                className={`loading-step loading-step--${state}`}
              >
                <span className={`loading-step-bullet loading-step-bullet--${state}`}>
                  {state === "done" && (
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 10 10"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M2 5.2L4.2 7.4L8.2 2.6"
                        stroke="var(--cardinal)"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  {state === "active" && (
                    <span className="loading-step-bullet-dot" />
                  )}
                </span>
                <span className="loading-step-label">{step.label}</span>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Progress bar */}
      <div className="w-full" style={{ maxWidth: 640, marginTop: 24 }}>
        <div
          style={{
            height: 2,
            borderRadius: 1,
            background: "var(--border-default)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: "100%",
              background:
                "linear-gradient(to right, var(--cardinal), var(--gold))",
              transform: `translateX(-${100 - progress}%)`,
              transition: "transform 200ms ease-out",
              willChange: "transform",
            }}
          />
        </div>
        <div
          className="flex justify-between items-center mt-2"
          style={{ color: "var(--text-tertiary)" }}
        >
          <span style={{ fontSize: 13 }}>Usually takes 15 to 30 seconds</span>
          <span
            className="font-mono tabular-nums"
            style={{ fontSize: 12 }}
          >
            {Math.round(progress)}%
          </span>
        </div>
      </div>
    </div>
  )
}
