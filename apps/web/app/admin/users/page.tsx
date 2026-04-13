"use client"

import { AdminLayout } from "@/components/layout/admin-layout"
import { ComingSoonPanel } from "@/components/admin/coming-soon-panel"

export default function UsersPage() {
  return (
    <AdminLayout title="Users & Admins" subtitle="Role and account governance">
      <div className="max-w-3xl space-y-6">
        <ComingSoonPanel
          title="Users & Admins"
          description="Role management, approval workflows, and account lifecycle controls are being rebuilt with stronger access policies and auditability."
        />
      </div>
    </AdminLayout>
  )
}
