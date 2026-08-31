import { AppFooter } from "@/components/app-footer"
import { AppHeader } from "@/components/app-header"
import { PageContainer } from "@/components/page-container"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
  return (
    <div className="site-shell">
      <AppHeader />
      <main id="main-content" className="flex flex-1">
        <section className="hero w-full" aria-labelledby="hero-title">
          <PageContainer className="grid min-h-[calc(100dvh-4.5rem)] grid-cols-1 items-end gap-12 py-12 sm:py-16 md:grid-cols-[minmax(0,1.2fr)_minmax(17rem,0.8fr)] md:gap-[clamp(3rem,8vw,9rem)] md:py-16 lg:py-20">
            <div className="hero-copy max-w-[53rem]">
              <h1
                id="hero-title"
                className="max-w-[18ch] text-[clamp(3.25rem,6vw,6.5rem)] font-[560] leading-[0.92] tracking-[-0.065em] text-balance"
              >
                Find AI agent skills that actually work.
              </h1>
              <p className="mt-8 max-w-[32rem] text-[clamp(1rem,1.5vw,1.25rem)] leading-[1.55] text-muted-foreground md:mt-12">
                Community votes, comments, and practical feedback for agent skills.
              </p>
              <Button asChild size="lg" className="mt-8 md:mt-10">
                <Link href="/skills">Browse Skills</Link>
              </Button>
            </div>

            <div
              className="monogram flex aspect-square w-full max-w-[32rem] flex-col justify-between rounded-md border border-primary/20 bg-primary p-5 text-primary-foreground shadow-sm sm:p-8 md:justify-self-end"
              aria-hidden="true"
            >
              <span className="text-[clamp(4rem,10vw,9rem)] font-semibold leading-none tracking-[-0.1em]">
                SG
              </span>
              <div className="flex items-end justify-between gap-4 text-[clamp(1.5rem,3.5vw,3.5rem)] font-semibold leading-[0.9] tracking-[-0.07em]">
                <span>Skill</span>
                <span>Grill</span>
              </div>
            </div>
          </PageContainer>
        </section>
      </main>
      <AppFooter />
    </div>
  )
}
