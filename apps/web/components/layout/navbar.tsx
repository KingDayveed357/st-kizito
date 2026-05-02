"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface NavbarProps {
  title?: string
  subtitle?: string
  actions?: React.ReactNode
  onMenuClick?: () => void
  className?: string
}

export function Navbar({ title, subtitle, actions, onMenuClick, className }: NavbarProps) {
  return (
    <nav
      className={cn(
        "flex items-center justify-between min-h-16 px-4 md:px-6 border-b border-outline/20 bg-surface-container-lowest/95 backdrop-blur",
        className
      )}
    >
      <div className="flex items-center gap-4 flex-1">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 hover:bg-surface-container-low rounded-lg transition-colors"
          aria-label="Toggle sidebar"
        >
          <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Title */}
        <div className="flex flex-col min-w-0">
          {title && <h1 className="text-lg font-bold tracking-tight text-foreground truncate">{title}</h1>}
          {subtitle && <p className="text-[11px] text-foreground/50 font-medium uppercase tracking-wider truncate">{subtitle}</p>}
        </div>
      </div>

      {/* Actions */}
      {actions && <div className="flex items-center gap-3 flex-shrink-0">{actions}</div>}
    </nav>
  )
}
