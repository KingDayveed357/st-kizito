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

type Booking = {
  id: string
  name: string
  type: string
  intention: string
  start_date: string
  end_date: string
  payment_name: string | null
  payment_reference: string | null
  status: "pending" | "approved" | "rejected"
  mass_times?: {
    day_of_week: string
    time: string
    location: string | null
  }
}

export default function MassBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeActionId, setActiveActionId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all")

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

  const filteredBookings = filterStatus === "all" ? bookings : bookings.filter((b) => b.status === filterStatus)

  const handleApprove = async (id: string) => {
    setActiveActionId(id)
    await supabase.from('bookings').update({ status: 'approved' }).eq('id', id)
    await fetchBookings()
    setActiveActionId(null)
  }

  const handleReject = async (id: string) => {
    setActiveActionId(id)
    await supabase.from('bookings').update({ status: 'rejected' }).eq('id', id)
    await fetchBookings()
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

  return (
    <AdminLayout
      title="Mass Bookings"
      subtitle="Review and manage mass intentions and bookings"
    >
      {/* Filters */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <Button
          variant={filterStatus === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterStatus("all")}
        >
          All ({bookings.length})
        </Button>
        <Button
          variant={filterStatus === "pending" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterStatus("pending")}
        >
          Pending ({bookings.filter((b) => b.status === "pending").length})
        </Button>
        <Button
          variant={filterStatus === "approved" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterStatus("approved")}
        >
          Approved ({bookings.filter((b) => b.status === "approved").length})
        </Button>
        <Button
          variant={filterStatus === "rejected" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterStatus("rejected")}
        >
          Rejected ({bookings.filter((b) => b.status === "rejected").length})
        </Button>
      </div>

      {/* Bookings Table */}
      {isLoading ? <AdminPageSkeleton rows={4} /> : null}
      {!isLoading && filteredBookings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No bookings found</p>
          </CardContent>
        </Card>
      ) : !isLoading ? (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Intention</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Mass</TableHead>
                <TableHead>Payment Ref</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">{booking.name}</TableCell>
                  <TableCell className="text-sm">
                    {booking.type === 'thanksgiving' ? 'Thanksgiving' : 'Mass Intention'}
                  </TableCell>
                  <TableCell className="max-w-xs text-sm">{booking.intention}</TableCell>
                  <TableCell className="text-sm">
                    {formatDate(booking.start_date)}
                    {booking.end_date && booking.end_date !== booking.start_date && ` - ${formatDate(booking.end_date)}`}
                  </TableCell>
                  <TableCell className="text-sm">
                    {booking.mass_times ? `${booking.mass_times.day_of_week} ${booking.mass_times.time}` : '—'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {booking.payment_name ? (
                      <div className="flex flex-col">
                        <span className="font-medium">{booking.payment_name}</span>
                        <span className="text-muted-foreground text-xs">{booking.payment_reference}</span>
                      </div>
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(booking.status)}>
                      {getStatusLabel(booking.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {booking.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-success hover:bg-success/10"
                            onClick={() => handleApprove(booking.id)}
                            disabled={activeActionId === booking.id}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            <span className="ml-1">{activeActionId === booking.id ? "Updating..." : "Approve"}</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleReject(booking.id)}
                            disabled={activeActionId === booking.id}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                            <span className="ml-1">{activeActionId === booking.id ? "Updating..." : "Reject"}</span>
                          </Button>
                        </>
                      )}
                      {booking.status !== "pending" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => alert("View details for: " + booking.name)}
                        >
                          View
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-success mb-1">
              {bookings.filter((b) => b.status === "approved").length}
            </p>
            <p className="text-sm text-muted-foreground">Approved Intentions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-warning mb-1">
              {bookings.filter((b) => b.status === "pending").length}
            </p>
            <p className="text-sm text-muted-foreground">Pending Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-foreground mb-1">
              {bookings.length}
            </p>
            <p className="text-sm text-muted-foreground">Total Bookings</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
