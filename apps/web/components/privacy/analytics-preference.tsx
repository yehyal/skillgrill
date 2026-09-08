"use client"

import { useSyncExternalStore } from "react"

import { Button } from "@/components/ui/button"
import {
  disableAnalytics,
  enableAnalytics,
  getAnalyticsPreference,
  subscribeToAnalyticsPreference,
  type AnalyticsPreference,
} from "@/lib/analytics"

export function AnalyticsPreference() {
  const preference = useSyncExternalStore(
    subscribeToAnalyticsPreference,
    getAnalyticsPreference,
    getServerAnalyticsPreference
  )

  const isDisabled = preference === "disabled"
  const isUnavailable = preference === "unavailable"

  function togglePreference() {
    if (isDisabled) {
      enableAnalytics()
    } else {
      disableAnalytics()
    }
  }

  return (
    <div className="border-t border-border pt-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div>
          <p className="text-sm font-medium" role="status" aria-live="polite">
            Anonymous analytics is {isUnavailable ? "not active in this environment" : isDisabled ? "disabled" : "enabled"}.
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Your choice is stored only as an analytics opt-out preference.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={togglePreference}
          disabled={isUnavailable}
        >
          {isUnavailable
            ? "Analytics unavailable"
            : isDisabled
              ? "Enable anonymous analytics"
              : "Disable anonymous analytics"}
        </Button>
      </div>
    </div>
  )
}

function getServerAnalyticsPreference(): AnalyticsPreference {
  return "enabled"
}
