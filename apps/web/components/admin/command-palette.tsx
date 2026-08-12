"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { ADMIN_NAV_SECTIONS } from "@/components/admin/nav-config"

/**
 * Global command palette (⌘K / Ctrl+K) for the admin portal. Renders its own trigger button (for the
 * navbar) plus the dialog, and jumps to any admin destination by keyboard — a big discoverability win
 * for non-technical parish staff who don't know the URL structure.
 */
export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  const go = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search admin (Command or Control K)"
        className="group flex items-center gap-2 rounded-lg border border-outline/30 bg-surface-container-low/60 px-3 py-2 text-sm text-foreground/50 transition-colors hover:bg-surface-container-low hover:text-foreground/70"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search…</span>
        <kbd className="hidden md:inline rounded border border-outline/40 bg-surface px-1.5 py-0.5 text-[10px] font-medium text-foreground/50">
          ⌘K
        </kbd>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Admin search"
        description="Jump to any section of the parish admin portal."
      >
        <CommandInput placeholder="Search sections and actions…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {ADMIN_NAV_SECTIONS.map((section) => (
            <CommandGroup key={section.title} heading={section.title}>
              {section.items
                .filter((item) => !item.disabled)
                .map((item) => {
                  const Icon = item.icon
                  return (
                    <CommandItem
                      key={item.href}
                      value={`${item.label} ${section.title}`}
                      onSelect={() => go(item.href)}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      <span>{item.label}</span>
                    </CommandItem>
                  )
                })}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  )
}
