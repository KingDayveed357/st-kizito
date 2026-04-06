"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button-custom"
import { Input } from "@/components/ui/input-custom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card-custom"

export default function SettingsPage() {
  const [parishName, setParishName] = useState("St. Kizito Parish")
  const [email, setEmail] = useState("admin@stkizito.com")
  const [phone, setPhone] = useState("+1 (555) 123-4567")
  const [address, setAddress] = useState("123 Faith Street, Holy City, HC 12345")
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false)
      alert("Settings saved successfully!")
    }, 800)
  }

  return (
    <AdminLayout title="Settings" subtitle="Manage parish configuration and preferences">
      <div className="max-w-2xl space-y-6">
        {/* Parish Information */}
        <Card>
          <CardHeader>
            <CardTitle>Parish Information</CardTitle>
            <CardDescription>Update your parish details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Parish Name"
              value={parishName}
              onChange={(e) => setParishName(e.target.value)}
            />
            <Input
              label="Contact Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Input
              label="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <Button onClick={handleSave} isLoading={isSaving}>
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Manage security and access control</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Two-Factor Authentication
              </label>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Enhance security with two-factor authentication
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Enable
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Email Notifications</CardTitle>
            <CardDescription>Configure email notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-input w-4 h-4" />
              <span className="text-sm text-foreground">New mass bookings</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-input w-4 h-4" />
              <span className="text-sm text-foreground">Event registrations</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-input w-4 h-4" />
              <span className="text-sm text-foreground">New announcements published</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="rounded border-input w-4 h-4" />
              <span className="text-sm text-foreground">Weekly activity summary</span>
            </label>
            <Button variant="outline" size="sm">
              Update Preferences
            </Button>
          </CardContent>
        </Card>

        {/* API & Integrations */}
        <Card>
          <CardHeader>
            <CardTitle>API & Integrations</CardTitle>
            <CardDescription>Manage API keys and third-party integrations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-3">
                API keys allow you to integrate St. Kizito Parish App with other applications.
              </p>
              <Button variant="outline" size="sm">
                Generate API Key
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Backup & Data */}
        <Card>
          <CardHeader>
            <CardTitle>Backup & Data</CardTitle>
            <CardDescription>Manage backups and export parish data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium text-foreground mb-1">Last Backup</p>
                <p className="text-xs text-muted-foreground">April 1, 2026 at 2:30 AM</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="sm">
                  Backup Now
                </Button>
                <Button variant="outline" size="sm">
                  Export Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10">
              Delete Parish Data
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
