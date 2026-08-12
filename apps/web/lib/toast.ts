import { toast } from "sonner"

/**
 * Toast helpers for admin mutations.
 *
 * The point of routing every toast through here is the error path: Supabase and Postgres messages
 * ("new row violates row-level security policy for table \"events\"") leak schema details and mean
 * nothing to a parish administrator. `notifyError` therefore takes a human sentence written by the
 * caller and logs the underlying cause to the console instead of rendering it.
 */

/** Confirms a completed action. Say what happened, in the past tense: "Announcement published". */
export function notifySuccess(message: string, description?: string) {
  toast.success(message, { description })
}

/**
 * Reports a failed action.
 *
 * @param message  What the administrator was trying to do, and that it failed.
 * @param cause    The raw error. Logged, never displayed.
 */
export function notifyError(message: string, cause?: unknown) {
  if (cause) {
    console.error(`[admin] ${message}`, cause)
  }
  toast.error(message, {
    description: "Nothing was changed. Please try again.",
  })
}

/** Neutral acknowledgement — e.g. "Export started". */
export function notifyInfo(message: string, description?: string) {
  toast(message, { description })
}
