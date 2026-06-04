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
      <div className="relative w-32 h-32 mb-10">
        <span className="loading-pulse-ring" />
        <span className="loading-pulse-ring" style={{ animationDelay: "0.9s" }} />
        <span className="loading-pulse-ring" style={{ animationDelay: "1.8s" }} />
        <span
          className="absolute inset-0 m-auto w-3.5 h-3.5 rounded-full"
          style={{
            background: "var(--cardinal)",
            boxShadow: "0 0 0 5px rgba(153,0,0,0.10)",
          }}
        />
      </div>

      <p
        className="text-2xl md:text-3xl text-center mb-2"
        style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}
      >
        {STEPS[activeStep].label}…
      </p>
      <p
        className="text-sm mb-10"
        style={{ color: "var(--text-tertiary)" }}
      >
        Usually takes 15 to 30 seconds
      </p>

      <div className="w-full max-w-md">
        <div
          className="h-1 rounded-full overflow-hidden"
          style={{ background: "var(--border-default)" }}
        >
          <div
            className="h-full"
            style={{
              background: "var(--cardinal)",
              width: `${progress}%`,
              transition: "width 200ms ease-out",
            }}
          />
        </div>
        <p
          className="text-xs font-mono mt-2 text-right tabular-nums"
          style={{ color: "var(--text-tertiary)" }}
        >
          {Math.round(progress)}%
        </p>
      </div>
    </div>
  )
}
