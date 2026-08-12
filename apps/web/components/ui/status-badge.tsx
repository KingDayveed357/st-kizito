import { cn } from "@/lib/utils"

/**
 * Every status string used anywhere in the admin, mapped to one of five meanings and a label.
 *
 * Before this, five pages each invented their own status colours with raw Tailwind — `bg-green-600/10`
 * on announcements, `text-emerald-500` in the sidebar, `text-amber-500` elsewhere — so "approved" was
 * a different green depending on which page you were looking at. Adding a status now means adding a
 * row here, not picking a colour.
 */
const STATUS_MAP = {
  // Review outcomes — bookings, donations, sacrament requests
  pending: { tone: "attention", label: "Pending" },
  approved: { tone: "positive", label: "Approved" },
  verified: { tone: "positive", label: "Verified" },
  rejected: { tone: "critical", label: "Rejected" },
  needs_info: { tone: "info", label: "Needs info" },

  // Content lifecycle — announcements, events, galleries
  draft: { tone: "neutral", label: "Draft" },
  scheduled: { tone: "attention", label: "Scheduled" },
  published: { tone: "positive", label: "Published" },
  expired: { tone: "critical", label: "Expired" },
  archived: { tone: "neutral", label: "Archived" },

  // Availability — mass times, contacts
  active: { tone: "positive", label: "Active" },
  inactive: { tone: "neutral", label: "Inactive" },
} as const

export type StatusKey = keyof typeof STATUS_MAP

const TONE_CLASSES = {
  positive: "bg-status-positive-bg text-status-positive-fg",
  attention: "bg-status-attention-bg text-status-attention-fg",
  critical: "bg-status-critical-bg text-status-critical-fg",
  neutral: "bg-status-neutral-bg text-status-neutral-fg",
  info: "bg-status-info-bg text-status-info-fg",
} as const

interface StatusBadgeProps {
  status: string
  /** Override the default label, e.g. "Awaiting verification" instead of "Pending". */
  label?: string
  className?: string
}

/** Normalises `"Approved"`, `"APPROVED"` and `"needs info"` to the same key. */
const normalise = (status: string) => status.trim().toLowerCase().replace(/[\s-]+/g, "_")

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const key = normalise(status) as StatusKey
  const entry = STATUS_MAP[key]

  // An unmapped status renders neutrally with the raw value rather than throwing — a status added in
  // the database before it is added here should look unstyled, not crash the page.
  const tone = entry?.tone ?? "neutral"
  const text = label ?? entry?.label ?? status

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5",
        "text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap",
        TONE_CLASSES[tone],
        className
      )}
    >
      {text}
    </span>
  )
}
