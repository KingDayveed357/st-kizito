import type { ReactNode } from "react"
import { AdminShell } from "@/components/layout/admin-shell"
import { cookies } from "next/headers"

/**
 * Layout for the authenticated admin dashboard.
 *
 * This is a `(dashboard)` route GROUP: it adds no URL segment, so every page keeps its existing
 * path (`/admin`, `/admin/donations`, …). The group exists purely so the shell wraps the dashboard
 * pages while `/admin/login` — which sits outside it — stays chrome-free.
 *
 * Being a server component, the shell streams with the initial HTML; pages only supply content.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies()
  
  const sidebarOpen = cookieStore.get("admin_sidebar_open")?.value !== "false"
  const sidebarCollapsed = cookieStore.get("admin_sidebar_collapsed")?.value === "true"

  return   <AdminShell defaultSidebarOpen={sidebarOpen} defaultSidebarCollapsed={sidebarCollapsed}>
      {children}
    </AdminShell>
}
