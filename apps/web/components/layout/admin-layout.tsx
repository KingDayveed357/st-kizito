"use client"

import * as React from "react"
import { Sidebar } from "./sidebar"
import { Navbar } from "./navbar"
import { ADMIN_NAV_SECTIONS } from "@/components/admin/nav-config"
import { useIsMobile } from "@/components/ui/use-mobile"

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
  const isMobile = useIsMobile()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)

  // Sync sidebar state with screen size
  React.useEffect(() => {
    if (isMobile !== undefined) {
      if (!isMobile) {
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
    }
  }, [isMobile])

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
        <main className="flex-1 overflow-y-auto bg-surface-container-lowest/20">
          <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  )
}
