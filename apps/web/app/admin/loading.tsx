import { AdminLayout } from "@/components/layout/admin-layout"
import { AdminPageSkeleton } from "@/components/admin/admin-page-skeleton"

export default function AdminLoading() {
  return (
    <AdminLayout title="Loading" subtitle="Preparing admin workspace">
      <AdminPageSkeleton rows={4} />
    </AdminLayout>
  )
}
