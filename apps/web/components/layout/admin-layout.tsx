"use client"

import * as React from "react"
import { Sidebar } from "./sidebar"
import { Navbar } from "./navbar"
import { ADMIN_NAV_SECTIONS } from "@/components/admin/nav-config"

interface AdminLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  navbarActions?: React.ReactNode
}

export function AdminLayout({
  children,
  title,
  subtitle,
  navbarActions,
}: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar
        sections={ADMIN_NAV_SECTIONS}
        isOpen={sidebarOpen}
        onOpenChange={setSidebarOpen}
        isCollapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />
      <div className="flex-1 flex flex-col overflow-hidden w-full min-w-0">
        <Navbar
          title={title}
          subtitle={subtitle}
          actions={navbarActions}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="p-5 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
