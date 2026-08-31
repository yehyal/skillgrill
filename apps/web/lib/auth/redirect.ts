const APP_ORIGIN = "http://localhost:3000"

export function sanitizeRedirectPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/"
  }

  try {
    const url = new URL(value, APP_ORIGIN)

    if (url.origin !== APP_ORIGIN) {
      return "/"
    }

    return `${url.pathname}${url.search}${url.hash}` || "/"
  } catch {
    return "/"
  }
}

export function getCurrentRelativePath() {
  if (typeof window === "undefined") {
    return "/"
  }

  return sanitizeRedirectPath(
    `${window.location.pathname}${window.location.search}${window.location.hash}`
  )
}
