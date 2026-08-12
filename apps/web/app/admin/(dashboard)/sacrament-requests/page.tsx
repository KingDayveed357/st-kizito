"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, X, Copy, Check } from "lucide-react"
import { AdminPage } from "@/components/layout/admin-page"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AdminPageSkeleton } from "@/components/admin/admin-page-skeleton"
import { createClient } from "@/lib/supabase"
import { notifyError, notifySuccess } from "@/lib/toast"
import { formatDate as formatDateShared } from "@/lib/format-time"

type SacramentStatus = "pending" | "approved" | "rejected" | "needs_info"

type SacramentRequest = {
  id: string
  client_request_id: string | null
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

/** Action dialog state for Reject / Request Info (replaces window.prompt). */
type ActionDialogState = {
  type: "reject" | "needs_info"
  id: string
  note: string
} | null

const STATUS_FILTERS: Array<"all" | SacramentStatus> = ["all", "pending", "approved", "needs_info", "rejected"]

/** Case-insensitive substring match across all searchable fields of a sacrament request. */
const requestMatchesSearch = (r: SacramentRequest, query: string): boolean => {
  if (!query) return true
  const q = query.trim().toLowerCase()
  return (
    r.full_name.toLowerCase().includes(q) ||
    (r.contact_phone?.toLowerCase().includes(q) ?? false) ||
    (r.sacrament_request_types?.title?.toLowerCase().includes(q) ?? false) ||
    r.type.toLowerCase().includes(q) ||
    (r.client_request_id?.toLowerCase().includes(q) ?? false) ||
    (r.admin_note?.toLowerCase().includes(q) ?? false)
  )
}

export default function SacramentRequestsPage() {
  const [requests, setRequests] = useState<SacramentRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | SacramentStatus>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)

  /** Controls the styled Reject / Request Info dialog (replaces window.prompt). */
  const [actionDialog, setActionDialog] = useState<ActionDialogState>(null)

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

    // Previously unchecked: a rejected write silently left the request in its old state.
    const { error } = await supabase
      .from("sacrament_requests")
      .update({ status, admin_note: admin_note ?? null })
      .eq("id", id)

    setActiveId(null)

    if (error) {
      notifyError("We couldn't update that request.", error)
      return
    }

    notifySuccess(
      status === "approved"
        ? "Request approved"
        : status === "rejected"
          ? "Request declined"
          : "Information requested"
    )
    await fetchRequests()
  }

  const approve = (id: string) => update(id, "approved", null)

  /**
   * Previously used window.prompt() — a blocking, unstyled browser dialog with no validation.
   * Now opens a proper Dialog so the admin can write a clear note without the page freezing.
   */
  const openRejectDialog = (id: string) => {
    setActionDialog({ type: "reject", id, note: "" })
  }

  const openNeedsInfoDialog = (id: string) => {
    setActionDialog({ type: "needs_info", id, note: "" })
  }

  const submitActionDialog = async () => {
    if (!actionDialog) return
    const { type, id, note } = actionDialog
    if (!note.trim()) return
    setActionDialog(null)
    await update(id, type === "reject" ? "rejected" : "needs_info", note.trim())
  }

  const copyTrackingId = useCallback(async (id: string) => {
    try {
      await navigator.clipboard.writeText(id.toUpperCase())
      setCopiedId(id)
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2000)
    } catch {
      // Clipboard API unavailable in some environments — fail silently.
    }
  }, [])

  const badgeVariant = (s: string) =>
    s === "approved" ? "success" : s === "rejected" ? "destructive" : s === "needs_info" ? "default" : "warning"

  const label = (s: string) => (s === "needs_info" ? "Needs Info" : s.charAt(0).toUpperCase() + s.slice(1))

  // Centralised in lib/format-time (parish timezone, consistent across admin).
  const formatDate = (d: string) => formatDateShared(d)

  // Two-stage filter: status first, then search query.
  const statusFiltered = filter === "all" ? requests : requests.filter((r) => r.status === filter)
  const filtered = statusFiltered.filter((r) => requestMatchesSearch(r, searchQuery))

  // Per-status counts over the full dataset (unaffected by search) for the filter chips.
  const counts: Record<string, number> = { all: requests.length }
  for (const s of ["pending", "approved", "needs_info", "rejected"] as SacramentStatus[]) {
    counts[s] = requests.filter((r) => r.status === s).length
  }

  return (
    <AdminPage title="Sacramental Requests" subtitle="Review and process parishioner sacrament requests">
      {/* ── Search bar ───────────────────────────────────────────────────────── */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Search by name, tracking ID, phone, request type…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-8 h-10 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Status filter chips ───────────────────────────────────────────── */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((f) => {
          const total = counts[f] ?? 0
          const visible = searchQuery
            ? requests
                .filter((r) => f === "all" || r.status === f)
                .filter((r) => requestMatchesSearch(r, searchQuery)).length
            : total
          const count = searchQuery ? `${visible} of ${total}` : `${total}`
          return (
            <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}>
              {f === "all" ? "All" : label(f)} ({count})
            </Button>
          )
        })}
      </div>

      {isLoading ? <AdminPageSkeleton rows={4} /> : null}
      {!isLoading && filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {searchQuery ? `No requests match "${searchQuery}"` : "No requests found"}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="mt-2 text-sm text-primary underline-offset-4 hover:underline"
              >
                Clear search
              </button>
            )}
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
                    <div className="flex flex-col gap-0.5">
                      <span>{r.full_name}</span>
                      {r.contact_phone ? <span className="text-muted-foreground text-xs">{r.contact_phone}</span> : null}
                      {r.client_request_id ? (
                        <span
                          className="text-xs text-muted-foreground font-mono tracking-wide cursor-pointer hover:text-foreground transition-colors flex items-center gap-1 group"
                          title="Click to copy tracking ID"
                          onClick={() => copyTrackingId(r.client_request_id!)}
                        >
                          {r.client_request_id.toUpperCase()}
                          {copiedId === r.client_request_id ? (
                            <Check className="h-3 w-3 text-success" />
                          ) : (
                            <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </span>
                      ) : null}
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
                        <Button size="sm" variant="ghost" onClick={() => openNeedsInfoDialog(r.id)} disabled={activeId === r.id}>
                          Request Info
                        </Button>
                      )}
                      {r.status !== "rejected" && (
                        <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => openRejectDialog(r.id)} disabled={activeId === r.id}>
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

      {/* ── Action dialog (Reject / Request Info) — replaces window.prompt ─── */}
      <Dialog
        open={!!actionDialog}
        onOpenChange={(open) => { if (!open) setActionDialog(null) }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.type === "reject" ? "Decline request" : "Request more information"}
            </DialogTitle>
            <DialogDescription>
              {actionDialog?.type === "reject"
                ? "Provide a brief reason. This note will be visible to the parishioner."
                : "Describe what information is needed from the parishioner."}
            </DialogDescription>
          </DialogHeader>

          <textarea
            className="w-full min-h-[100px] rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none transition-colors"
            placeholder={
              actionDialog?.type === "reject"
                ? "e.g. Payment not confirmed in bank records."
                : "e.g. Please provide a copy of the baptismal certificate."
            }
            value={actionDialog?.note ?? ""}
            onChange={(e) =>
              setActionDialog((prev) => prev ? { ...prev, note: e.target.value } : prev)
            }
            autoFocus
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>
              Cancel
            </Button>
            <Button
              variant={actionDialog?.type === "reject" ? "destructive" : "default"}
              onClick={submitActionDialog}
              disabled={!actionDialog?.note.trim()}
            >
              {actionDialog?.type === "reject" ? "Decline" : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPage>
  )
}
