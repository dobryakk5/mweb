import { FastifyInstance } from 'fastify'
import { z } from 'zod'

import { db, ads, userFlats, adHistory } from '@acme/db'
import { eq, sql, inArray } from 'drizzle-orm'

// Функция для записи изменений в историю (только для значимых полей, не просмотров)
async function recordAdChanges(
  adId: number, 
  oldAd: any, 
  newData: any,
  fastify: FastifyInstance
) {
  const changes: any = { adId }
  
  // Проверяем изменение цены (записываем в историю)
  if (newData.price !== undefined && newData.price !== oldAd.price) {
    changes.price = newData.price
    fastify.log.info(`Manual update - Ad ${adId}: price changed from ${oldAd.price} to ${newData.price}`)
  }
  
  // НЕ записываем просмотры в историю при ручном обновлении
  // Просмотры записывает только scheduler
  
  // Проверяем изменение статуса (записываем в историю)
  if (newData.status !== undefined && newData.status !== oldAd.status) {
    changes.status = newData.status
    fastify.log.info(`Manual update - Ad ${adId}: status changed from ${oldAd.status} to ${newData.status}`)
  }
  
  // Записываем изменения в историю если есть что записать (только цена и статус)
  if (Object.keys(changes).length > 1) { // больше 1, так как adId всегда есть
    await db.insert(adHistory).values(changes)
    fastify.log.info(`Manual update - Ad ${adId}: significant changes recorded to history`)
  }
}

const createAdSchema = z.object({
  flatId: z.number().positive(), // ID квартиры
  url: z.string().url(),
  address: z.string().min(1),
  price: z.number().min(0), // Изменено с .positive() на .min(0)
  rooms: z.number().positive(),
  from: z.number().int().min(1).max(2).default(2).optional(), // 1 - найдено по кнопке "Объявления", 2 - добавлено вручную
  sma: z.number().int().min(0).max(1).default(0).optional(), // 0 - обычное объявление, 1 - в сравнении квартир
})

// Схема для обновления объявления с данными от API парсинга
const updateAdSchema = z.object({
  flatId: z.number().positive().optional(),
  url: z.string().url().optional(),
  address: z.string().min(1).optional(),
  price: z.number().min(0).optional(),
  rooms: z.number().positive().optional(),
  
  // Новые поля от API парсинга
  totalArea: z.union([z.string(), z.number()]).optional(),
  livingArea: z.union([z.string(), z.number()]).optional(),
  kitchenArea: z.union([z.string(), z.number()]).optional(),
  floor: z.number().optional(),
  totalFloors: z.number().optional(),
  bathroom: z.string().optional(),
  balcony: z.string().optional(),
  renovation: z.string().optional(),
  furniture: z.string().optional(),
  constructionYear: z.number().optional(),
  houseType: z.string().optional(),
  ceilingHeight: z.union([z.string(), z.number()]).optional(),
  metroStation: z.string().optional(),
  metroTime: z.union([z.string(), z.number()]).optional(),
  tags: z.string().optional(),
  description: z.string().optional(),
  photoUrls: z.array(z.string()).optional(),
  source: z.number().optional(),
  status: z.boolean().optional(),
  viewsToday: z.number().optional(),
  from: z.number().int().min(1).max(2).optional(), // 1 - найдено по кнопке "Объявления", 2 - добавлено вручную
  sma: z.number().int().min(0).max(1).optional(), // 0 - обычное объявление, 1 - в сравнении квартир
})

// Схема для переноса данных в публичные таблицы
const transferToPublicSchema = z.object({
  adIds: z.array(z.number().positive()).min(1).max(100), // Массив ID объявлений, максимум 100 за раз
})

export default async function adsRoutes(fastify: FastifyInstance) {
  // Получить историю изменений объявления из users.ads_history
  fastify.get('/ads/:id/history', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      
      const history = await db
        .select()
        .from(adHistory)
        .where(eq(adHistory.adId, parseInt(id)))
        .orderBy(sql`${adHistory.recordedAt} DESC`)
        .limit(20) // Последние 20 записей
      
      return reply.send(history)
    } catch (error) {
      fastify.log.error(`Error fetching history for ad:`, error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // Получить изменения цены из public.flats_changes по URL объявления
  fastify.get('/ads/:id/price-changes', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      
      // Сначала получаем URL объявления
      const ad = await db.select({ url: ads.url }).from(ads).where(eq(ads.id, parseInt(id))).limit(1)
      
      if (ad.length === 0) {
        return reply.status(404).send({ error: 'Ad not found' })
      }
      
      // Извлекаем avitoid из URL (те же правила что в процедуре)
      const url = ad[0].url
      const avitoidMatch = url.match(/(\d+)\/?$/)
      if (!avitoidMatch) {
        return reply.send([]) // Если не удалось извлечь ID, возвращаем пустой массив
      }
      const avitoid = parseInt(avitoidMatch[1])
      
      // Определяем source_id по URL
      let sourceId: number
      if (url.includes('cian.ru')) {
        sourceId = 4
      } else if (url.includes('avito.ru')) {
        sourceId = 1
      } else if (url.includes('realty.yandex.ru') || url.includes('realty.ya.ru')) {
        sourceId = 3
      } else {
        sourceId = 2
      }
      
      // Получаем изменения цены из public.flats_changes
      const priceChanges = await db.transaction(async (tx) => {
        await tx.execute(sql`SET search_path TO users, public`)
        return await tx.execute(sql`
          SELECT 
            fc.updated as date,
            fc.price,
            fc.is_actual,
            fc.description
          FROM public.flats_changes fc
          JOIN public.flats_history fh ON fc.flats_history_id = fh.id
          WHERE fh.avitoid = ${avitoid} AND fh.source_id = ${sourceId}
          AND fc.price IS NOT NULL
          ORDER BY fc.updated DESC
          LIMIT 50
        `)
      })
      
      // Преобразуем результат в нужный формат
      const changes = Array.isArray(priceChanges) ? priceChanges : (priceChanges as any).rows || []
      
      fastify.log.info(`Found ${changes.length} price changes for ad ${id} (avitoid: ${avitoid}, source: ${sourceId})`)
      
      return reply.send(changes)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      fastify.log.error(`Error fetching price changes for ad: ${errorMessage}`)
      return reply.status(500).send({ error: 'Internal server error', details: errorMessage })
    }
  })

  // Получить агрегированные изменения цены для нескольких объявлений
  fastify.post('/ads/price-changes', async (request, reply) => {
    try {
      const body = z.object({
        adIds: z.array(z.number().positive()).min(1).max(10) // Максимум 10 объявлений для графика
      }).parse(request.body)
      
      fastify.log.info(`Fetching price changes for ads: ${body.adIds}`)
      
      // Получаем URL всех объявлений
      const adsData = await db.select({ id: ads.id, url: ads.url }).from(ads).where(inArray(ads.id, body.adIds))
      
      const allChanges: any[] = []
      
      for (const ad of adsData) {
        try {
          // Извлекаем avitoid и source_id для каждого объявления
          const avitoidMatch = ad.url.match(/(\d+)\/?$/)
          if (!avitoidMatch) continue
          
          const avitoid = parseInt(avitoidMatch[1])
          let sourceId: number
          
          if (ad.url.includes('cian.ru')) {
            sourceId = 4
          } else if (ad.url.includes('avito.ru')) {
            sourceId = 1
          } else if (ad.url.includes('realty.yandex.ru') || ad.url.includes('realty.ya.ru')) {
            sourceId = 3
          } else {
            sourceId = 2
          }
          
          // Получаем изменения для этого объявления
          const changes = await db.transaction(async (tx) => {
            await tx.execute(sql`SET search_path TO users, public`)
            return await tx.execute(sql`
              SELECT 
                fc.updated as date,
                fc.price,
                ${ad.id} as ad_id,
                '${ad.url}' as url
              FROM public.flats_changes fc
              JOIN public.flats_history fh ON fc.flats_history_id = fh.id
              WHERE fh.avitoid = ${avitoid} AND fh.source_id = ${sourceId}
              AND fc.price IS NOT NULL
              ORDER BY fc.updated DESC
              LIMIT 20
            `)
          })
          
          const adChanges = Array.isArray(changes) ? changes : (changes as any).rows || []
          allChanges.push(...adChanges)
          
        } catch (adError) {
          fastify.log.warn(`Error processing ad ${ad.id}: ${adError}`)
        }
      }
      
      // Сортируем все изменения по дате
      allChanges.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      
      fastify.log.info(`Found ${allChanges.length} total price changes for ${body.adIds.length} ads`)
      
      return reply.send(allChanges)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      fastify.log.error(`Error fetching bulk price changes: ${errorMessage}`)
      return reply.status(500).send({ error: 'Internal server error', details: errorMessage })
    }
  })
  // GET /ads - получить все объявления
  fastify.get('/ads', async (request, reply) => {
    try {
      const { flatId } = z.object({ flatId: z.string().optional() }).parse(request.query)
      
      const baseQuery = db.select().from(ads)
      
      const query = flatId 
        ? baseQuery.where(eq(ads.flatId, parseInt(flatId)))
        : baseQuery
      
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
        flatId: body.flatId,
        url: body.url,
        address: body.address,
        price: body.price,
        rooms: body.rooms,
        views: 0, // Добавляем views по умолчанию
        from: body.from || 2, // По умолчанию - добавлено вручную
        sma: body.sma || 0, // По умолчанию - обычное объявление
      }).returning()
      
      return reply.status(201).send(result[0])
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // PATCH /ads/:id - обновить объявление
  fastify.patch('/ads/:id', async (request, reply) => {
    let id: string
    try {
      const params = z.object({ id: z.string() }).parse(request.params)
      id = params.id
      const body = updateAdSchema.parse(request.body)
      
      fastify.log.info(`Updating ad ${id} with data:`, body)
      
      // Логируем каждое поле отдельно
      Object.entries(body).forEach(([key, value]) => {
        fastify.log.info(`Field ${key}: ${value} (type: ${typeof value})`)
      })
      
      // Получаем текущие данные объявления для сравнения
      const currentAd = await db.select().from(ads).where(eq(ads.id, parseInt(id))).limit(1)
      if (currentAd.length > 0) {
        fastify.log.info(`Current ad data before update:`, currentAd[0])
        
        // Записываем изменения в историю перед обновлением
        await recordAdChanges(parseInt(id), currentAd[0], body, fastify)
      }
      
      // Подготавливаем данные для обновления
      const updateData: any = { ...body }
      
      // Конвертируем числовые поля в строки для decimal полей БД
      if (updateData.totalArea !== undefined && typeof updateData.totalArea === 'number') {
        updateData.totalArea = updateData.totalArea.toString()
      }
      if (updateData.livingArea !== undefined && typeof updateData.livingArea === 'number') {
        updateData.livingArea = updateData.livingArea.toString()
      }
      if (updateData.kitchenArea !== undefined && typeof updateData.kitchenArea === 'number') {
        updateData.kitchenArea = updateData.kitchenArea.toString()
      }
      if (updateData.ceilingHeight !== undefined && typeof updateData.ceilingHeight === 'number') {
        updateData.ceilingHeight = updateData.ceilingHeight.toString()
      }
      if (updateData.metroTime !== undefined && typeof updateData.metroTime === 'number') {
        updateData.metroTime = updateData.metroTime.toString()
      }
      
      // Статус уже boolean в БД, конвертация не нужна

      const result = await db.update(ads)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(ads.id, parseInt(id)))
        .returning()
      
      fastify.log.info(`Update result:`, result)
      
      // Получаем обновленные данные для сравнения
      const updatedAd = await db.select().from(ads).where(eq(ads.id, parseInt(id))).limit(1)
      if (updatedAd.length > 0) {
        fastify.log.info(`Updated ad data after update:`, updatedAd[0])
      }
      
      if (result.length === 0) {
        return reply.status(404).send({ error: 'Ad not found' })
      }
      
      return reply.send(result[0])
    } catch (error) {
      fastify.log.error(`Error updating ad ${id || 'unknown'}:`, error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // PUT /ads/:id - полностью заменить объявление (принудительное обновление)
  fastify.put('/ads/:id', async (request, reply) => {
    let adId: string
    try {
      const params = z.object({ id: z.string() }).parse(request.params)
      adId = params.id
      const body = updateAdSchema.parse(request.body)
      
      fastify.log.info(`Force updating ad ${adId} with data:`, body)
      
      // Логируем каждое поле отдельно
      Object.entries(body).forEach(([key, value]) => {
        fastify.log.info(`Field ${key}: ${value} (type: ${typeof value})`)
      })
      
      // Получаем текущие данные объявления для сравнения
      const currentAd = await db.select().from(ads).where(eq(ads.id, parseInt(adId))).limit(1)
      if (currentAd.length > 0) {
        fastify.log.info(`Current ad data before force update:`, currentAd[0])
        
        // Записываем изменения в историю перед принудительным обновлением
        await recordAdChanges(parseInt(adId), currentAd[0], body, fastify)
      }
      
      // Подготавливаем данные для принудительного обновления
      const forceUpdateData: any = { ...body }
      
      // Конвертируем числовые поля в строки для decimal полей БД
      if (forceUpdateData.totalArea !== undefined && typeof forceUpdateData.totalArea === 'number') {
        forceUpdateData.totalArea = forceUpdateData.totalArea.toString()
      }
      if (forceUpdateData.livingArea !== undefined && typeof forceUpdateData.livingArea === 'number') {
        forceUpdateData.livingArea = forceUpdateData.livingArea.toString()
      }
      if (forceUpdateData.kitchenArea !== undefined && typeof forceUpdateData.kitchenArea === 'number') {
        forceUpdateData.kitchenArea = forceUpdateData.kitchenArea.toString()
      }
      if (forceUpdateData.ceilingHeight !== undefined && typeof forceUpdateData.ceilingHeight === 'number') {
        forceUpdateData.ceilingHeight = forceUpdateData.ceilingHeight.toString()
      }
      if (forceUpdateData.metroTime !== undefined && typeof forceUpdateData.metroTime === 'number') {
        forceUpdateData.metroTime = forceUpdateData.metroTime.toString()
      }
      
      // Статус уже boolean в БД, конвертация не нужна

      // Принудительно обновляем все поля
      const result = await db.update(ads)
        .set({
          ...forceUpdateData,
          updatedAt: new Date(),
        })
        .where(eq(ads.id, parseInt(adId)))
        .returning()
      
      fastify.log.info(`Force update result:`, result)
      
      // Получаем обновленные данные для сравнения
      const updatedAd = await db.select().from(ads).where(eq(ads.id, parseInt(adId))).limit(1)
      if (updatedAd.length > 0) {
        fastify.log.info(`Updated ad data after force update:`, updatedAd[0])
      }
      
      if (result.length === 0) {
        return reply.status(404).send({ error: 'Ad not found' })
      }
      
      return reply.send(result[0])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const errorStack = error instanceof Error ? error.stack : 'No stack trace available'
      
      fastify.log.error(`Error force updating ad ${typeof adId !== 'undefined' ? adId : 'unknown'}: ${errorMessage}`)
      fastify.log.error('Full error object:', JSON.stringify(error, null, 2))
      fastify.log.error('Error stack trace:', errorStack)
      
      return reply.status(500).send({ 
        error: 'Internal server error', 
        details: errorMessage,
        adId: typeof adId !== 'undefined' ? adId : 'unknown'
      })
    }
  })

  // GET /ads/broader-by-address/:flatId - найти объявления по адресу без точного определения этажа и комнат
  fastify.get('/ads/broader-by-address/:flatId', async (request, reply) => {
    let flatId: string | undefined
    try {
      const params = z.object({ flatId: z.string() }).parse(request.params)
      flatId = params.flatId
      
      // Получаем данные квартиры для поиска по адресу
      const flats = await db.select().from(userFlats).where(eq(userFlats.id, parseInt(flatId))).limit(1)
      
      if (flats.length === 0) {
        return reply.status(404).send({ error: 'Flat not found' })
      }
      
      const currentFlat = flats[0]
      
      // Используем хранимую процедуру find_ads для поиска по адресу только (этаж и комнаты = null)
      const result = await db.transaction(async (tx) => {
        await tx.execute(sql`SET search_path TO users,public`)
        return await tx.execute(
          sql`SELECT price, rooms, person_type, created, updated, url, is_active, floor 
              FROM public.find_ads(${currentFlat.address}, null, null)`
        )
      })
      
      // Transaction returns results directly as an array, not wrapped in .rows
      const broaderAds = Array.isArray(result) ? result : (result as any).rows || []
      
      fastify.log.info(`Found ${broaderAds.length} broader ads for flat ${flatId} by address only`)
      
      return reply.send(broaderAds)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      fastify.log.error(`Error finding broader ads for flat ${flatId || 'unknown'}: ${errorMessage}`)
      return reply.status(500).send({ error: 'Internal server error', details: errorMessage })
    }
  })

  // GET /ads/similar-by-flat/:flatId - найти похожие объявления по параметрам квартиры
  fastify.get('/ads/similar-by-flat/:flatId', async (request, reply) => {
    let flatId: string | undefined
    try {
      const params = z.object({ flatId: z.string() }).parse(request.params)
      flatId = params.flatId
      
      // Получаем данные квартиры для поиска похожих
      const flats = await db.select().from(userFlats).where(eq(userFlats.id, parseInt(flatId))).limit(1)
      
      if (flats.length === 0) {
        return reply.status(404).send({ error: 'Flat not found' })
      }
      
      const currentFlat = flats[0]
      
      // Используем хранимую процедуру find_ads для поиска
      // Using transaction to ensure search path persists
      const result = await db.transaction(async (tx) => {
        await tx.execute(sql`SET search_path TO users,public`)
        return await tx.execute(
          sql`SELECT price, rooms, person_type, created, updated, url, is_active, floor 
              FROM public.find_ads(${currentFlat.address}, ${currentFlat.floor}, ${currentFlat.rooms})`
        )
      })
      
      // Transaction returns results directly as an array, not wrapped in .rows
      const similarAds = Array.isArray(result) ? result : (result as any).rows || []
      
      fastify.log.info(`Found ${similarAds.length} similar ads for flat ${flatId}`)
      
      return reply.send(similarAds)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      fastify.log.error(`Error finding similar ads for flat ${flatId || 'unknown'}: ${errorMessage}`)
      return reply.status(500).send({ error: 'Internal server error', details: errorMessage })
    }
  })

  // GET /ads/similar/:id - найти похожие объявления
  fastify.get('/ads/similar/:id', async (request, reply) => {
    let id: string | undefined
    try {
      const params = z.object({ id: z.string() }).parse(request.params)
      id = params.id
      
      // Получаем данные объявления для поиска похожих
      const ad = await db.select().from(ads).where(eq(ads.id, parseInt(id))).limit(1)
      
      if (ad.length === 0) {
        return reply.status(404).send({ error: 'Ad not found' })
      }
      
      const currentAd = ad[0]
      
      // Вызываем хранимую процедуру поиска похожих объявлений
      const result = await db.transaction(async (tx) => {
        await tx.execute(sql`SET search_path TO users,public`)
        return await tx.execute(
          sql`SELECT price, rooms, person_type, created, updated, url, is_active 
              FROM public.find_ads(${currentAd.address}, ${currentAd.floor}, ${currentAd.rooms})`
        )
      })
      
      // Transaction returns results directly as an array, not wrapped in .rows
      const similarAds = Array.isArray(result) ? result : (result as any).rows || []
      
      fastify.log.info(`Found ${similarAds.length} similar ads for ad ${id}`)
      
      return reply.send(similarAds)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      fastify.log.error(`Error finding similar ads for ${id || 'unknown'}: ${errorMessage}`)
      return reply.status(500).send({ error: 'Internal server error', details: errorMessage })
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

  // POST /ads/transfer-to-public - перенести объявления в публичные таблицы
  fastify.post('/ads/transfer-to-public', async (request, reply) => {
    try {
      const body = transferToPublicSchema.parse(request.body)
      
      fastify.log.info(`Transferring ${body.adIds.length} ads to public tables:`, body.adIds)
      
      // Проверяем, что все указанные объявления существуют
      const existingAds = await db.select({ id: ads.id })
        .from(ads)
        .where(inArray(ads.id, body.adIds))
      
      const existingIds = existingAds.map(ad => ad.id)
      const missingIds = body.adIds.filter(id => !existingIds.includes(id))
      
      if (missingIds.length > 0) {
        fastify.log.warn(`Some ads not found: ${missingIds}`)
        return reply.status(400).send({ 
          error: 'Some ads not found', 
          missingIds,
          existingIds 
        })
      }
      
      // Вызываем процедуру переноса данных
      await db.transaction(async (tx) => {
        await tx.execute(sql`SET search_path TO users, public`)
        // Преобразуем массив в PostgreSQL формат
        const arrayParam = `{${body.adIds.join(',')}}`
        await tx.execute(
          sql`CALL users.transfer_user_ads_to_public(${arrayParam}::INTEGER[])`
        )
      })
      
      fastify.log.info(`Successfully transferred ${body.adIds.length} ads to public tables`)
      
      return reply.send({ 
        success: true,
        message: `Successfully transferred ${body.adIds.length} ads to public tables`,
        transferredIds: body.adIds
      })
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      fastify.log.error(`Error transferring ads to public tables: ${errorMessage}`)
      
      return reply.status(500).send({ 
        error: 'Internal server error', 
        details: errorMessage 
      })
    }
  })
}
