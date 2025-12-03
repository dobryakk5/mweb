import { type FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db, userFlats, ads, adHistory } from '@acme/db'
import { eq, desc, and, ilike } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

const tgUserIdParamsSchema = z.object({
  tgUserId: z.coerce.number().int().positive(),
})

const listUserFlatsQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  sortBy: z
    .enum([
      'createdAt',
      'createdAt_desc',
      'address',
      'address_desc',
      'rooms',
      'rooms_desc',
      'floor',
      'floor_desc',
    ])
    .optional(),
})

const getFlatByIdSchema = z.object({
  id: z.coerce.number().int().positive(),
})

const createUserFlatSchema = z.object({
  tgUserId: z.number(),
  address: z.string(),
  rooms: z.number(),
  floor: z.number(),
})

export default async (fastify: FastifyInstance) => {
  console.log('[user-flats.ts] Регистрация маршрутов начата')

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

      const createdFlat = newFlat[0]

      // Автоматически запускаем поиск похожих объявлений И СОХРАНЯЕМ их в базу
      try {
        const result = await db.transaction(async (tx) => {
          await tx.execute(sql`SET search_path TO users,public`)
          return await tx.execute(
            sql`SELECT price, rooms, person_type, created, updated, url, is_active, floor, area, kitchen_area
                FROM public.find_ads(${createdFlat.address}, ${createdFlat.floor}, ${createdFlat.rooms})`,
          )
        })

        const similarAds = Array.isArray(result)
          ? result
          : (result as any).rows || []
        console.log(
          `Auto-search completed for new flat ${createdFlat.id}: found ${similarAds.length} ads`,
        )

        // Сохраняем найденные объявления в базу данных
        let savedCount = 0
        if (similarAds.length > 0) {
          for (const ad of similarAds) {
            try {
              // Проверяем, существует ли уже такое объявление для этой квартиры
              const existingAd = await db
                .select({ id: ads.id })
                .from(ads)
                .where(and(eq(ads.url, ad.url), eq(ads.flatId, createdFlat.id)))
                .limit(1)

              if (existingAd.length === 0) {
                // Добавляем новое объявление
                await db.insert(ads).values({
                  flatId: createdFlat.id,
                  url: ad.url,
                  address: createdFlat.address,
                  price: ad.price || 0,
                  rooms: ad.rooms || createdFlat.rooms,
                  floor: ad.floor || createdFlat.floor,
                  totalArea: ad.area,
                  kitchenArea: ad.kitchen_area,
                  status: Boolean(ad.is_active),
                  from: 1, // flat-specific ads
                  sma: 0, // not in comparison by default
                  sourceCreated: ad.created ? new Date(ad.created) : null,
                  sourceUpdated: ad.updated ? new Date(ad.updated) : null,
                })
                savedCount++
              }
            } catch (saveError) {
              console.error('Error saving auto-found ad:', saveError)
            }
          }
        }

        console.log(
          `Auto-search for flat ${createdFlat.id}: found ${similarAds.length} ads, saved ${savedCount} new ads`,
        )

        // Возвращаем созданную квартиру вместе с результатами поиска
        return reply.status(201).send({
          flat: createdFlat,
          similarAds: similarAds,
          savedCount: savedCount,
          autoSearchCompleted: true,
        })
      } catch (searchError) {
        console.error('Error in auto-search for new flat:', searchError)
        // В случае ошибки поиска возвращаем только созданную квартиру
        return reply.status(201).send({
          flat: createdFlat,
          similarAds: [],
          savedCount: 0,
          autoSearchCompleted: false,
          searchError:
            searchError instanceof Error
              ? searchError.message
              : String(searchError),
        })
      }
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
      const { tgUserId } = tgUserIdParamsSchema.parse(request.params)
      const { sortBy, search, page } = listUserFlatsQuerySchema.parse(
        request.query ?? {},
      )

      const sortMap = {
        address: userFlats.address,
        address_desc: desc(userFlats.address),
        rooms: userFlats.rooms,
        rooms_desc: desc(userFlats.rooms),
        floor: userFlats.floor,
        floor_desc: desc(userFlats.floor),
        createdAt: userFlats.createdAt,
        createdAt_desc: desc(userFlats.createdAt),
      } as const

      const orderByClause =
        sortMap[sortBy ?? 'createdAt_desc'] ?? desc(userFlats.createdAt)

      let whereClause = eq(userFlats.tgUserId, tgUserId)
      const normalizedSearch = search?.trim()

      if (normalizedSearch) {
        whereClause = and(
          whereClause,
          ilike(userFlats.address, `%${normalizedSearch}%`),
        )
      }

      const limit = 15
      const currentPage = page ?? 1
      const offset = (currentPage - 1) * limit

      const flats = await db
        .select()
        .from(userFlats)
        .where(whereClause)
        .orderBy(orderByClause)
        .limit(limit)
        .offset(offset)

      return reply.send(flats)
    } catch (error) {
      if (error instanceof z.ZodError) {
        request.log.warn(
          { err: error },
          '[user-flats] Invalid params for /user-flats/user/:tgUserId',
        )
        return reply.status(400).send({ error: 'Invalid request' })
      }

      request.log.error(
        { err: error },
        '[user-flats] Failed to fetch flats for user',
      )
      return reply.status(500).send({ error: 'Failed to fetch user flats' })
    }
  })

  // Получить количество квартир пользователя
  fastify.get('/user-flats/user/:tgUserId/count', async (request, reply) => {
    try {
      const { tgUserId } = tgUserIdParamsSchema.parse(request.params)
      const { search } = listUserFlatsQuerySchema
        .pick({ search: true })
        .parse(request.query ?? {})

      let whereClause = eq(userFlats.tgUserId, tgUserId)
      const normalizedSearch = search?.trim()

      if (normalizedSearch) {
        whereClause = and(
          whereClause,
          ilike(userFlats.address, `%${normalizedSearch}%`),
        )
      }

      const result = await db
        .select({ count: sql`count(*)` })
        .from(userFlats)
        .where(whereClause)

      return reply.send({ total: Number(result[0]?.count || 0) })
    } catch (error) {
      if (error instanceof z.ZodError) {
        request.log.warn(
          { err: error },
          '[user-flats] Invalid params for count route',
        )
        return reply.status(400).send({ error: 'Invalid request' })
      }

      request.log.error(
        { err: error },
        '[user-flats] Failed to fetch user flats count',
      )
      return reply
        .status(500)
        .send({ error: 'Failed to fetch user flats count' })
    }
  })

  // Удалить квартиру и всю связанную статистику
  console.log('[user-flats.ts] Регистрация DELETE маршрута /user-flats/:id')
  fastify.delete('/user-flats/:id', async (request, reply) => {
    console.log(
      `[DELETE /user-flats/:id] Запрос на удаление квартиры с ID: ${(request.params as any).id}`,
    )
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

      console.log(
        `[DELETE /user-flats/:id] Существующая квартира найдена: ${existingFlat.length > 0}`,
      )
      if (existingFlat.length > 0) {
        console.log(
          `[DELETE /user-flats/:id] Данные квартиры:`,
          existingFlat[0],
        )
      }

      // Получаем все объявления по этой квартире для удаления истории
      console.log(
        `[DELETE /user-flats/:id] Поиск объявлений для квартиры ID: ${id}`,
      )
      const flatAds = await db
        .select({ id: ads.id })
        .from(ads)
        .where(eq(ads.flatId, id))

      console.log(
        `[DELETE /user-flats/:id] Найдено объявлений: ${flatAds.length}`,
      )
      if (flatAds.length > 0) {
        console.log(
          `[DELETE /user-flats/:id] IDs объявлений:`,
          flatAds.map((ad) => ad.id),
        )
      }

      // Удаляем историю для всех объявлений этой квартиры
      if (flatAds.length > 0) {
        const adIds = flatAds.map((ad) => ad.id)
        console.log(
          `[DELETE /user-flats/:id] Удаление истории для ${adIds.length} объявлений`,
        )

        for (const adId of adIds) {
          await db.delete(adHistory).where(eq(adHistory.adId, adId))
        }
        console.log(`[DELETE /user-flats/:id] Удаление истории завершено`)
      }

      // Удаляем все объявления по этой квартире
      console.log(
        `[DELETE /user-flats/:id] Удаление объявлений для квартиры ID: ${id}`,
      )
      const adsDeleted = await db.delete(ads).where(eq(ads.flatId, id))
      console.log(`[DELETE /user-flats/:id] Объявления удалены`)

      // Удаляем саму квартиру
      console.log(`[DELETE /user-flats/:id] Удаление квартиры ID: ${id}`)
      const deletedFlat = await db
        .delete(userFlats)
        .where(eq(userFlats.id, id))
        .returning()

      console.log(
        `[DELETE /user-flats/:id] Результат удаления квартиры:`,
        deletedFlat,
      )

      if (deletedFlat.length === 0) {
        console.log(`[DELETE /user-flats/:id] Квартира с ID ${id} не найдена`)
        return reply.status(404).send({ error: 'Flat not found' })
      }

      console.log(
        `[DELETE /user-flats/:id] Квартира и связанные данные успешно удалены. ID: ${id}`,
      )
      return reply.send({
        message: 'Flat and all related data deleted successfully',
      })
    } catch (error) {
      console.error(
        `[DELETE /user-flats/:id] Ошибка при удалении квартиры:`,
        error,
      )
      console.error(`[DELETE /user-flats/:id] Stack trace:`, error.stack)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  console.log('[user-flats.ts] Все маршруты зарегистрированы')
}
