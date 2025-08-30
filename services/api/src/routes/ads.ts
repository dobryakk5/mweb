import { FastifyInstance } from 'fastify'
import { z } from 'zod'

import { db, ads } from '@acme/db'
import { eq } from 'drizzle-orm'

const createAdSchema = z.object({
  flatId: z.number().positive(), // ID квартиры
  url: z.string().url(),
  address: z.string().min(1),
  price: z.number().min(0), // Изменено с .positive() на .min(0)
  rooms: z.number().positive(),
})

// Схема для обновления объявления с данными от API парсинга
const updateAdSchema = z.object({
  flatId: z.number().positive().optional(),
  url: z.string().url().optional(),
  address: z.string().min(1).optional(),
  price: z.number().min(0).optional(),
  rooms: z.number().positive().optional(),
  
  // Новые поля от API парсинга
  totalArea: z.string().optional(),
  livingArea: z.string().optional(),
  kitchenArea: z.string().optional(),
  floor: z.string().optional(),
  totalFloors: z.number().optional(),
  bathroom: z.string().optional(),
  balcony: z.string().optional(),
  renovation: z.string().optional(),
  furniture: z.string().optional(),
  constructionYear: z.number().optional(),
  houseType: z.string().optional(),
  ceilingHeight: z.string().optional(),
  metroStation: z.string().optional(),
  metroTime: z.string().optional(),
  tags: z.string().optional(),
  description: z.string().optional(),
  photoUrls: z.array(z.string()).optional(),
  source: z.string().optional(),
  status: z.string().optional(),
  viewsToday: z.number().optional(),
  totalViews: z.number().optional(),
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
      }
      
      const result = await db.update(ads)
        .set({
          ...body,
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
      fastify.log.error(`Error updating ad ${id}:`, error)
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
      }
      
      // Принудительно обновляем все поля
      const result = await db.update(ads)
        .set({
          ...body,
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
      fastify.log.error(`Error force updating ad ${adId || 'unknown'}:`, error)
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
