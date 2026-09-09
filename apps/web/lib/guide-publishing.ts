import "server-only"

import matter from "gray-matter"
import { cache } from "react"
import { z } from "zod"
import { readdir, readFile } from "node:fs/promises"
import path from "node:path"

import { getPublishedSkillCatalog } from "@/lib/skill-publishing"

export type GuideAuthor = {
  name: string
  url: string
}

export type GuideMetadata = {
  slug: string
  title: string
  description: string
  publishedAt: string
  updatedAt: string
  category: string
  tags: string[]
  author: GuideAuthor
  draft: boolean
  relatedSkills: string[]
}

export type Guide = GuideMetadata & {
  content: string
}

export type PublishedGuideSitemapEntry = {
  slug: string
  lastModified: string
}

const GUIDE_DIRECTORY = path.join(process.cwd(), "content", "guides")

const guideDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "must use YYYY-MM-DD")
  .refine((value) => isRealDate(value), "must be a real calendar date")

const guideFrontmatterSchema = z
  .object({
    title: z.string().trim().min(1).max(70),
    description: z.string().trim().min(1).max(160),
    publishedAt: guideDateSchema,
    updatedAt: guideDateSchema,
    category: z.string().trim().min(1).max(80),
    tags: z.array(z.string().trim().min(1).max(50)).min(1),
    author: z
      .object({
        name: z.string().trim().min(1).max(100),
        url: z
          .string()
          .trim()
          .url()
          .refine(isHttpUrl, "must be an HTTP(S) profile URL"),
      })
      .strict(),
    draft: z.boolean().default(false),
    relatedSkills: z.array(z.string().trim().min(1).max(200)).default([]),
  })
  .strict()
  .superRefine((value, context) => {
    if (new Set(value.tags).size !== value.tags.length) {
      context.addIssue({
        code: "custom",
        path: ["tags"],
        message: "must contain unique values",
      })
    }

    if (new Set(value.relatedSkills).size !== value.relatedSkills.length) {
      context.addIssue({
        code: "custom",
        path: ["relatedSkills"],
        message: "must contain unique values",
      })
    }

    if (value.updatedAt < value.publishedAt) {
      context.addIssue({
        code: "custom",
        path: ["updatedAt"],
        message: "must not be earlier than publishedAt",
      })
    }
  })

const loadGuideFiles = cache(async (): Promise<Guide[]> => {
  let entries

  try {
    entries = await readdir(GUIDE_DIRECTORY, { withFileTypes: true })
  } catch (error) {
    if (isMissingFileError(error)) {
      return []
    }

    throw error
  }

  const guideEntries = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .sort((left, right) => left.name.localeCompare(right.name))

  const seenSlugs = new Set<string>()
  const guides = await Promise.all(
    guideEntries.map(async (entry) => {
      const slug = path.basename(entry.name, ".md")

      if (!slug || seenSlugs.has(slug)) {
        throw new Error(`Guide files contain the duplicate slug ${slug || entry.name}.`)
      }

      seenSlugs.add(slug)
      return parseGuide(await readFile(path.join(GUIDE_DIRECTORY, entry.name), "utf8"), slug)
    })
  )

  return guides
    .filter((guide) => !guide.draft)
    .sort((left, right) => {
      const publishedOrder = right.publishedAt.localeCompare(left.publishedAt)

      if (publishedOrder !== 0) {
        return publishedOrder
      }

      return left.slug.localeCompare(right.slug)
    })
})

export async function getPublishedGuideSummaries(options?: { required?: boolean }) {
  const guides = await getPublishedGuides(options)
  return guides.map(({ content, ...summary }) => {
    void content
    return summary
  })
}

export async function getPublishedGuides(options?: { required?: boolean }) {
  const guides = await loadGuideFiles()

  if (options?.required) {
    await validateRelatedSkills(guides)
  }

  return guides
}

export async function getPublishedGuide(
  slug: string,
  options?: { required?: boolean }
) {
  const guide = (await getPublishedGuides(options)).find((entry) => entry.slug === slug)
  return guide ?? null
}

export async function getPublishedGuideSitemapEntries(options?: { required?: boolean }) {
  const guides = await getPublishedGuides(options)
  return guides.map<PublishedGuideSitemapEntry>((guide) => ({
    slug: guide.slug,
    lastModified: guide.updatedAt,
  }))
}

export function formatGuideDate(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)))
}

async function validateRelatedSkills(guides: Guide[]) {
  const relatedSlugs = guides.flatMap((guide) => guide.relatedSkills)

  if (relatedSlugs.length === 0) {
    return
  }

  const catalog = await getPublishedSkillCatalog({ required: true })
  const catalogSlugs = new Set(catalog.map((skill) => skill.slug))

  for (const guide of guides) {
    for (const relatedSkill of guide.relatedSkills) {
      if (!catalogSlugs.has(relatedSkill)) {
        throw new Error(
          `Guide ${guide.slug} references the unpublished skill ${relatedSkill}.`
        )
      }
    }
  }
}

function parseGuide(contents: string, slug: string): Guide {
  let parsed

  try {
    parsed = matter(contents)
  } catch (error) {
    throw new Error(`Guide ${slug} has invalid frontmatter: ${getErrorMessage(error)}`)
  }

  const metadata = guideFrontmatterSchema.safeParse(parsed.data)

  if (!metadata.success) {
    const details = metadata.error.issues
      .map((issue) => `${issue.path.join(".") || "metadata"}: ${issue.message}`)
      .join("; ")
    throw new Error(`Guide ${slug} has invalid metadata: ${details}`)
  }

  if (!parsed.content.trim()) {
    throw new Error(`Guide ${slug} has an empty article body.`)
  }

  return {
    slug,
    ...metadata.data,
    content: parsed.content,
  }
}

function isRealDate(value: string) {
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

function isMissingFileError(error: unknown): error is NodeJS.ErrnoException {
  return isRecord(error) && error.code === "ENOENT"
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "the frontmatter could not be parsed"
}
