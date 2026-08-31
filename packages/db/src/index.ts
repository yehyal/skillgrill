import postgres from "postgres"
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js"

import * as schema from "./schema"

export * from "./schema"

export type Database = PostgresJsDatabase<typeof schema>

export type DatabaseConnection = {
  client: ReturnType<typeof postgres>
  db: Database
}

export function createDatabase(databaseUrl: string): DatabaseConnection {
  const client = postgres(databaseUrl, {
    prepare: false,
    max: 1,
    connect_timeout: 5,
  })

  return {
    client,
    db: drizzle(client, { schema }),
  }
}
