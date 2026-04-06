"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface SidebarItem {
  label: string
  href: string
  icon?: React.ReactNode
  children?: SidebarItem[]
}

interface SidebarProps {
  items: SidebarItem[]
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  isCollapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

export function Sidebar({ items, isOpen = true, onOpenChange, isCollapsed = false, onCollapsedChange }: SidebarProps) {
  const pathname = usePathname()
  const [open, setOpen] = React.useState(true)
  const [collapsed, setCollapsed] = React.useState(isCollapsed)
  const [mounted, setMounted] = React.useState(false)

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
    return pathname === href || pathname.startsWith(href + "/")
  }

  if (!mounted) return null

  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/50 z-30 transition-opacity duration-300 md:hidden",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => handleOpenChange(false)}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 z-40 fixed md:relative border-r border-sidebar-border",
          "md:translate-x-0",
          !open && "-translate-x-full md:translate-x-0",
          collapsed ? "w-20 md:w-20" : "w-64 md:w-64"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm flex-shrink-0">
                SK
              </div>
              <span className="font-semibold text-sm truncate">Parish</span>
            </div>
          )}
          {collapsed && (
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm flex-shrink-0">
              SK
            </div>
          )}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleCollapsedChange(!collapsed)}
              className="p-1.5 hover:bg-sidebar-accent/20 rounded-lg transition-colors hidden md:block"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand" : "Collapse"}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {collapsed ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                )}
              </svg>
            </button>
            <button
              onClick={() => handleOpenChange(false)}
              className="p-1.5 hover:bg-sidebar-accent/20 rounded-lg transition-colors md:hidden"
              aria-label="Close sidebar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 md:px-3 py-4">
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    collapsed && "md:justify-center",
                    isActive(item.href)
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/20"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  {item.icon && <span className="flex-shrink-0 w-5 h-5">{item.icon}</span>}
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-3 flex items-center justify-center md:justify-start">
          <button 
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-sidebar-accent/20 transition-all duration-200",
              collapsed && "md:justify-center",
              !collapsed && "w-full"
            )}
            title={collapsed ? "Logout" : undefined}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
