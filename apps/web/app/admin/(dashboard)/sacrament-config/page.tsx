"use client"

import { useState, useEffect } from "react"
import { AdminPage } from "@/components/layout/admin-page"
import { Button } from "@/components/ui/button-custom"
import { Card, CardContent } from "@/components/ui/card-custom"
import { AdminPageSkeleton } from "@/components/admin/admin-page-skeleton"
import { createClient } from "@/lib/supabase"

const FIELD_TYPES = ["text", "longtext", "date", "phone", "email", "select"] as const
type FieldType = (typeof FIELD_TYPES)[number]

type FieldDraft = {
  key: string
  label: string
  type: FieldType
  required: boolean
  helperText: string
  placeholder: string
  optionsText: string // comma-separated, for 'select'
}

type TypeDraft = {
  title: string
  active: boolean
  allow_attachment: boolean
  is_free: boolean
  amount: string
  currency: string
  payment_instructions: string
  account_name: string
  account_number: string
  bank_name: string
  payment_notes: string
  fields: FieldDraft[]
}

type SacramentTypeRow = {
  type: string
  title: string
  active: boolean
  allow_attachment: boolean
  is_free: boolean
  amount: number
  currency: string | null
  payment_instructions: string | null
  account_name: string | null
  account_number: string | null
  bank_name: string | null
  payment_notes: string | null
  required_fields: unknown
  sort_order: number
}

const slugify = (label: string) =>
  label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "field"

const rowToDraft = (r: SacramentTypeRow): TypeDraft => ({
  title: r.title,
  active: r.active,
  allow_attachment: r.allow_attachment,
  is_free: r.is_free,
  amount: String(r.amount ?? 0),
  currency: r.currency ?? "₦",
  payment_instructions: r.payment_instructions ?? "",
  account_name: r.account_name ?? "",
  account_number: r.account_number ?? "",
  bank_name: r.bank_name ?? "",
  payment_notes: r.payment_notes ?? "",
  fields: (Array.isArray(r.required_fields) ? r.required_fields : []).map((f: any) => ({
    key: String(f.key ?? ""),
    label: String(f.label ?? ""),
    type: FIELD_TYPES.includes(f.type) ? f.type : "text",
    required: !!f.required,
    helperText: String(f.helperText ?? ""),
    placeholder: String(f.placeholder ?? ""),
    optionsText: Array.isArray(f.options) ? f.options.join(", ") : "",
  })),
})

export default function SacramentConfigPage() {
  const [rows, setRows] = useState<SacramentTypeRow[]>([])
  const [drafts, setDrafts] = useState<Record<string, TypeDraft>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchTypes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchTypes = async () => {
    setIsLoading(true)
    const { data, error } = await supabase.from("sacrament_request_types").select("*").order("sort_order")
    if (!error && data) {
      const typed = data as unknown as SacramentTypeRow[]
      setRows(typed)
      setDrafts(Object.fromEntries(typed.map((r) => [r.type, rowToDraft(r)])))
    }
    setIsLoading(false)
  }

  const patch = (type: string, p: Partial<TypeDraft>) =>
    setDrafts((d) => ({ ...d, [type]: { ...d[type], ...p } }))

  const patchField = (type: string, idx: number, p: Partial<FieldDraft>) =>
    setDrafts((d) => {
      const fields = d[type].fields.map((f, i) => (i === idx ? { ...f, ...p } : f))
      return { ...d, [type]: { ...d[type], fields } }
    })

  const addField = (type: string) =>
    setDrafts((d) => ({
      ...d,
      [type]: {
        ...d[type],
        fields: [...d[type].fields, { key: "", label: "", type: "text", required: false, helperText: "", placeholder: "", optionsText: "" }],
      },
    }))

  const removeField = (type: string, idx: number) =>
    setDrafts((d) => ({ ...d, [type]: { ...d[type], fields: d[type].fields.filter((_, i) => i !== idx) } }))

  const moveField = (type: string, idx: number, dir: -1 | 1) =>
    setDrafts((d) => {
      const fields = [...d[type].fields]
      const j = idx + dir
      if (j < 0 || j >= fields.length) return d
      ;[fields[idx], fields[j]] = [fields[j], fields[idx]]
      return { ...d, [type]: { ...d[type], fields } }
    })

  const save = async (type: string) => {
    const draft = drafts[type]

    // Build + validate required_fields.
    const seen = new Set<string>()
    const required_fields = draft.fields.map((f) => {
      const label = f.label.trim()
      const key = (f.key.trim() || slugify(label))
      return { ...f, key, label }
    })
    for (const f of required_fields) {
      if (!f.label) return setMessage({ type: "error", text: "Every field needs a label." })
      if (seen.has(f.key)) return setMessage({ type: "error", text: `Duplicate field key: ${f.key}` })
      seen.add(f.key)
    }

    const payload = {
      is_free: draft.is_free,
      amount: draft.is_free ? 0 : Number(draft.amount) || 0,
      currency: draft.currency || "₦",
      payment_instructions: draft.is_free ? null : draft.payment_instructions || null,
      account_name: draft.is_free ? null : draft.account_name || null,
      account_number: draft.is_free ? null : draft.account_number || null,
      bank_name: draft.is_free ? null : draft.bank_name || null,
      payment_notes: draft.is_free ? null : draft.payment_notes || null,
      allow_attachment: draft.allow_attachment,
      active: draft.active,
      required_fields: required_fields.map((f) => ({
        key: f.key,
        label: f.label,
        type: f.type,
        required: f.required,
        ...(f.helperText.trim() ? { helperText: f.helperText.trim() } : {}),
        ...(f.placeholder.trim() ? { placeholder: f.placeholder.trim() } : {}),
        ...(f.type === "select"
          ? { options: f.optionsText.split(",").map((o) => o.trim()).filter(Boolean) }
          : {}),
      })),
    }

    setSaving(type)
    const { error } = await supabase.from("sacrament_request_types").update(payload).eq("type", type)
    setSaving(null)
    if (error) setMessage({ type: "error", text: error.message })
    else {
      setMessage({ type: "success", text: `Saved. Parishioners see the update after the app re-syncs.` })
      fetchTypes()
    }
  }

  const inputCls = "w-full rounded-md border border-input bg-background px-2 py-1 text-sm"

  return (
    <AdminPage title="Sacrament Config" subtitle="Configure form fields and payment for each request — no code changes needed">
      {message ? (
        <div className={`mb-6 rounded-md px-4 py-3 text-sm ${message.type === "error" ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}>
          {message.text}
        </div>
      ) : null}

      {isLoading ? <AdminPageSkeleton rows={3} /> : null}

      {!isLoading && rows.map((r) => {
        const d = drafts[r.type]
        if (!d) return null
        return (
          <Card key={r.type} className="mb-8">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-semibold">{d.title}</h3>
                  <p className="text-xs text-muted-foreground">{r.type}</p>
                </div>
                <Button size="sm" onClick={() => save(r.type)} disabled={saving === r.type}>
                  {saving === r.type ? "Saving..." : "Save"}
                </Button>
              </div>

              {/* Visibility */}
              <div className="flex gap-6 mb-6 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={d.active} onChange={(e) => patch(r.type, { active: e.target.checked })} />
                  Visible in the app
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={d.allow_attachment} onChange={(e) => patch(r.type, { allow_attachment: e.target.checked })} />
                  Allow supporting information
                </label>
              </div>

              {/* ── Form fields ── */}
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-semibold">Form Fields</h4>
                <Button size="sm" variant="outline" onClick={() => addField(r.type)}>+ Add field</Button>
              </div>
              <div className="space-y-3 mb-8">
                {d.fields.length === 0 ? <p className="text-xs text-muted-foreground">No fields yet.</p> : null}
                {d.fields.map((f, idx) => (
                  <div key={idx} className="rounded-lg border border-border p-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input className={inputCls} placeholder="Label" value={f.label} onChange={(e) => patchField(r.type, idx, { label: e.target.value })} />
                      <input className={inputCls} placeholder="Key (auto from label if blank)" value={f.key} onChange={(e) => patchField(r.type, idx, { key: e.target.value })} />
                      <select className={inputCls} value={f.type} onChange={(e) => patchField(r.type, idx, { type: e.target.value as FieldType })}>
                        {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <input className={inputCls} placeholder="Helper text (optional)" value={f.helperText} onChange={(e) => patchField(r.type, idx, { helperText: e.target.value })} />
                      <input className={inputCls} placeholder="Placeholder (optional)" value={f.placeholder} onChange={(e) => patchField(r.type, idx, { placeholder: e.target.value })} />
                      {f.type === "select" ? (
                        <input className={inputCls} placeholder="Options (comma-separated)" value={f.optionsText} onChange={(e) => patchField(r.type, idx, { optionsText: e.target.value })} />
                      ) : <div />}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={f.required} onChange={(e) => patchField(r.type, idx, { required: e.target.checked })} />
                        Required
                      </label>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => moveField(r.type, idx, -1)} disabled={idx === 0}>↑</Button>
                        <Button size="sm" variant="ghost" onClick={() => moveField(r.type, idx, 1)} disabled={idx === d.fields.length - 1}>↓</Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => removeField(r.type, idx)}>Remove</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Payment ── */}
              <h4 className="text-sm font-semibold mb-2">Payment</h4>
              <label className="flex items-center gap-2 text-sm mb-3">
                <input type="checkbox" checked={d.is_free} onChange={(e) => patch(r.type, { is_free: e.target.checked })} />
                Free of charge
              </label>
              {!d.is_free && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-sm">Amount
                    <input type="number" min={0} className={inputCls} value={d.amount} onChange={(e) => patch(r.type, { amount: e.target.value })} />
                  </label>
                  <label className="text-sm">Currency symbol
                    <input className={inputCls} value={d.currency} onChange={(e) => patch(r.type, { currency: e.target.value })} />
                  </label>
                  <label className="text-sm">Bank name
                    <input className={inputCls} value={d.bank_name} onChange={(e) => patch(r.type, { bank_name: e.target.value })} />
                  </label>
                  <label className="text-sm">Account name
                    <input className={inputCls} value={d.account_name} onChange={(e) => patch(r.type, { account_name: e.target.value })} />
                  </label>
                  <label className="text-sm">Account number
                    <input className={inputCls} value={d.account_number} onChange={(e) => patch(r.type, { account_number: e.target.value })} />
                  </label>
                  <div />
                  <label className="text-sm sm:col-span-2">Payment instructions
                    <textarea rows={2} className={inputCls} value={d.payment_instructions} onChange={(e) => patch(r.type, { payment_instructions: e.target.value })} />
                  </label>
                  <label className="text-sm sm:col-span-2">Additional notes
                    <textarea rows={2} className={inputCls} value={d.payment_notes} onChange={(e) => patch(r.type, { payment_notes: e.target.value })} />
                  </label>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </AdminPage>
  )
}
