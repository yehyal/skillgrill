const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || null
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") || null
const indexable = process.env.NEXT_PUBLIC_INDEXABLE === "true"

if (process.env.NODE_ENV === "production" && !contactEmail) {
  throw new Error("NEXT_PUBLIC_CONTACT_EMAIL is required for production deployments.")
}

export const siteConfig = {
  name: "Skill Grill",
  operator: "Skill Grill, an independent project built by @yehyal",
  builderHandle: "@yehyal",
  builderUrl: "https://x.com/yehyal",
  contactEmail,
  siteUrl,
  indexable,
  copyright: "© 2026 Skill Grill",
} as const
