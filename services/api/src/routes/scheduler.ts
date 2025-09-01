import { FastifyInstance } from 'fastify'
import { z } from 'zod'

import { db, ads, adHistory } from '@acme/db'
import { eq } from 'drizzle-orm'

// Схема для обновления просмотров планировщиком
const dailyUpdateSchema = z.object({
  adId: z.number().positive(),
  viewsToday: z.number().optional(),
  totalViews: z.number().optional(),
  status: z.string().optional(),
})

export default async function schedulerRoutes(fastify: FastifyInstance) {
  // POST /scheduler/daily-update - эндпоинт для планировщика
  fastify.post('/scheduler/daily-update', async (request, reply) => {
    try {
      const { adId, viewsToday, totalViews, status } = dailyUpdateSchema.parse(request.body)
      
      // Получаем текущие данные объявления
      const currentAd = await db.select().from(ads).where(eq(ads.id, adId)).limit(1)
      
      if (currentAd.length === 0) {
        return reply.status(404).send({ error: 'Ad not found' })
      }
      
      const oldAd = currentAd[0]
      const changes: any = {}
      
      // Проверяем изменения просмотров
      if (viewsToday !== undefined && viewsToday !== oldAd.viewsToday) {
        changes.viewsToday = viewsToday
        fastify.log.info(`Daily update - Ad ${adId}: views today changed from ${oldAd.viewsToday} to ${viewsToday}`)
      }
      
      if (totalViews !== undefined && totalViews !== oldAd.totalViews) {
        changes.totalViews = totalViews  
        fastify.log.info(`Daily update - Ad ${adId}: total views changed from ${oldAd.totalViews} to ${totalViews}`)
      }
      
      // Проверяем изменения статуса
      if (status !== undefined && status !== oldAd.status) {
        changes.status = status
        fastify.log.info(`Daily update - Ad ${adId}: status changed from ${oldAd.status} to ${status}`)
      }
      
      // Записываем в историю только если есть изменения
      if (Object.keys(changes).length > 0) {
        await db.insert(adHistory).values({
          adId: adId,
          trackingType: 'daily_snapshot',
          ...changes,
        })
        fastify.log.info(`Daily update - Ad ${adId}: changes recorded to history`)
      }
      
      // Обновляем основную таблицу ads
      const updateData: any = {}
      if (viewsToday !== undefined) updateData.viewsToday = viewsToday
      if (totalViews !== undefined) updateData.totalViews = totalViews
      if (status !== undefined) updateData.status = status
      
      if (Object.keys(updateData).length > 0) {
        updateData.updatedAt = new Date()
        
        await db.update(ads)
          .set(updateData)
          .where(eq(ads.id, adId))
        
        fastify.log.info(`Daily update - Ad ${adId}: main table updated`)
      }
      
      return reply.send({ 
        success: true, 
        adId,
        changes: Object.keys(changes).length,
        message: 'Daily update completed'
      })
      
    } catch (error) {
      fastify.log.error('Error in daily update:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })
}