"use client"

import { useState, useEffect, useCallback } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { AdminPage } from "@/components/layout/admin-page"
import { Button } from "@/components/ui/button-custom"
import { Input } from "@/components/ui/input-custom"
import { Card, CardContent } from "@/components/ui/card-custom"
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from "@/components/ui/modal-custom"
import { AdminPageSkeleton } from "@/components/admin/admin-page-skeleton"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { createClient } from "@/lib/supabase"
import { notifyError, notifySuccess } from "@/lib/toast"

type MassTime = {
  id: string
  day_of_week: string
  time: string
  location: string | null
  type: string | null
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export default function MassTimesPage() {
  const [massTimes, setMassTimes] = useState<MassTime[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [timeError, setTimeError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<MassTime | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formData, setFormData] = useState({
    day: "Sunday",
    time: "08:00",
    location: "Main Church",
    type: "Low Mass",
  })

  const supabase = createClient()

  const fetchMassTimes = useCallback(async () => {
    setIsLoading(true)
    const { data, error } = await supabase.from('mass_times').select('*')

    if (error) {
      setLoadError("We couldn't load the Mass schedule.")
      setMassTimes([])
    } else {
      setLoadError(null)
      setMassTimes((data ?? []) as MassTime[])
    }
    setIsLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchMassTimes()
  }, [fetchMassTimes])

  const groupedByDay = DAYS.map((day) => ({
    day,
    times: massTimes.filter((m) => m.day_of_week === day).sort((a, b) => a.time.localeCompare(b.time)),
  }))

  const handleCreateClick = () => {
    setEditingId(null)
    setFormData({ day: "Sunday", time: "08:00", location: "Main Church", type: "Low Mass" })
    setTimeError(null)
    setIsModalOpen(true)
  }

  const handleEditClick = (massTime: MassTime) => {
    setEditingId(massTime.id)
    setFormData({
      day: massTime.day_of_week,
      time: massTime.time,
      location: massTime.location || "",
      type: massTime.type || "",
    })
    setTimeError(null)
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.day || !formData.time) {
      setTimeError("Choose a day and a time.")
      return
    }
    setTimeError(null)
    setIsSaving(true)

    const payload = {
      day_of_week: formData.day,
      time: formData.time,
      location: formData.location || null,
      type: formData.type || null,
    }

    // Previously unchecked: a rejected write closed the modal and reported success.
    const { error } = editingId
      ? await supabase.from('mass_times').update(payload).eq('id', editingId)
      : await supabase.from('mass_times').insert(payload)

    setIsSaving(false)

    if (error) {
      notifyError(
        editingId ? "We couldn't update that Mass time." : "We couldn't add that Mass time.",
        error
      )
      return
    }

    notifySuccess(
      editingId ? "Mass time updated" : "Mass time added",
      `${formData.day}, ${formatTime(formData.time)}`
    )
    setIsModalOpen(false)
    await fetchMassTimes()
  }

  const handleDelete = async () => {
    if (!pendingDelete) return
    setIsDeleting(true)

    const { error } = await supabase.from('mass_times').delete().eq('id', pendingDelete.id)

    setIsDeleting(false)

    if (error) {
      notifyError("We couldn't remove that Mass time.", error)
      return
    }

    notifySuccess("Mass time removed", `${pendingDelete.day_of_week}, ${formatTime(pendingDelete.time)}`)
    setPendingDelete(null)
    await fetchMassTimes()
  }

  const navbarActions = (
    <Button onClick={handleCreateClick}>
      <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
      Add Mass Time
    </Button>
  )

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  return (
    <AdminPage
      title="Mass Times"
      subtitle="Manage weekly mass schedule"
      navbarActions={navbarActions}
    >
      <div className="space-y-6">
        {isLoading ? <AdminPageSkeleton rows={4} /> : null}

        {!isLoading && loadError ? (
          <Card className="border-error/30 bg-error/5">
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-sm font-medium text-error">{loadError}</p>
              <p className="text-xs text-muted-foreground">Check your connection and try again.</p>
              <Button variant="outline" size="sm" onClick={fetchMassTimes}>
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && !loadError ? groupedByDay.map(({ day, times }) => (
          <div key={day}>
            <h3 className="text-lg font-semibold text-foreground mb-4">{day}</h3>

            {times.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No masses scheduled</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {times.map((massTime) => (
                  <Card key={massTime.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-2xl font-bold text-primary">{formatTime(massTime.time)}</p>
                          <p className="text-sm font-medium text-foreground mt-1">{massTime.location}</p>
                          {massTime.type && <p className="text-sm text-muted-foreground">{massTime.type}</p>}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleEditClick(massTime)}
                            aria-label={`Edit ${day} ${formatTime(massTime.time)} Mass`}
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setPendingDelete(massTime)}
                            aria-label={`Remove ${day} ${formatTime(massTime.time)} Mass`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )) : null}
      </div>

      {/* Modal for Create/Edit */}
      <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
        <ModalHeader>
          <ModalTitle>{editingId ? "Edit Mass Time" : "Add New Mass Time"}</ModalTitle>
          <button
            onClick={() => setIsModalOpen(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </ModalHeader>
        <ModalBody className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Day</label>
            <select
              value={formData.day}
              onChange={(e) => setFormData({ ...formData, day: e.target.value })}
              className="w-full h-10 rounded-lg border border-input bg-input px-3 py-2 text-sm text-foreground"
            >
              {DAYS.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Time"
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            isInvalid={Boolean(timeError)}
            helperText={timeError ?? undefined}
          />

          <Input
            label="Location (Optional)"
            placeholder="e.g., Main Church, Lady Chapel"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />

          <Input
            label="Mass Type (Optional)"
            placeholder="e.g., Low Mass, High Mass, Sung Mass"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={isSaving}>
            {editingId ? "Save changes" : "Add Mass time"}
          </Button>
        </ModalFooter>
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Remove this Mass time?"
        description={
          pendingDelete ? (
            <>
              The{" "}
              <strong className="text-foreground">
                {pendingDelete.day_of_week} {formatTime(pendingDelete.time)}
              </strong>{" "}
              Mass will disappear from the parish app&apos;s schedule immediately. This cannot be
              undone.
            </>
          ) : null
        }
        confirmLabel="Remove Mass time"
        isPending={isDeleting}
        onConfirm={handleDelete}
      />
    </AdminPage>
  )
}
