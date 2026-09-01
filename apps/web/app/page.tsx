import { PageContainer } from "@/components/page-container"
import { SiteShell } from "@/components/site-shell"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
  return (
    <SiteShell>
      <main id="main-content" className="flex flex-1">
        <section className="hero flex w-full flex-1" aria-labelledby="hero-title">
          <PageContainer className="grid w-full grid-cols-1 items-start gap-10 py-10 sm:gap-12 sm:py-16 md:items-end md:grid-cols-[minmax(0,1.2fr)_minmax(17rem,0.8fr)] md:gap-[clamp(3rem,8vw,9rem)] lg:py-20">
            <div className="hero-copy max-w-[53rem]">
              <h1
                id="hero-title"
                className="max-w-[16ch] text-[clamp(2.9rem,6vw,6.5rem)] font-[560] leading-[0.94] tracking-[-0.065em] text-balance sm:max-w-[18ch]"
              >
                Find AI agent skills that actually work.
              </h1>
              <p className="mt-6 max-w-[32rem] text-base leading-7 text-muted-foreground sm:mt-8 sm:text-lg sm:leading-8 md:mt-12">
                Community votes, comments, and practical feedback for agent skills.
              </p>
              <Button asChild size="lg" className="mt-7 sm:mt-8 md:mt-10">
                <Link href="/skills">Browse Skills</Link>
              </Button>
            </div>

            <div
              className="monogram flex aspect-square w-[min(100%,18rem)] flex-col justify-between self-end justify-self-end rounded-md border border-primary/20 bg-primary p-5 text-primary-foreground shadow-sm sm:w-full sm:max-w-[32rem] sm:p-8 md:justify-self-end"
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
    </SiteShell>
  )
}
