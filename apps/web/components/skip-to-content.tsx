"use client"

import type { MouseEvent } from "react"

export function SkipToContent() {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    const main = document.getElementById("main-content")

    if (!main) {
      return
    }

    event.preventDefault()
    main.focus()
  }

  return (
    <a
      href="#main-content"
      onClick={handleClick}
      className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-50 focus-visible:rounded-md focus-visible:bg-primary focus-visible:px-3 focus-visible:py-2 focus-visible:text-sm focus-visible:font-medium focus-visible:text-primary-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      Skip to main content
    </a>
  )
}
