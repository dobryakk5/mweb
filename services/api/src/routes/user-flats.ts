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

export default async (fastify: FastifyInstance) => {
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
    console.log(`[DELETE /user-flats/:id] Запрос на удаление квартиры с ID: ${request.params.id}`)
    console.log(`[DELETE /user-flats/:id] Полный URL запроса: ${request.url}`)
    console.log(`[DELETE /user-flats/:id] Метод запроса: ${request.method}`)
    console.log(`[DELETE /user-flats/:id] Headers:`, request.headers)

    try {
      const { id } = getFlatByIdSchema.parse(request.params)
      console.log(`[DELETE /user-flats/:id] Parsed ID: ${id}`)

      // Проверяем существование квартиры перед удалением
      const existingFlat = await db
        .select()
        .from(userFlats)
        .where(eq(userFlats.id, id))
        .limit(1)

      console.log(`[DELETE /user-flats/:id] Существующая квартира найдена: ${existingFlat.length > 0}`)
      if (existingFlat.length > 0) {
        console.log(`[DELETE /user-flats/:id] Данные квартиры:`, existingFlat[0])
      }

      // Получаем все объявления по этой квартире для удаления истории
      console.log(`[DELETE /user-flats/:id] Поиск объявлений для квартиры ID: ${id}`)
      const flatAds = await db
        .select({ id: ads.id })
        .from(ads)
        .where(eq(ads.flatId, id))

      console.log(`[DELETE /user-flats/:id] Найдено объявлений: ${flatAds.length}`)
      if (flatAds.length > 0) {
        console.log(`[DELETE /user-flats/:id] IDs объявлений:`, flatAds.map(ad => ad.id))
      }

      // Удаляем историю для всех объявлений этой квартиры
      if (flatAds.length > 0) {
        const adIds = flatAds.map(ad => ad.id)
        console.log(`[DELETE /user-flats/:id] Удаление истории для ${adIds.length} объявлений`)

        for (const adId of adIds) {
          await db.delete(adHistory).where(eq(adHistory.adId, adId))
        }
        console.log(`[DELETE /user-flats/:id] Удаление истории завершено`)
      }

      // Удаляем все объявления по этой квартире
      console.log(`[DELETE /user-flats/:id] Удаление объявлений для квартиры ID: ${id}`)
      const adsDeleted = await db.delete(ads).where(eq(ads.flatId, id))
      console.log(`[DELETE /user-flats/:id] Объявления удалены`)

      // Удаляем саму квартиру
      console.log(`[DELETE /user-flats/:id] Удаление квартиры ID: ${id}`)
      const deletedFlat = await db
        .delete(userFlats)
        .where(eq(userFlats.id, id))
        .returning()

      console.log(`[DELETE /user-flats/:id] Результат удаления квартиры:`, deletedFlat)

      if (deletedFlat.length === 0) {
        console.log(`[DELETE /user-flats/:id] Квартира с ID ${id} не найдена`)
        return reply.status(404).send({ error: 'Flat not found' })
      }

      console.log(`[DELETE /user-flats/:id] Квартира и связанные данные успешно удалены. ID: ${id}`)
      return reply.send({ message: 'Flat and all related data deleted successfully' })
    } catch (error) {
      console.error(`[DELETE /user-flats/:id] Ошибка при удалении квартиры:`, error)
      console.error(`[DELETE /user-flats/:id] Stack trace:`, error.stack)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })
}
