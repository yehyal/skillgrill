import Link from "next/link"

import { PageContainer } from "@/components/page-container"
import { siteConfig } from "@/lib/site-config"

export function AppFooter() {
  return (
    <footer className="border-t border-border py-6 text-sm text-muted-foreground">
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
              <li><Link className="outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50" href="/skills">Browse</Link></li>
              <li><Link className="outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50" href="/about">About</Link></li>
              <li><Link className="outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50" href="/privacy">Privacy</Link></li>
              <li><Link className="outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50" href="/terms">Terms</Link></li>
              <li><Link className="outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50" href="/contact">Contact</Link></li>
            </ul>
          </nav>
        </div>

      </PageContainer>
    </footer>
  )
}
