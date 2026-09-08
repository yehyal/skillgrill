import posthog, { type BeforeSendFn } from "posthog-js"
import type { VoteReason, VoteValue } from "@skill-grill/shared"

export type AnalyticsSignInSurface = "header" | "vote" | "comment" | "report"
export type AnalyticsViewMode = "list" | "card"
export type AnalyticsRanking = "all_time" | "trending" | "newest"
export type AnalyticsVoteOperation =
  | "cast"
  | "changed"
  | "removed"
  | "reason_added"
  | "reason_changed"
  | "reason_removed"
export type AnalyticsTextLengthBucket = "0" | "1-20" | "21-80" | "81-200" | "201+"
export type AnalyticsTokenBucket = "unknown" | "0-999" | "1k-4.9k" | "5k-9.9k" | "10k+"

export type AnalyticsEventMap = {
  directory_searched: {
    query_length_bucket: AnalyticsTextLengthBucket
    result_count: number
    zero_results: boolean
    tag: string
    ranking: AnalyticsRanking
  }
  directory_filter_changed: {
    filter_type: "tag" | "ranking"
    value: string
  }
  skill_selected: {
    skill_id: string
    skill_slug: string
    surface: "homepage" | "directory"
    rank: number
    ranking: AnalyticsRanking
    view_mode: AnalyticsViewMode
  }
  skill_viewed: {
    skill_id: string
    skill_slug: string
    tags: string[]
    estimated_tokens_bucket: AnalyticsTokenBucket
  }
  install_command_copied: {
    skill_id: string
    skill_slug: string
    estimated_tokens_bucket: AnalyticsTokenBucket
  }
  skill_file_source_viewed: {
    skill_id: string
    skill_slug: string
    file_path: "SKILL.md"
  }
  skill_file_copied: {
    skill_id: string
    skill_slug: string
    file_path: "SKILL.md"
  }
  skill_outbound_opened: {
    skill_id: string
    skill_slug: string
    destination: "source" | "catalog"
  }
  sign_in_started: {
    surface: AnalyticsSignInSurface
  }
  sign_in_completed: {
    return_surface: AnalyticsSignInSurface
  }
  skill_vote_completed: {
    skill_id: string
    skill_slug: string
    operation: AnalyticsVoteOperation
    verdict: "well_done" | "undercooked" | null
    has_reason: boolean
    reason?: VoteReason
  }
  skill_comment_completed: {
    skill_id: string
    skill_slug: string
    body_length_bucket: AnalyticsTextLengthBucket
  }
}

export type AnalyticsEventName = keyof AnalyticsEventMap
export type AnalyticsPreference = "enabled" | "disabled" | "browser_blocked" | "unavailable"

const ANALYTICS_HOSTNAME = "skillgrill.dev"
const POSTHOG_HOST = "https://eu.i.posthog.com"
const ANALYTICS_OPT_OUT_KEY = "skill-grill:posthog-opt-out"
const ANALYTICS_PREFERENCE_EVENT = "skill-grill:analytics-preference-change"
const SIGN_IN_SURFACE_KEY = "skill-grill:analytics-sign-in-surface"
const SIGN_IN_COMPLETION_KEY = "skill-grill:analytics-sign-in-completed"
const SIGN_IN_INTENT_TTL_MS = 30 * 60 * 1000
const SIGN_IN_COMPLETION_DEDUPE_MS = 30 * 1000
const APPROVED_EVENTS = new Set<string>([
  "$pageview",
  "$pageleave",
  "directory_searched",
  "directory_filter_changed",
  "skill_selected",
  "skill_viewed",
  "install_command_copied",
  "skill_file_source_viewed",
  "skill_file_copied",
  "skill_outbound_opened",
  "sign_in_started",
  "sign_in_completed",
  "skill_vote_completed",
  "skill_comment_completed",
])
const CUSTOM_EVENT_PROPERTIES: Record<string, Set<string>> = {
  directory_searched: new Set([
    "schema_version",
    "query_length_bucket",
    "result_count",
    "zero_results",
    "tag",
    "ranking",
  ]),
  directory_filter_changed: new Set(["schema_version", "filter_type", "value"]),
  skill_selected: new Set([
    "schema_version",
    "skill_id",
    "skill_slug",
    "surface",
    "rank",
    "ranking",
    "view_mode",
  ]),
  skill_viewed: new Set([
    "schema_version",
    "skill_id",
    "skill_slug",
    "tags",
    "estimated_tokens_bucket",
  ]),
  install_command_copied: new Set([
    "schema_version",
    "skill_id",
    "skill_slug",
    "estimated_tokens_bucket",
  ]),
  skill_file_source_viewed: new Set(["schema_version", "skill_id", "skill_slug", "file_path"]),
  skill_file_copied: new Set(["schema_version", "skill_id", "skill_slug", "file_path"]),
  skill_outbound_opened: new Set(["schema_version", "skill_id", "skill_slug", "destination"]),
  sign_in_started: new Set(["schema_version", "surface"]),
  sign_in_completed: new Set(["schema_version", "return_surface"]),
  skill_vote_completed: new Set([
    "schema_version",
    "skill_id",
    "skill_slug",
    "operation",
    "verdict",
    "has_reason",
    "reason",
  ]),
  skill_comment_completed: new Set([
    "schema_version",
    "skill_id",
    "skill_slug",
    "body_length_bucket",
  ]),
}
const URL_PROPERTIES = new Set([
  "$current_url",
  "$initial_current_url",
  "$session_entry_url",
  "$referrer",
  "$initial_referrer",
])

let analyticsInitialized = false

export function initializeAnalytics() {
  if (analyticsInitialized || !isAnalyticsEligible() || isAnalyticsOptedOut() || isDoNotTrackEnabled()) {
    return
  }

  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN?.trim()

  if (!token) {
    return
  }

  try {
    posthog.init(token, {
      api_host: POSTHOG_HOST,
      cookieless_mode: "always",
      person_profiles: "never",
      autocapture: false,
      capture_pageview: "history_change",
      capture_pageleave: true,
      disable_session_recording: true,
      capture_heatmaps: false,
      capture_dead_clicks: false,
      capture_exceptions: false,
      disable_surveys: true,
      disable_product_tours: true,
      disable_web_experiments: true,
      disable_conversations: true,
      disable_capture_url_hashes: true,
      respect_dnt: true,
      save_campaign_params: false,
      before_send: sanitizeAnalyticsEvent,
    })
    analyticsInitialized = true
  } catch {
    // Analytics must never interfere with the application.
  }
}

export function captureAnalytics<EventName extends AnalyticsEventName>(
  event: EventName,
  properties: AnalyticsEventMap[EventName]
) {
  if (!analyticsInitialized) {
    initializeAnalytics()
  }

  if (!analyticsInitialized || isAnalyticsOptedOut() || isDoNotTrackEnabled()) {
    return
  }

  try {
    posthog.capture(event, {
      schema_version: 1,
      ...properties,
    })
  } catch {
    // Analytics must never block the action that triggered it.
  }
}

export function isAnalyticsEligible() {
  return (
    typeof window !== "undefined" &&
    window.location.hostname === ANALYTICS_HOSTNAME &&
    process.env.NEXT_PUBLIC_POSTHOG_ENABLED === "true" &&
    Boolean(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN?.trim())
  )
}

export function isAnalyticsOptedOut() {
  if (typeof window === "undefined") {
    return false
  }

  try {
    return window.localStorage.getItem(ANALYTICS_OPT_OUT_KEY) === "1"
  } catch {
    return false
  }
}

export function getAnalyticsPreference(): AnalyticsPreference {
  if (!isAnalyticsEligible()) {
    return "unavailable"
  }

  if (isDoNotTrackEnabled()) {
    return "browser_blocked"
  }

  return isAnalyticsOptedOut() ? "disabled" : "enabled"
}

export function subscribeToAnalyticsPreference(onChange: () => void) {
  window.addEventListener("storage", onChange)
  window.addEventListener(ANALYTICS_PREFERENCE_EVENT, onChange)

  return () => {
    window.removeEventListener("storage", onChange)
    window.removeEventListener(ANALYTICS_PREFERENCE_EVENT, onChange)
  }
}

export function disableAnalytics() {
  writeOptOutPreference(true)

  try {
    posthog.opt_out_capturing()
  } catch {
    // The local preference remains authoritative if the SDK is unavailable.
  }
}

export function enableAnalytics() {
  writeOptOutPreference(false)

  try {
    posthog.opt_in_capturing({ captureEventName: false })
  } catch {
    // Initialization below can still recover when the SDK was not ready yet.
  }

  initializeAnalytics()
}

export function rememberAnalyticsSignInSurface(surface: AnalyticsSignInSurface) {
  if (typeof window === "undefined") {
    return
  }

  try {
    window.sessionStorage.setItem(
      SIGN_IN_SURFACE_KEY,
      JSON.stringify({ surface, timestamp: Date.now() })
    )
  } catch {
    // OAuth still works when session storage is unavailable.
  }
}

export function readAnalyticsSignInSurface(): AnalyticsSignInSurface {
  if (typeof window === "undefined") {
    return "header"
  }

  try {
    const raw = window.sessionStorage.getItem(SIGN_IN_SURFACE_KEY)
    window.sessionStorage.removeItem(SIGN_IN_SURFACE_KEY)

    if (!raw) {
      return "header"
    }

    const parsed = JSON.parse(raw) as { surface?: unknown; timestamp?: unknown }

    if (
      isSignInSurface(parsed.surface) &&
      typeof parsed.timestamp === "number" &&
      Date.now() - parsed.timestamp < SIGN_IN_INTENT_TTL_MS
    ) {
      return parsed.surface
    }
  } catch {
    // A malformed intent is ignored rather than becoming analytics data.
  }

  return "header"
}

export function captureSignInCompletedOnce(returnSurface: AnalyticsSignInSurface) {
  if (hasRecentSignInCompletion()) {
    return
  }

  rememberSignInCompletion()
  captureAnalytics("sign_in_completed", { return_surface: returnSurface })
}

export function getTextLengthBucket(length: number): AnalyticsTextLengthBucket {
  if (length <= 0) {
    return "0"
  }

  if (length <= 20) {
    return "1-20"
  }

  if (length <= 80) {
    return "21-80"
  }

  if (length <= 200) {
    return "81-200"
  }

  return "201+"
}

export function getTokenBucket(tokens: number | null | undefined): AnalyticsTokenBucket {
  if (tokens === null || tokens === undefined || tokens < 0) {
    return "unknown"
  }

  if (tokens < 1000) {
    return "0-999"
  }

  if (tokens < 5000) {
    return "1k-4.9k"
  }

  if (tokens < 10000) {
    return "5k-9.9k"
  }

  return "10k+"
}

export function getVoteOperation(
  previousVote: VoteValue,
  previousReason: VoteReason | null,
  nextVote: VoteValue,
  nextReason: VoteReason | null
): AnalyticsVoteOperation {
  if (nextVote === null) {
    return "removed"
  }

  if (previousVote === null) {
    return "cast"
  }

  if (previousVote !== nextVote) {
    return "changed"
  }

  if (previousReason === null && nextReason !== null) {
    return "reason_added"
  }

  if (previousReason !== null && nextReason === null) {
    return "reason_removed"
  }

  return "reason_changed"
}

const sanitizeAnalyticsEvent: BeforeSendFn = (capture) => {
  if (
    !capture ||
    !APPROVED_EVENTS.has(capture.event) ||
    isAnalyticsOptedOut() ||
    isDoNotTrackEnabled()
  ) {
    return null
  }

  const allowedProperties = CUSTOM_EVENT_PROPERTIES[capture.event]
  const properties = Object.fromEntries(
    Object.entries(capture.properties).filter(([key]) =>
      allowedProperties
        ? allowedProperties.has(key) || key.startsWith("$")
        : true
    )
  )

  for (const property of URL_PROPERTIES) {
    const value = properties[property]

    if (typeof value !== "string") {
      continue
    }

    properties[property] = property.includes("referrer")
      ? sanitizeReferrer(value)
      : sanitizeCurrentUrl(value)
  }

  return { ...capture, properties }
}

function isAnalyticsOptOutValue(value: boolean) {
  return value ? "1" : null
}

function writeOptOutPreference(optedOut: boolean) {
  if (typeof window === "undefined") {
    return
  }

  try {
    const value = isAnalyticsOptOutValue(optedOut)

    if (value) {
      window.localStorage.setItem(ANALYTICS_OPT_OUT_KEY, value)
    } else {
      window.localStorage.removeItem(ANALYTICS_OPT_OUT_KEY)
    }
    window.dispatchEvent(new Event(ANALYTICS_PREFERENCE_EVENT))
  } catch {
    // The preference control remains usable for the current session.
  }
}

function sanitizeCurrentUrl(value: string) {
  try {
    const url = new URL(value, window.location.origin)
    const allowedParams = new URLSearchParams()

    for (const key of ["utm_source", "utm_medium", "utm_campaign"]) {
      const parameter = url.searchParams.get(key)

      if (parameter) {
        allowedParams.set(key, parameter)
      }
    }

    const query = allowedParams.toString()
    return `${url.origin}${url.pathname}${query ? `?${query}` : ""}`
  } catch {
    return window.location.origin + window.location.pathname
  }
}

function sanitizeReferrer(value: string) {
  try {
    const url = new URL(value, window.location.origin)
    return `${url.origin}${url.pathname}`
  } catch {
    return null
  }
}

function isDoNotTrackEnabled() {
  return (
    typeof navigator !== "undefined" &&
    navigator.doNotTrack === "1"
  )
}

function isSignInSurface(value: unknown): value is AnalyticsSignInSurface {
  return value === "header" || value === "vote" || value === "comment" || value === "report"
}

function hasRecentSignInCompletion() {
  if (typeof window === "undefined") {
    return false
  }

  try {
    const timestamp = Number(window.sessionStorage.getItem(SIGN_IN_COMPLETION_KEY))
    return Number.isFinite(timestamp) && Date.now() - timestamp < SIGN_IN_COMPLETION_DEDUPE_MS
  } catch {
    return false
  }
}

function rememberSignInCompletion() {
  if (typeof window === "undefined") {
    return
  }

  try {
    window.sessionStorage.setItem(SIGN_IN_COMPLETION_KEY, String(Date.now()))
  } catch {
    // The callback remains functional when session storage is unavailable.
  }
}
