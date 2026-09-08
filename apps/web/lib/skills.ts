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
