"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button-custom"
import { Input } from "@/components/ui/input-custom"
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
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from "@/components/ui/modal-custom"
import { mockUsers } from "@/lib/mock-data"
import type { User } from "@/lib/mock-data"

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [filterRole, setFilterRole] = useState<"all" | "admin" | "staff" | "parishioner">("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "parishioner" as const,
  })

  const filteredUsers = filterRole === "all" ? users : users.filter((u) => u.role === filterRole)

  const handleCreateClick = () => {
    setEditingId(null)
    setFormData({ name: "", email: "", role: "parishioner" })
    setIsModalOpen(true)
  }

  const handleEditClick = (user: User) => {
    setEditingId(user.id)
    setFormData({ name: user.name, email: user.email, role: user.role })
    setIsModalOpen(true)
  }

  const handleSave = () => {
    if (!formData.name || !formData.email) {
      alert("Please fill in all fields")
      return
    }

    if (editingId) {
      setUsers(
        users.map((u) =>
          u.id === editingId
            ? { ...u, name: formData.name, email: formData.email, role: formData.role }
            : u
        )
      )
    } else {
      setUsers([
        ...users,
        {
          id: String(Date.now()),
          name: formData.name,
          email: formData.email,
          role: formData.role,
          joinDate: new Date(),
        },
      ])
    }

    setIsModalOpen(false)
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to remove this user?")) {
      setUsers(users.filter((u) => u.id !== id))
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "default"
      case "staff":
        return "secondary"
      case "parishioner":
        return "outline"
      default:
        return "default"
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const navbarActions = (
    <Button onClick={handleCreateClick} className="bg-primary">
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      Add User
    </Button>
  )

  return (
    <AdminLayout
      title="Users & Admins"
      subtitle="Manage parish members and administrators"
      navbarActions={navbarActions}
    >
      {/* Filters */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <Button
          variant={filterRole === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterRole("all")}
        >
          All ({users.length})
        </Button>
        <Button
          variant={filterRole === "admin" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterRole("admin")}
        >
          Admins ({users.filter((u) => u.role === "admin").length})
        </Button>
        <Button
          variant={filterRole === "staff" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterRole("staff")}
        >
          Staff ({users.filter((u) => u.role === "staff").length})
        </Button>
        <Button
          variant={filterRole === "parishioner" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterRole("parishioner")}
        >
          Parishioners ({users.filter((u) => u.role === "parishioner").length})
        </Button>
      </div>

      {/* Users Table */}
      {filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No users found</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(user.joinDate)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditClick(user)}>
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
                        onClick={() => handleDelete(user.id)}
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Modal for Create/Edit */}
      <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
        <ModalHeader>
          <ModalTitle>{editingId ? "Edit User" : "Add New User"}</ModalTitle>
          <button
            onClick={() => setIsModalOpen(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </ModalHeader>
        <ModalBody className="space-y-4">
          <Input
            label="Full Name"
            placeholder="User full name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="user@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as "admin" | "staff" | "parishioner" })}
              className="w-full h-10 rounded-lg border border-input bg-input px-3 py-2 text-sm text-foreground"
            >
              <option value="parishioner">Parishioner</option>
              <option value="staff">Staff</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {editingId ? "Update" : "Add User"}
          </Button>
        </ModalFooter>
      </Modal>
    </AdminLayout>
  )
}
