import type { PostgresJsDatabase } from '@acme/db'
import type * as schema from '@acme/db/schema'

declare module 'fastify' {
  interface FastifyInstance {
    db: PostgresJsDatabase<typeof schema>
  }
}
