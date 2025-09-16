import { drizzle } from 'drizzle-orm/postgres-js'

import client from './client'
import { env } from './env'
import * as schema from './schema'

const database = drizzle(client, {
  logger: env.NODE_ENV === 'development',
  schema,
})

export const db = database
export default database
