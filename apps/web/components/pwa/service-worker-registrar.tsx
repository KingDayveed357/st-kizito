"use client"

import { useEffect } from "react"

/**
 * Registers the service worker in production only (a SW in dev fights hot-reload).
 * Renders nothing.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV !== "production"
    ) {
      return
    }
    const register = () => navigator.serviceWorker.register("/sw.js").catch(() => {})
    // Register after load so it never competes with first paint.
    if (document.readyState === "complete") register()
    else window.addEventListener("load", register, { once: true })
  }, [])

  return null
}
