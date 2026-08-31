import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"

import { skills } from "./schema"

type SeedSkill = {
  slug: string
  name: string
  description: string
  sourceUrl: string
  installCommand: string
  docsUrl: string
  tags: string[]
  supportedAgents: string[]
}

export const seedSkills: SeedSkill[] = [
  {
    slug: "pdf-compass",
    name: "PDF Compass",
    description: "Helps agents inspect, summarize, and assemble PDF documents.",
    sourceUrl: "https://local.skill-grill.invalid/pdf-compass",
    installCommand: "skills install local/pdf-compass",
    docsUrl: "https://local.skill-grill.invalid/pdf-compass/docs",
    tags: ["pdf", "documents"],
    supportedAgents: ["codex", "generic"],
  },
  {
    slug: "doc-threader",
    name: "Doc Threader",
    description: "Turns scattered notes into clear, traceable document drafts.",
    sourceUrl: "https://local.skill-grill.invalid/doc-threader",
    installCommand: "skills install local/doc-threader",
    docsUrl: "https://local.skill-grill.invalid/doc-threader/docs",
    tags: ["documents", "writing"],
    supportedAgents: ["claude-code", "generic"],
  },
  {
    slug: "sheet-signal",
    name: "Sheet Signal",
    description: "Surfaces patterns, outliers, and useful summaries from spreadsheets.",
    sourceUrl: "https://local.skill-grill.invalid/sheet-signal",
    installCommand: "skills install local/sheet-signal",
    docsUrl: "https://local.skill-grill.invalid/sheet-signal/docs",
    tags: ["spreadsheets", "data-analysis"],
    supportedAgents: ["codex", "cursor"],
  },
  {
    slug: "deck-loom",
    name: "Deck Loom",
    description: "Weaves raw research into a focused presentation outline.",
    sourceUrl: "https://local.skill-grill.invalid/deck-loom",
    installCommand: "skills install local/deck-loom",
    docsUrl: "https://local.skill-grill.invalid/deck-loom/docs",
    tags: ["slides", "writing"],
    supportedAgents: ["codex", "generic"],
  },
  {
    slug: "review-lens",
    name: "Review Lens",
    description: "Gives code reviews a consistent pass for correctness and clarity.",
    sourceUrl: "https://local.skill-grill.invalid/review-lens",
    installCommand: "skills install local/review-lens",
    docsUrl: "https://local.skill-grill.invalid/review-lens/docs",
    tags: ["code-review", "testing"],
    supportedAgents: ["codex", "claude-code", "cursor"],
  },
  {
    slug: "layout-forge",
    name: "Layout Forge",
    description: "Builds responsive interface directions from a compact product brief.",
    sourceUrl: "https://local.skill-grill.invalid/layout-forge",
    installCommand: "skills install local/layout-forge",
    docsUrl: "https://local.skill-grill.invalid/layout-forge/docs",
    tags: ["frontend", "design"],
    supportedAgents: ["claude-code", "cursor"],
  },
  {
    slug: "route-radar",
    name: "Route Radar",
    description: "Maps Next.js routes, loading states, and edge-case navigation paths.",
    sourceUrl: "https://local.skill-grill.invalid/route-radar",
    installCommand: "skills install local/route-radar",
    docsUrl: "https://local.skill-grill.invalid/route-radar/docs",
    tags: ["nextjs", "frontend"],
    supportedAgents: ["codex", "cursor"],
  },
  {
    slug: "test-weaver",
    name: "Test Weaver",
    description: "Suggests focused test cases for new behavior and risky regressions.",
    sourceUrl: "https://local.skill-grill.invalid/test-weaver",
    installCommand: "skills install local/test-weaver",
    docsUrl: "https://local.skill-grill.invalid/test-weaver/docs",
    tags: ["testing", "code-review"],
    supportedAgents: ["codex", "generic"],
  },
  {
    slug: "signal-scout",
    name: "Signal Scout",
    description: "Finds the strongest evidence in a messy research question.",
    sourceUrl: "https://local.skill-grill.invalid/signal-scout",
    installCommand: "skills install local/signal-scout",
    docsUrl: "https://local.skill-grill.invalid/signal-scout/docs",
    tags: ["research", "data-analysis"],
    supportedAgents: ["claude-code", "generic"],
  },
  {
    slug: "repo-needle",
    name: "Repo Needle",
    description: "Locates the files and ownership context needed for a GitHub task.",
    sourceUrl: "https://local.skill-grill.invalid/repo-needle",
    installCommand: "skills install local/repo-needle",
    docsUrl: "https://local.skill-grill.invalid/repo-needle/docs",
    tags: ["github", "devops"],
    supportedAgents: ["codex", "claude-code"],
  },
  {
    slug: "preview-pilot",
    name: "Preview Pilot",
    description: "Keeps Vercel preview checks focused on the changes that matter.",
    sourceUrl: "https://local.skill-grill.invalid/preview-pilot",
    installCommand: "skills install local/preview-pilot",
    docsUrl: "https://local.skill-grill.invalid/preview-pilot/docs",
    tags: ["vercel", "devops"],
    supportedAgents: ["cursor", "generic"],
  },
  {
    slug: "row-keeper",
    name: "Row Keeper",
    description: "Explains Supabase data changes while protecting schema assumptions.",
    sourceUrl: "https://local.skill-grill.invalid/row-keeper",
    installCommand: "skills install local/row-keeper",
    docsUrl: "https://local.skill-grill.invalid/row-keeper/docs",
    tags: ["supabase", "data-analysis"],
    supportedAgents: ["codex", "generic"],
  },
  {
    slug: "canvas-cue",
    name: "Canvas Cue",
    description: "Translates a visual reference into practical interface checkpoints.",
    sourceUrl: "https://local.skill-grill.invalid/canvas-cue",
    installCommand: "skills install local/canvas-cue",
    docsUrl: "https://local.skill-grill.invalid/canvas-cue/docs",
    tags: ["design", "figma"],
    supportedAgents: ["claude-code", "cursor"],
  },
  {
    slug: "flow-switch",
    name: "Flow Switch",
    description: "Breaks repeated operational work into small, composable automations.",
    sourceUrl: "https://local.skill-grill.invalid/flow-switch",
    installCommand: "skills install local/flow-switch",
    docsUrl: "https://local.skill-grill.invalid/flow-switch/docs",
    tags: ["automation", "devops"],
    supportedAgents: ["codex", "generic"],
  },
  {
    slug: "plainspoken",
    name: "Plainspoken",
    description: "Tightens technical copy without sanding off useful specificity.",
    sourceUrl: "https://local.skill-grill.invalid/plainspoken",
    installCommand: "skills install local/plainspoken",
    docsUrl: "https://local.skill-grill.invalid/plainspoken/docs",
    tags: ["writing", "prompting"],
    supportedAgents: ["claude-code", "generic"],
  },
  {
    slug: "threat-sketch",
    name: "Threat Sketch",
    description: "Turns a feature description into a short, actionable security review.",
    sourceUrl: "https://local.skill-grill.invalid/threat-sketch",
    installCommand: "skills install local/threat-sketch",
    docsUrl: "https://local.skill-grill.invalid/threat-sketch/docs",
    tags: ["security", "code-review"],
    supportedAgents: ["codex", "claude-code"],
  },
  {
    slug: "stacksmith",
    name: "Stacksmith",
    description: "Assembles a grounded implementation plan from existing project patterns.",
    sourceUrl: "https://local.skill-grill.invalid/stacksmith",
    installCommand: "skills install local/stacksmith",
    docsUrl: "https://local.skill-grill.invalid/stacksmith/docs",
    tags: ["prompting", "frontend"],
    supportedAgents: ["codex", "generic"],
  },
  {
    slug: "query-garden",
    name: "Query Garden",
    description: "Suggests small, readable query improvements for growing data features.",
    sourceUrl: "https://local.skill-grill.invalid/query-garden",
    installCommand: "skills install local/query-garden",
    docsUrl: "https://local.skill-grill.invalid/query-garden/docs",
    tags: ["supabase", "testing"],
    supportedAgents: ["codex", "cursor"],
  },
  {
    slug: "brief-bloom",
    name: "Brief Bloom",
    description: "Expands a rough idea into a clear brief with useful decision points.",
    sourceUrl: "https://local.skill-grill.invalid/brief-bloom",
    installCommand: "skills install local/brief-bloom",
    docsUrl: "https://local.skill-grill.invalid/brief-bloom/docs",
    tags: ["writing", "research"],
    supportedAgents: ["claude-code", "generic"],
  },
  {
    slug: "signal-check",
    name: "Signal Check",
    description: "Audits release notes and task lists for missing operational details.",
    sourceUrl: "https://local.skill-grill.invalid/signal-check",
    installCommand: "skills install local/signal-check",
    docsUrl: "https://local.skill-grill.invalid/signal-check/docs",
    tags: ["devops", "testing"],
    supportedAgents: ["codex", "generic"],
  },
]

async function seed() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to seed the database.")
  }

  const client = postgres(databaseUrl, { prepare: false, max: 1 })
  const db = drizzle(client)

  try {
    for (const skill of seedSkills) {
      await db
        .insert(skills)
        .values({
          id: `local/${skill.slug}`,
          source: "local",
          slug: skill.slug,
          name: skill.name,
          description: skill.description,
          sourceUrl: skill.sourceUrl,
          installCommand: skill.installCommand,
          docsUrl: skill.docsUrl,
          tags: skill.tags,
          supportedAgents: skill.supportedAgents,
        })
        .onConflictDoUpdate({
          target: skills.slug,
          set: {
            name: skill.name,
            description: skill.description,
            sourceUrl: skill.sourceUrl,
            installCommand: skill.installCommand,
            docsUrl: skill.docsUrl,
            tags: skill.tags,
            supportedAgents: skill.supportedAgents,
            updatedAt: new Date(),
          },
        })
    }
  } finally {
    await client.end()
  }

  console.log(`Seeded ${seedSkills.length} local skills.`)
}

await seed()
