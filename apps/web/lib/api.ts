import type { ApiErrorResponse } from "@skill-grill/shared"

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
