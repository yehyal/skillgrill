import { PageContainer } from "@/components/page-container"
import { SiteShell } from "@/components/site-shell"
import { HomeDiscovery } from "@/components/skills/home-discovery"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRightIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons"
import Link from "next/link"

export default function Home() {
  return (
    <SiteShell>
      <main id="main-content" className="flex-1">
        <section aria-labelledby="hero-title" className="border-b border-border">
          <PageContainer className="grid gap-8 py-8 sm:py-10 md:grid-cols-[minmax(0,1fr)_17rem] md:items-end lg:py-12">
            <div className="max-w-[44rem]">
              <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-primary">
                Skills, put to the test
              </p>
              <h1
                id="hero-title"
                className="mt-3 max-w-[18ch] text-4xl font-semibold leading-none text-balance sm:text-5xl"
              >
                Find AI agent skills that actually work.
              </h1>
              <p className="mt-4 max-w-[38rem] text-base leading-7 text-muted-foreground">
                Votes, comments, and firsthand takes on whether each skill lives up to the hype.
              </p>

              <form action="/skills" className="mt-6 flex flex-col gap-2 sm:max-w-[36rem] sm:flex-row">
                <label className="min-w-0 flex-1">
                  <span className="sr-only">Search skills</span>
                  <span className="relative block">
                    <MagnifyingGlassIcon
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      name="q"
                      placeholder="Search by name, task, tag, or agent"
                      className="pl-9"
                    />
                  </span>
                </label>
                <Button type="submit" className="sm:px-5">
                  Search
                </Button>
              </form>
            </div>

            <div
              className="grid gap-2 text-sm"
              aria-hidden="true"
            >
              <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-card px-3 py-2">
                <span className="font-medium">Browse</span>
                <span className="font-mono text-xs text-muted-foreground">Directory</span>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-card px-3 py-2">
                <span className="font-medium">Compare</span>
                <span className="font-mono text-xs text-muted-foreground">Ratings + comments</span>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-card px-3 py-2">
                <span className="font-medium">Install</span>
                <span className="font-mono text-xs text-muted-foreground">Commands</span>
              </div>
            </div>
          </PageContainer>
        </section>

        <PageContainer className="py-7 sm:py-8">
          <section aria-labelledby="shortcuts-title">
            <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
              <h2 id="shortcuts-title" className="text-sm font-semibold">
                Start with compatibility
              </h2>
              <Button asChild variant="ghost" size="sm">
                <Link href="/skills">
                  Browse all <ArrowRightIcon aria-hidden="true" />
                </Link>
              </Button>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Codex", "/skills?agents=codex"],
                ["Claude Code", "/skills?agents=claude-code"],
                ["Cursor", "/skills?agents=cursor"],
                ["Any agent", "/skills?agents=generic"],
              ].map(([label, href]) => (
                <Link
                  key={label}
                  href={href}
                  className="rounded-md border border-border bg-card px-3 py-2 text-sm font-medium outline-none transition-colors hover:border-primary/50 hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  {label}
                </Link>
              ))}
            </div>
          </section>
        </PageContainer>

        <HomeDiscovery />
      </main>
    </SiteShell>
  )
}
