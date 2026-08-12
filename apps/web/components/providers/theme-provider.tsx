"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ComponentProps } from "react"

/**
 * Client wrapper so the server root layout can mount next-themes.
 *
 * Deliberately configured as light-only for now (`enableSystem={false}`, `defaultTheme="light"`).
 * The `.dark` token block in globals.css exists but has never been visually verified against the
 * admin screens — enabling system detection here would silently ship an untested dark theme to every
 * administrator whose OS is set to dark. Flipping `enableSystem` on is a one-line change once dark
 * mode has had a design pass.
 */
export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
