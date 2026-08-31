import type { ApiErrorResponse } from "@skill-grill/shared"

export class ApiRequestError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiRequestError"
    this.status = status
  }
}

export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? null
}

export async function getApiError(response: Response) {
  try {
    const payload = (await response.json()) as ApiErrorResponse
    return payload.error?.message ?? `Request failed with status ${response.status}.`
  } catch {
    return `Request failed with status ${response.status}.`
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit) {
  const apiBaseUrl = getApiBaseUrl()

  if (!apiBaseUrl) {
    throw new ApiRequestError(
      "Set NEXT_PUBLIC_API_URL to the running Worker API, then try again.",
      0
    )
  }

  const response = await fetch(`${apiBaseUrl}${path}`, init)

  if (!response.ok) {
    throw new ApiRequestError(await getApiError(response), response.status)
  }

  return (await response.json()) as T
}
