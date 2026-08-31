"use client"

import { useEffect, useState, type FormEvent } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
} from "@radix-ui/react-icons"
import type { SkillListResponse } from "@skill-grill/shared"

import { SkillCard } from "@/components/skills/skill-card"
import { SkillListSkeleton } from "@/components/skills/skill-list-skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { getApiBaseUrl, getApiError } from "@/lib/api"
import {
  formatTagLabel,
  skillAgentOptions,
  skillTagOptions,
} from "@/lib/skills"
import { PageContainer } from "@/components/page-container"

export function SkillsBrowser() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "")
  const [searchIsDirty, setSearchIsDirty] = useState(false)
  const [result, setResult] = useState<SkillListResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retryToken, setRetryToken] = useState(0)
  const urlKey = searchParams.toString()

  useEffect(() => {
    const controller = new AbortController()
    const query = new URLSearchParams(urlKey)
    const apiBaseUrl = getApiBaseUrl()

    async function loadSkills() {
      setResult(null)
      setError(null)

      if (!apiBaseUrl) {
        setError("Set NEXT_PUBLIC_API_URL to the running Worker API, then try again.")
        return
      }

      try {
        const response = await fetch(`${apiBaseUrl}/api/skills?${query.toString()}`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(await getApiError(response))
        }

        const payload = (await response.json()) as SkillListResponse
        if (!controller.signal.aborted) {
          setResult(payload)
        }
      } catch (loadError) {
        if (controller.signal.aborted) {
          return
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load skills. Please try again."
        )
      }
    }

    void loadSkills()

    return () => controller.abort()
  }, [retryToken, urlKey])

  function updateUrl(updates: Record<string, string | null>) {
    const nextParams = new URLSearchParams(searchParams.toString())

    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        nextParams.set(key, value)
      } else {
        nextParams.delete(key)
      }
    }

    const nextQuery = nextParams.toString()
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false })
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextSearch = searchIsDirty ? search : searchParams.get("q") ?? ""
    updateUrl({ q: nextSearch.trim() || null, page: null })
    setSearchIsDirty(false)
  }

  function clearFilters() {
    setSearch("")
    setSearchIsDirty(false)
    router.replace(pathname, { scroll: false })
  }

  const currentSort = searchParams.get("sort") ?? "popular"
  const currentTag = searchParams.get("tags") ?? "all"
  const currentAgent = searchParams.get("agents") ?? "all"
  const currentPage = Number(searchParams.get("page") ?? "1") || 1
  const hasFilters = Boolean(
    searchParams.get("q") ||
      searchParams.get("tags") ||
      searchParams.get("agents") ||
      currentSort !== "popular"
  )

  return (
    <main id="main-content" className="flex-1">
      <PageContainer className="py-12 sm:py-16 lg:py-20">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-primary">
              Skill directory
            </p>
            <h1 className="mt-4 max-w-[12ch] text-4xl font-semibold tracking-[-0.065em] text-balance sm:text-5xl">
              Find your next useful skill.
            </h1>
          </div>
          <p className="max-w-[34ch] text-sm leading-6 text-muted-foreground md:text-right">
            Browse practical building blocks for agents, ranked by the people trying them.
          </p>
        </div>

        <Separator className="my-10" />

        <section aria-labelledby="discovery-controls" className="rounded-md border border-border bg-card p-4 sm:p-5">
          <h2 id="discovery-controls" className="sr-only">
            Search and filter skills
          </h2>
          <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 sm:flex-row">
            <label className="flex-1">
              <span className="sr-only">Search skills</span>
              <span className="relative block">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  value={searchIsDirty ? search : searchParams.get("q") ?? ""}
                  onChange={(event) => {
                    setSearch(event.target.value)
                    setSearchIsDirty(true)
                  }}
                  placeholder="Search by name, description, or tag"
                  className="pl-9"
                  aria-label="Search by name, description, or tag"
                />
              </span>
            </label>
            <Button type="submit" className="sm:px-5">
              Search
            </Button>
          </form>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <label className="grid gap-2 text-xs font-medium text-foreground">
              <span>Sort by</span>
              <Select value={currentSort} onValueChange={(value) => updateUrl({ sort: value === "popular" ? null : value, page: null })}>
                <SelectTrigger aria-label="Sort skills">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Popular</SelectItem>
                  <SelectItem value="score">Highest score</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                </SelectContent>
              </Select>
            </label>

            <label className="grid gap-2 text-xs font-medium text-foreground">
              <span>Tag</span>
              <Select value={currentTag} onValueChange={(value) => updateUrl({ tags: value === "all" ? null : value, page: null })}>
                <SelectTrigger aria-label="Filter by tag">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tags</SelectItem>
                  {skillTagOptions.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {formatTagLabel(tag)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className="grid gap-2 text-xs font-medium text-foreground">
              <span>Agent</span>
              <Select value={currentAgent} onValueChange={(value) => updateUrl({ agents: value === "all" ? null : value, page: null })}>
                <SelectTrigger aria-label="Filter by agent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All agents</SelectItem>
                  {skillAgentOptions.map((agent) => (
                    <SelectItem key={agent} value={agent}>
                      {agent === "claude-code" ? "Claude Code" : agent === "generic" ? "Any agent" : agent === "codex" ? "Codex" : "Cursor"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          </div>
        </section>

        <div className="mt-10 flex min-h-6 items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {result ? (
              <>
                <span className="font-medium text-foreground">{result.pagination.total}</span>{" "}
                {result.pagination.total === 1 ? "skill" : "skills"} found
              </>
            ) : error ? (
              ""
            ) : (
              "Loading the directory..."
            )}
          </p>
          {hasFilters ? (
            <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          ) : null}
        </div>

        <div className="mt-2">
          {error ? (
            <div className="border-t border-destructive/40 py-10" role="alert">
              <Badge variant="accent">Could not load</Badge>
              <h2 className="mt-4 text-xl font-semibold tracking-[-0.04em]">
                The directory is taking a breather.
              </h2>
              <p className="mt-2 max-w-[42ch] text-sm leading-6 text-muted-foreground">{error}</p>
              <Button type="button" variant="outline" className="mt-6" onClick={() => setRetryToken((token) => token + 1)}>
                Try again
              </Button>
            </div>
          ) : result ? (
            result.data.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2 xl:grid-cols-3">
                  {result.data.map((skill, index) => (
                    <SkillCard key={skill.id} skill={skill} index={(currentPage - 1) * result.pagination.limit + index} />
                  ))}
                </div>
                {result.pagination.totalPages > 1 ? (
                  <nav className="mt-12 flex items-center justify-between border-t border-border pt-5" aria-label="Skill pages">
                    <Button type="button" variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => updateUrl({ page: String(currentPage - 1) })}>
                      <ChevronLeftIcon aria-hidden="true" />
                      Previous
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      Page <span className="font-medium text-foreground">{currentPage}</span> of {result.pagination.totalPages}
                    </span>
                    <Button type="button" variant="outline" size="sm" disabled={currentPage >= result.pagination.totalPages} onClick={() => updateUrl({ page: String(currentPage + 1) })}>
                      Next
                      <ChevronRightIcon aria-hidden="true" />
                    </Button>
                  </nav>
                ) : null}
              </>
            ) : (
              <div className="border-t border-border py-12" role="status">
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">No matches</p>
                <h2 className="mt-4 text-2xl font-semibold tracking-[-0.05em]">Try a wider search.</h2>
                <p className="mt-2 max-w-[42ch] text-sm leading-6 text-muted-foreground">
                  Nothing in the directory matches these filters. Clear them to see all available skills.
                </p>
                <Button type="button" variant="outline" className="mt-6" onClick={clearFilters}>
                  Show all skills
                </Button>
              </div>
            )
          ) : (
            <SkillListSkeleton />
          )}
        </div>

        <div className="mt-16 border-t border-border pt-5">
          <Link href="/" className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
            Back to the home page
          </Link>
        </div>
      </PageContainer>
    </main>
  )
}
