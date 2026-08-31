import { describe, expect, it } from "vitest"

import { sanitizeRedirectPath } from "@/lib/auth/redirect"

describe("sanitizeRedirectPath", () => {
  it("keeps a valid relative path with query and hash", () => {
    expect(sanitizeRedirectPath("/reviews?sort=recent#comments")).toBe(
      "/reviews?sort=recent#comments"
    )
  })

  it("rejects external URLs", () => {
    expect(sanitizeRedirectPath("https://example.com/account")).toBe("/")
  })

  it("rejects protocol-relative URLs", () => {
    expect(sanitizeRedirectPath("//example.com/account")).toBe("/")
  })

  it("uses the home page when next is missing", () => {
    expect(sanitizeRedirectPath(undefined)).toBe("/")
    expect(sanitizeRedirectPath(null)).toBe("/")
  })
})
