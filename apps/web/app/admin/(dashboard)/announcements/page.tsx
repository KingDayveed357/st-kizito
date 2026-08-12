"use client"

import { useState, useEffect, useCallback } from "react"
import { Megaphone, Pencil, Plus, Trash2 } from "lucide-react"
import { AdminPage } from "@/components/layout/admin-page"
import { Button } from "@/components/ui/button-custom"
import { Input } from "@/components/ui/input-custom"
import { Badge } from "@/components/ui/badge-custom"
import { StatusBadge } from "@/components/ui/status-badge"
import { Card, CardContent } from "@/components/ui/card-custom"
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from "@/components/ui/modal-custom"
import { AdminPageSkeleton } from "@/components/admin/admin-page-skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { AnnouncementPreview } from "@/components/admin/announcement-preview"
import { createClient } from "@/lib/supabase"
import { formatRelativeTime, formatDateTime } from "@/lib/format-time"
import { notifyError, notifySuccess } from "@/lib/toast"

type Announcement = {
  id: string
  title: string
  content: string
  type: "liturgical" | "parish" | null
  published: boolean
  created_at: string
}

type FieldErrors = Partial<Record<"title" | "content", string>>

const EMPTY_FORM = {
  title: "",
  content: "",
  type: "parish" as "liturgical" | "parish",
  published: false,
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<"all" | "liturgical" | "parish">("all")

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [isSaving, setIsSaving] = useState(false)

  const [pendingDelete, setPendingDelete] = useState<Announcement | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const supabase = createClient()

  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setLoadError("We couldn't load the parish announcements.")
      setAnnouncements([])
    } else {
      setLoadError(null)
      setAnnouncements((data ?? []) as Announcement[])
    }
    setIsLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchAnnouncements()
  }, [fetchAnnouncements])

  const filtered =
    filterType === "all" ? announcements : announcements.filter((a) => a.type === filterType)

  const openCreate = () => {
    setEditingId(null)
    setFormData(EMPTY_FORM)
    setFieldErrors({})
    setIsModalOpen(true)
  }

  const openEdit = (announcement: Announcement) => {
    setEditingId(announcement.id)
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type ?? "parish",
      published: announcement.published,
    })
    setFieldErrors({})
    setIsModalOpen(true)
  }

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {}
    if (!formData.title.trim()) errors.title = "Give the announcement a headline."
    if (!formData.content.trim()) errors.content = "Write what parishioners need to know."
    return errors
  }

  const handleSave = async () => {
    const errors = validate()
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setIsSaving(true)

    const payload = {
      title: formData.title.trim(),
      content: formData.content.trim(),
      type: formData.type,
      published: formData.published,
    }

    // Previously unchecked: a rejected write closed the modal and reported nothing.
    const { error } = editingId
      ? await supabase.from('announcements').update(payload).eq('id', editingId)
      : await supabase.from('announcements').insert(payload)

    setIsSaving(false)

    if (error) {
      notifyError(
        editingId ? "We couldn't update that announcement." : "We couldn't create that announcement.",
        error
      )
      return
    }

    notifySuccess(
      editingId ? "Announcement updated" : payload.published ? "Announcement published" : "Draft saved",
      payload.published ? "Parishioners can see this in the app now." : payload.title
    )
    setIsModalOpen(false)
    await fetchAnnouncements()
  }

  const handleDelete = async () => {
    if (!pendingDelete) return
    setIsDeleting(true)

    const { error } = await supabase.from('announcements').delete().eq('id', pendingDelete.id)

    setIsDeleting(false)

    if (error) {
      notifyError("We couldn't delete that announcement.", error)
      return
    }

    notifySuccess("Announcement deleted", pendingDelete.title)
    setPendingDelete(null)
    await fetchAnnouncements()
  }

  const navbarActions = (
    <Button onClick={openCreate}>
      <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
      New Announcement
    </Button>
  )

  return (
    <AdminPage
      title="Announcements"
      subtitle="Manage parish announcements and notifications"
      navbarActions={navbarActions}
    >
      <div className="mb-6 flex flex-wrap gap-2">
        {(["all", "liturgical", "parish"] as const).map((type) => (
          <Button
            key={type}
            variant={filterType === type ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType(type)}
          >
            {type === "all" ? "All" : type === "liturgical" ? "Liturgical" : "Parish"}
          </Button>
        ))}
      </div>

      <div className="space-y-4">
        {isLoading ? <AdminPageSkeleton rows={3} /> : null}

        {!isLoading && loadError ? (
          <Card className="border-error/30 bg-error/5">
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-sm font-medium text-error">{loadError}</p>
              <p className="text-xs text-muted-foreground">Check your connection and try again.</p>
              <Button variant="outline" size="sm" onClick={fetchAnnouncements}>
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && !loadError && filtered.length === 0 ? (
          <EmptyState
            icon={<Megaphone className="h-6 w-6" />}
            title={filterType === "all" ? "No announcements yet" : "Nothing in this category"}
            description={
              filterType === "all"
                ? "Post an announcement so parishioners hear about Masses, feasts, and parish news."
                : "Try another category, or post a new announcement in this one."
            }
            action={<Button onClick={openCreate}>New announcement</Button>}
          />
        ) : null}

        {!isLoading && !loadError
          ? filtered.map((announcement) => (
              <Card key={announcement.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge variant={announcement.type === "liturgical" ? "default" : "secondary"}>
                          {announcement.type === "liturgical" ? "Liturgical" : "Parish"}
                        </Badge>
                        <StatusBadge status={announcement.published ? "published" : "draft"} />
                      </div>
                      {/*
                        The list previously printed the raw `title` and `content`, so an admin saw
                        their ALL-CAPS text verbatim while the app title-cased it and stripped the
                        repeated headline — two different renderings of one record. This is the same
                        component the editor preview uses.
                      */}
                      <div className="mb-3">
                        <AnnouncementPreview
                          variant="inline"
                          title={announcement.title}
                          content={announcement.content}
                          type={announcement.type}
                        />
                      </div>
                      <span
                        className="text-xs text-muted-foreground"
                        title={formatDateTime(announcement.created_at)}
                      >
                        {formatRelativeTime(announcement.created_at)}
                      </span>
                    </div>

                    <div className="flex flex-shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(announcement)}
                        aria-label={`Edit ${announcement.title}`}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setPendingDelete(announcement)}
                        aria-label={`Delete ${announcement.title}`}
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
          <ModalTitle>{editingId ? "Edit announcement" : "Create new announcement"}</ModalTitle>
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
            label="Title"
            placeholder="Feast of the Transfiguration"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            isInvalid={Boolean(fieldErrors.title)}
            helperText={fieldErrors.title}
          />
          <div>
            <label
              htmlFor="announcement-type"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Type
            </label>
            <select
              id="announcement-type"
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value as "liturgical" | "parish" })
              }
              className="h-10 w-full rounded-lg border border-input bg-input px-3 py-2 text-sm text-foreground"
            >
              <option value="parish">Parish</option>
              <option value="liturgical">Liturgical</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="announcement-content"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Content
            </label>
            <textarea
              id="announcement-content"
              placeholder="Masses at 6:00 AM and 6:00 PM."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={5}
              className={
                "w-full rounded-lg border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring " +
                (fieldErrors.content ? "border-destructive" : "border-input")
              }
            />
            {fieldErrors.content ? (
              <p className="mt-1 text-xs text-destructive">{fieldErrors.content}</p>
            ) : null}
          </div>
          {/*
            Live preview. The single most useful thing the portal can show while writing: the
            parishioner's view, updating as you type. Without it the admin cannot tell that the app
            will drop a repeated headline or lift a "Masses:" line into its own field.
          */}
          <div>
            <p className="mb-2 block text-sm font-medium text-foreground">How this appears in the app</p>
            <AnnouncementPreview
              title={formData.title}
              content={formData.content}
              type={formData.type}
              dateLabel="Today"
            />
          </div>

          <div className="mt-4 flex items-center gap-2">
            <input
              type="checkbox"
              id="published"
              checked={formData.published}
              onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
              className="h-4 w-4 rounded border-input"
            />
            <label htmlFor="published" className="text-sm font-medium text-foreground">
              Publish now (visible in the app)
            </label>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={isSaving}>
            {editingId ? "Save changes" : formData.published ? "Publish" : "Save draft"}
          </Button>
        </ModalFooter>
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete this announcement?"
        description={
          <>
            <strong className="text-foreground">{pendingDelete?.title}</strong> will be removed from
            the parish app immediately. This cannot be undone.
          </>
        }
        confirmLabel="Delete announcement"
        isPending={isDeleting}
        onConfirm={handleDelete}
      />
    </AdminPage>
  )
}
