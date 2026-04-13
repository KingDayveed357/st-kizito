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

type Donation = {
  id: string
  amount: number
  is_anonymous: boolean
  donor_name: string | null
  purpose: string | null
  message: string | null
  payment_name: string | null
  payment_reference: string | null
  status: "pending" | "approved" | "rejected"
  created_at: string
}

export default function DonationsPage() {
  const [donations, setDonations] = useState<Donation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeActionId, setActiveActionId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all")

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

  const filteredDonations = filterStatus === "all" ? donations : donations.filter((d) => d.status === filterStatus)

  const handleApprove = async (id: string) => {
    setActiveActionId(id)
    await supabase.from('donations').update({ status: 'approved' }).eq('id', id)
    await fetchDonations()
    setActiveActionId(null)
  }

  const handleReject = async (id: string) => {
    setActiveActionId(id)
    await supabase.from('donations').update({ status: 'rejected' }).eq('id', id)
    await fetchDonations()
    setActiveActionId(null)
  }

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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`
  }

  return (
    <AdminLayout
      title="Donations"
      subtitle="Review and manage parish donations"
    >
      {/* Filters */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <Button
          variant={filterStatus === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterStatus("all")}
        >
          All ({donations.length})
        </Button>
        <Button
          variant={filterStatus === "pending" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterStatus("pending")}
        >
          Pending ({donations.filter((d) => d.status === "pending").length})
        </Button>
        <Button
          variant={filterStatus === "approved" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterStatus("approved")}
        >
          Approved ({donations.filter((d) => d.status === "approved").length})
        </Button>
        <Button
          variant={filterStatus === "rejected" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterStatus("rejected")}
        >
          Rejected ({donations.filter((d) => d.status === "rejected").length})
        </Button>
      </div>

      {/* Donations Table */}
      {isLoading ? <AdminPageSkeleton rows={4} /> : null}
      {!isLoading && filteredDonations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No donations found</p>
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
                    <Badge variant={getStatusBadgeVariant(donation.status)}>
                      {getStatusLabel(donation.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {donation.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-success hover:bg-success/10"
                            onClick={() => handleApprove(donation.id)}
                            disabled={activeActionId === donation.id}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            <span className="ml-1">{activeActionId === donation.id ? "Updating..." : "Approve"}</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleReject(donation.id)}
                            disabled={activeActionId === donation.id}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-primary mb-1">
              {formatCurrency(donations.filter((d) => d.status === "approved").reduce((sum, d) => sum + (d.amount || 0), 0))}
            </p>
            <p className="text-sm text-muted-foreground">Total Approved Donations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-warning mb-1">
              {donations.filter((d) => d.status === "pending").length}
            </p>
            <p className="text-sm text-muted-foreground">Pending Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-foreground mb-1">
              {donations.length}
            </p>
            <p className="text-sm text-muted-foreground">Total Donations</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}


