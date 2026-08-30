import { describe, expect, it } from "vitest"

import { app } from "./index"

describe("GET /health", () => {
  it("returns the public health contract", async () => {
    const response = await app.request("http://localhost/health")

    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toContain("application/json")
    await expect(response.json()).resolves.toEqual({ ok: true })
  })
})
