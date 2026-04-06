"use client"

import * as React from "react"
import { Sidebar } from "./sidebar"
import { Navbar } from "./navbar"
import { cn } from "@/lib/utils"

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

  const sidebarItems = [
    {
      label: "Dashboard",
      href: "/admin",
      icon: (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-3m0 0l7-4 7 4M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9m-9 16l-7-4m0 0V5m7 4l7-4" />
        </svg>
      ),
    },
    {
      label: "Announcements",
      href: "/admin/announcements",
      icon: (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882m7.832 6.882a4.5 4.5 0 01-7.664 0m7.664 0a4.5 4.5 0 00-7.664 0m7.664 0l3.828-3.828a6 6 0 00-8.485 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Events",
      href: "/admin/events",
      icon: (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: "Mass Times",
      href: "/admin/mass-times",
      icon: (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Mass Bookings",
      href: "/admin/mass-bookings",
      icon: (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7 20H5a2 2 0 01-2-2V5a2 2 0 012-2h6.414a2 2 0 011.414.586l7 7A2 2 0 0121 9.414V19a2 2 0 01-2 2h-12a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      label: "Donations",
      href: "/admin/donations",
      icon: (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Users & Admins",
      href: "/admin/users",
      icon: (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 8.048M12 9v.75m6.154-.75H18m0 0a6 6 0 01-12 0m12 0H6" />
        </svg>
      ),
    },
    {
      label: "Payment Details",
      href: "/admin/payment-details",
      icon: (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      label: "Contact Details",
      href: "/admin/contact-details",
      icon: (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16h6M7 4h10a2 2 0 012 2v12l-3-2H7a2 2 0 01-2-2V6a2 2 0 012-2z" />
        </svg>
      ),
    },
    {
      label: "Settings",
      href: "/admin/settings",
      icon: (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar
        items={sidebarItems}
        isOpen={sidebarOpen}
        onOpenChange={setSidebarOpen}
        isCollapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <Navbar 
          title={title} 
          subtitle={subtitle} 
          actions={navbarActions}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
