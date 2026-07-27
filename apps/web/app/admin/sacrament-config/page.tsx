"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button-custom"
import { Card, CardContent } from "@/components/ui/card-custom"
import { AdminPageSkeleton } from "@/components/admin/admin-page-skeleton"
import { createClient } from "@/lib/supabase"

type SacramentType = {
  type: string
  title: string
  description: string | null
  icon: string | null
  is_free: boolean
  amount: number
  required_fields: unknown
  allow_attachment: boolean
  active: boolean
  sort_order: number
}

type Draft = {
  is_free: boolean
  amount: string
  allow_attachment: boolean
  active: boolean
  required_fields: string // JSON text edited by the admin
}

export default function SacramentConfigPage() {
  const [types, setTypes] = useState<SacramentType[]>([])
  const [drafts, setDrafts] = useState<Record<string, Draft>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [savingType, setSavingType] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchTypes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchTypes = async () => {
    setIsLoading(true)
    const { data, error } = await supabase.from("sacrament_request_types").select("*").order("sort_order")
    if (!error && data) {
      const rows = data as unknown as SacramentType[]
      setTypes(rows)
      setDrafts(
        Object.fromEntries(
          rows.map((t) => [
            t.type,
            {
              is_free: t.is_free,
              amount: String(t.amount ?? 0),
              allow_attachment: t.allow_attachment,
              active: t.active,
              required_fields: JSON.stringify(t.required_fields ?? [], null, 2),
            },
          ]),
        ),
      )
    }
    setIsLoading(false)
  }

  const setDraft = (type: string, patch: Partial<Draft>) =>
    setDrafts((d) => ({ ...d, [type]: { ...d[type], ...patch } }))

  const save = async (type: string) => {
    const draft = drafts[type]
    let parsedFields: unknown
    try {
      parsedFields = JSON.parse(draft.required_fields)
      if (!Array.isArray(parsedFields)) throw new Error("Required fields must be a JSON array")
    } catch (e) {
      setMessage({ type: "error", text: `Invalid required-fields JSON: ${(e as Error).message}` })
      return
    }
    setSavingType(type)
    const { error } = await supabase
      .from("sacrament_request_types")
      .update({
        is_free: draft.is_free,
        amount: draft.is_free ? 0 : Number(draft.amount) || 0,
        allow_attachment: draft.allow_attachment,
        active: draft.active,
        required_fields: parsedFields,
      })
      .eq("type", type)
    setSavingType(null)
    if (error) setMessage({ type: "error", text: error.message })
    else {
      setMessage({ type: "success", text: `Saved “${type}”. Parishioners see the update after the app re-syncs.` })
      fetchTypes()
    }
  }

  return (
    <AdminLayout title="Sacrament Config" subtitle="Set whether each sacrament is free or has a fee, and which details are required">
      {message ? (
        <div
          className={`mb-6 rounded-md px-4 py-3 text-sm ${
            message.type === "error" ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      {isLoading ? <AdminPageSkeleton rows={3} /> : null}

      {!isLoading &&
        types.map((t) => {
          const draft = drafts[t.type]
          if (!draft) return null
          return (
            <Card key={t.type} className="mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{t.title}</h3>
                    <p className="text-xs text-muted-foreground">{t.type}</p>
                  </div>
                  <Button size="sm" onClick={() => save(t.type)} disabled={savingType === t.type}>
                    {savingType === t.type ? "Saving..." : "Save"}
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={draft.is_free} onChange={(e) => setDraft(t.type, { is_free: e.target.checked })} />
                    Free of charge
                  </label>

                  <label className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Fee (₦)</span>
                    <input
                      type="number"
                      min={0}
                      disabled={draft.is_free}
                      value={draft.amount}
                      onChange={(e) => setDraft(t.type, { amount: e.target.value })}
                      className="w-32 rounded-md border border-input bg-background px-2 py-1 disabled:opacity-50"
                    />
                  </label>

                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={draft.allow_attachment} onChange={(e) => setDraft(t.type, { allow_attachment: e.target.checked })} />
                    Allow supporting information
                  </label>

                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={draft.active} onChange={(e) => setDraft(t.type, { active: e.target.checked })} />
                    Visible in the app
                  </label>
                </div>

                <div className="mt-4">
                  <p className="text-sm font-medium mb-1">Required fields</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    JSON array of {"{ key, label, type: text|longtext|date|phone, required }"}.
                  </p>
                  <textarea
                    value={draft.required_fields}
                    onChange={(e) => setDraft(t.type, { required_fields: e.target.value })}
                    rows={10}
                    spellCheck={false}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
                  />
                </div>
              </CardContent>
            </Card>
          )
        })}
    </AdminLayout>
  )
}
