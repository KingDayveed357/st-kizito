"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button-custom"
import { Input } from "@/components/ui/input-custom"
import { Card, CardContent } from "@/components/ui/card-custom"
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from "@/components/ui/modal-custom"
import { AdminPageSkeleton } from "@/components/admin/admin-page-skeleton"
import { createClient } from "@/lib/supabase"

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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    day: "Sunday",
    time: "08:00",
    location: "Main Church",
    type: "Low Mass",
  })

  const supabase = createClient()

  useEffect(() => {
    fetchMassTimes()
  }, [])

  const fetchMassTimes = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('mass_times')
      .select('*')
    if (!error && data) {
      setMassTimes(data as MassTime[])
    }
    setIsLoading(false)
  }

  const groupedByDay = DAYS.map((day) => ({
    day,
    times: massTimes.filter((m) => m.day_of_week === day).sort((a, b) => a.time.localeCompare(b.time)),
  }))

  const handleCreateClick = () => {
    setEditingId(null)
    setFormData({ day: "Sunday", time: "08:00", location: "Main Church", type: "Low Mass" })
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
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.day || !formData.time) {
      alert("Please fill in day and time")
      return
    }

    if (editingId) {
      await supabase
        .from('mass_times')
        .update({
          day_of_week: formData.day,
          time: formData.time,
          location: formData.location || null,
          type: formData.type || null,
        })
        .eq('id', editingId)
    } else {
      await supabase
        .from('mass_times')
        .insert({
          day_of_week: formData.day,
          time: formData.time,
          location: formData.location || null,
          type: formData.type || null,
        })
    }

    await fetchMassTimes()
    setIsModalOpen(false)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this mass time?")) {
      await supabase.from('mass_times').delete().eq('id', id)
      await fetchMassTimes()
    }
  }

  const navbarActions = (
    <Button onClick={handleCreateClick} className="bg-primary">
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
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
    <AdminLayout
      title="Mass Times"
      subtitle="Manage weekly mass schedule"
      navbarActions={navbarActions}
    >
      <div className="space-y-6">
        {isLoading ? <AdminPageSkeleton rows={4} /> : null}
        {!isLoading ? groupedByDay.map(({ day, times }) => (
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
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleEditClick(massTime)}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDelete(massTime.id)}
                          >
                            <svg
                              className="w-4 h-4 text-destructive"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
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
          <Button variant="outline" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {editingId ? "Update" : "Add"}
          </Button>
        </ModalFooter>
      </Modal>
    </AdminLayout>
  )
}
