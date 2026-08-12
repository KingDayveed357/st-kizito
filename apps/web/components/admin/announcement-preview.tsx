"use client"

import { Clock, Flame, Megaphone } from "lucide-react"
import { buildExcerpt, extractSchedule, normalizeTitle } from "@/lib/parish-content"

interface AnnouncementPreviewProps {
  title: string
  content: string
  type: "liturgical" | "parish" | null
  /** Relative-date label, e.g. "Today". Omitted in the live editor, where nothing is published yet. */
  dateLabel?: string | null
  /** `card` mirrors the app exactly; `inline` is the compact form used in the admin list. */
  variant?: "card" | "inline"
}

const TYPE_META = {
  liturgical: { label: "Liturgical", Icon: Flame },
  parish: { label: "Parish notice", Icon: Megaphone },
}

/**
 * How an announcement will look in the parishioner's app.
 *
 * The portal used to render `announcement.content` raw, so an admin typing in capitals saw capitals
 * and had no idea the app would present it differently — or that the app was stripping their
 * repeated headline. Showing the same normalisation here closes that gap: what the admin approves
 * is what a parishioner gets.
 *
 * Kept in step with `apps/mobile/src/components/parish/AnnouncementCard.tsx`. The hierarchy is the
 * same in both: kind of notice → title → schedule → body.
 */
export function AnnouncementPreview({
  title,
  content,
  type,
  dateLabel,
  variant = "card",
}: AnnouncementPreviewProps) {
  const meta = TYPE_META[type ?? "parish"]
  const displayTitle = normalizeTitle(title)
  const { schedule, rest } = extractSchedule(buildExcerpt(content, title))

  if (variant === "inline") {
    return (
      <div className="space-y-1">
        <p className="font-serif text-base font-semibold leading-snug">{displayTitle || "Untitled"}</p>
        {schedule ? (
          <p className="inline-flex items-center gap-1.5 rounded-md bg-tertiary/10 px-2 py-0.5 text-xs font-medium text-tertiary">
            <Clock className="h-3 w-3" />
            {schedule}
          </p>
        ) : null}
        {rest ? (
          // `line-clamp-2` mirrors the app's `numberOfLines` so the two previews truncate alike.
          <p className="line-clamp-2 whitespace-pre-line text-sm text-foreground/70">{rest}</p>
        ) : null}
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-outline/25 bg-surface-container-lowest p-4">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-tertiary/15 text-tertiary">
          <meta.Icon className="h-3.5 w-3.5" />
        </span>
        <span className="text-xs font-semibold text-foreground/70">{meta.label}</span>
        {dateLabel ? (
          <>
            <span className="h-[3px] w-[3px] rounded-full bg-foreground/40" aria-hidden="true" />
            <span className="text-xs text-foreground/55">{dateLabel}</span>
          </>
        ) : null}
      </div>

      <p className="font-serif text-[17px] font-bold leading-[23px]">
        {displayTitle || <span className="text-foreground/40">Your headline appears here</span>}
      </p>

      {schedule ? (
        <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-[10px] bg-tertiary/10 px-2.5 py-1.5 text-xs font-semibold text-tertiary">
          <Clock className="h-3 w-3" />
          {schedule}
        </p>
      ) : null}

      {rest ? (
        <p className="mt-2.5 whitespace-pre-line text-[13.5px] leading-5 text-foreground/70">{rest}</p>
      ) : null}
    </div>
  )
}
