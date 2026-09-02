const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || null
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") || null

export const siteConfig = {
  name: "Skill Grill",
  operator: "Skill Grill, an independent project built by @yehyal",
  builderHandle: "@yehyal",
  builderUrl: "https://x.com/yehyal",
  contactEmail,
  siteUrl,
  indexable: process.env.NEXT_PUBLIC_INDEXABLE === "true",
  copyright: "© 2026 Skill Grill",
} as const
