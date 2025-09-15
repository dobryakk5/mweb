import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db, userFlats, ads, adHistory } from '@acme/db'
import { eq, desc, and, ilike } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

const getUserFlatsSchema = z.object({
  tgUserId: z.string().transform(Number),
})

const getFlatByIdSchema = z.object({
  id: z.string().transform(Number),
})

const createUserFlatSchema = z.object({
  tgUserId: z.number(),
  address: z.string(),
  rooms: z.number(),
  floor: z.number(),
})

export default async function userFlatsRoutes(fastify: FastifyInstance) {
  // Создать новую квартиру
  fastify.post('/user-flats', async (request, reply) => {
    try {
      const data = createUserFlatSchema.parse(request.body)
      
      const newFlat = await db
        .insert(userFlats)
        .values({
          tgUserId: data.tgUserId,
          address: data.address,
          rooms: data.rooms,
          floor: data.floor,
        })
        .returning()

      return reply.status(201).send(newFlat[0])
    } catch (error) {
      console.error('Error creating flat:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // Получить конкретную квартиру по ID
  fastify.get('/user-flats/:id', async (request, reply) => {
    try {
      const { id } = getFlatByIdSchema.parse(request.params)
      
      const flat = await db
        .select()
        .from(userFlats)
        .where(eq(userFlats.id, id))
        .limit(1)

      if (flat.length === 0) {
        return reply.status(404).send({ error: 'Flat not found' })
      }

      return reply.send(flat[0])
    } catch (error) {
      return reply.status(400).send({ error: 'Invalid request' })
    }
  })

  // Обновить квартиру
  fastify.patch('/user-flats/:id', async (request, reply) => {
    try {
      const { id } = getFlatByIdSchema.parse(request.params)
      const data = createUserFlatSchema.partial().parse(request.body)
      
      const updatedFlat = await db
        .update(userFlats)
        .set(data)
        .where(eq(userFlats.id, id))
        .returning()

      if (updatedFlat.length === 0) {
        return reply.status(404).send({ error: 'Flat not found' })
      }

      return reply.send(updatedFlat[0])
    } catch (error) {
      console.error('Error updating flat:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // Получить все квартиры пользователя
  fastify.get('/user-flats/user/:tgUserId', async (request, reply) => {
    try {
      const { tgUserId } = getUserFlatsSchema.parse(request.params)
      const { sortBy, search } = request.query as { sortBy?: string; search?: string }
      
      let orderByClause
      
      if (sortBy === 'address') {
        orderByClause = userFlats.address
      } else if (sortBy === 'address_desc') {
        orderByClause = desc(userFlats.address)
      } else if (sortBy === 'rooms') {
        orderByClause = userFlats.rooms
      } else if (sortBy === 'rooms_desc') {
        orderByClause = desc(userFlats.rooms)
      } else if (sortBy === 'floor') {
        orderByClause = userFlats.floor
      } else if (sortBy === 'floor_desc') {
        orderByClause = desc(userFlats.floor)
      } else {
        // По умолчанию сортируем по дате создания
        orderByClause = desc(userFlats.createdAt)
      }
      
      let whereClause = eq(userFlats.tgUserId, tgUserId)
      
      // Добавляем поиск по адресу, если указан
      if (search && search.trim()) {
        whereClause = and(
          eq(userFlats.tgUserId, tgUserId),
          ilike(userFlats.address, `%${search.trim()}%`)
        )
      }
      
      const flats = await db
        .select()
        .from(userFlats)
        .where(whereClause)
        .orderBy(orderByClause)

      return reply.send(flats)
    } catch (error) {
      return reply.status(400).send({ error: 'Invalid request' })
    }
  })

  // Получить количество квартир пользователя
  fastify.get('/user-flats/user/:tgUserId/count', async (request, reply) => {
    try {
      const { tgUserId } = getUserFlatsSchema.parse(request.params)
      const { search } = request.query as { search?: string }
      
      let whereClause = eq(userFlats.tgUserId, tgUserId)
      
      // Добавляем поиск по адресу, если указан
      if (search && search.trim()) {
        whereClause = and(
          eq(userFlats.tgUserId, tgUserId),
          ilike(userFlats.address, `%${search.trim()}%`)
        )
      }
      
      const result = await db
        .select({ count: sql`count(*)` })
        .from(userFlats)
        .where(whereClause)

      return reply.send({ count: Number(result[0]?.count || 0) })
    } catch (error) {
      return reply.status(400).send({ error: 'Invalid request' })
    }
  })

  // Удалить квартиру и всю связанную статистику
  fastify.delete('/user-flats/:id', async (request, reply) => {
    try {
      const { id } = getFlatByIdSchema.parse(request.params)

      // Получаем все объявления по этой квартире для удаления истории
      const flatAds = await db
        .select({ id: ads.id })
        .from(ads)
        .where(eq(ads.flatId, id))

      // Удаляем историю для всех объявлений этой квартиры
      if (flatAds.length > 0) {
        const adIds = flatAds.map(ad => ad.id)
        for (const adId of adIds) {
          await db.delete(adHistory).where(eq(adHistory.adId, adId))
        }
      }

      // Удаляем все объявления по этой квартире
      await db.delete(ads).where(eq(ads.flatId, id))

      // Удаляем саму квартиру
      const deletedFlat = await db
        .delete(userFlats)
        .where(eq(userFlats.id, id))
        .returning()

      if (deletedFlat.length === 0) {
        return reply.status(404).send({ error: 'Flat not found' })
      }

      return reply.send({ message: 'Flat and all related data deleted successfully' })
    } catch (error) {
      console.error('Error deleting flat:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })
}
