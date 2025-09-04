// Устанавливаем DATABASE_URL прямо в код (временно для разработки)
process.env.DATABASE_URL = "postgresql://mwww:ploked@217.114.15.233:5432/realty?search_path=users"

import cron from 'node-cron'
import { db, ads } from '@acme/db'

// Функция для определения источника по URL
function getSourceFromUrl(url: string): 'cian' | 'avito' | 'yandex' | 'unknown' {
  const lowerUrl = url.toLowerCase()
  if (lowerUrl.includes('cian.ru')) return 'cian'
  if (lowerUrl.includes('avito.ru')) return 'avito'
  if (lowerUrl.includes('realty.yandex.ru')) return 'yandex'
  return 'unknown'
}

// Функция для парсинга просмотров и статуса через Python API
async function parseViewsFromUrl(url: string): Promise<{ viewsToday?: number, status?: boolean }> {
  console.log(`🔍 Parsing views and status from: ${url}`)
  
  try {
    // Используем Python API парсер
    const response = await fetch(`http://localhost:8008/api/parse/single?url=${encodeURIComponent(url)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.warn(`⚠️ Parser API error for ${url}: ${response.status}`)
      return {
        viewsToday: undefined, // Нет данных от парсера
        status: undefined,     // Нет данных от парсера
      }
    }

    const propertyData = await response.json()
    console.log(`📊 Parsed data for ${url}:`, propertyData)
    
    // Извлекаем просмотры и статус из ответа парсера
    let viewsToday: number | undefined = undefined
    let status: boolean | undefined = undefined
    
    // Парсим просмотры (могут быть в разных форматах)
    if (propertyData.views_today !== undefined && propertyData.views_today !== null) {
      viewsToday = Number(propertyData.views_today)
    } else if (propertyData.viewsToday !== undefined && propertyData.viewsToday !== null) {
      viewsToday = Number(propertyData.viewsToday)
    }
    
    // Парсим статус активности
    if (propertyData.is_active !== undefined && propertyData.is_active !== null) {
      status = Boolean(propertyData.is_active)
    } else if (propertyData.isActive !== undefined && propertyData.isActive !== null) {
      status = Boolean(propertyData.isActive)
    } else if (propertyData.status !== undefined && propertyData.status !== null) {
      // Если статус строка, проверяем на активность
      const statusStr = String(propertyData.status).toLowerCase()
      status = statusStr === 'active' || statusStr === 'активно' || statusStr === 'true'
    }
    
    return {
      viewsToday: viewsToday,
      status: status,
    }
    
  } catch (error) {
    console.error(`❌ Error parsing ${url}:`, error)
    return {
      viewsToday: undefined, // Нет данных из-за ошибки
      status: undefined,     // Нет данных из-за ошибки
    }
  }
}

// Функция для отправки данных через API
async function sendDailyUpdate(
  adId: number,
  newData: { viewsToday?: number, status?: boolean }
) {
  try {
    const response = await fetch('http://localhost:13001/scheduler/daily-update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        adId: adId,
        viewsToday: newData.viewsToday,
        status: newData.status,
      }),
    })

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`)
    }

    const result = await response.json()
    console.log(`📊 Ad ${adId}: daily update sent successfully, changes: ${result.changes}`)
    return result
  } catch (error) {
    console.error(`❌ Failed to send daily update for ad ${adId}:`, error)
    throw error
  }
}

// Основная функция ежедневного отслеживания
async function performDailyTracking() {
  console.log('🕚 Starting daily views tracking at 23:00...')
  
  try {
    // Получаем все активные объявления, фильтрацию сделаем по URL
    const allAds = await db.select().from(ads)
    
    // Фильтруем объявления по стратегии
    const adsToTrack = allAds.filter(ad => {
      const source = getSourceFromUrl(ad.url)
      return source === 'cian' || // Все CIAN
             (ad.sma === 1 && (source === 'avito' || source === 'yandex')) // Только в сравнении для Avito/Yandex
    })
    
    console.log(`📋 Found ${adsToTrack.length} ads to track out of ${allAds.length} total`)
    
    for (const ad of adsToTrack) {
      try {
        const source = getSourceFromUrl(ad.url)
        console.log(`🔄 Processing ad ${ad.id} from ${source}...`)
        
        // Парсим текущие просмотры и статус
        const currentData = await parseViewsFromUrl(ad.url)
        
        // Отправляем данные через API (API сам запишет в историю и обновит таблицу)
        await sendDailyUpdate(ad.id, currentData)
        
        console.log(`✅ Ad ${ad.id} updated successfully`)
        
        // Пауза между запросами чтобы не нагружать сайты
        await new Promise(resolve => setTimeout(resolve, 2000))
        
      } catch (error) {
        console.error(`❌ Failed to track views for ad ${ad.id}:`, error)
      }
    }
    
    console.log('🎉 Daily views tracking completed!')
    
  } catch (error) {
    console.error('💥 Error in daily tracking:', error)
  }
}

// Планировщик: каждый день в 23:00
cron.schedule('0 23 * * *', async () => {
  await performDailyTracking()
}, {
  timezone: 'Europe/Moscow' // Московское время
})

// Для тестирования: каждую минуту (закомментировано)
// cron.schedule('* * * * *', async () => {
//   console.log('🧪 Test run...')
//   await performDailyTracking()
// })

console.log('📅 Daily views tracking scheduler started')
console.log('⏰ Scheduled to run every day at 23:00 Moscow time')

// Тестовый запуск при старте (для разработки) - закомментировано
// if (process.env.NODE_ENV === 'development') {
//   console.log('🧪 Running test tracking in 5 seconds...')
//   setTimeout(async () => {
//     await performDailyTracking()
//   }, 5000)
// }

// Принудительный запуск если передан аргумент --force
if (process.argv.includes('--force')) {
  console.log('🚀 Force running scheduler...')
  performDailyTracking().then(() => {
    console.log('✅ Force run completed')
    process.exit(0)
  }).catch(error => {
    console.error('❌ Force run failed:', error)
    process.exit(1)
  })
}