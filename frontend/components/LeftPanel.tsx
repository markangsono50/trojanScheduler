"use client"

interface Props {
  currentStep: 1 | 2 | 3
  onStartOver?: () => void
}

export default function LeftPanel({ currentStep, onStartOver }: Props) {
  const steps = [
    { num: 1, label: "Add your courses & constraints" },
    { num: 2, label: "Build 3 optimal schedules" },
    { num: 3, label: "Review & export" },
  ]
  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        width: "22.222%",
        background: "linear-gradient(170deg, #3d0000 0%, #6B0000 45%, #990000 100%)",
        display: "flex",
        flexDirection: "column",
        padding: "40px 28px",
        zIndex: 10,
      }}
    >
      <div style={{ flex: 1 }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.12em",
            color: "rgba(255,204,0,0.75)",
            textTransform: "uppercase",
            marginBottom: 14,
          }}
        >
          USC · Fall 2026
        </p>
        <h1
          style={{
            fontFamily: "'DM Serif Display', serif",
            color: "#fff",
            fontSize: 30,
            lineHeight: 1.1,
            marginBottom: 12,
          }}
        >
          Trojan<br />Scheduler
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, lineHeight: 1.6, maxWidth: 160 }}>
          Build the perfect USC schedule in seconds.
        </p>
      </div>
      <div>
        <p
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.1em",
            color: "rgba(255,255,255,0.3)",
            textTransform: "uppercase",
            marginBottom: 20,
          }}
        >
          How it works
        </p>
        {steps.map(({ num, label }, i) => {
          const active = num === currentStep
          return (
            <div
              key={num}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                paddingTop: i > 0 ? 16 : 0,
                marginTop: i > 0 ? 16 : 0,
                borderTop: i > 0 ? "1px solid rgba(255,255,255,0.08)" : "none",
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  flexShrink: 0,
                  border: active ? "2px solid rgba(255,204,0,0.75)" : "2px solid rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: active ? "rgba(255,204,0,0.1)" : "transparent",
                  marginTop: 1,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: active ? "rgba(255,204,0,0.9)" : "rgba(255,255,255,0.3)",
                  }}
                >
                  {num}
                </span>
              </div>
              <span
                style={{
                  fontSize: 13,
                  lineHeight: 1.5,
                  paddingTop: 4,
                  color: active ? "#fff" : "rgba(255,255,255,0.3)",
                  fontWeight: active ? 500 : 400,
                }}
              >
                {label}
              </span>
            </div>
          )
        })}

        {onStartOver && (
          <button
            onClick={onStartOver}
            style={{
              marginTop: 28,
              background: "transparent",
              border: "none",
              padding: 0,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.45)",
              cursor: "pointer",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "rgba(255,204,0,0.85)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(255,255,255,0.45)"
            }}
          >
            Start Over
          </button>
        )}
      </div>
    </div>
  )
}
