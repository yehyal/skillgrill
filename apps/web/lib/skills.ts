export const skillTagOptions = [
  "pdf",
  "documents",
  "spreadsheets",
  "data-analysis",
  "slides",
  "code-review",
  "frontend",
  "design",
  "nextjs",
  "testing",
  "research",
  "github",
  "vercel",
  "supabase",
  "figma",
  "automation",
  "writing",
  "security",
  "devops",
  "prompting",
] as const

export function formatTagLabel(tag: string) {
  return tag.replace(/-/g, " ")
}

export function formatSkillDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

const compactCountFormatter = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
})

const exactCountFormatter = new Intl.NumberFormat("en-US")

export function formatCompactCount(value: number) {
  return compactCountFormatter.format(value)
}

export function formatExactCount(value: number) {
  return exactCountFormatter.format(value)
}

export function formatSkillDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export type CatalogFreshnessState = "recent" | "aging" | "stale" | "unknown"

export function getCatalogFreshness(
  checkedAt: string | null,
  now = Date.now(),
): { state: CatalogFreshnessState; ageDays: number | null } {
  if (!checkedAt) {
    return { state: "unknown", ageDays: null }
  }

  const timestamp = Date.parse(checkedAt)

  if (Number.isNaN(timestamp)) {
    return { state: "unknown", ageDays: null }
  }

  const ageDays = Math.max(0, Math.ceil((now - timestamp) / 86_400_000))

  if (ageDays <= 8) {
    return { state: "recent", ageDays }
  }

  if (ageDays <= 30) {
    return { state: "aging", ageDays }
  }

  return { state: "stale", ageDays }
}

export function isCatalogStale(checkedAt: string | null, now = Date.now()) {
  return getCatalogFreshness(checkedAt, now).state === "stale"
}
