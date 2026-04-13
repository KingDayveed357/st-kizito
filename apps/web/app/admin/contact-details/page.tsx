"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button-custom"
import { Input } from "@/components/ui/input-custom"
import { Card, CardContent } from "@/components/ui/card-custom"
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from "@/components/ui/modal-custom"
import { AdminPageSkeleton } from "@/components/admin/admin-page-skeleton"
import { createClient } from "@/lib/supabase"

type ParishContact = {
  id: string
  role: string
  name: string
  detail: string | null
  phone: string
  whatsapp_phone: string | null
  icon: string | null
  accent: string | null
  sort_order: number
  active: boolean
  created_at: string
}

const ICON_OPTIONS = [
  "document-text-outline",
  "book-outline",
  "heart-circle-outline",
  "person-outline",
  "people-outline",
  "call-outline",
]

export default function ContactDetailsPage() {
  const [contacts, setContacts] = useState<ParishContact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    role: "",
    name: "",
    detail: "",
    phone: "",
    whatsapp_phone: "",
    icon: "person-outline",
    accent: "#4A7C59",
    sort_order: "0",
    active: true,
  })

  const supabase = createClient()

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    setErrorMsg(null)
    setIsLoading(true)
    const { data, error } = await supabase
      .from("parish_contacts")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })

    if (error) {
      setErrorMsg(`Failed to load contacts: ${error.message}`)
      return
    }

    if (data) {
      setContacts(data as ParishContact[])
    }
    setIsLoading(false)
  }

  const handleCreateClick = () => {
    setEditingId(null)
    setFormData({
      role: "",
      name: "",
      detail: "",
      phone: "",
      whatsapp_phone: "",
      icon: "person-outline",
      accent: "#4A7C59",
      sort_order: "0",
      active: true,
    })
    setIsModalOpen(true)
  }

  const handleEditClick = (contact: ParishContact) => {
    setEditingId(contact.id)
    setFormData({
      role: contact.role,
      name: contact.name,
      detail: contact.detail ?? "",
      phone: contact.phone,
      whatsapp_phone: contact.whatsapp_phone ?? "",
      icon: contact.icon ?? "person-outline",
      accent: contact.accent ?? "#4A7C59",
      sort_order: String(contact.sort_order ?? 0),
      active: contact.active,
    })
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    setErrorMsg(null)
    setSuccessMsg(null)

    if (!formData.role || !formData.name || !formData.phone) {
      setErrorMsg("Please fill in role, name, and phone")
      return
    }

    setIsSaving(true)

    const payload = {
      role: formData.role,
      name: formData.name,
      detail: formData.detail || null,
      phone: formData.phone.trim(),
      whatsapp_phone: formData.whatsapp_phone.trim() || null,
      icon: formData.icon || null,
      accent: formData.accent || null,
      sort_order: Number(formData.sort_order || "0"),
      active: formData.active,
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from("parish_contacts")
          .update(payload)
          .eq("id", editingId)

        if (error) throw error
        setSuccessMsg("Contact updated successfully")
      } else {
        const { error } = await supabase
          .from("parish_contacts")
          .insert(payload)

        if (error) throw error
        setSuccessMsg("Contact created successfully")
      }

      await fetchContacts()
      setIsModalOpen(false)
    } catch (e: any) {
      setErrorMsg(`Failed to save contact: ${e?.message ?? "Unknown error"}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this contact?")) return
    setErrorMsg(null)
    const { error } = await supabase.from("parish_contacts").delete().eq("id", id)
    if (error) {
      setErrorMsg(`Failed to delete contact: ${error.message}`)
      return
    }
    await fetchContacts()
  }

  const navbarActions = (
    <Button onClick={handleCreateClick} className="bg-primary">
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      Add Contact
    </Button>
  )

  return (
    <AdminLayout
      title="Contact Details"
      subtitle="Manage people parishioners can reach directly from the mobile app"
      navbarActions={navbarActions}
    >
      <div className="space-y-4">
        {successMsg ? (
          <div className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success font-medium">
            {successMsg}
          </div>
        ) : null}
        {errorMsg ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium">
            {errorMsg}
          </div>
        ) : null}

        {isLoading ? <AdminPageSkeleton rows={3} /> : null}
        {!isLoading && contacts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No contact details added yet</p>
            </CardContent>
          </Card>
        ) : !isLoading ? (
          contacts.map((contact) => (
            <Card key={contact.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: contact.accent ?? "#4A7C59" }}>
                        {contact.role}
                      </span>
                      {!contact.active ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Inactive</span>
                      ) : null}
                    </div>
                    <p className="text-lg font-semibold text-foreground">{contact.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">{contact.detail || "No detail"}</p>
                    <div className="mt-3 text-sm text-muted-foreground space-y-1">
                      <p>Phone: {contact.phone}</p>
                      <p>WhatsApp: {contact.whatsapp_phone || contact.phone}</p>
                      <p>Sort Order: {contact.sort_order}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEditClick(contact)}>
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(contact.id)}>
                      <span className="text-destructive">Delete</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : null}
      </div>

      <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
        <ModalHeader>
          <ModalTitle>{editingId ? "Edit Contact" : "Add Contact"}</ModalTitle>
          <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </ModalHeader>
        <ModalBody className="space-y-4">
          <Input
            label="Role"
            placeholder="e.g. Parish Secretary"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          />
          <Input
            label="Name"
            placeholder="e.g. Mrs. Adaeze Okonkwo"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="Detail"
            placeholder="e.g. Sacramental documents and certificates"
            value={formData.detail}
            onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Phone"
              placeholder="+2348012345678"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              label="WhatsApp Phone (Optional)"
              placeholder="+2348012345678"
              value={formData.whatsapp_phone}
              onChange={(e) => setFormData({ ...formData, whatsapp_phone: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Icon</label>
              <select
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="w-full h-10 rounded-lg border border-input bg-input px-3 py-2 text-sm text-foreground"
              >
                {ICON_OPTIONS.map((icon) => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </select>
            </div>
            <Input
              label="Accent Color"
              placeholder="#4A7C59"
              value={formData.accent}
              onChange={(e) => setFormData({ ...formData, accent: e.target.value })}
            />
          </div>
          <Input
            label="Sort Order"
            type="number"
            value={formData.sort_order}
            onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
          />
          <div className="flex items-center gap-2">
            <input
              id="active"
              type="checkbox"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="h-4 w-4 rounded border-input"
            />
            <label htmlFor="active" className="text-sm font-medium text-foreground">
              Active (visible in mobile app)
            </label>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : editingId ? "Update" : "Create"}
          </Button>
        </ModalFooter>
      </Modal>
    </AdminLayout>
  )
}
