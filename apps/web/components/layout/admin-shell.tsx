"use client"

import * as React from "react"
import { Sidebar } from "./sidebar"
import { ADMIN_NAV_SECTIONS } from "@/components/admin/nav-config"
import { useIsMobile } from "@/components/ui/use-mobile"

interface AdminShellContextValue {
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  toggleCollapsed: () => void
}

const AdminShellContext = React.createContext<AdminShellContextValue | null>(null)

export function useAdminShell(): AdminShellContextValue {
  const context = React.useContext(AdminShellContext)
  return context ?? {
    sidebarOpen: true,
    sidebarCollapsed: false,
    toggleSidebar: () => {},
    toggleCollapsed: () => {},
  }
}

interface AdminShellProps {
  children: React.ReactNode
  /** 
   * Pass from the Server Component (layout.tsx) by reading the cookie.
   * This eliminates the SSR→hydration flash entirely.
   */
  defaultSidebarOpen?: boolean
  defaultSidebarCollapsed?: boolean
}

const SIDEBAR_COOKIE = "admin_sidebar_open"
const COLLAPSED_COOKIE = "admin_sidebar_collapsed"

export function AdminShell({
  children,
  defaultSidebarOpen = true,   // server-read cookie value passed as prop
  defaultSidebarCollapsed = false,
}: AdminShellProps) {
  const isMobile = useIsMobile()

  // Initialize from the cookie (server-provided), not false
  const [sidebarOpen, setSidebarOpen] = React.useState(defaultSidebarOpen)
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(defaultSidebarCollapsed)

  // Only override based on mobile once we know for sure
  const hasAppliedMobileDefault = React.useRef(false)
  React.useEffect(() => {
    if (isMobile !== undefined && !hasAppliedMobileDefault.current) {
      hasAppliedMobileDefault.current = true
      if (isMobile) setSidebarOpen(false) // Force closed on mobile
    }
  }, [isMobile])

  const toggleSidebar = React.useCallback(() => {
    setSidebarOpen((open) => {
      const next = !open
      // Persist preference to cookie for next SSR render
      document.cookie = `${SIDEBAR_COOKIE}=${next}; path=/; max-age=31536000`
      return next
    })
  }, [])

  const toggleCollapsed = React.useCallback(() => {
    setSidebarCollapsed((c) => {
      const next = !c
      document.cookie = `${COLLAPSED_COOKIE}=${next}; path=/; max-age=31536000`
      return next
    })
  }, [])

  const value = React.useMemo(
    () => ({ sidebarOpen, sidebarCollapsed, toggleSidebar, toggleCollapsed }),
    [sidebarOpen, sidebarCollapsed, toggleSidebar, toggleCollapsed]
  )

  return (
    <AdminShellContext.Provider value={value}>
      <div className="flex h-screen overflow-hidden bg-surface">
        <Sidebar
          sections={ADMIN_NAV_SECTIONS}
          isOpen={sidebarOpen}
          onOpenChange={setSidebarOpen}
          isCollapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />
        <div className="flex-1 flex flex-col overflow-hidden w-full min-w-0">
          {children}
        </div>
      </div>
    </AdminShellContext.Provider>
  )
}