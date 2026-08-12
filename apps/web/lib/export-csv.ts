/**
 * Client-side CSV export for admin list pages. Generates from already-fetched rows (no extra query),
 * quotes safely (commas, quotes, newlines), prepends a BOM so Excel reads UTF-8 (₦, accents), and
 * triggers a download named with an ISO date.
 */
export interface CsvColumn<T> {
  /** Header label in the exported file. */
  label: string
  /** Value accessor for a row. */
  value: (row: T) => string | number | boolean | null | undefined
}

const escapeCell = (input: string | number | boolean | null | undefined): string => {
  if (input === null || input === undefined) return ""
  const str = String(input)
  return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => escapeCell(c.label)).join(",")
  const body = rows.map((row) => columns.map((c) => escapeCell(c.value(row))).join(",")).join("\r\n")
  return `${header}\r\n${body}`
}

export function downloadCsv<T>(baseName: string, rows: T[], columns: CsvColumn<T>[]): void {
  if (typeof window === "undefined") return
  const csv = toCsv(rows, columns)
  // BOM so Excel detects UTF-8.
  const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const date = new Date().toISOString().slice(0, 10)
  const link = document.createElement("a")
  link.href = url
  link.download = `${baseName}-${date}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
