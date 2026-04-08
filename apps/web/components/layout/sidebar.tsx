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
  const [open, setOpen] = React.useState(true)
  const [collapsed, setCollapsed] = React.useState(isCollapsed)
  const [mounted, setMounted] = React.useState(false)
  const { isLoggingOut, logoutError, logoutSuccess, handleLogout } = useLogout()

  React.useEffect(() => {
    setMounted(true)
    setOpen(isOpen)
  }, [isOpen])

  const handleCollapsedChange = (value: boolean) => {
    setCollapsed(value)
    onCollapsedChange?.(value)
  }

  const handleOpenChange = (value: boolean) => {
    setOpen(value)
    onOpenChange?.(value)
  }

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === href
    }

    return pathname === href || pathname.startsWith(`${href}/`)
  }

  if (!mounted) return null

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-30 transition-opacity duration-300 md:hidden",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => handleOpenChange(false)}
      />

      <aside
        className={cn(
          "flex flex-col h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 z-40 fixed md:relative border-r border-sidebar-border",
          "md:translate-x-0",
          !open && "-translate-x-full md:translate-x-0",
          collapsed ? "w-20 md:w-20" : "w-72 md:w-72"
        )}
      >
        <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-4">
          <div className={cn("flex items-center gap-3 min-w-0", collapsed && "justify-center w-full") }>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground text-sm font-semibold">
              SK
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight truncate">St. Kizito Parish</p>
                <p className="text-xs text-sidebar-foreground/60 truncate">Admin Console</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handleCollapsedChange(!collapsed)}
              className="hidden md:inline-flex p-1.5 hover:bg-sidebar-accent/20 rounded-lg transition-colors"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
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
                {!collapsed && (
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
                        <Link
                          href={item.href}
                          className={cn(
                            "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                            collapsed && "md:justify-center",
                            active
                              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                              : "text-sidebar-foreground/88 hover:bg-sidebar-accent/25 hover:text-sidebar-foreground"
                          )}
                          title={collapsed ? item.label : undefined}
                        >
                          <Icon className={cn("h-4.5 w-4.5 flex-shrink-0", active ? "opacity-100" : "opacity-80 group-hover:opacity-100")} />
                          {!collapsed && (
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
              collapsed && "md:justify-center",
              !collapsed && "w-full"
            )}
            title={collapsed ? "Logout" : undefined}
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut className="h-4.5 w-4.5 flex-shrink-0" />
            {!collapsed && <span>{isLoggingOut ? 'Signing out...' : 'Logout'}</span>}
          </button>

          {!collapsed && logoutSuccess ? (
            <p className="px-3 text-xs text-emerald-500">Signed out. Redirecting...</p>
          ) : null}
          {!collapsed && logoutError ? (
            <p className="px-3 text-xs text-amber-500">{logoutError}</p>
          ) : null}
        </div>
      </aside>
    </>
  )
}
