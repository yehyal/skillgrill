import type { User } from "@supabase/supabase-js"

type Identity = {
  displayName: string
  username: string
  avatarUrl: string | null
  initials: string
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function safeAvatarUrl(value: unknown) {
  const candidate = stringValue(value)

  if (!candidate) {
    return null
  }

  try {
    const url = new URL(candidate)
    return url.protocol === "https:" || url.protocol === "http:" ? candidate : null
  } catch {
    return null
  }
}

function getInitials(value: string) {
  const initials = value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()

  return initials || "GH"
}

export function getGitHubIdentity(user: User): Identity {
  const metadata = user.user_metadata ?? {}
  const username =
    stringValue(metadata.user_name) ??
    stringValue(metadata.preferred_username) ??
    stringValue(metadata.username) ??
    "GitHub user"
  const displayName =
    stringValue(metadata.full_name) ??
    stringValue(metadata.name) ??
    username

  return {
    displayName,
    username,
    avatarUrl: safeAvatarUrl(metadata.avatar_url ?? metadata.picture),
    initials: getInitials(displayName),
  }
}
