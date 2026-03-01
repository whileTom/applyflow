import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "ApplyFlow - AI-Powered Resume Optimizer"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1a1428 0%, #1f1935 100%)",
        fontFamily: "system-ui, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background pattern */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          display: "flex",
          opacity: 0.1,
        }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              background: i % 2 === 0 ? "#7e5fd4" : "transparent",
              transform: `skewY(-12deg)`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px",
          zIndex: 1,
        }}
      >
        {/* Logo/Icon representation */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "160px",
            height: "160px",
            borderRadius: "32px",
            background: "linear-gradient(135deg, #7e5fd4 0%, #6a52c4 100%)",
            marginBottom: "40px",
            boxShadow: "0 20px 60px rgba(126, 95, 212, 0.4)",
          }}
        >
          <svg width="100" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
              stroke="#f5f5f6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M14 2v6h6" stroke="#f5f5f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 18v-6" stroke="#f5f5f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="m9 15 3-3 3 3" stroke="#f5f5f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: "72px",
            fontWeight: "800",
            color: "#f5f5f6",
            margin: "0",
            marginBottom: "24px",
            letterSpacing: "-0.02em",
            textAlign: "center",
          }}
        >
          ApplyFlow
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "32px",
            fontWeight: "500",
            color: "#9d8cc7",
            margin: "0",
            textAlign: "center",
            maxWidth: "800px",
          }}
        >
          AI-Powered Resume Optimizer
        </p>

        {/* Accent line */}
        <div
          style={{
            width: "120px",
            height: "6px",
            background: "linear-gradient(90deg, #7e5fd4 0%, #6a86d9 100%)",
            borderRadius: "3px",
            marginTop: "32px",
          }}
        />
      </div>

      {/* Bottom accent */}
      <div
        style={{
          position: "absolute",
          bottom: "0",
          left: "0",
          right: "0",
          height: "8px",
          background: "linear-gradient(90deg, #7e5fd4 0%, #6a86d9 50%, #7e5fd4 100%)",
        }}
      />
    </div>,
    {
      ...size,
    },
  )
}
