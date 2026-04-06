"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button-custom"
import { Input } from "@/components/ui/input-custom"
import { Badge } from "@/components/ui/badge-custom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card-custom"
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from "@/components/ui/modal-custom"
import { createClient } from "@/lib/supabase"

type Announcement = {
  id: string
  title: string
  content: string
  type: "liturgical" | "parish" | null
  published: boolean
  created_at: string
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [filterType, setFilterType] = useState<"all" | "liturgical" | "parish">("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "parish" as "liturgical" | "parish",
    published: false,
  })

  const supabase = createClient()

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      setAnnouncements(data as Announcement[])
    }
  }

  const filteredAnnouncements = filterType === "all" ? announcements : announcements.filter((a) => a.type === filterType)

  const handleCreateClick = () => {
    setEditingId(null)
    setFormData({ title: "", content: "", type: "parish", published: false })
    setIsModalOpen(true)
  }

  const handleEditClick = (announcement: Announcement) => {
    setEditingId(announcement.id)
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type || "parish",
      published: announcement.published,
    })
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.title || !formData.content) {
      alert("Please fill in all fields")
      return
    }

    if (editingId) {
      await supabase
        .from('announcements')
        .update({
          title: formData.title,
          content: formData.content,
          type: formData.type,
          published: formData.published,
        })
        .eq('id', editingId)
    } else {
      await supabase
        .from('announcements')
        .insert({
          title: formData.title,
          content: formData.content,
          type: formData.type,
          published: formData.published,
        })
    }

    await fetchAnnouncements()
    setIsModalOpen(false)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this announcement?")) {
      await supabase.from('announcements').delete().eq('id', id)
      await fetchAnnouncements()
    }
  }

  const navbarActions = (
    <Button onClick={handleCreateClick} className="bg-primary">
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      New Announcement
    </Button>
  )

  return (
    <AdminLayout
      title="Announcements"
      subtitle="Manage parish announcements and notifications"
      navbarActions={navbarActions}
    >
      {/* Filters */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <Button
          variant={filterType === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterType("all")}
        >
          All
        </Button>
        <Button
          variant={filterType === "liturgical" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterType("liturgical")}
        >
          Liturgical
        </Button>
        <Button
          variant={filterType === "parish" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterType("parish")}
        >
          Parish
        </Button>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No announcements found</p>
            </CardContent>
          </Card>
        ) : (
          filteredAnnouncements.map((announcement) => (
            <Card key={announcement.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-foreground">{announcement.title}</h3>
                      <Badge variant={announcement.type === "liturgical" ? "default" : "secondary"}>
                        {announcement.type === "liturgical" ? "Liturgical" : "Parish"}
                      </Badge>
                      <Badge variant={announcement.published ? "default" : "outline"} className={announcement.published ? "bg-green-600/10 text-green-600 hover:bg-green-600/20" : ""}>
                        {announcement.published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{announcement.content}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditClick(announcement)}
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
                      size="sm"
                      onClick={() => handleDelete(announcement.id)}
                    >
                      <svg className="w-4 h-4 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          ))
        )}
      </div>

      {/* Modal for Create/Edit */}
      <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
        <ModalHeader>
          <ModalTitle>{editingId ? "Edit Announcement" : "Create New Announcement"}</ModalTitle>
          <button
            onClick={() => setIsModalOpen(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </ModalHeader>
        <ModalBody className="space-y-4">
          <Input
            label="Title"
            placeholder="Announcement title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as "liturgical" | "parish" })}
              className="w-full h-10 rounded-lg border border-input bg-input px-3 py-2 text-sm text-foreground"
            >
              <option value="parish">Parish</option>
              <option value="liturgical">Liturgical</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Content</label>
            <textarea
              placeholder="Announcement content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={5}
              className="w-full rounded-lg border border-input bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              id="published"
              checked={formData.published}
              onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
              className="h-4 w-4 rounded border-input"
            />
            <label htmlFor="published" className="text-sm font-medium text-foreground">
              Published (Visible in App)
            </label>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {editingId ? "Update" : "Create"}
          </Button>
        </ModalFooter>
      </Modal>
    </AdminLayout>
  )
}
