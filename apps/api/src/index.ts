import { Hono } from "hono"

import type { HealthResponse } from "@skill-grill/shared"

export const app = new Hono()

app.get("/health", (context) => {
  const response: HealthResponse = { ok: true }

  return context.json(response)
})

export default app
