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

type Donation = {
  id: string
  client_request_id: string | null
  amount: number
  is_anonymous: boolean
  donor_name: string | null
  purpose: string | null
  message: string | null
  payment_name: string | null
  payment_reference: string | null
  payment_receipt_url: string | null
  status: "pending" | "approved" | "rejected"
  created_at: string
}

/** Case-insensitive substring match across all searchable fields of a donation. */
const donationMatchesSearch = (donation: Donation, query: string): boolean => {
  if (!query) return true
  const q = query.trim().toLowerCase()
  return (
    (donation.donor_name?.toLowerCase().includes(q) ?? false) ||
    (donation.purpose?.toLowerCase().includes(q) ?? false) ||
    (donation.message?.toLowerCase().includes(q) ?? false) ||
    (donation.payment_name?.toLowerCase().includes(q) ?? false) ||
    (donation.payment_reference?.toLowerCase().includes(q) ?? false) ||
    (donation.client_request_id?.toLowerCase().includes(q) ?? false)
  )
}

export default function DonationsPage() {
  const [donations, setDonations] = useState<Donation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeActionId, setActiveActionId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Receipt viewer dialog
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  const [receiptState, setReceiptState] = useState<"idle" | "loading" | "ready" | "error">("idle")

  // Details dialog (includes tracking ID + receipt)
  const [detail, setDetail] = useState<Donation | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchDonations()
  }, [])

  const fetchDonations = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setDonations(data as Donation[])
    }
    setIsLoading(false)
  }

  // Two-stage filter: status first, then search query.
  const statusFiltered = filterStatus === "all" ? donations : donations.filter((d) => d.status === filterStatus)
  const filteredDonations = statusFiltered.filter((d) => donationMatchesSearch(d, searchQuery))

  /**
   * Receipts live in a PRIVATE bucket, so they can only be viewed through a short-lived signed URL
   * minted with the admin's authenticated session — never a public URL.
   */
  const openDetails = async (donation: Donation) => {
    setDetail(donation)
    setReceiptUrl(null)
    if (!donation.payment_receipt_url) {
      setReceiptState("idle")
      return
    }
    setReceiptState("loading")
    const { data, error } = await supabase.storage.from("payment-receipts").createSignedUrl(donation.payment_receipt_url, 600)
    if (error || !data?.signedUrl) {
      setReceiptState("error")
      return
    }
    setReceiptUrl(data.signedUrl)
    setReceiptState("ready")
  }

  /**
   * Verifying or declining a donation is a financial decision. It previously ignored the write
   * result entirely: a rejected update refetched the unchanged list, and the administrator was left
   * believing the donation had been verified.
   */
  const setDonationStatus = async (id: string, status: 'approved' | 'rejected') => {
    setActiveActionId(id)

    const { error } = await supabase.from('donations').update({ status }).eq('id', id)

    setActiveActionId(null)

    if (error) {
      notifyError(
        status === 'approved'
          ? "We couldn't verify that donation."
          : "We couldn't decline that donation.",
        error
      )
      return
    }

    notifySuccess(status === 'approved' ? 'Donation verified' : 'Donation declined')
    await fetchDonations()
    setDetail((curr) => (curr && curr.id === id ? { ...curr, status } : curr))
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

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  // Date formatting is centralised in lib/format-time (parish timezone, consistent across admin).

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`
  }

  const handleExport = () => {
    downloadCsv("donations", filteredDonations, [
      { label: "Tracking ID", value: (d) => d.client_request_id?.toUpperCase() ?? "" },
      { label: "Donor", value: (d) => (d.is_anonymous ? "Anonymous" : d.donor_name ?? "") },
      { label: "Amount (NGN)", value: (d) => d.amount },
      { label: "Purpose", value: (d) => d.purpose ?? "" },
      { label: "Message", value: (d) => d.message ?? "" },
      { label: "Payment Name", value: (d) => d.payment_name ?? "" },
      { label: "Payment Reference", value: (d) => d.payment_reference ?? "" },
      { label: "Receipt", value: (d) => (d.payment_receipt_url ? "Yes" : "No") },
      { label: "Status", value: (d) => d.status },
      { label: "Created", value: (d) => d.created_at },
    ])
  }

  // Per-status counts over the full dataset (unaffected by search) for the filter chips.
  const counts = {
    all: donations.length,
    pending: donations.filter((d) => d.status === "pending").length,
    approved: donations.filter((d) => d.status === "approved").length,
    rejected: donations.filter((d) => d.status === "rejected").length,
  }

  return (
    <AdminPage
      title="Donations"
      subtitle="Review and manage parish donations"
      navbarActions={
        <Button variant="outline" size="sm" onClick={handleExport} disabled={filteredDonations.length === 0}>
          Export CSV
        </Button>
      }
    >
      {/* ── Search bar ───────────────────────────────────────────────────────── */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Search by donor name, tracking ID, purpose, payment reference…"
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
          const visible = searchQuery
            ? donations
                .filter((d) => s === "all" || d.status === s)
                .filter((d) => donationMatchesSearch(d, searchQuery)).length
            : total
          const label = s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)
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

      {/* ── Donations Table ────────────────────────────────────────────────── */}
      {isLoading ? <AdminPageSkeleton rows={4} /> : null}
      {!isLoading && filteredDonations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {searchQuery ? `No donations match "${searchQuery}"` : "No donations found"}
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
                <TableHead>Date</TableHead>
                <TableHead>Donor</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Ref</TableHead>
                <TableHead>Receipt</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDonations.map((donation) => (
                <TableRow key={donation.id}>
                  <TableCell>{formatDate(donation.created_at)}</TableCell>
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-0.5">
                      <span>{donation.is_anonymous ? 'Anonymous' : (donation.donor_name || 'N/A')}</span>
                      {donation.purpose ? (
                        <span className="text-xs text-muted-foreground">Purpose: {donation.purpose}</span>
                      ) : null}
                      {donation.message ? (
                        <span className="text-xs text-muted-foreground line-clamp-1">"{donation.message}"</span>
                      ) : null}
                      {donation.client_request_id ? (
                        <span
                          className="text-xs text-muted-foreground font-mono tracking-wide cursor-pointer hover:text-foreground transition-colors"
                          title="Click to copy tracking ID"
                          onClick={() => copyTrackingId(donation.client_request_id!)}
                        >
                          {donation.client_request_id.toUpperCase()}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-primary">{formatCurrency(donation.amount)}</TableCell>
                  <TableCell className="text-sm">
                    {donation.payment_name ? (
                      <div className="flex flex-col">
                        <span className="font-medium">{donation.payment_name}</span>
                        <span className="text-muted-foreground text-xs">{donation.payment_reference}</span>
                      </div>
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    {donation.payment_receipt_url ? (
                      <Button size="sm" variant="ghost" onClick={() => openDetails(donation)}>
                        View
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">None</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(donation.status)}>
                      {getStatusLabel(donation.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => openDetails(donation)}>
                        Details
                      </Button>
                      {donation.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-success hover:bg-success/10"
                            onClick={() => setDonationStatus(donation.id, 'approved')}
                            disabled={activeActionId === donation.id}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="ml-1">{activeActionId === donation.id ? "Updating..." : "Approve"}</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => setDonationStatus(donation.id, 'rejected')}
                            disabled={activeActionId === donation.id}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span className="ml-1">{activeActionId === donation.id ? "Updating..." : "Reject"}</span>
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : null}

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
        <Card className="bg-surface-container-low/40">
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-primary mb-1">
              {formatCurrency(donations.filter((d) => d.status === "approved").reduce((sum, d) => sum + (d.amount || 0), 0))}
            </p>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Approved Total</p>
          </CardContent>
        </Card>
        <Card className="bg-surface-container-low/40">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-warning mb-1">{counts.pending}</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pending Review</p>
          </CardContent>
        </Card>
        <Card className="bg-surface-container-low/40">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-foreground mb-1">{counts.all}</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Donations</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Details dialog (tracking ID + receipt viewer) ─────────────────── */}
      <Dialog
        open={!!detail}
        onOpenChange={(open) => {
          if (!open) {
            setDetail(null)
            setReceiptState("idle")
            setReceiptUrl(null)
          }
        }}
      >
        <DialogContent className="max-w-lg">
          {detail ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {detail.is_anonymous ? "Anonymous Donor" : (detail.donor_name || "Donor")}
                </DialogTitle>
                <DialogDescription>
                  Donation ·{" "}
                  <Badge variant={getStatusBadgeVariant(detail.status)}>{getStatusLabel(detail.status)}</Badge>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 text-sm">
                {/* Tracking ID */}
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</p>
                    <p className="text-foreground font-semibold text-base">{formatCurrency(detail.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</p>
                    <p className="text-foreground">{formatDate(detail.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Transfer Name</p>
                    <p className="text-foreground">{detail.payment_name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reference</p>
                    <p className="text-foreground">{detail.payment_reference || "—"}</p>
                  </div>
                </div>

                {detail.purpose ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Purpose</p>
                    <p className="text-foreground">{detail.purpose}</p>
                  </div>
                ) : null}
                {detail.message ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Message</p>
                    <p className="text-foreground">"{detail.message}"</p>
                  </div>
                ) : null}

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Payment Receipt</p>
                  {!detail.payment_receipt_url ? (
                    <p className="text-muted-foreground">
                      No receipt attached. Match this transfer using the name and reference above.
                    </p>
                  ) : receiptState === "loading" ? (
                    <p className="text-muted-foreground">Loading receipt…</p>
                  ) : receiptState === "error" ? (
                    /* Same reasoning as the mass-bookings page: a signed URL that cannot be minted and an
                       object that will not render are different problems, and neither should leave the
                       administrator staring at a broken-image glyph with no explanation. */
                    <div className="space-y-2">
                      <p className="text-sm text-destructive">This receipt could not be displayed.</p>
                      <p className="text-sm text-muted-foreground">
                        The file may not have finished uploading. Approve using the transfer name and
                        reference, or ask the donor to resend it.
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
                        alt="Donation payment receipt"
                        className="max-h-96 w-auto rounded-lg border border-outline object-contain"
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
                    onClick={() => setDonationStatus(detail.id, 'rejected')}
                    disabled={activeActionId === detail.id}
                  >
                    Reject
                  </Button>
                  <Button
                    onClick={() => setDonationStatus(detail.id, 'approved')}
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
