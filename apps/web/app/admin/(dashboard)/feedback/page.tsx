"use client"

import { useEffect, useState, useMemo } from "react"
import { Search, Filter, Trash2, CheckCircle, MessageSquare, MoreHorizontal, ArrowUpDown, RefreshCw } from "lucide-react"
import { AdminPage } from "@/components/layout/admin-page"
import { Card, CardContent } from "@/components/ui/card-custom"
import { Badge } from "@/components/ui/badge-custom"
import { Button } from "@/components/ui/button-custom"
import { Input } from "@/components/ui/input-custom"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table-custom"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { AdminPageSkeleton } from "@/components/admin/admin-page-skeleton"
import { createClient } from "@/lib/supabase"
import { formatDate, formatDateTime } from "@/lib/format-time"
import { toast } from "sonner"

type FeedbackSubmission = {
  id: string
  name: string | null
  email: string | null
  message: string
  category: "bug" | "feature request" | "general feedback"
  status: "pending" | "resolved"
  created_at: string
}

const ITEMS_PER_PAGE = 10

export default function AdminFeedbackPage() {
  const [entries, setEntries] = useState<FeedbackSubmission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackSubmission | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [feedbackToDelete, setFeedbackToDelete] = useState<string | null>(null)
  const [sortConfig, setSortConfig] = useState<{ key: keyof FeedbackSubmission, direction: 'asc' | 'desc' }>({ key: 'created_at', direction: 'desc' })

  const supabase = createClient()

  useEffect(() => {
    void fetchFeedback()
  }, [])

  const fetchFeedback = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("feedback_submissions")
        .select("*")
        .order("created_at", { ascending: false })

      if (!error && data) {
        setEntries(data as FeedbackSubmission[])
      } else if (error) {
        toast.error("Error fetching feedback: " + error.message)
      }
    } catch (e) {
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusUpdate = async (id: string, newStatus: "pending" | "resolved") => {
    const { error } = await supabase
      .from("feedback_submissions")
      .update({ status: newStatus })
      .eq("id", id)

    if (error) {
      toast.error("Failed to update status")
    } else {
      setEntries(prev => prev.map(entry => entry.id === id ? { ...entry, status: newStatus } : entry))
      toast.success(`Feedback marked as ${newStatus}`)
    }
  }

  const handleDelete = async () => {
    if (!feedbackToDelete) return

    const { error } = await supabase
      .from("feedback_submissions")
      .delete()
      .eq("id", feedbackToDelete)

    if (error) {
      toast.error("Failed to delete feedback")
    } else {
      setEntries(prev => prev.filter(entry => entry.id !== feedbackToDelete))
      toast.success("Feedback deleted successfully")
    }
    setIsDeleteModalOpen(false)
    setFeedbackToDelete(null)
  }

  const filteredEntries = useMemo(() => {
    return entries
      .filter(entry => {
        const matchesSearch = 
          (entry.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
          (entry.email?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
          entry.message.toLowerCase().includes(searchQuery.toLowerCase())
        
        const matchesCategory = categoryFilter === "all" || entry.category === categoryFilter
        const matchesStatus = statusFilter === "all" || (entry.status || "pending") === statusFilter
        
        return matchesSearch && matchesCategory && matchesStatus
      })
      .sort((a, b) => {
        const aValue = a[sortConfig.key] || ""
        const bValue = b[sortConfig.key] || ""
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
  }, [entries, searchQuery, categoryFilter, statusFilter, sortConfig])

  const totalPages = Math.ceil(filteredEntries.length / ITEMS_PER_PAGE)
  const paginatedEntries = filteredEntries.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const handleSort = (key: keyof FeedbackSubmission) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  return (
    <AdminPage
      title="Feedback Inbox"
      subtitle="Process user bug reports, feature requests, and inquiries"
    >
      <div className="space-y-6">
        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface-container-low/50 rounded-2xl p-5 border border-outline/10">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Total</p>
            <h3 className="text-2xl font-bold">{entries.length}</h3>
          </div>
          <div className="bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl p-5 border border-amber-100/50 dark:border-amber-800/20">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">Pending</p>
            <h3 className="text-2xl font-bold text-amber-700 dark:text-amber-300">
              {entries.filter(e => (e.status || 'pending') !== 'resolved').length}
            </h3>
          </div>
          <div className="bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl p-5 border border-emerald-100/50 dark:border-emerald-800/20">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">Resolved</p>
            <h3 className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              {entries.filter(e => e.status === 'resolved').length}
            </h3>
          </div>
          <div className="bg-rose-50/50 dark:bg-rose-900/10 rounded-2xl p-5 border border-rose-100/50 dark:border-rose-800/20">
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1">Bugs</p>
            <h3 className="text-2xl font-bold text-rose-700 dark:text-rose-300">
              {entries.filter(e => e.category === 'bug').length}
            </h3>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 md:p-6 border border-outline/10 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search feedback..."
              className="pl-10 h-11 bg-surface-container-low/30 border-outline/10 rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px] h-11 bg-surface-container-low/30 border-outline/10 rounded-xl">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="bug">Bug Report</SelectItem>
                <SelectItem value="feature request">Feature</SelectItem>
                <SelectItem value="general feedback">General</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-11 bg-surface-container-low/30 border-outline/10 rounded-xl">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl" onClick={fetchFeedback}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Data Table */}
        {isLoading ? (
          <AdminPageSkeleton rows={8} />
        ) : (
          <div className="bg-surface-container-lowest rounded-2xl border border-outline/10 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-surface-container-low/30">
                    <TableHead className="w-[200px] cursor-pointer hover:bg-surface-container-low transition-colors" onClick={() => handleSort('name')}>
                      <div className="flex items-center gap-2">
                        User <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead className="w-[140px]">Category</TableHead>
                    <TableHead>Message Preview</TableHead>
                    <TableHead className="w-[120px] cursor-pointer hover:bg-surface-container-low transition-colors" onClick={() => handleSort('status')}>
                      <div className="flex items-center gap-2">
                        Status <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead className="w-[150px] cursor-pointer hover:bg-surface-container-low transition-colors" onClick={() => handleSort('created_at')}>
                      <div className="flex items-center gap-2">
                        Date <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead className="text-right w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEntries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <MessageSquare className="h-8 w-8 opacity-20" />
                          <p>No feedback found matching your filters.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedEntries.map((entry) => (
                      <TableRow key={entry.id} className="group hover:bg-surface-container-low/40 transition-colors">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground truncate">{entry.name || "Anonymous"}</span>
                            <span className="text-xs text-muted-foreground truncate">{entry.email || "No email provided"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={entry.category === 'bug' ? 'destructive' : entry.category === 'feature request' ? 'secondary' : 'outline'} className="capitalize px-2 py-0.5">
                            {entry.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[300px]">
                          <p className="truncate text-sm text-foreground/75 italic">{entry.message}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant={(entry.status || 'pending') === 'resolved' ? 'success' : 'warning'} className="capitalize px-2 py-0.5">
                            {entry.status || 'pending'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-medium">
                          {formatDate(entry.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52 rounded-xl">
                              <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-widest px-3 py-2">Management</DropdownMenuLabel>
                              <DropdownMenuItem className="rounded-lg mx-1" onClick={() => {
                                setSelectedFeedback(entry)
                                setIsViewModalOpen(true)
                              }}>
                                <MessageSquare className="mr-2 h-4 w-4" /> Full Message
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {(entry.status || 'pending') !== 'resolved' ? (
                                <DropdownMenuItem className="rounded-lg mx-1 text-emerald-600 dark:text-emerald-400" onClick={() => handleStatusUpdate(entry.id, 'resolved')}>
                                  <CheckCircle className="mr-2 h-4 w-4" /> Mark as Resolved
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem className="rounded-lg mx-1" onClick={() => handleStatusUpdate(entry.id, 'pending')}>
                                  <RefreshCw className="mr-2 h-4 w-4" /> Reopen Report
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="rounded-lg mx-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30" onClick={() => {
                                setFeedbackToDelete(entry.id)
                                setIsDeleteModalOpen(true)
                              }}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Permanently
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination UI */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-outline/10 bg-surface-container-low/20">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault()
                          if (currentPage > 1) setCurrentPage(currentPage - 1)
                        }}
                        className={currentPage === 1 ? "pointer-events-none opacity-40" : "hover:bg-surface-container-low"}
                      />
                    </PaginationItem>
                    
                    {/* Compact pagination logic could go here, keeping it simple for now */}
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <PaginationItem key={i} className="hidden sm:block">
                        <PaginationLink 
                          href="#" 
                          isActive={currentPage === i + 1}
                          onClick={(e) => {
                            e.preventDefault()
                            setCurrentPage(i + 1)
                          }}
                          className={currentPage === i + 1 ? "bg-primary text-on-primary" : "hover:bg-surface-container-low"}
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault()
                          if (currentPage < totalPages) setCurrentPage(currentPage + 1)
                        }}
                        className={currentPage === totalPages ? "pointer-events-none opacity-40" : "hover:bg-surface-container-low"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Full Message View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-xl rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-primary/5 dark:bg-primary/10 p-8 border-b border-outline/10">
            <div className="flex items-center justify-between mb-4">
              <Badge variant={selectedFeedback?.category === 'bug' ? 'destructive' : 'secondary'} className="rounded-lg">
                {selectedFeedback?.category}
              </Badge>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                {selectedFeedback && formatDateTime(selectedFeedback.created_at)}
              </span>
            </div>
            <DialogTitle className="text-2xl font-bold text-foreground">
              Feedback from {selectedFeedback?.name || "Anonymous"}
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Contact: {selectedFeedback?.email || "No email address provided"}
            </p>
          </div>
          
          <div className="p-8">
            <div className="rounded-2xl bg-surface-container-low/50 p-6 border border-outline/10 text-foreground/90 leading-relaxed whitespace-pre-wrap italic">
              "{selectedFeedback?.message}"
            </div>
          </div>

          <DialogFooter className="p-6 bg-surface-container-low/30 flex flex-row gap-3 justify-end border-t border-outline/10">
            <Button variant="ghost" className="rounded-xl px-6" onClick={() => setIsViewModalOpen(false)}>Close</Button>
            {(selectedFeedback?.status || 'pending') !== 'resolved' && (
              <Button className="rounded-xl px-6" onClick={() => {
                handleStatusUpdate(selectedFeedback!.id, 'resolved')
                setIsViewModalOpen(false)
              }}>
                Mark as Resolved
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader className="items-center text-center">
            <div className="h-16 w-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="h-8 w-8 text-rose-600 dark:text-rose-400" />
            </div>
            <DialogTitle className="text-xl">Delete Feedback?</DialogTitle>
            <DialogDescription className="text-sm pt-2">
              This will permanently remove this feedback from the system. This action is irreversible.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-4">
            <Button variant="destructive" className="rounded-xl h-12 text-base font-semibold" onClick={handleDelete}>
              Delete Permanently
            </Button>
            <Button variant="ghost" className="rounded-xl h-12" onClick={() => setIsDeleteModalOpen(false)}>
              Keep Feedback
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminPage>
  )
}
