"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { PageContainer } from "@/components/page-container"
import { siteConfig } from "@/lib/site-config"

const productHuntUrl = "https://www.producthunt.com/products/skillgrill?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-skillgrill"
const productHuntBadgeUrl = "https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1244569&theme=light&t=1788981723876"

export function AppFooter() {
  const pathname = usePathname()

  return (
    <footer className="border-t border-border bg-muted/40 py-8 text-sm text-muted-foreground">
      <PageContainer className="grid gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1 text-xs sm:flex-row sm:items-center sm:gap-4">
            <span>{siteConfig.copyright}</span>
            <span>
              Built by{" "}
              <a
                href={siteConfig.builderUrl}
                target="_blank"
                rel="noreferrer"
                className="text-foreground underline decoration-border underline-offset-4 outline-none hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {siteConfig.builderHandle}
              </a>
            </span>
          </div>
          <nav aria-label="Footer navigation">
            <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
              <li><Link aria-current={pathname?.startsWith("/skills") ? "page" : undefined} className="outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50" href="/skills">Browse</Link></li>
              <li><Link aria-current={pathname?.startsWith("/guides") ? "page" : undefined} className="outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50" href="/guides">Guides</Link></li>
              <li><Link aria-current={pathname === "/about" ? "page" : undefined} className="outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50" href="/about">About</Link></li>
              <li><Link aria-current={pathname === "/privacy" ? "page" : undefined} className="outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50" href="/privacy">Privacy</Link></li>
              <li><Link aria-current={pathname === "/terms" ? "page" : undefined} className="outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50" href="/terms">Terms</Link></li>
              <li><Link aria-current={pathname === "/contact" ? "page" : undefined} className="outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50" href="/contact">Contact</Link></li>
            </ul>
          </nav>
        </div>

        <div
          className="flex min-h-[52px] flex-wrap items-center gap-3 border-t border-border pt-5"
          aria-label="Featured on"
        >
          <a
            href="https://tools.launchllama.co?utm_source=badge&utm_medium=referral"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- Launch Llama hosts and updates its own featured badge. */}
            <img
              src="https://tools.launchllama.co/featured-badge.png?v=2"
              alt="As seen on Launch Llama Newsletter"
              width="200"
              height="52"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="block h-[52px] w-[200px]"
            />
          </a>
          <a href="https://www.tinylaunch.com/launch/21545" target="_blank" rel="noopener">
            {/* eslint-disable-next-line @next/next/no-img-element*/}
            <img
              src="https://tinylaunch.com/tinylaunch_badge_launching_soon.svg"
              alt="TinyLaunch Badge"
              style={{
                width: 202,
                height: 'auto'
              }}
            />
          </a>
          <a href={productHuntUrl} target="_blank" rel="noopener noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element -- Product Hunt hosts and updates its own featured badge. */}
            <img
              src={productHuntBadgeUrl}
              alt="SkillGrill - Find AI agent skills that actually work. | Product Hunt"
              width={250}
              height={54}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="block h-[54px] w-[250px]"
            />
          </a>
        </div>
      </PageContainer>
    </footer>
  )
}
