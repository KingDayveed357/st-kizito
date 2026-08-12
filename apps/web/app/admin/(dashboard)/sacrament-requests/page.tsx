"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button-custom"
import { Badge } from "@/components/ui/badge-custom"
import { Card, CardContent } from "@/components/ui/card-custom"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table-custom"
import { AdminPageSkeleton } from "@/components/admin/admin-page-skeleton"
import { createClient } from "@/lib/supabase"

type SacramentStatus = "pending" | "approved" | "rejected" | "needs_info"

type SacramentRequest = {
  id: string
  type: string
  full_name: string
  contact_phone: string | null
  payload: Record<string, string> | null
  attachment_url: string | null
  is_free: boolean
  amount_due: number
  admin_note: string | null
  status: SacramentStatus
  created_at: string
  sacrament_request_types?: { title: string } | null
}

const STATUS_FILTERS: Array<"all" | SacramentStatus> = ["all", "pending", "approved", "needs_info", "rejected"]

export default function SacramentRequestsPage() {
  const [requests, setRequests] = useState<SacramentRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | SacramentStatus>("all")

  const supabase = createClient()

  useEffect(() => {
    fetchRequests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchRequests = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from("sacrament_requests")
      .select("*, sacrament_request_types(title)")
      .order("created_at", { ascending: false })
    if (!error && data) setRequests(data as unknown as SacramentRequest[])
    setIsLoading(false)
  }

  const update = async (id: string, status: SacramentStatus, admin_note?: string | null) => {
    setActiveId(id)
    await supabase.from("sacrament_requests").update({ status, admin_note: admin_note ?? null }).eq("id", id)
    await fetchRequests()
    setActiveId(null)
  }

  const approve = (id: string) => update(id, "approved", null)
  const reject = (id: string) => {
    const note = window.prompt("Reason for declining (shown to the parishioner):") ?? ""
    update(id, "rejected", note)
  }
  const requestInfo = (id: string) => {
    const note = window.prompt("What information is needed from the parishioner?") ?? ""
    if (note.trim()) update(id, "needs_info", note)
  }

  const badgeVariant = (s: string) =>
    s === "approved" ? "success" : s === "rejected" ? "destructive" : s === "needs_info" ? "default" : "warning"

  const label = (s: string) => (s === "needs_info" ? "Needs Info" : s.charAt(0).toUpperCase() + s.slice(1))

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter)

  return (
    <AdminLayout title="Sacramental Requests" subtitle="Review and process parishioner sacrament requests">
      <div className="mb-6 flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}>
            {f === "all" ? "All" : label(f)} ({f === "all" ? requests.length : requests.filter((r) => r.status === f).length})
          </Button>
        ))}
      </div>

      {isLoading ? <AdminPageSkeleton rows={4} /> : null}
      {!isLoading && filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No requests found</p>
          </CardContent>
        </Card>
      ) : !isLoading ? (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parishioner</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{r.full_name}</span>
                      {r.contact_phone ? <span className="text-muted-foreground text-xs">{r.contact_phone}</span> : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{r.sacrament_request_types?.title ?? r.type}</TableCell>
                  <TableCell className="max-w-xs text-sm">
                    <div className="flex flex-col gap-0.5">
                      {r.payload &&
                        Object.entries(r.payload)
                          .filter(([, v]) => v)
                          .map(([k, v]) => (
                            <span key={k} className="text-xs">
                              <span className="text-muted-foreground">{k.replace(/_/g, " ")}:</span> {v}
                            </span>
                          ))}
                      {r.attachment_url ? (
                        <span className="text-xs text-muted-foreground">Supporting: {r.attachment_url}</span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{r.is_free ? "Free" : `₦${Number(r.amount_due).toLocaleString()}`}</TableCell>
                  <TableCell className="text-sm">{formatDate(r.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant={badgeVariant(r.status) as any}>{label(r.status)}</Badge>
                      {r.admin_note ? <span className="text-xs text-muted-foreground max-w-[160px]">{r.admin_note}</span> : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 flex-wrap">
                      {r.status !== "approved" && (
                        <Button size="sm" variant="ghost" className="text-success hover:bg-success/10" onClick={() => approve(r.id)} disabled={activeId === r.id}>
                          Approve
                        </Button>
                      )}
                      {r.status === "pending" && (
                        <Button size="sm" variant="ghost" onClick={() => requestInfo(r.id)} disabled={activeId === r.id}>
                          Request Info
                        </Button>
                      )}
                      {r.status !== "rejected" && (
                        <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => reject(r.id)} disabled={activeId === r.id}>
                          Decline
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : null}
    </AdminLayout>
  )
}
