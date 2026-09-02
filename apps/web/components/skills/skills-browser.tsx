"use client"

import { useMemo, useState, useSyncExternalStore, type FormEvent } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DashboardIcon,
  MagnifyingGlassIcon,
  RowsIcon,
} from "@radix-ui/react-icons"
import type { SkillListQuery, SkillSort } from "@skill-grill/shared"

import { PageContainer } from "@/components/page-container"
import { SkillCard } from "@/components/skills/skill-card"
import { SkillListRow } from "@/components/skills/skill-list-row"
import { SkillListSkeleton } from "@/components/skills/skill-list-skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  formatAgentLabel,
  formatTagLabel,
  skillAgentOptions,
  skillTagOptions,
} from "@/lib/skills"
import { useSkillListQuery } from "@/lib/skill-queries"

const DIRECTORY_VIEW_KEY = "skill-grill:directory-view"
const DIRECTORY_VIEW_EVENT = "skill-grill:directory-view-change"
type DirectoryView = "list" | "card"

export function SkillsBrowser() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "")
  const [searchIsDirty, setSearchIsDirty] = useState(false)
  const view = useSyncExternalStore(subscribeToDirectoryView, getDirectoryView, getServerDirectoryView)
  const urlKey = searchParams.toString()
  const query = useMemo<SkillListQuery>(() => {
    const params = new URLSearchParams(urlKey)
    const rawPage = Number(params.get("page") ?? "1")
    const sort: SkillSort = params.get("sort") === "trending" ? "trending" : "popular"

    return {
      q: params.get("q")?.trim() || undefined,
      sort,
      tags: params.get("tags")?.split(",").filter(Boolean) ?? [],
      agents: params.get("agents")?.split(",").filter(Boolean) ?? [],
      page: Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1,
      limit: 12,
    }
  }, [urlKey])
  const listQuery = useSkillListQuery(query)
  const result = listQuery.data
  const error = listQuery.error instanceof Error ? listQuery.error.message : null

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

  function rankingHref(sort: "popular" | "trending") {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("page")

    if (sort === "popular") {
      params.delete("sort")
    } else {
      params.set("sort", sort)
    }

    const nextQuery = params.toString()
    return nextQuery ? `${pathname}?${nextQuery}` : pathname
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

  const currentSort = query.sort
  const currentTag = query.tags[0] ?? "all"
  const currentAgent = query.agents[0] ?? "all"
  const currentPage = query.page
  const hasFilters = Boolean(
    query.q ||
      query.tags.length > 0 ||
      query.agents.length > 0 ||
      currentSort === "trending"
  )

  return (
    <main id="main-content" className="flex-1">
      <PageContainer className="py-8 sm:py-10 lg:py-12">
        <div className="flex flex-col gap-3 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
          <div>
            <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-primary">
              Skill directory
            </p>
            <h1 className="mt-3 max-w-[18ch] text-3xl font-semibold leading-none text-balance sm:text-4xl">
              Find a skill for the next task.
            </h1>
          </div>
          <p className="max-w-[38ch] text-sm leading-6 text-muted-foreground sm:text-right">
            See the votes and firsthand feedback before you install.
          </p>
        </div>

        <div className="mt-6 border-b border-border">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <nav aria-label="Skill ranking" role="tablist" className="flex gap-5">
              <Link
                href={rankingHref("popular")}
                role="tab"
                aria-selected={currentSort === "popular"}
                className={`border-b-2 px-0.5 pb-3 text-sm font-medium outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 ${currentSort === "popular" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"}`}
              >
                All Time
              </Link>
              <Link
                href={rankingHref("trending")}
                role="tab"
                aria-selected={currentSort === "trending"}
                className={`border-b-2 px-0.5 pb-3 text-sm font-medium outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 ${currentSort === "trending" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"}`}
              >
                Trending <span className="font-mono text-[0.6875rem]">7d</span>
              </Link>
            </nav>

            <div className="flex items-center gap-2 pb-2 sm:pb-3" role="group" aria-label="Directory view">
              <span className="mr-1 text-xs text-muted-foreground">View</span>
              <Button
                type="button"
                size="icon"
                variant={view === "list" ? "secondary" : "ghost"}
                aria-pressed={view === "list"}
                aria-label="List view"
                title="List view"
                onClick={() => setDirectoryView("list")}
              >
                <RowsIcon aria-hidden="true" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant={view === "card" ? "secondary" : "ghost"}
                aria-pressed={view === "card"}
                aria-label="Card view"
                title="Card view"
                onClick={() => setDirectoryView("card")}
              >
                <DashboardIcon aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>

        <section aria-labelledby="discovery-controls" className="border-b border-border py-5">
          <h2 id="discovery-controls" className="sr-only">
            Search and filter skills
          </h2>
          <form onSubmit={handleSearchSubmit} className="flex flex-col gap-2 sm:flex-row">
            <label className="min-w-0 flex-1">
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
            <Button type="submit" className="w-full sm:w-auto sm:px-5">
              Search
            </Button>
          </form>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="grid min-w-0 gap-2 text-xs font-medium text-foreground">
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

            <label className="grid min-w-0 gap-2 text-xs font-medium text-foreground">
              <span>Agent</span>
              <Select value={currentAgent} onValueChange={(value) => updateUrl({ agents: value === "all" ? null : value, page: null })}>
                <SelectTrigger aria-label="Filter by agent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All agents</SelectItem>
                  {skillAgentOptions.map((agent) => (
                    <SelectItem key={agent} value={agent}>
                      {formatAgentLabel(agent)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          </div>
        </section>

        <div className="mt-5 flex min-h-8 items-center justify-between gap-3">
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

        <div className="mt-2" aria-busy={listQuery.isFetching}>
          {error ? (
            <div className="border-t border-destructive/40 py-10" role="alert">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-destructive">Could not load</p>
              <h2 className="mt-3 text-xl font-semibold">The directory is taking a breather.</h2>
              <p className="mt-2 max-w-[46ch] text-sm leading-6 text-muted-foreground">{error}</p>
              <Button type="button" variant="outline" className="mt-5" onClick={() => void listQuery.refetch()}>
                Try again
              </Button>
            </div>
          ) : result ? (
            result.data.length > 0 ? (
              view === "list" ? (
                <div className="border-t border-border">
                  {result.data.map((skill, index) => (
                    <SkillListRow
                      key={skill.id}
                      skill={skill}
                      rank={(currentPage - 1) * result.pagination.limit + index + 1}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
                  {result.data.map((skill, index) => (
                    <SkillCard
                      key={skill.id}
                      skill={skill}
                      index={(currentPage - 1) * result.pagination.limit + index}
                    />
                  ))}
                </div>
              )
            ) : (
              <div className="border-t border-border py-12" role="status">
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-primary">
                  {currentSort === "trending" ? "No movement yet" : "No matches"}
                </p>
                <h2 className="mt-3 text-2xl font-semibold">
                  {currentSort === "trending" ? "Trending is quiet for now." : "Try a wider search."}
                </h2>
                <p className="mt-2 max-w-[42ch] text-sm leading-6 text-muted-foreground">
                  {currentSort === "trending"
                    ? "The seven-day list fills after ratings change. Check All Time for the full directory meanwhile."
                    : "Nothing in the directory matches these filters. Clear them to see all available skills."}
                </p>
                <Button type="button" variant="outline" className="mt-5" onClick={clearFilters}>
                  Show all skills
                </Button>
              </div>
            )
          ) : (
            <SkillListSkeleton view={view} />
          )}
        </div>

        {result && result.pagination.totalPages > 1 ? (
          <nav className="mt-8 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-t border-border pt-5 sm:gap-4" aria-label="Skill pages">
            <Button type="button" variant="outline" size="sm" aria-label="Go to previous skill page" disabled={currentPage <= 1} onClick={() => updateUrl({ page: String(currentPage - 1) })}>
              <ChevronLeftIcon aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">Previous</span>
            </Button>
            <span className="min-w-0 text-center text-xs text-muted-foreground">
              Page <span className="font-medium text-foreground">{currentPage}</span> of {result.pagination.totalPages}
            </span>
            <Button type="button" variant="outline" size="sm" aria-label="Go to next skill page" disabled={currentPage >= result.pagination.totalPages} onClick={() => updateUrl({ page: String(currentPage + 1) })}>
              <span className="sr-only sm:not-sr-only">Next</span>
              <ChevronRightIcon aria-hidden="true" />
            </Button>
          </nav>
        ) : null}
      </PageContainer>
    </main>
  )
}

function subscribeToDirectoryView(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange)
  window.addEventListener(DIRECTORY_VIEW_EVENT, onStoreChange)

  return () => {
    window.removeEventListener("storage", onStoreChange)
    window.removeEventListener(DIRECTORY_VIEW_EVENT, onStoreChange)
  }
}

function getDirectoryView(): DirectoryView {
  try {
    const storedView = window.localStorage.getItem(DIRECTORY_VIEW_KEY)
    return storedView === "card" ? "card" : "list"
  } catch {
    return "list"
  }
}

function getServerDirectoryView(): DirectoryView {
  return "list"
}

function setDirectoryView(nextView: DirectoryView) {
  try {
    window.localStorage.setItem(DIRECTORY_VIEW_KEY, nextView)
  } catch {
    // The UI remains usable when browser storage is unavailable.
  }
  window.dispatchEvent(new Event(DIRECTORY_VIEW_EVENT))
}
