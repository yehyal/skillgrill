"use client"

import { useEffect, useRef, useState } from "react"
import { MoonIcon, SunIcon } from "@radix-ui/react-icons"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

type ThemeChoice = "light" | "dark"

const THEME_CHANGE_DELAY_MS = 140

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [pendingTheme, setPendingTheme] = useState<ThemeChoice | null>(null)
  const changeTimeout = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (changeTimeout.current !== null) {
        window.clearTimeout(changeTimeout.current)
      }
    }
  }, [])

  function handleThemeChange() {
    if (pendingTheme) {
      return
    }

    const currentTheme = resolvedTheme ?? (document.documentElement.classList.contains("dark") ? "dark" : "light")
    const nextTheme: ThemeChoice = currentTheme === "dark"
      ? "light"
      : "dark"

    setPendingTheme(nextTheme)
    changeTimeout.current = window.setTimeout(() => {
      setTheme(nextTheme)
      setPendingTheme(null)
      changeTimeout.current = null
    }, THEME_CHANGE_DELAY_MS)
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Toggle color theme"
      title="Toggle color theme"
      disabled={pendingTheme !== null}
      onClick={handleThemeChange}
    >
      <span className="relative size-4" aria-hidden="true">
        <SunIcon className="absolute inset-0 hidden size-4 dark:block" />
        <MoonIcon className="absolute inset-0 size-4 dark:hidden" />
      </span>
    </Button>
  )
}
