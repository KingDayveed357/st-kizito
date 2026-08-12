"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut, PanelLeftClose, PanelLeftOpen, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SidebarNavSection } from "@/components/admin/nav-config"
import { useLogout } from "@/hooks/use-logout"

interface SidebarProps {
  sections: SidebarNavSection[]
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  isCollapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

export function Sidebar({
  sections,
  isOpen = true,
  onOpenChange,
  isCollapsed = false,
  onCollapsedChange,
}: SidebarProps) {
  const pathname = usePathname()
  const { isLoggingOut, logoutError, logoutSuccess, handleLogout } = useLogout()

  const handleCollapsedChange = (value: boolean) => {
    onCollapsedChange?.(value)
  }

  const handleOpenChange = (value: boolean) => {
    onOpenChange?.(value)
  }

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === href
    }

    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-30 transition-opacity duration-300 md:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => handleOpenChange(false)}
      />

      <aside
        className={cn(
          "flex flex-col h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 z-40 fixed md:relative border-r border-sidebar-border",
          "md:translate-x-0",
          !isOpen && "-translate-x-full md:translate-x-0",
          isCollapsed ? "w-20 md:w-20" : "w-64 md:w-64"
        )}
      >
        <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-4">
          <div className={cn("flex items-center gap-3 min-w-0", isCollapsed && "justify-center w-full") }>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground text-sm font-semibold">
              SK
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight truncate">St. Kizito Parish</p>
                <p className="text-xs text-sidebar-foreground/60 truncate">Admin Console</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handleCollapsedChange(!isCollapsed)}
              className="hidden md:inline-flex p-1.5 hover:bg-sidebar-accent/20 rounded-lg transition-colors"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
            <button
              onClick={() => handleOpenChange(false)}
              className="p-1.5 hover:bg-sidebar-accent/20 rounded-lg transition-colors md:hidden"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-6">
            {sections.map((section) => (
              <div key={section.title}>
                {!isCollapsed && (
                  <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/45">
                    {section.title}
                  </p>
                )}
                <ul className="space-y-1">
                  {section.items.map((item) => {
                    const active = isActive(item.href)
                    const Icon = item.icon

                    return (
                      <li key={item.href}>
                        {item.disabled ? (
                          <span
                            aria-disabled="true"
                            className={cn(
                              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                              "cursor-not-allowed text-sidebar-foreground/45",
                              isCollapsed && "md:justify-center"
                            )}
                            title={isCollapsed ? item.label : undefined}
                          >
                            <Icon className="h-4.5 w-4.5 flex-shrink-0 opacity-60" />
                            {!isCollapsed && (
                              <>
                                <span className="truncate">{item.label}</span>
                                {item.badge ? (
                                  <span className="ml-auto rounded-full bg-sidebar-accent/60 px-2 py-0.5 text-[10px] font-medium text-sidebar-accent-foreground">
                                    {item.badge}
                                  </span>
                                ) : null}
                              </>
                            )}
                          </span>
                        ) : (
                          <Link
                            href={item.href}
                            className={cn(
                              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                              isCollapsed && "md:justify-center",
                              active
                                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                                : "text-sidebar-foreground/88 hover:bg-sidebar-accent/25 hover:text-sidebar-foreground"
                            )}
                            title={isCollapsed ? item.label : undefined}
                          >
                            <Icon className={cn("h-4.5 w-4.5 flex-shrink-0", active ? "opacity-100" : "opacity-80 group-hover:opacity-100")} />
                            {!isCollapsed && (
                              <>
                                <span className="truncate">{item.label}</span>
                                {item.badge ? (
                                  <span className="ml-auto rounded-full bg-sidebar-accent px-2 py-0.5 text-[10px] font-medium text-sidebar-accent-foreground">
                                    {item.badge}
                                  </span>
                                ) : null}
                              </>
                            )}
                          </Link>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        <div className="border-t border-sidebar-border p-3 space-y-2">
          <button
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
              "hover:bg-sidebar-accent/25",
              isCollapsed && "md:justify-center",
              !isCollapsed && "w-full"
            )}
            title={isCollapsed ? "Logout" : undefined}
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut className="h-4.5 w-4.5 flex-shrink-0" />
            {!isCollapsed && <span>{isLoggingOut ? 'Signing out...' : 'Logout'}</span>}
          </button>

          {!isCollapsed && logoutSuccess ? (
            <p className="px-3 text-xs text-emerald-500 animate-in fade-in duration-300">Signed out. Redirecting...</p>
          ) : null}
          {!isCollapsed && logoutError ? (
            <p className="px-3 text-xs text-amber-500 animate-in fade-in duration-300">{logoutError}</p>
          ) : null}
        </div>
      </aside>
    </>
  )
}
