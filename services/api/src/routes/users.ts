import { zodToJsonSchema } from 'zod-to-json-schema'
import type { FastifyPluginAsync } from 'fastify'

import type {
  UsersQuerySchema,
  UsersCountQuerySchema,  
  UpsertUser,
  PostgresError
} from '@acme/db'
import {
  getUsersQuerySchema,
  getUsersCountQuerySchema,
  upsertUserSchema,
  getUsers,
  getUsersCount,
  getUserById,
  addUser,
  updateUserById
} from '@acme/db'

export default (async (fastify) => {
  fastify
    .get<{ Querystring: UsersQuerySchema }>(
      '/users',
      {
        schema: {
          querystring: zodToJsonSchema(getUsersQuerySchema),
        },
      },
      async (req, reply) => {
        const { search, sortBy, page } = req.query as any

        try {
          reply.status(200).send(await getUsers({ search, sortBy, page }))
        } catch (error) {
          fastify.log.error('Error handling /users request:', error)

          reply.status(500).send({ error: 'Failed to process the request.' })
        }
      },
    )

    .post<{ Body: UpsertUser }>(
      '/users',
      {
        schema: {
          body: zodToJsonSchema(upsertUserSchema),
        },
      },
      async (req, reply) => {
        try {
          const validatedUser = upsertUserSchema.parse(req.body)

          const [response] = await addUser(validatedUser)

          reply.status(200).send(response)
        } catch (err) {
          if (err instanceof Error && err.name === 'PostgresError') {
            const e = err as PostgresError

            if (e.code === '23505') {
              reply.status(403).send(null)
              return
            }
          }

          fastify.log.error('Error updating user:', err)

          reply.status(500).send(null)
        }
      },
    )

    .get<{ Querystring: UsersCountQuerySchema }>(
      '/users/count',
      {
        schema: {
          querystring: zodToJsonSchema(getUsersCountQuerySchema),
        },
      },
      async (req, reply) => {
        const { search } = req.query as any

        try {
          const total = await getUsersCount({ search })

          reply.status(200).send({ total })
        } catch (err) {
          if (process.env.NODE_ENV === 'development') {
            fastify.log.error('Error fetching user count:', err)
          }

          reply.status(500).send({ error: 'Failed to fetch user count.' })
        }
      },
    )

    .get<{ Params: { userId: string } }>(
      '/users/:userId',
      async (req, reply) => {
        const { userId } = req.params

        try {
          const response = await getUserById(userId)

          if (!response) {
            reply.status(404).send({ error: 'User not found' })

            return
          }

          reply.status(200).send(response)
        } catch (err) {
          fastify.log.error('Error fetching user:', err)

          reply.status(500).send({ error: 'Failed to fetch user.' })
        }
      },
    )

    .patch<{ Params: { userId: string }; Body: UpsertUser }>(
      '/users/:userId',
      {
        schema: {
          body: zodToJsonSchema(upsertUserSchema.partial()),
        },
      },
      async (req, reply) => {
        const { userId } = req.params

        try {
          const existingUser = await getUserById(userId)

          if (!existingUser) {
            reply.status(404).send({ error: 'User not found' })

            return
          }

          const validatedUser = upsertUserSchema.parse({
            ...existingUser,
            ...(req.body as any),
          })

          const [response] = await updateUserById(userId, validatedUser)

          reply.status(200).send(response)
        } catch (err) {
          fastify.log.error('Error updating user:', err)

          reply.status(500).send({ error: 'Failed to update user.' })
        }
      },
    )
}) satisfies FastifyPluginAsync
