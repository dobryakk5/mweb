import { type FastifyInstance } from 'fastify'
import { z } from 'zod'

import { db, ads, adHistory, userFlats } from '@acme/db'
import { eq, and, sql } from 'drizzle-orm'

// Схема для обновления просмотров планировщиком
const dailyUpdateSchema = z.object({
  adId: z.number().positive(),
  viewsToday: z.number().optional(),
  status: z.boolean().optional(),
})

// Helper function to send notification to Telegram
async function sendTelegramNotification(
  fastify: FastifyInstance,
  tgUserId: number,
  adId: number,
  adUrl: string,
  address: string,
  price: number,
  rooms: number,
  changeType: 'new' | 'status_changed',
  oldStatus?: boolean,
  newStatus?: boolean,
) {
  try {
    const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8008'

    let message = ''
    if (changeType === 'new') {
      message =
        `🆕 Новое объявление по вашей квартире!\n\n` +
        `📍 Адрес: ${address}\n` +
        `🏠 Комнат: ${rooms}\n` +
        `💰 Цена: ${price.toLocaleString('ru-RU')} ₽\n` +
        `🔗 Ссылка: ${adUrl}`
    } else if (changeType === 'status_changed') {
      const statusText = newStatus ? '✅ Активно' : '❌ Снято с публикации'
      message =
        `🔄 Изменение статуса объявления\n\n` +
        `📍 Адрес: ${address}\n` +
        `🏠 Комнат: ${rooms}\n` +
        `💰 Цена: ${price.toLocaleString('ru-RU')} ₽\n` +
        `📊 Статус: ${statusText}\n` +
        `🔗 Ссылка: ${adUrl}`
    }

    const response = await fetch(`${pythonApiUrl}/api/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: tgUserId.toString(),
        message: message,
      }),
    })

    if (!response.ok) {
      fastify.log.error(
        `Failed to send Telegram notification: ${response.status}`,
      )
    } else {
      fastify.log.info(
        `Telegram notification sent to user ${tgUserId} for ad ${adId}`,
      )
    }
  } catch (error) {
    fastify.log.error('Error sending Telegram notification:', error)
  }
}

export default async function schedulerRoutes(fastify: FastifyInstance) {
  // POST /scheduler/daily-update - эндпоинт для планировщика
  fastify.post('/scheduler/daily-update', async (request, reply) => {
    try {
      const { adId, viewsToday, status } = dailyUpdateSchema.parse(request.body)

      // Получаем текущие данные объявления
      const currentAd = await db
        .select()
        .from(ads)
        .where(eq(ads.id, adId))
        .limit(1)

      if (currentAd.length === 0) {
        return reply.status(404).send({ error: 'Ad not found' })
      }

      const oldAd = currentAd[0]
      const changes: any = {}

      // Проверяем изменения просмотров
      if (viewsToday !== undefined && viewsToday !== oldAd.viewsToday) {
        changes.viewsToday = viewsToday
        fastify.log.info(
          `Daily update - Ad ${adId}: views today changed from ${oldAd.viewsToday} to ${viewsToday}`,
        )
      }

      // Проверяем изменения статуса
      if (status !== undefined && status !== oldAd.status) {
        changes.status = status
        fastify.log.info(
          `Daily update - Ad ${adId}: status changed from ${oldAd.status} to ${status}`,
        )

        // Отправляем уведомление о смене статуса
        if (oldAd.flatId) {
          const flatData = await db
            .select()
            .from(userFlats)
            .where(eq(userFlats.id, oldAd.flatId))
            .limit(1)
          if (flatData.length > 0) {
            const flat = flatData[0]
            await sendTelegramNotification(
              fastify,
              Number(flat.tgUserId),
              adId,
              oldAd.url,
              oldAd.address,
              oldAd.price,
              oldAd.rooms,
              'status_changed',
              oldAd.status ?? undefined,
              status,
            )
          }
        }
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
      fastify.log.info(
        `Daily update - Ad ${adId}: daily snapshot recorded to history`,
        historyRecord,
      )

      // Всегда обновляем основную таблицу ads (scheduler всегда записывает данные)
      const updateData: any = {
        updatedAt: new Date(),
      }

      // Записываем все полученные данные в основную таблицу
      if (viewsToday !== undefined) updateData.viewsToday = viewsToday
      if (status !== undefined) updateData.status = status

      await db.update(ads).set(updateData).where(eq(ads.id, adId))

      fastify.log.info(
        `Daily update - Ad ${adId}: main table updated with scheduler data`,
      )

      return reply.send({
        success: true,
        adId,
        changes: Object.keys(changes).length,
        message: 'Daily update completed',
      })
    } catch (error) {
      fastify.log.error('Error in daily update:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // POST /scheduler/check-flat-changes - проверка изменений по всем квартирам пользователей
  fastify.post('/scheduler/check-flat-changes', async (request, reply) => {
    try {
      const { days = 1 } = request.body as { days?: number }
      const daysInMs = days * 24 * 60 * 60 * 1000

      // Получаем все квартиры пользователей
      const userFlatsData = await db.select().from(userFlats)

      fastify.log.info(
        `Checking ads changes for ${userFlatsData.length} user flats (last ${days} days)`,
      )

      let totalNewAds = 0
      let totalStatusChanges = 0
      let notificationsSent = 0

      for (const flat of userFlatsData) {
        try {
          // 1. Получаем текущие объявления из users.ads для этой квартиры
          const existingAds = await db
            .select()
            .from(ads)
            .where(eq(ads.flatId, flat.id))

          // Создаем карты для быстрого поиска
          const existingAdsMap = new Map(
            existingAds.map((ad) => [
              `${ad.price}-${ad.rooms}-${ad.floor}`,
              ad,
            ]),
          )

          // 2. Получаем актуальные объявления ПО КВАРТИРЕ через find_ads
          const flatAdsResult = await db.transaction(async (tx) => {
            await tx.execute(sql`SET search_path TO users,public`)
            return await tx.execute(
              sql`SELECT price, rooms, person_type, created, updated, url, is_active, floor, area, kitchen_area
                  FROM public.find_ads(${flat.address}, ${flat.floor}, ${flat.rooms})`,
            )
          })

          const flatAds = Array.isArray(flatAdsResult)
            ? flatAdsResult
            : (flatAdsResult as any).rows || []

          // 3. Получаем актуальные объявления ПО ДОМУ через find_ads (исключая саму квартиру)
          const houseAdsResult = await db.transaction(async (tx) => {
            await tx.execute(sql`SET search_path TO users,public`)
            return await tx.execute(
              sql`SELECT price, rooms, person_type, created, updated, url, is_active, floor, area, kitchen_area
                  FROM public.find_ads(${flat.address}, null, null)
                  WHERE NOT (floor = ${flat.floor} AND rooms = ${flat.rooms})`,
            )
          })

          const houseAds = Array.isArray(houseAdsResult)
            ? houseAdsResult
            : (houseAdsResult as any).rows || []

          // 4. Объединяем все актуальные объявления
          const allCurrentAds = [...flatAds, ...houseAds]

          // 5. Проверяем новые объявления и изменения статусов
          for (const currentAd of allCurrentAds) {
            const adKey = `${currentAd.price}-${currentAd.rooms}-${currentAd.floor}`
            const existingAd = existingAdsMap.get(adKey)

            // 5a. Новое объявление
            if (!existingAd) {
              // Проверяем, что объявление создано или обновлено за указанный период
              const lastUpdate = currentAd.updated || currentAd.created
              const isRecent =
                lastUpdate &&
                new Date(lastUpdate) > new Date(Date.now() - daysInMs)

              if (isRecent && currentAd.is_active) {
                totalNewAds++

                // Отправляем уведомление о новом объявлении
                const adType = flatAds.some(
                  (ad) => `${ad.price}-${ad.rooms}-${ad.floor}` === adKey,
                )
                  ? 'flat'
                  : 'house'

                await sendTelegramNotification(
                  fastify,
                  Number(flat.tgUserId),
                  0, // нет ID, т.к. это новое объявление
                  currentAd.url,
                  flat.address,
                  currentAd.price,
                  currentAd.rooms,
                  'new',
                )
                notificationsSent++

                fastify.log.info(
                  `New ${adType} ad found for flat ${flat.id}: ${currentAd.url}`,
                )
              }
            }
            // 5b. Изменение статуса существующего объявления
            else {
              const oldStatus = existingAd.status ?? false
              const newStatus = currentAd.is_active ?? false

              if (oldStatus !== newStatus) {
                // Проверяем, что объявление обновлялось за указанный период
                const lastUpdate = currentAd.updated || currentAd.created
                const wasUpdatedRecently =
                  lastUpdate &&
                  new Date(lastUpdate) > new Date(Date.now() - daysInMs)

                // Также проверяем updated_at самого объявления в БД
                const adUpdatedRecently =
                  existingAd.updatedAt &&
                  new Date(existingAd.updatedAt) >
                    new Date(Date.now() - daysInMs)

                // Отправляем уведомление только если изменение произошло недавно
                if (wasUpdatedRecently || adUpdatedRecently) {
                  totalStatusChanges++

                  // Отправляем уведомление об изменении статуса
                  await sendTelegramNotification(
                    fastify,
                    Number(flat.tgUserId),
                    existingAd.id,
                    existingAd.url,
                    flat.address,
                    existingAd.price,
                    existingAd.rooms,
                    'status_changed',
                    oldStatus,
                    newStatus,
                  )
                  notificationsSent++

                  fastify.log.info(
                    `Status changed for ad ${existingAd.id}: ${oldStatus} -> ${newStatus} (updated recently)`,
                  )
                } else {
                  fastify.log.debug(
                    `Status changed for ad ${existingAd.id}: ${oldStatus} -> ${newStatus} (but not updated recently, skipping notification)`,
                  )
                }
              }
            }
          }
        } catch (error) {
          fastify.log.error(`Error checking flat ${flat.id}:`, error)
        }
      }

      return reply.send({
        success: true,
        flatsChecked: userFlatsData.length,
        newAds: totalNewAds,
        statusChanges: totalStatusChanges,
        notificationsSent,
        message: 'Flat changes check completed',
      })
    } catch (error) {
      fastify.log.error('Error checking flat changes:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // POST /scheduler/check-single-flat/:flatId - проверка изменений по конкретной квартире
  fastify.post(
    '/scheduler/check-single-flat/:flatId',
    async (request, reply) => {
      try {
        const { flatId } = request.params as { flatId: string }
        const flatIdNum = parseInt(flatId)

        if (isNaN(flatIdNum)) {
          return reply.status(400).send({ error: 'Invalid flat ID' })
        }

        // Получаем данные квартиры
        const flats = await db
          .select()
          .from(userFlats)
          .where(eq(userFlats.id, flatIdNum))
          .limit(1)

        if (flats.length === 0) {
          return reply.status(404).send({ error: 'Flat not found' })
        }

        const flat = flats[0]

        let newAdsFlat = 0
        let newAdsHouse = 0
        let statusChangesFlat = 0
        let statusChangesHouse = 0
        let notificationsSent = 0

        // 1. Получаем текущие объявления из users.ads для этой квартиры
        const existingAds = await db
          .select()
          .from(ads)
          .where(eq(ads.flatId, flat.id))

        const existingAdsMap = new Map(
          existingAds.map((ad) => [`${ad.price}-${ad.rooms}-${ad.floor}`, ad]),
        )

        // 2. Получаем актуальные объявления ПО КВАРТИРЕ через find_ads
        const flatAdsResult = await db.transaction(async (tx) => {
          await tx.execute(sql`SET search_path TO users,public`)
          return await tx.execute(
            sql`SELECT price, rooms, person_type, created, updated, url, is_active, floor, area, kitchen_area
              FROM public.find_ads(${flat.address}, ${flat.floor}, ${flat.rooms})`,
          )
        })

        const flatAds = Array.isArray(flatAdsResult)
          ? flatAdsResult
          : (flatAdsResult as any).rows || []

        // 3. Получаем актуальные объявления ПО ДОМУ через find_ads
        const houseAdsResult = await db.transaction(async (tx) => {
          await tx.execute(sql`SET search_path TO users,public`)
          return await tx.execute(
            sql`SELECT price, rooms, person_type, created, updated, url, is_active, floor, area, kitchen_area
              FROM public.find_ads(${flat.address}, null, null)
              WHERE NOT (floor = ${flat.floor} AND rooms = ${flat.rooms})`,
          )
        })

        const houseAds = Array.isArray(houseAdsResult)
          ? houseAdsResult
          : (houseAdsResult as any).rows || []

        // 4. Проверяем изменения для объявлений по квартире
        for (const currentAd of flatAds) {
          const adKey = `${currentAd.price}-${currentAd.rooms}-${currentAd.floor}`
          const existingAd = existingAdsMap.get(adKey)

          if (!existingAd) {
            const lastUpdate = currentAd.updated || currentAd.created
            const isRecent =
              lastUpdate &&
              new Date(lastUpdate) > new Date(Date.now() - 24 * 60 * 60 * 1000)

            if (isRecent && currentAd.is_active) {
              newAdsFlat++
              await sendTelegramNotification(
                fastify,
                Number(flat.tgUserId),
                0,
                currentAd.url,
                flat.address,
                currentAd.price,
                currentAd.rooms,
                'new',
              )
              notificationsSent++
            }
          } else {
            const oldStatus = existingAd.status ?? false
            const newStatus = currentAd.is_active ?? false

            if (oldStatus !== newStatus) {
              const lastUpdate = currentAd.updated || currentAd.created
              const wasUpdatedRecently =
                lastUpdate &&
                new Date(lastUpdate) >
                  new Date(Date.now() - 24 * 60 * 60 * 1000)
              const adUpdatedRecently =
                existingAd.updatedAt &&
                new Date(existingAd.updatedAt) >
                  new Date(Date.now() - 24 * 60 * 60 * 1000)

              if (wasUpdatedRecently || adUpdatedRecently) {
                statusChangesFlat++
                await sendTelegramNotification(
                  fastify,
                  Number(flat.tgUserId),
                  existingAd.id,
                  existingAd.url,
                  flat.address,
                  existingAd.price,
                  existingAd.rooms,
                  'status_changed',
                  oldStatus,
                  newStatus,
                )
                notificationsSent++
              }
            }
          }
        }

        // 5. Проверяем изменения для объявлений по дому
        for (const currentAd of houseAds) {
          const adKey = `${currentAd.price}-${currentAd.rooms}-${currentAd.floor}`
          const existingAd = existingAdsMap.get(adKey)

          if (!existingAd) {
            const lastUpdate = currentAd.updated || currentAd.created
            const isRecent =
              lastUpdate &&
              new Date(lastUpdate) > new Date(Date.now() - 24 * 60 * 60 * 1000)

            if (isRecent && currentAd.is_active) {
              newAdsHouse++
              await sendTelegramNotification(
                fastify,
                Number(flat.tgUserId),
                0,
                currentAd.url,
                flat.address,
                currentAd.price,
                currentAd.rooms,
                'new',
              )
              notificationsSent++
            }
          } else {
            const oldStatus = existingAd.status ?? false
            const newStatus = currentAd.is_active ?? false

            if (oldStatus !== newStatus) {
              const lastUpdate = currentAd.updated || currentAd.created
              const wasUpdatedRecently =
                lastUpdate &&
                new Date(lastUpdate) >
                  new Date(Date.now() - 24 * 60 * 60 * 1000)
              const adUpdatedRecently =
                existingAd.updatedAt &&
                new Date(existingAd.updatedAt) >
                  new Date(Date.now() - 24 * 60 * 60 * 1000)

              if (wasUpdatedRecently || adUpdatedRecently) {
                statusChangesHouse++
                await sendTelegramNotification(
                  fastify,
                  Number(flat.tgUserId),
                  existingAd.id,
                  existingAd.url,
                  flat.address,
                  existingAd.price,
                  existingAd.rooms,
                  'status_changed',
                  oldStatus,
                  newStatus,
                )
                notificationsSent++
              }
            }
          }
        }

        return reply.send({
          success: true,
          flatId: flat.id,
          address: flat.address,
          newAdsFlat,
          newAdsHouse,
          statusChangesFlat,
          statusChangesHouse,
          notificationsSent,
          message: 'Single flat check completed',
        })
      } catch (error) {
        fastify.log.error('Error checking single flat:', error)
        return reply.status(500).send({ error: 'Internal server error' })
      }
    },
  )

  // POST /scheduler/check-nearby-changes - проверка изменений в радиусе 500м по всем квартирам пользователя
  fastify.post('/scheduler/check-nearby-changes', async (request, reply) => {
    try {
      const { tgUserId, days = 1 } = request.body as {
        tgUserId: number
        days?: number
      }
      const daysInMs = days * 24 * 60 * 60 * 1000

      if (!tgUserId) {
        return reply.status(400).send({ error: 'tgUserId is required' })
      }

      // Получаем все квартиры пользователя
      const userFlatsData = await db
        .select()
        .from(userFlats)
        .where(eq(userFlats.tgUserId, tgUserId))

      fastify.log.info(
        `Checking nearby ads changes for ${userFlatsData.length} user flats (last ${days} days)`,
      )

      let totalNewAds = 0
      let totalStatusChanges = 0
      let notificationsSent = 0

      for (const flat of userFlatsData) {
        try {
          // 1. Получаем текущие объявления из users.ads для этой квартиры
          const existingAds = await db
            .select()
            .from(ads)
            .where(eq(ads.flatId, flat.id))

          const existingAdsMap = new Map(
            existingAds.map((ad) => [
              `${ad.price}-${ad.rooms}-${ad.floor}`,
              ad,
            ]),
          )

          // 2. Получаем минимальную цену из существующих объявлений по квартире для фильтра
          const activeAds = existingAds.filter(
            (ad) => ad.status === true && ad.price,
          )
          const minPrice =
            activeAds.length > 0
              ? Math.min(...activeAds.map((ad) => ad.price || 0))
              : 999999999

          // Получаем площади из первого объявления с площадями
          const adWithAreas = existingAds.find(
            (ad) => ad.totalArea && ad.kitchenArea,
          )
          const minArea = adWithAreas?.totalArea
            ? Number(adWithAreas.totalArea) * 0.9
            : null
          const minKitchenArea = adWithAreas?.kitchenArea
            ? Number(adWithAreas.kitchenArea) * 0.9
            : null

          // 3. Получаем актуальные объявления В РАДИУСЕ 500м через find_nearby_apartments
          const nearbyAdsResult = await db.transaction(async (tx) => {
            await tx.execute(sql`SET search_path TO users,public`)
            return await tx.execute(
              sql`SELECT price, floor, rooms, person_type, created, updated, url, is_active, house_id, distance_m, area, kitchen_area
                  FROM public.find_nearby_apartments(${flat.address}, ${flat.rooms}, ${minPrice}, ${minArea}, ${minKitchenArea}, 500)`,
            )
          })

          const nearbyAds = Array.isArray(nearbyAdsResult)
            ? nearbyAdsResult
            : (nearbyAdsResult as any).rows || []

          fastify.log.info(
            `Found ${nearbyAds.length} nearby ads for flat ${flat.id}`,
          )

          // 4. Проверяем новые объявления и изменения статусов
          for (const currentAd of nearbyAds) {
            const adKey = `${currentAd.price}-${currentAd.rooms}-${currentAd.floor}`
            const existingAd = existingAdsMap.get(adKey)

            // 4a. Новое объявление
            if (!existingAd) {
              const lastUpdate = currentAd.updated || currentAd.created
              const isRecent =
                lastUpdate &&
                new Date(lastUpdate) > new Date(Date.now() - daysInMs)

              if (isRecent && currentAd.is_active) {
                totalNewAds++

                await sendTelegramNotification(
                  fastify,
                  Number(flat.tgUserId),
                  0,
                  currentAd.url,
                  flat.address,
                  currentAd.price,
                  currentAd.rooms,
                  'new',
                )
                notificationsSent++

                fastify.log.info(
                  `New nearby ad found for flat ${flat.id}: ${currentAd.url} (${currentAd.distance_m}m away)`,
                )
              }
            }
            // 4b. Изменение статуса существующего объявления
            else {
              const oldStatus = existingAd.status ?? false
              const newStatus = currentAd.is_active ?? false

              if (oldStatus !== newStatus) {
                const lastUpdate = currentAd.updated || currentAd.created
                const wasUpdatedRecently =
                  lastUpdate &&
                  new Date(lastUpdate) > new Date(Date.now() - daysInMs)

                const adUpdatedRecently =
                  existingAd.updatedAt &&
                  new Date(existingAd.updatedAt) >
                    new Date(Date.now() - daysInMs)

                if (wasUpdatedRecently || adUpdatedRecently) {
                  totalStatusChanges++

                  await sendTelegramNotification(
                    fastify,
                    Number(flat.tgUserId),
                    existingAd.id,
                    existingAd.url,
                    flat.address,
                    existingAd.price,
                    existingAd.rooms,
                    'status_changed',
                    oldStatus,
                    newStatus,
                  )
                  notificationsSent++

                  fastify.log.info(
                    `Status changed for nearby ad ${existingAd.id}: ${oldStatus} -> ${newStatus}`,
                  )
                }
              }
            }
          }
        } catch (error) {
          fastify.log.error(
            `Error checking nearby ads for flat ${flat.id}:`,
            error,
          )
        }
      }

      return reply.send({
        success: true,
        flatsChecked: userFlatsData.length,
        totalNewAds,
        totalStatusChanges,
        notificationsSent,
        message: 'Nearby ads check completed',
      })
    } catch (error) {
      fastify.log.error('Error checking nearby ads changes:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })
}
