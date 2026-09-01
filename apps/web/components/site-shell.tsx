import type { ReactNode } from "react"

import { AppFooter } from "@/components/app-footer"
import { AppHeader } from "@/components/app-header"

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="site-shell flex min-h-dvh flex-col">
      <AppHeader />
      {children}
      <AppFooter />
    </div>
  )
}
