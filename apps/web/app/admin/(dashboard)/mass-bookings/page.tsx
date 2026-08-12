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
import { downloadCsv } from "@/lib/export-csv"
import { formatDate } from "@/lib/format-time"

type Booking = {
  id: string
  client_request_id: string | null
  name: string
  type: string
  intention: string
  start_date: string
  end_date: string
  amount: number | null
  preferred_mass_time: string | null
  payment_name: string | null
  payment_reference: string | null
  payment_receipt_url: string | null
  status: "pending" | "approved" | "rejected"
  created_at?: string
  mass_times?: {
    day_of_week: string
    time: string
    location: string | null
  }
}

const naira = (amount: number | null | undefined) =>
  amount == null ? "—" : `₦${Number(amount).toLocaleString("en-NG")}`

/** Inclusive day count between two ISO dates (mirrors the mobile bookingRules). */
const bookingDays = (start: string, end: string) => {
  if (!start || !end) return 1
  const a = new Date(`${start}T12:00:00`).getTime()
  const b = new Date(`${end}T12:00:00`).getTime()
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return 1
  return Math.round((b - a) / 86_400_000) + 1
}

/** Case-insensitive substring match across all searchable fields of a booking. */
const bookingMatchesSearch = (booking: Booking, query: string): boolean => {
  if (!query) return true
  const q = query.trim().toLowerCase()
  return (
    booking.name.toLowerCase().includes(q) ||
    booking.intention.toLowerCase().includes(q) ||
    (booking.payment_name?.toLowerCase().includes(q) ?? false) ||
    (booking.payment_reference?.toLowerCase().includes(q) ?? false) ||
    (booking.client_request_id?.toLowerCase().includes(q) ?? false)
  )
}

export default function MassBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeActionId, setActiveActionId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Details / receipt dialog
  const [detail, setDetail] = useState<Booking | null>(null)
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  const [receiptState, setReceiptState] = useState<"idle" | "loading" | "ready" | "error">("idle")

  const supabase = createClient()

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('bookings')
      .select('*, mass_times(day_of_week, time, location)')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setBookings(data as any as Booking[])
    }
    setIsLoading(false)
  }

  // Two-stage filter: status first, then search query.
  const statusFiltered = filterStatus === "all" ? bookings : bookings.filter((b) => b.status === filterStatus)
  const filteredBookings = statusFiltered.filter((b) => bookingMatchesSearch(b, searchQuery))

  const totalApprovedOfferings = bookings
    .filter((b) => b.status === "approved")
    .reduce((sum, b) => sum + (Number(b.amount) || 0), 0)

  const setStatus = async (id: string, status: "approved" | "rejected") => {
    setActiveActionId(id)

    // Previously unchecked. Approving a Mass intention that did not actually save meant a parishioner
    // was told their Mass was booked when the record still read "pending".
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id)

    setActiveActionId(null)

    if (error) {
      notifyError(
        status === "approved"
          ? "We couldn't approve that booking."
          : "We couldn't decline that booking.",
        error
      )
      return
    }

    notifySuccess(status === "approved" ? "Booking approved" : "Booking declined")
    await fetchBookings()
    setDetail((current) => (current && current.id === id ? { ...current, status } : current))
  }

  const openDetails = async (booking: Booking) => {
    setDetail(booking)
    setReceiptUrl(null)
    if (!booking.payment_receipt_url) {
      setReceiptState("idle")
      return
    }
    // The receipts bucket is private; mint a short-lived signed URL (admin is authenticated).
    setReceiptState("loading")
    const { data, error } = await supabase
      .storage
      .from('payment-receipts')
      .createSignedUrl(booking.payment_receipt_url, 600)
    if (error || !data?.signedUrl) {
      setReceiptState("error")
      return
    }
    setReceiptUrl(data.signedUrl)
    setReceiptState("ready")
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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "success"
      case "rejected":
        return "destructive"
      case "pending":
        return "warning"
      default:
        return "default"
    }
  }

  const getStatusLabel = (status: string) => status.charAt(0).toUpperCase() + status.slice(1)

  // Date formatting is centralised in lib/format-time (parish timezone, consistent across admin).

  const massTimeLabel = (booking: Booking) =>
    booking.mass_times
      ? `${booking.mass_times.day_of_week} ${booking.mass_times.time}`
      : booking.preferred_mass_time || "—"

  const handleExport = () => {
    downloadCsv("mass-bookings", filteredBookings, [
      { label: "Tracking ID", value: (b) => b.client_request_id?.toUpperCase() ?? "" },
      { label: "Name", value: (b) => b.name },
      { label: "Type", value: (b) => (b.type === "thanksgiving" ? "Thanksgiving" : "Mass Intention") },
      { label: "Intention", value: (b) => b.intention },
      { label: "Start Date", value: (b) => b.start_date },
      { label: "End Date", value: (b) => b.end_date },
      { label: "Masses", value: (b) => bookingDays(b.start_date, b.end_date) },
      { label: "Mass Time", value: (b) => massTimeLabel(b) },
      { label: "Amount (NGN)", value: (b) => b.amount ?? "" },
      { label: "Payment Name", value: (b) => b.payment_name ?? "" },
      { label: "Payment Reference", value: (b) => b.payment_reference ?? "" },
      { label: "Receipt", value: (b) => (b.payment_receipt_url ? "Yes" : "No") },
      { label: "Status", value: (b) => b.status },
      { label: "Created", value: (b) => b.created_at ?? "" },
    ])
  }

  // Per-status counts over the full dataset (unaffected by search) for the filter chips.
  const counts = {
    all: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    approved: bookings.filter((b) => b.status === "approved").length,
    rejected: bookings.filter((b) => b.status === "rejected").length,
  }

  return (
    <AdminPage
      title="Mass Bookings"
      subtitle="Review and manage mass intentions and bookings"
      navbarActions={
        <Button variant="outline" size="sm" onClick={handleExport} disabled={filteredBookings.length === 0}>
          Export CSV
        </Button>
      }
    >
      {/* ── Search bar ───────────────────────────────────────────────────────── */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Search by name, tracking ID, intention, payment reference…"
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
        {(["all", "pending", "approved", "rejected"] as const).map((s) => {
          const total = counts[s]
          // When searching, show how many of the full set survive the text filter too.
          const visible = searchQuery
            ? bookings
                .filter((b) => s === "all" || b.status === s)
                .filter((b) => bookingMatchesSearch(b, searchQuery)).length
            : total
          const label =
            s === "all"
              ? `All`
              : s.charAt(0).toUpperCase() + s.slice(1)
          const count = searchQuery ? `${visible} of ${total}` : `${total}`
          return (
            <Button
              key={s}
              variant={filterStatus === s ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus(s)}
            >
              {label} ({count})
            </Button>
          )
        })}
      </div>

      {/* ── Bookings Table ────────────────────────────────────────────────── */}
      {isLoading ? <AdminPageSkeleton rows={4} /> : null}
      {!isLoading && filteredBookings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {searchQuery ? `No bookings match "${searchQuery}"` : "No bookings found"}
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Intention</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Mass</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => {
                  const days = bookingDays(booking.start_date, booking.end_date)
                  return (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-0.5">
                          <span>{booking.name}</span>
                          {booking.client_request_id ? (
                            <span
                              className="text-xs text-muted-foreground font-mono tracking-wide cursor-pointer hover:text-foreground transition-colors"
                              title="Click to copy tracking ID"
                              onClick={() => copyTrackingId(booking.client_request_id!)}
                            >
                              {booking.client_request_id.toUpperCase()}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {booking.type === 'thanksgiving' ? 'Thanksgiving' : 'Mass Intention'}
                      </TableCell>
                      <TableCell className="max-w-xs text-sm truncate">{booking.intention}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {formatDate(booking.start_date)}
                        {booking.end_date && booking.end_date !== booking.start_date && ` – ${formatDate(booking.end_date)}`}
                        <span className="block text-xs text-muted-foreground">
                          {days} {days === 1 ? "Mass" : "Masses"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{massTimeLabel(booking)}</TableCell>
                      <TableCell className="text-right text-sm font-semibold whitespace-nowrap">
                        {naira(booking.amount)}
                      </TableCell>
                      <TableCell>
                        {booking.payment_receipt_url ? (
                          <Button size="sm" variant="ghost" onClick={() => openDetails(booking)}>
                            View
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(booking.status)}>
                          {getStatusLabel(booking.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {booking.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-success hover:bg-success/10"
                                onClick={() => setStatus(booking.id, "approved")}
                                disabled={activeActionId === booking.id}
                              >
                                {activeActionId === booking.id ? "…" : "Approve"}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => setStatus(booking.id, "rejected")}
                                disabled={activeActionId === booking.id}
                              >
                                {activeActionId === booking.id ? "…" : "Reject"}
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => openDetails(booking)}>
                            Details
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : null}

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
        <Card className="bg-surface-container-low/40">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-success mb-1">{counts.approved}</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card className="bg-surface-container-low/40">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-warning mb-1">{counts.pending}</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-surface-container-low/40">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-foreground mb-1">{counts.all}</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card className="bg-surface-container-low/40">
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-primary mb-1">{naira(totalApprovedOfferings)}</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Approved Offerings</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Details / receipt dialog ─────────────────────────────────────── */}
      <Dialog open={!!detail} onOpenChange={(open) => { if (!open) { setDetail(null); setReceiptUrl(null); setReceiptState("idle") } }}>
        <DialogContent className="max-w-lg">
          {detail ? (
            <>
              <DialogHeader>
                <DialogTitle>{detail.name}</DialogTitle>
                <DialogDescription>
                  {detail.type === 'thanksgiving' ? 'Thanksgiving' : 'Mass Intention'} ·{" "}
                  <Badge variant={getStatusBadgeVariant(detail.status)}>{getStatusLabel(detail.status)}</Badge>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 text-sm">
                {/* Tracking ID — always shown first so it's easy to cross-reference a parishioner query */}
                {detail.client_request_id ? (
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 border border-border px-3 py-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Tracking ID</p>
                      <p className="font-mono text-sm font-semibold text-foreground tracking-wide">
                        {detail.client_request_id.toUpperCase()}
                      </p>
                    </div>
                    <button
                      onClick={() => copyTrackingId(detail.client_request_id!)}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-background border border-transparent hover:border-border"
                      title="Copy tracking ID"
                    >
                      {copiedId === detail.client_request_id ? (
                        <Check className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      <span>{copiedId === detail.client_request_id ? "Copied!" : "Copy"}</span>
                    </button>
                  </div>
                ) : null}

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Intention</p>
                  <p className="text-foreground">{detail.intention}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Period</p>
                    <p className="text-foreground">
                      {formatDate(detail.start_date)}
                      {detail.end_date && detail.end_date !== detail.start_date && ` – ${formatDate(detail.end_date)}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {bookingDays(detail.start_date, detail.end_date)}{" "}
                      {bookingDays(detail.start_date, detail.end_date) === 1 ? "Mass" : "Masses"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</p>
                    <p className="text-foreground font-semibold">{naira(detail.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mass Time</p>
                    <p className="text-foreground">{massTimeLabel(detail)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Transfer</p>
                    <p className="text-foreground">{detail.payment_name || "—"}</p>
                    {detail.payment_reference ? (
                      <p className="text-xs text-muted-foreground">{detail.payment_reference}</p>
                    ) : null}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Payment Receipt</p>
                  {!detail.payment_receipt_url ? (
                    <p className="text-muted-foreground">
                      No receipt attached. Match this transfer using the name and reference above.
                    </p>
                  ) : receiptState === "loading" ? (
                    <p className="text-muted-foreground">Loading receipt…</p>
                  ) : receiptState === "error" ? (
                    /*
                     * Two different failures land here and the administrator needs to tell them
                     * apart: a signed URL that could not be minted (transient — retry), versus an
                     * image that will not render because the stored object is unusable. The latter
                     * was the visible symptom of the zero-byte upload bug; it is not recoverable
                     * from this screen, so the copy says what to do instead of leaving a broken
                     * image with no explanation.
                     */
                    <div className="space-y-2">
                      <p className="text-destructive">This receipt could not be displayed.</p>
                      <p className="text-sm text-muted-foreground">
                        The file may not have finished uploading. Approve using the transfer name and
                        reference, or ask the parishioner to resend the receipt.
                      </p>
                      <Button variant="outline" size="sm" onClick={() => openDetails(detail)}>
                        Try again
                      </Button>
                    </div>
                  ) : receiptUrl ? (
                    <a href={receiptUrl} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={receiptUrl}
                        alt={`Payment receipt for ${detail.name}`}
                        className="max-h-72 w-auto rounded-lg border border-outline object-contain"
                        // A valid signed URL can still point at an unreadable object. Without this
                        // the browser silently shows a broken-image glyph.
                        onError={() => setReceiptState("error")}
                      />
                    </a>
                  ) : null}
                </div>
              </div>

              {detail.status === "pending" ? (
                <DialogFooter>
                  <Button
                    variant="destructive"
                    onClick={() => setStatus(detail.id, "rejected")}
                    disabled={activeActionId === detail.id}
                  >
                    Reject
                  </Button>
                  <Button
                    onClick={() => setStatus(detail.id, "approved")}
                    disabled={activeActionId === detail.id}
                  >
                    Approve
                  </Button>
                </DialogFooter>
              ) : null}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </AdminPage>
  )
}
