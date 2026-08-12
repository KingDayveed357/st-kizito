"use client"

import * as React from "react"
import { Navbar } from "./navbar"
import { useAdminShell } from "./admin-shell"

interface AdminPageProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  navbarActions?: React.ReactNode
}

/**
 * Per-page content region for admin dashboard pages: the top bar (page title, search, actions) plus
 * the scrollable content area.
 *
 * The surrounding chrome (sidebar) is rendered once by the route-group layout via `AdminShell`, so
 * navigating between admin pages swaps only this region — the sidebar no longer remounts or
 * flashes in. Props intentionally mirror the previous `AdminLayout` so pages needed no other change.
 */
export function AdminPage({ children, title, subtitle, navbarActions }: AdminPageProps) {
  const { toggleSidebar } = useAdminShell()

  return (
    <>
      <Navbar title={title} subtitle={subtitle} actions={navbarActions} onMenuClick={toggleSidebar} />
      <main className="flex-1 overflow-y-auto bg-surface-container-lowest/20">
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">{children}</div>
      </main>
    </>
  )
}
