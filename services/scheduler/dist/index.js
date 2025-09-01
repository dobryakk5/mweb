"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const db_1 = require("@acme/db");
// Функция для определения источника по URL
function getSourceFromUrl(url) {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('cian.ru'))
        return 'cian';
    if (lowerUrl.includes('avito.ru'))
        return 'avito';
    if (lowerUrl.includes('realty.yandex.ru'))
        return 'yandex';
    return 'unknown';
}
// Функция для парсинга просмотров и статуса (заглушка для будущей реализации)
async function parseViewsFromUrl(url) {
    console.log(`🔍 Parsing views and status from: ${url}`);
    // Здесь будет реальная логика парсинга
    // Сейчас возвращаем заглушку
    const statuses = ['active', 'inactive', 'sold', 'archived'];
    return {
        viewsToday: Math.floor(Math.random() * 50), // Заглушка
        totalViews: Math.floor(Math.random() * 1000) + 500, // Заглушка
        status: statuses[Math.floor(Math.random() * statuses.length)], // Заглушка
    };
}
// Функция для отправки данных через API
async function sendDailyUpdate(adId, newData) {
    try {
        const response = await fetch('http://localhost:13001/scheduler/daily-update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                adId: adId,
                viewsToday: newData.viewsToday,
                totalViews: newData.totalViews,
                status: newData.status,
            }),
        });
        if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`);
        }
        const result = await response.json();
        console.log(`📊 Ad ${adId}: daily update sent successfully, changes: ${result.changes}`);
        return result;
    }
    catch (error) {
        console.error(`❌ Failed to send daily update for ad ${adId}:`, error);
        throw error;
    }
}
// Основная функция ежедневного отслеживания
async function performDailyTracking() {
    console.log('🕚 Starting daily views tracking at 23:00...');
    try {
        // Получаем все активные объявления, фильтрацию сделаем по URL
        const allAds = await db_1.db.select().from(db_1.ads);
        // Фильтруем объявления по стратегии
        const adsToTrack = allAds.filter(ad => {
            const source = getSourceFromUrl(ad.url);
            return source === 'cian' || // Все CIAN
                (ad.sma === 1 && (source === 'avito' || source === 'yandex')); // Только в сравнении для Avito/Yandex
        });
        console.log(`📋 Found ${adsToTrack.length} ads to track out of ${allAds.length} total`);
        for (const ad of adsToTrack) {
            try {
                const source = getSourceFromUrl(ad.url);
                console.log(`🔄 Processing ad ${ad.id} from ${source}...`);
                // Парсим текущие просмотры и статус
                const currentData = await parseViewsFromUrl(ad.url);
                // Отправляем данные через API (API сам запишет в историю и обновит таблицу)
                await sendDailyUpdate(ad.id, currentData);
                console.log(`✅ Ad ${ad.id} updated successfully`);
                // Пауза между запросами чтобы не нагружать сайты
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            catch (error) {
                console.error(`❌ Failed to track views for ad ${ad.id}:`, error);
            }
        }
        console.log('🎉 Daily views tracking completed!');
    }
    catch (error) {
        console.error('💥 Error in daily tracking:', error);
    }
}
// Планировщик: каждый день в 23:00
node_cron_1.default.schedule('0 23 * * *', async () => {
    await performDailyTracking();
}, {
    timezone: 'Europe/Moscow' // Московское время
});
// Для тестирования: каждую минуту (закомментировано)
// cron.schedule('* * * * *', async () => {
//   console.log('🧪 Test run...')
//   await performDailyTracking()
// })
console.log('📅 Daily views tracking scheduler started');
console.log('⏰ Scheduled to run every day at 23:00 Moscow time');
// Тестовый запуск при старте (для разработки)
if (process.env.NODE_ENV === 'development') {
    console.log('🧪 Running test tracking in 5 seconds...');
    setTimeout(async () => {
        await performDailyTracking();
    }, 5000);
}
