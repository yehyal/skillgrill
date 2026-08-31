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

export const skillAgentOptions = ["codex", "claude-code", "cursor", "generic"] as const

export function formatAgentLabel(agent: string) {
  if (agent === "claude-code") {
    return "Claude Code"
  }

  if (agent === "codex") {
    return "Codex"
  }

  if (agent === "cursor") {
    return "Cursor"
  }

  if (agent === "generic") {
    return "Any agent"
  }

  return agent
}

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
