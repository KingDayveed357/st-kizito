"use client"

import { useState, useEffect, useCallback } from "react"
import { CalendarDays, MapPin, Pencil, Plus, Trash2 } from "lucide-react"
import { AdminPage } from "@/components/layout/admin-page"
import { Button } from "@/components/ui/button-custom"
import { Input } from "@/components/ui/input-custom"
import { Card, CardContent } from "@/components/ui/card-custom"
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from "@/components/ui/modal-custom"
import { AdminPageSkeleton } from "@/components/admin/admin-page-skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { createClient } from "@/lib/supabase"
import { formatDateWithWeekday } from "@/lib/format-time"
import { notifyError, notifySuccess } from "@/lib/toast"

type Event = {
  id: string
  title: string
  description: string
  start_date: string
  end_date: string | null
  location: string
  created_at: string
}

type FieldErrors = Partial<Record<"title" | "location" | "startDate" | "endDate", string>>

const EMPTY_FORM = { title: "", description: "", startDate: "", endDate: "", location: "" }

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [isSaving, setIsSaving] = useState(false)

  const [pendingDelete, setPendingDelete] = useState<Event | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const supabase = createClient()

  const fetchEvents = useCallback(async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('start_date', { ascending: true })

    // A failed read previously left the page showing "No events scheduled", which is indistinguishable
    // from a parish that genuinely has none. Surface the failure instead.
    if (error) {
      setLoadError("We couldn't load the parish events.")
      setEvents([])
    } else {
      setLoadError(null)
      setEvents((data ?? []) as Event[])
    }
    setIsLoading(false)
    // `supabase` is a fresh client each render; including it would loop. The client is stateless here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const openCreate = () => {
    setEditingId(null)
    setFormData(EMPTY_FORM)
    setFieldErrors({})
    setIsModalOpen(true)
  }

  const openEdit = (event: Event) => {
    setEditingId(event.id)
    setFormData({
      title: event.title,
      description: event.description ?? "",
      startDate: event.start_date,
      endDate: event.end_date ?? "",
      location: event.location,
    })
    setFieldErrors({})
    setIsModalOpen(true)
  }

  /** Inline field errors, replacing the browser `alert()` that named no field. */
  const validate = (): FieldErrors => {
    const errors: FieldErrors = {}
    if (!formData.title.trim()) errors.title = "Give the event a name parishioners will recognise."
    if (!formData.location.trim()) errors.location = "Tell parishioners where to go."
    if (!formData.startDate) errors.startDate = "Choose the date the event starts."
    if (formData.endDate && formData.endDate < formData.startDate) {
      errors.endDate = "The end date cannot be before the start date."
    }
    return errors
  }

  const handleSave = async () => {
    const errors = validate()
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setIsSaving(true)

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      start_date: formData.startDate,
      end_date: formData.endDate || null,
      location: formData.location.trim(),
    }

    // These writes previously ignored `error` entirely: an RLS rejection closed the modal, refetched
    // the unchanged list, and left the administrator believing the event had saved.
    const { error } = editingId
      ? await supabase.from('events').update(payload).eq('id', editingId)
      : await supabase.from('events').insert(payload)

    setIsSaving(false)

    if (error) {
      notifyError(
        editingId ? "We couldn't update that event." : "We couldn't create that event.",
        error
      )
      return
    }

    notifySuccess(editingId ? "Event updated" : "Event created", payload.title)
    setIsModalOpen(false)
    await fetchEvents()
  }

  const handleDelete = async () => {
    if (!pendingDelete) return
    setIsDeleting(true)

    const { error } = await supabase.from('events').delete().eq('id', pendingDelete.id)

    setIsDeleting(false)

    if (error) {
      notifyError("We couldn't delete that event.", error)
      return
    }

    notifySuccess("Event deleted", pendingDelete.title)
    setPendingDelete(null)
    await fetchEvents()
  }

  const navbarActions = (
    <Button onClick={openCreate}>
      <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
      New Event
    </Button>
  )

  return (
    <AdminPage
      title="Events"
      subtitle="Manage parish events and celebrations"
      navbarActions={navbarActions}
    >
      <div className="grid gap-4">
        {isLoading ? <AdminPageSkeleton rows={3} /> : null}

        {!isLoading && loadError ? (
          <Card className="border-error/30 bg-error/5">
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-sm font-medium text-error">{loadError}</p>
              <p className="text-xs text-muted-foreground">
                Check your connection and try again.
              </p>
              <Button variant="outline" size="sm" onClick={fetchEvents}>
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && !loadError && events.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="h-6 w-6" />}
            title="No events yet"
            description="Create your first parish event so parishioners can discover what's happening in the community."
            action={<Button onClick={openCreate}>Create event</Button>}
          />
        ) : null}

        {!isLoading && !loadError
          ? events.map((event) => (
              <Card key={event.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="mb-2 text-lg font-semibold text-foreground">{event.title}</h3>
                      {event.description ? (
                        <p className="mb-3 text-sm text-muted-foreground">{event.description}</p>
                      ) : null}
                      <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                        <div className="flex items-start gap-2">
                          <CalendarDays
                            className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground"
                            aria-hidden="true"
                          />
                          <div>
                            <span className="text-muted-foreground">Date</span>
                            <p className="font-medium text-foreground">
                              {formatDateWithWeekday(event.start_date)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin
                            className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground"
                            aria-hidden="true"
                          />
                          <div>
                            <span className="text-muted-foreground">Location</span>
                            <p className="font-medium text-foreground">{event.location}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(event)}
                        aria-label={`Edit ${event.title}`}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setPendingDelete(event)}
                        aria-label={`Delete ${event.title}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          : null}
      </div>

      <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
        <ModalHeader>
          <ModalTitle>{editingId ? "Edit event" : "Create new event"}</ModalTitle>
          <button
            onClick={() => setIsModalOpen(false)}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            ✕
          </button>
        </ModalHeader>
        <ModalBody className="space-y-4">
          <Input
            label="Event title"
            placeholder="Harvest & Bazaar"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            isInvalid={Boolean(fieldErrors.title)}
            helperText={fieldErrors.title}
          />
          <div>
            <label
              htmlFor="event-description"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Description
            </label>
            <textarea
              id="event-description"
              placeholder="What happens, and who it's for."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-input bg-input px-3 py-2 text-sm text-foreground"
            />
          </div>
          <Input
            label="Location"
            placeholder="Parish grounds"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            isInvalid={Boolean(fieldErrors.location)}
            helperText={fieldErrors.location}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Start date"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              isInvalid={Boolean(fieldErrors.startDate)}
              helperText={fieldErrors.startDate}
            />
            <Input
              label="End date (optional)"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              isInvalid={Boolean(fieldErrors.endDate)}
              helperText={fieldErrors.endDate}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={isSaving}>
            {editingId ? "Save changes" : "Create event"}
          </Button>
        </ModalFooter>
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete this event?"
        description={
          <>
            <strong className="text-foreground">{pendingDelete?.title}</strong> will be removed from
            the parish app immediately. This cannot be undone.
          </>
        }
        confirmLabel="Delete event"
        isPending={isDeleting}
        onConfirm={handleDelete}
      />
    </AdminPage>
  )
}
