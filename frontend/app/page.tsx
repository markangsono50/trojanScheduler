"use client"

import { useState } from "react"
import InputForm from "@/components/InputForm"
import LeftPanel from "@/components/LeftPanel"
import LoadingScreen from "@/components/LoadingScreen"
import ScheduleImageCard from "@/components/ScheduleImageCard"
import ScheduleDetail from "@/components/ScheduleDetail"
import {
  AppStage,
  DiscussionOption,
  GenerateRequest,
  GenerateResponse,
  Schedule,
  SwapState,
} from "@/lib/types"

export default function Home() {
  const [stage, setStage] = useState<AppStage>("form")
  const [response, setResponse] = useState<GenerateResponse | null>(null)
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
  const [swapState, setSwapState] = useState<SwapState>({})
  const [error, setError] = useState<string | null>(null)
  const [discussionPromptCourse, setDiscussionPromptCourse] = useState<string | null>(null)
  const [discussionOptions, setDiscussionOptions] = useState<DiscussionOption[]>([])
  const [pendingPayload, setPendingPayload] = useState<GenerateRequest | null>(null)
  const [planningMode, setPlanningMode] = useState(false)

  const callGenerate = async (payload: GenerateRequest) => {
    setError(null)
    setStage("loading")
    try {
      const res = await fetch(
        process.env.NEXT_PUBLIC_BACKEND_URL
          ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/generate`
          : "/api/generate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )
      const data: GenerateResponse = await res.json()

      if (data.needs_linked_section_prompt) {
        const course = data.needs_linked_section_prompt
        const bundles = data.linked_section_options?.[course] ?? []
        // Flatten lecture-keyed bundles into a single list of discussion
        // options. Each option carries the lecture it came from so we can
        // resubmit both ids together. Bundles whose options_by_type has no
        // "discussion" type are skipped (lecture-only courses shouldn't have
        // hit this path in the first place; if they do, the user has nothing
        // to pick).
        const flatOptions: DiscussionOption[] = bundles.flatMap((b) =>
          (b.options_by_type?.discussion ?? []).map((d) => ({
            section_id: d.section_id,
            days: d.days,
            start_time: d.start_time,
            end_time: d.end_time,
            seats_available: d.seats_available,
            total_seats: d.total_seats,
            location: d.location,
            lecture_section_id: b.lecture_section_id,
            lecture_professor: b.professor,
            lecture_days: b.lecture_days,
            lecture_start_time: b.lecture_start_time,
            lecture_end_time: b.lecture_end_time,
          }))
        )
        setDiscussionPromptCourse(course)
        setDiscussionOptions(flatOptions)
        setPendingPayload(payload)
        setStage("form")
        return
      }

      if (data.error || !data.schedules?.length) {
        setError(data.error ?? "No valid schedules found. Try adjusting your constraints.")
        setStage("form")
        return
      }

      setResponse(data)
      setSwapState({})
      setStage("results")
    } catch {
      setError("Could not reach the server. Please try again.")
      setStage("form")
    }
  }

  const handleSubmit = (payload: GenerateRequest) => {
    setPlanningMode(payload.planning_mode ?? false)
    setPendingPayload(payload)
    callGenerate(payload)
  }

  const handleDiscussionPreference = (
    pref: Record<string, Record<string, string>>
  ) => {
    if (!pendingPayload) return
    const updated: GenerateRequest = {
      ...pendingPayload,
      linked_section_preferences: {
        ...(pendingPayload.linked_section_preferences ?? {}),
        ...pref,
      },
    }
    setDiscussionPromptCourse(null)
    callGenerate(updated)
  }

  const handleSelect = (schedule: Schedule) => {
    // Clicking the already-selected card deselects it and returns to the
    // pre-detail comparison view.
    if (selectedSchedule?.rank === schedule.rank) {
      setSelectedSchedule(null)
      setSwapState({})
      setStage("results")
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }
    // Clicking a different card switches the detail view to that schedule.
    setSelectedSchedule(schedule)
    setSwapState({})
    setStage("detail")
    setTimeout(() => {
      document.getElementById("detail-section")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }, 120)
  }

  const handleStartOver = () => {
    setStage("form")
    setResponse(null)
    setSelectedSchedule(null)
    setSwapState({})
    setError(null)
    setDiscussionPromptCourse(null)
    setPendingPayload(null)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const currentStep: 1 | 2 | 3 = stage === "detail" ? 3 : stage === "form" ? 1 : 2

  // The form stage uses InputForm's own shell (LeftPanel + content area).
  // For loading/results/detail we reproduce the same shell here so the layout
  // stays identical across the whole app.
  if (stage === "form") {
    return (
      <InputForm
        onSubmit={handleSubmit}
        error={error}
        discussionPromptCourse={discussionPromptCourse}
        discussionOptions={discussionOptions}
        onDiscussionPreference={handleDiscussionPreference}
      />
    )
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <LeftPanel currentStep={currentStep} onStartOver={handleStartOver} />
      <div
        style={{
          marginLeft: "22.222%",
          width: "77.778%",
          minHeight: "100vh",
          backgroundColor: "var(--bg-page)",
        }}
      >
        {stage === "loading" && <LoadingScreen />}

        {(stage === "results" || stage === "detail") && response && (
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "56px 64px 96px" }}>

            {/* Page title */}
            <div style={{ marginBottom: 48 }}>
              <p
                style={{
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--cardinal)",
                  marginBottom: 14,
                }}
              >
                {stage === "results"
                  ? `${String(response.schedules.length).padStart(2, "0")} Options`
                  : "Selected"}
              </p>
              <h2
                style={{
                  fontFamily: "'DM Serif Display', serif",
                  color: "var(--text-primary)",
                  fontSize: 44,
                  lineHeight: 1.05,
                  letterSpacing: "-0.01em",
                  marginBottom: 12,
                }}
              >
                {stage === "results" ? "Your schedules." : "Schedule selected."}
              </h2>
              <p style={{ color: "var(--text-tertiary)", fontSize: 15, maxWidth: 520, lineHeight: 1.6 }}>
                {stage === "results"
                  ? "Three best builds, ranked by professor quality, compactness, and minimal gaps. Pick one to drill in."
                  : "Scroll down to see every course, swap GE choices, or export to your calendar."}
              </p>
            </div>

            {/* Schedule image cards */}
            <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 28, marginBottom: 48 }}>
              {response.schedules.map((sched) => (
                <ScheduleImageCard
                  key={sched.rank}
                  schedule={sched}
                  label={["A", "B", "C"][sched.rank - 1]}
                  isSelected={selectedSchedule?.rank === sched.rank}
                  dimmed={stage === "detail" && selectedSchedule?.rank !== sched.rank}
                  onSelect={handleSelect}
                  planningMode={planningMode}
                />
              ))}
            </div>

            {/* Detail section */}
            {stage === "detail" && selectedSchedule && (
              <div id="detail-section">
                <ScheduleDetail
                  schedule={selectedSchedule}
                  swapState={swapState}
                  onSwap={(originalId, replacement) =>
                    setSwapState((prev) => ({ ...prev, [originalId]: replacement }))
                  }
                  onStartOver={handleStartOver}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}