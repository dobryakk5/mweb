import { FastifyInstance } from 'fastify'
import { z } from 'zod'

import { db } from '@acme/db'
import { insertAdSchema, selectAdSchema } from '@acme/db/schemas'
import { ads } from '@acme/db/schema'
import { eq } from 'drizzle-orm'

const createAdSchema = z.object({
  flatId: z.number().positive(), // ID квартиры
  url: z.string().url(),
  address: z.string().min(1),
  price: z.number().min(0), // Изменено с .positive() на .min(0)
  rooms: z.number().positive(),
})

export default async function adsRoutes(fastify: FastifyInstance) {
  // GET /ads - получить все объявления
  fastify.get('/ads', async (request, reply) => {
    try {
      const { flatId } = z.object({ flatId: z.string().optional() }).parse(request.query)
      
      let query = db.select().from(ads)
      
      if (flatId) {
        query = query.where(eq(ads.flatId, parseInt(flatId)))
      }
      
      const result = await query.orderBy(ads.createdAt)
      return reply.send(result)
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // GET /ads/:id - получить объявление по ID
  fastify.get('/ads/:id', async (request, reply) => {
    try {
      const { id } = z.object({ id: z.string() }).parse(request.params)
      const result = await db.select().from(ads).where(eq(ads.id, parseInt(id))).limit(1)
      
      if (result.length === 0) {
        return reply.status(404).send({ error: 'Ad not found' })
      }
      
      return reply.send(result[0])
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // POST /ads - создать новое объявление
  fastify.post('/ads', async (request, reply) => {
    try {
      const body = createAdSchema.parse(request.body)
      
      const result = await db.insert(ads).values({
        ...body,
        views: 0, // Добавляем views по умолчанию
      }).returning()
      
      return reply.status(201).send(result[0])
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // PATCH /ads/:id - обновить объявление
  fastify.patch('/ads/:id', async (request, reply) => {
    try {
      const { id } = z.object({ id: z.string() }).parse(request.params)
      const body = createAdSchema.partial().parse(request.body)
      
      const result = await db.update(ads)
        .set({
          ...body,
          updatedAt: new Date(),
        })
        .where(eq(ads.id, parseInt(id)))
        .returning()
      
      if (result.length === 0) {
        return reply.status(404).send({ error: 'Ad not found' })
      }
      
      return reply.send(result[0])
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // DELETE /ads/:id - удалить объявление
  fastify.delete('/ads/:id', async (request, reply) => {
    try {
      const { id } = z.object({ id: z.string() }).parse(request.params)
      
      const result = await db.delete(ads)
        .where(eq(ads.id, parseInt(id)))
        .returning()
      
      if (result.length === 0) {
        return reply.status(404).send({ error: 'Ad not found' })
      }
      
      return reply.send({ message: 'Ad deleted successfully' })
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })
}
