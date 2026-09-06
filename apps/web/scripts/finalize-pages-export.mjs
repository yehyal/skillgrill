import { rm } from "node:fs/promises"
import { fileURLToPath } from "node:url"

const sentinelDirectory = fileURLToPath(
  new URL("../out/skills/__static-export-sentinel__", import.meta.url)
)

await rm(sentinelDirectory, { recursive: true, force: true })
