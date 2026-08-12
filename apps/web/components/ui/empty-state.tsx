import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  /** A lucide icon element, e.g. `<CalendarDays className="h-6 w-6" />`. */
  icon?: ReactNode
  /** What is absent, stated plainly: "No upcoming events". */
  title: string
  /**
   * Why it matters and what to do next — this is the part the old empty states were missing.
   * "No requests found" told an administrator nothing.
   */
  description: string
  /** The primary action that resolves the emptiness, e.g. a "Create event" button. */
  action?: ReactNode
  className?: string
}

/**
 * The shared empty state.
 *
 * Every empty state in the admin previously dead-ended ("No requests found", "No events scheduled") —
 * a sentence with no explanation and no way forward. The contract here is that an empty state must
 * always say what is missing, why that matters, and offer the action that fixes it where one exists.
 */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-outline/30",
        "bg-surface-container-lowest px-6 py-14 text-center",
        className
      )}
    >
      {icon ? (
        <div
          className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container-low text-foreground/50"
          aria-hidden="true"
        >
          {icon}
        </div>
      ) : null}

      <h3 className="font-serif text-lg font-semibold text-foreground">{title}</h3>

      <p className="mt-2 max-w-sm text-sm leading-relaxed text-foreground/65">{description}</p>

      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}
