"use client"

import { useCallback, useEffect, useState } from "react"
import { ShieldCheck, ShieldAlert, Trash2, UserPlus } from "lucide-react"
import { AdminPage } from "@/components/layout/admin-page"
import { Button } from "@/components/ui/button-custom"
import { Input } from "@/components/ui/input-custom"
import { Card, CardContent } from "@/components/ui/card-custom"
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from "@/components/ui/modal-custom"
import { AdminPageSkeleton } from "@/components/admin/admin-page-skeleton"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { createClient } from "@/lib/supabase"
import { notifyError, notifySuccess } from "@/lib/toast"

/**
 * Users & Admins — the roster that defines who may administer the parish portal.
 *
 * Until the security migration, "admin" meant nothing more than holding any Supabase Auth session:
 * every RLS policy read `auth.role() = 'authenticated'`. Access is now membership in `admin_users`,
 * checked by `public.is_admin()` in both the middleware and every policy, so this page is the only
 * place that membership can be changed without SQL.
 *
 * Grant/revoke go through the `admin_grant` / `admin_revoke` RPCs rather than direct table writes:
 * the browser runs on the anon key and cannot read `auth.users` to resolve an email to a user id.
 * Those functions are SECURITY DEFINER and re-check owner status server-side, so the UI gating
 * below is a convenience, not the control.
 */

type AdminRole = "owner" | "admin" | "viewer"

interface AdminUser {
  user_id: string
  email: string | null
  role: AdminRole
  created_at: string
}

const ROLE_COPY: Record<AdminRole, { label: string; description: string }> = {
  owner: {
    label: "Owner",
    description: "Full access, and may add or remove other administrators.",
  },
  admin: {
    label: "Administrator",
    description: "Full access to parish records. Cannot change who has access.",
  },
  viewer: {
    label: "Viewer",
    description: "Intended for read-only staff. Enforced by policy as it is rolled out.",
  },
}

const ROLES: AdminRole[] = ["admin", "owner", "viewer"]

export default function UsersPage() {
  const [roster, setRoster] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<AdminRole>("admin")
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [pendingRevoke, setPendingRevoke] = useState<AdminUser | null>(null)
  const [isRevoking, setIsRevoking] = useState(false)

  const supabase = createClient()

  const fetchRoster = useCallback(async () => {
    setIsLoading(true)

    const [{ data: session }, { data, error }, { data: ownerFlag }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from("admin_users").select("*").order("created_at", { ascending: true }),
      supabase.rpc("is_admin_owner"),
    ])

    setCurrentUserId(session?.user?.id ?? null)
    setIsOwner(ownerFlag === true)

    if (error) {
      setLoadError("We couldn't load the administrator roster.")
      setRoster([])
    } else {
      setLoadError(null)
      setRoster((data ?? []) as AdminUser[])
    }
    setIsLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchRoster()
  }, [fetchRoster])

  const handleGrant = async () => {
    const trimmed = email.trim()
    if (!trimmed) {
      setFormError("Enter the email address of the account to grant access to.")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setFormError("That does not look like a valid email address.")
      return
    }

    setFormError(null)
    setIsSaving(true)
    const { error } = await supabase.rpc("admin_grant", {
      target_email: trimmed,
      target_role: role,
    })
    setIsSaving(false)

    if (error) {
      // P0002 is raised by `admin_grant` when no auth account exists yet — that is actionable
      // guidance rather than a failure, so it is shown inline instead of as a toast.
      if (error.code === "P0002") {
        setFormError(
          "No account exists for that address yet. Invite them in Supabase under Authentication → Users, then grant access here."
        )
        return
      }
      notifyError("We couldn't grant administrator access.", error)
      return
    }

    notifySuccess("Access granted", `${trimmed} is now ${ROLE_COPY[role].label.toLowerCase()}.`)
    setIsModalOpen(false)
    setEmail("")
    setRole("admin")
    fetchRoster()
  }

  const handleRevoke = async () => {
    if (!pendingRevoke) return
    setIsRevoking(true)
    const { error } = await supabase.rpc("admin_revoke", { target_user_id: pendingRevoke.user_id })
    setIsRevoking(false)

    if (error) {
      notifyError("We couldn't remove that administrator.", error)
      setPendingRevoke(null)
      return
    }

    notifySuccess("Access removed", `${pendingRevoke.email ?? "That account"} can no longer sign in.`)
    setPendingRevoke(null)
    fetchRoster()
  }

  const openGrantModal = () => {
    setEmail("")
    setRole("admin")
    setFormError(null)
    setIsModalOpen(true)
  }

  return (
    <AdminPage
      title="Users & Admins"
      subtitle="Who may sign in to the parish portal"
      navbarActions={
        isOwner ? (
          <Button onClick={openGrantModal}>
            <UserPlus className="h-4 w-4" />
            Grant access
          </Button>
        ) : null
      }
    >
      <div className="max-w-4xl space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-tertiary" aria-hidden="true" />
              <div className="space-y-1 text-sm">
                <p className="font-semibold">Access is explicit, not implied by having an account.</p>
                <p className="text-foreground/70">
                  Only the accounts listed here can open the portal or modify parish records. Creating
                  a Supabase Auth user does not grant access on its own — it must also be added below.
                  {!isOwner ? " Only an owner may change this list." : ""}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <AdminPageSkeleton rows={3} />
        ) : loadError ? (
          <Card>
            <CardContent className="space-y-4 pt-6 text-center">
              <ShieldAlert className="mx-auto h-6 w-6 text-error" aria-hidden="true" />
              <div>
                <p className="font-semibold">{loadError}</p>
                <p className="text-sm text-foreground/70">
                  This usually means the connection dropped. Your access has not changed.
                </p>
              </div>
              <Button variant="outline" onClick={fetchRoster}>
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : roster.length === 0 ? (
          <EmptyState
            icon={<ShieldAlert className="h-6 w-6" />}
            title="No administrators are on the roster"
            description="Nobody can currently administer the portal. Seed the first owner with the SQL at the bottom of apps/web/db/2026_08_security_hardening.sql, then manage everyone else from here."
          />
        ) : (
          <div className="space-y-3">
            {roster.map((entry) => {
              const isSelf = entry.user_id === currentUserId
              return (
                <Card key={entry.user_id}>
                  <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {entry.email ?? entry.user_id}
                        {isSelf ? <span className="ml-2 text-xs text-foreground/55">(you)</span> : null}
                      </p>
                      <p className="text-sm text-foreground/70">
                        <span className="font-medium">{ROLE_COPY[entry.role].label}</span>
                        {" — "}
                        {ROLE_COPY[entry.role].description}
                      </p>
                    </div>

                    {isOwner && !isSelf ? (
                      <Button
                        variant="outline"
                        onClick={() => setPendingRevoke(entry)}
                        aria-label={`Remove administrator access for ${entry.email ?? entry.user_id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
        <ModalHeader>
          <ModalTitle>Grant administrator access</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-5">
            <p className="text-sm text-foreground/70">
              The account must already exist in Supabase (Authentication → Users → Invite User). This
              grants that existing account access to the parish portal.
            </p>

            <div>
              <label
                htmlFor="grant-email"
                className="mb-2 block text-xs font-semibold uppercase tracking-widest text-foreground/70"
              >
                Email address
              </label>
              <Input
                id="grant-email"
                type="email"
                value={email}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="name@stkizito.org"
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <fieldset>
              <legend className="mb-2 block text-xs font-semibold uppercase tracking-widest text-foreground/70">
                Role
              </legend>
              <div className="space-y-2">
                {ROLES.map((value) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-start gap-3 rounded-xl border border-outline/30 p-3 has-[:checked]:border-tertiary has-[:checked]:bg-surface-container-low"
                  >
                    <input
                      type="radio"
                      name="admin-role"
                      value={value}
                      checked={role === value}
                      onChange={() => setRole(value)}
                      className="mt-1"
                    />
                    <span className="text-sm">
                      <span className="block font-semibold">{ROLE_COPY[value].label}</span>
                      <span className="text-foreground/70">{ROLE_COPY[value].description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {formError ? (
              <div
                className="rounded-xl border border-error/20 bg-error/10 p-3 text-sm text-error"
                role="alert"
              >
                {formError}
              </div>
            ) : null}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleGrant} disabled={isSaving}>
            {isSaving ? "Granting..." : "Grant access"}
          </Button>
        </ModalFooter>
      </Modal>

      <ConfirmDialog
        open={pendingRevoke !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRevoke(null)
        }}
        title="Remove administrator access?"
        description={`${pendingRevoke?.email ?? "This account"} will be signed out and will no longer be able to open the portal or change parish records. The Supabase account itself is not deleted.`}
        confirmLabel="Remove access"
        isPending={isRevoking}
        onConfirm={handleRevoke}
      />
    </AdminPage>
  )
}
