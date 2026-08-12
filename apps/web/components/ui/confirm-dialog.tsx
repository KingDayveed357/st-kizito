"use client"

import * as React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** What is about to happen, e.g. "Delete this event?" */
  title: string
  /**
   * The consequence, in plain language. Name the record — "Community Week will be removed from the
   * parish app" beats "This action cannot be undone".
   */
  description: React.ReactNode
  /** Label for the button that performs the action. Say the verb: "Delete event", not "OK". */
  confirmLabel: string
  cancelLabel?: string
  /** Destructive actions get the error styling. Default true, since that is what this is usually for. */
  destructive?: boolean
  isPending?: boolean
  onConfirm: () => void | Promise<void>
}

/**
 * Replaces the native `confirm()` calls that were scattered across the admin pages.
 *
 * Two things the browser dialog could not do: it could not name the record being destroyed (so an
 * administrator confirmed "Are you sure?" with no idea which row they had clicked), and it could not
 * show pending state while the delete was in flight. Built on Radix alert-dialog, so focus is trapped
 * and returned, Escape cancels, and the confirm button is not the default focus target.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive = true,
  isPending = false,
  onConfirm,
}: ConfirmDialogProps) {
  const handleConfirm = async (event: React.MouseEvent) => {
    // Keep the dialog mounted while the mutation runs so the pending state is visible.
    event.preventDefault()
    await onConfirm()
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {/*
        Radix's default open-focus behaviour is left alone deliberately: it moves focus into the
        dialog and traps it there. Cancel precedes the destructive action in DOM order, so it is the
        first thing Tab reaches and a stray Enter cannot delete a record.
      */}
      <AlertDialogContent className="bg-surface-container-lowest border-outline/25">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-serif text-xl">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-foreground/70">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className={cn(
              destructive && "bg-error text-on-error hover:bg-error/90 focus-visible:ring-error"
            )}
          >
            {isPending ? "Working…" : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
