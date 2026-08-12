/**
 * Display normalisation for admin-authored parish content.
 *
 * This is a deliberate mirror of `apps/mobile/src/utils/parishContent.ts`. There is no shared
 * `packages/` workspace in this repo (see the root CLAUDE.md), so the alternative to duplicating
 * ~80 lines would be inventing a workspace for it. The two copies must be changed together; the
 * mobile file is the reference implementation and carries the fuller commentary.
 *
 * Why the admin needs this at all: the announcement list and the editor preview must show exactly
 * what a parishioner will see. If the portal renders raw ALL-CAPS while the app title-cases it, the
 * admin is writing blind and will never understand why their notices look different on a phone.
 */

const MINOR_WORDS = new Set([
  "a", "an", "and", "as", "at", "but", "by", "for", "from", "in", "nor", "of",
  "on", "or", "the", "to", "up", "via", "with",
])

const KEEP_UPPERCASE = new Set([
  "CWO", "CMO", "CYON", "CYAN", "PPC", "RCIA", "SVP", "CCR", "JDPC", "CMS",
  "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII",
  "RIP", "BVM",
])

const PROPER_NOUNS = new Set([
  "january", "february", "march", "april", "may", "june", "july",
  "august", "september", "october", "november", "december",
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
  "god", "lord", "jesus", "christ", "mary", "holy", "spirit", "father", "son",
  "mass", "masses", "advent", "lent", "easter", "christmas", "pentecost",
  "saint", "st", "church", "parish", "gospel", "bible", "rosary", "angelus",
])

/** True when the text is SHOUTED rather than merely containing capitals. */
export function isShouted(text: string): boolean {
  const letters = text.replace(/[^A-Za-z]/g, "")
  if (letters.length < 8) return false
  const upper = letters.replace(/[^A-Z]/g, "").length
  return upper / letters.length > 0.8
}

function capitalizeWord(word: string, isFirst: boolean, isLast: boolean): string {
  if (!word) return word

  const bare = word.replace(/[^A-Za-z]/g, "")
  if (bare && KEEP_UPPERCASE.has(bare.toUpperCase())) return word.toUpperCase()
  if (/\d/.test(word)) return word.toLowerCase()

  const lower = word.toLowerCase()
  if (!isFirst && !isLast && MINOR_WORDS.has(lower)) return lower

  return lower.replace(/(^|[-–—])([a-z])/g, (_, sep, char) => sep + char.toUpperCase())
}

/** Title-case a shouted heading. Mixed-case input is returned unchanged. */
export function normalizeTitle(raw: string | null | undefined): string {
  const text = (raw ?? "").trim().replace(/\s+/g, " ")
  if (!text || !isShouted(text)) return text

  const words = text.split(" ")
  return words
    .map((word, index) => capitalizeWord(word, index === 0, index === words.length - 1))
    .join(" ")
}

/** Sentence-case a shouted body, keeping months, weekdays and religious terms capitalised. */
export function normalizeBody(raw: string | null | undefined): string {
  const text = (raw ?? "").trim()
  if (!text || !isShouted(text)) return text.replace(/[ \t]+/g, " ")

  return text
    .split(/\n/)
    .map((line) => {
      const trimmed = line.trim().replace(/[ \t]+/g, " ")
      if (!trimmed) return ""

      const lowered = trimmed
        .split(" ")
        .map((word) => {
          const bare = word.replace(/[^A-Za-z]/g, "")
          if (bare && KEEP_UPPERCASE.has(bare.toUpperCase())) return word.toUpperCase()

          const low = word.toLowerCase()
          if (bare && PROPER_NOUNS.has(bare.toLowerCase())) {
            return low.replace(/[a-z]/, (char) => char.toUpperCase())
          }
          return low
        })
        .join(" ")

      return lowered.replace(/(^|[.!?]\s+)([a-z])/g, (_, prefix, char) => prefix + char.toUpperCase())
    })
    .join("\n")
}

/** Body with a repeated title stripped from the front. Empty when the body is only the title. */
export function buildExcerpt(
  body: string | null | undefined,
  title: string | null | undefined
): string {
  const normalizedBody = normalizeBody(body)
  if (!normalizedBody) return ""

  const compare = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "")
  const titleKey = compare(title ?? "")
  if (!titleKey) return normalizedBody

  const lines = normalizedBody.split("\n")
  while (lines.length > 0) {
    const first = lines[0].trim()
    if (first === "" || compare(first) === titleKey) {
      lines.shift()
      continue
    }
    break
  }

  return lines.join("\n").trim()
}

/** Lifts a "Masses: 6.00 am" style line out of the body so it can be shown as its own detail. */
export function extractSchedule(body: string): { schedule: string | null; rest: string } {
  const lines = body.split("\n")
  const index = lines.findIndex((line) => /^\s*(masses?|time|times|venue|location)\s*[:\-]/i.test(line))
  if (index === -1) return { schedule: null, rest: body }

  const schedule = lines[index].replace(/^\s*[^:\-]+[:\-]\s*/, "").trim()
  const rest = lines.filter((_, i) => i !== index).join("\n").trim()
  return { schedule: schedule || null, rest }
}
