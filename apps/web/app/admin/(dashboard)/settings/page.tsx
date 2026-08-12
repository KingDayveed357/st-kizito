"use client"

import { startTransition, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/layout/admin-layout"
import { ComingSoonPanel } from "@/components/admin/coming-soon-panel"
import { Button } from "@/components/ui/button-custom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card-custom"
import { Input } from "@/components/ui/input-custom"
import { createClient } from "@/lib/supabase"

const PASSWORD_POLICY_TEXT = "Use at least 12 characters with uppercase, lowercase, number, and special symbol."

const validateStrongPassword = (value: string) => {
  return (
    value.length >= 12 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /[0-9]/.test(value) &&
    /[^A-Za-z0-9]/.test(value)
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [parishName, setParishName] = useState("St. Kizito Parish")
  const [email, setEmail] = useState("admin@stkizito.com")
  const [phone, setPhone] = useState("+1 (555) 123-4567")
  const [address, setAddress] = useState("123 Faith Street, Holy City, HC 12345")
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileMessage, setProfileMessage] = useState<string | null>(null)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [invalidateOtherSessions, setInvalidateOtherSessions] = useState(true)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)

  const [deletePhrase, setDeletePhrase] = useState("")
  const [isDeletingData, setIsDeletingData] = useState(false)
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null)

  const handleSaveProfile = async () => {
    setIsSavingProfile(true)
    setProfileMessage(null)

    window.setTimeout(() => {
      setIsSavingProfile(false)
      setProfileMessage("Parish profile preferences saved.")
    }, 700)
  }

  const handleChangePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(null)

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill all password fields.")
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.")
      return
    }

    if (newPassword === currentPassword) {
      setPasswordError("New password must be different from your current password.")
      return
    }

    if (!validateStrongPassword(newPassword)) {
      setPasswordError(PASSWORD_POLICY_TEXT)
      return
    }

    setIsUpdatingPassword(true)

    try {
      const { data: userResult, error: userError } = await supabase.auth.getUser()
      if (userError || !userResult.user?.email) {
        setPasswordError("Could not verify your current account. Please sign in again.")
        setIsUpdatingPassword(false)
        return
      }

      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: userResult.user.email,
        password: currentPassword,
      })

      if (reauthError) {
        setPasswordError("Current password is incorrect.")
        setIsUpdatingPassword(false)
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) {
        setPasswordError("Unable to update password. Please try again.")
        setIsUpdatingPassword(false)
        return
      }

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setPasswordSuccess("Password changed successfully.")

      if (invalidateOtherSessions) {
        await fetch("/admin/logout", { method: "POST", credentials: "include" })
        startTransition(() => {
          router.replace("/admin/login?loggedOut=1")
          router.refresh()
        })
      }
    } catch {
      setPasswordError("Unexpected error while changing password.")
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const canDeleteParishData = deletePhrase.trim() === "DELETE"

  const handleDeleteParishData = async () => {
    setDeleteMessage(null)
    if (!canDeleteParishData) return

    setIsDeletingData(true)
    window.setTimeout(() => {
      setIsDeletingData(false)
      setDeletePhrase("")
      setDeleteMessage("Destructive delete is currently locked until secure backup and retention controls are finalized.")
    }, 1000)
  }

  return (
    <AdminLayout title="Settings" subtitle="Security controls and administrative preferences">
      <div className="max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Parish Information</CardTitle>
            <CardDescription>Update visible parish details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="Parish Name" value={parishName} onChange={(event) => setParishName(event.target.value)} />
            <Input label="Contact Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            <Input label="Phone Number" value={phone} onChange={(event) => setPhone(event.target.value)} />
            <Input label="Address" value={address} onChange={(event) => setAddress(event.target.value)} />
            <div className="flex items-center gap-3">
              <Button onClick={handleSaveProfile} isLoading={isSavingProfile}>
                Save Changes
              </Button>
              {profileMessage ? <p className="text-sm text-success">{profileMessage}</p> : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Use your current password to authorize this security change.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleChangePassword} noValidate>
              {passwordError ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {passwordError}
                </div>
              ) : null}
              {passwordSuccess ? (
                <div className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
                  {passwordSuccess}
                </div>
              ) : null}

              <Input
                label="Current Password"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
              />
              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                helperText={PASSWORD_POLICY_TEXT}
                autoComplete="new-password"
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
              />
              <label className="flex items-center gap-2 text-sm text-foreground/75">
                <input
                  type="checkbox"
                  checked={invalidateOtherSessions}
                  onChange={(event) => setInvalidateOtherSessions(event.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                Sign out all active admin sessions after password change
              </label>
              <Button type="submit" isLoading={isUpdatingPassword}>
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>

        <ComingSoonPanel
          title="Email Notifications"
          description="Delivery routing, digest preferences, and escalation notification controls are being redesigned."
        />

        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>Deleting parish data is permanent and cannot be undone.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-destructive/25 bg-destructive/10 p-4 text-sm text-destructive">
              This action permanently removes data for bookings, donations, events, and administrative records.
            </div>
            <Input
              label='Type "DELETE" to enable destructive action'
              value={deletePhrase}
              onChange={(event) => setDeletePhrase(event.target.value)}
              isInvalid={Boolean(deletePhrase) && !canDeleteParishData}
              helperText={canDeleteParishData ? "Confirmation accepted." : "Exact uppercase phrase required."}
            />
            <div className="flex items-center gap-3">
              <Button
                variant="destructive"
                disabled={!canDeleteParishData}
                isLoading={isDeletingData}
                onClick={handleDeleteParishData}
              >
                Delete Parish Data
              </Button>
              {deleteMessage ? <p className="text-sm text-foreground/70">{deleteMessage}</p> : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
