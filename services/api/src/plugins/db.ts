import fp from 'fastify-plugin'

import { db, client } from '@acme/db'

export default fp(
  async function fastifyDrizzleORM(fastify) {
    if (fastify.db) {
      return
    }

    try {
      fastify.decorate('db', db)

      fastify.addHook('onClose', async (fastifyInstance) => {
        if (fastifyInstance.db) {
          fastifyInstance.log.info('Closing database connection...')

          await client.end()

          fastifyInstance.log.info('Database connection closed.')
        }
      })
    } catch (error) {
      fastify.log.error(
        `Failed to establish database connection: ${error.message}`,
      )

      throw error
    }
  },
  {
    name: 'db',
  },
)
