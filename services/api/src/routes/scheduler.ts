import { type FastifyInstance } from 'fastify'
import { z } from 'zod'

import { db, ads, adHistory } from '@acme/db'
import { eq } from 'drizzle-orm'

// Схема для обновления просмотров планировщиком
const dailyUpdateSchema = z.object({
  adId: z.number().positive(),
  viewsToday: z.number().optional(),
  status: z.boolean().optional(),
})

export default async function schedulerRoutes(fastify: FastifyInstance) {
  // POST /scheduler/daily-update - эндпоинт для планировщика
  fastify.post('/scheduler/daily-update', async (request, reply) => {
    try {
      const { adId, viewsToday, status } = dailyUpdateSchema.parse(request.body)
      
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
      
      
      // Проверяем изменения статуса
      if (status !== undefined && status !== oldAd.status) {
        changes.status = status
        fastify.log.info(`Daily update - Ad ${adId}: status changed from ${oldAd.status} to ${status}`)
      }
      
      // Всегда записываем ежедневный снимок в историю (независимо от изменений)
      const historyRecord: any = {
        adId: adId,
        price: oldAd.price, // Всегда записываем текущую цену
      }
      
      // Записываем только те поля, которые пришли от парсера
      // Если данных нет (undefined), то поле не записывается (будет NULL в БД)
      if (viewsToday !== undefined) {
        historyRecord.viewsToday = viewsToday
      }
      if (status !== undefined) {
        historyRecord.status = status
      }
      
      await db.insert(adHistory).values(historyRecord)
      fastify.log.info(`Daily update - Ad ${adId}: daily snapshot recorded to history`, historyRecord)
      
      // Всегда обновляем основную таблицу ads (scheduler всегда записывает данные)
      const updateData: any = {
        updatedAt: new Date()
      }
      
      // Записываем все полученные данные в основную таблицу
      if (viewsToday !== undefined) updateData.viewsToday = viewsToday
      if (status !== undefined) updateData.status = status
      
      await db.update(ads)
        .set(updateData)
        .where(eq(ads.id, adId))
      
      fastify.log.info(`Daily update - Ad ${adId}: main table updated with scheduler data`)
      
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