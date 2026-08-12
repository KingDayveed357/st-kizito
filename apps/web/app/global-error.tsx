"use client"

import { useEffect } from "react"

/**
 * Last-resort boundary: catches errors thrown by the root layout itself, where no styling, fonts, or
 * providers are guaranteed to have loaded. It must render its own <html> and <body>, and it cannot
 * rely on globals.css having applied — so the few styles it needs are inline.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[app] global error:", error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fcf9f3",
          color: "#1c1c18",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "26rem" }}>
          <div style={{ fontSize: "2.25rem", marginBottom: "1.25rem" }} aria-hidden="true">
            ✝
          </div>

          <h1 style={{ fontSize: "1.6rem", fontWeight: 600, margin: "0 0 0.75rem" }}>
            The application could not start
          </h1>

          <p style={{ color: "#56534a", lineHeight: 1.6, margin: "0 0 2rem" }}>
            Something failed before the page could load. Please try again.
          </p>

          <button
            onClick={reset}
            style={{
              padding: "0.65rem 1.4rem",
              borderRadius: "999px",
              border: "none",
              backgroundColor: "#000000",
              color: "#ffffff",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>

          {error.digest ? (
            <p style={{ marginTop: "1.5rem", fontSize: "0.75rem", color: "#8a8377" }}>
              Reference code: {error.digest}
            </p>
          ) : null}
        </div>
      </body>
    </html>
  )
}
