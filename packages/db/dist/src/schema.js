"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adHistoryRelations = exports.adsRelations = exports.userFlatsRelations = exports.adHistory = exports.ads = exports.userFlats = exports.sessions = exports.telegramUsers = exports.users = exports.usersSchema = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
const utils_1 = require("./utils");
// Создаем схему users
exports.usersSchema = (0, pg_core_1.pgSchema)('users');
exports.users = exports.usersSchema.table('users', {
    ...utils_1.id,
    username: (0, pg_core_1.varchar)('username').notNull().unique(),
    email: (0, pg_core_1.varchar)('email').notNull().unique(),
    firstName: (0, pg_core_1.varchar)('first_name').notNull(),
    lastName: (0, pg_core_1.varchar)('last_name').notNull(),
    ...utils_1.timestamps,
}, (t) => [
    (0, pg_core_1.index)('users_username_idx').on(t.username),
    (0, pg_core_1.index)('users_email_idx').on(t.email),
]);
exports.telegramUsers = exports.usersSchema.table('telegram_users', {
    ...utils_1.id,
    tgUserId: (0, pg_core_1.bigint)('tg_user_id', { mode: 'number' }).notNull().unique(),
    firstName: (0, pg_core_1.varchar)('first_name'),
    lastName: (0, pg_core_1.varchar)('last_name'),
    username: (0, pg_core_1.varchar)('username'),
    photoUrl: (0, pg_core_1.varchar)('photo_url'),
    ...utils_1.timestamps,
}, (t) => [(0, pg_core_1.index)('telegram_users_tg_user_id_idx').on(t.tgUserId)]);
exports.sessions = exports.usersSchema.table('sessions', {
    ...utils_1.id,
    tgUserId: (0, pg_core_1.bigint)('tg_user_id', { mode: 'number' }).notNull(),
    sessionToken: (0, pg_core_1.varchar)('session_token').notNull().unique(),
    expiresAt: (0, pg_core_1.varchar)('expires_at').notNull(),
    ...utils_1.timestamps,
}, (t) => [
    (0, pg_core_1.index)('sessions_tg_user_id_idx').on(t.tgUserId),
    (0, pg_core_1.index)('sessions_token_idx').on(t.sessionToken),
]);
exports.userFlats = exports.usersSchema.table('user_flats', {
    id: (0, pg_core_1.integer)('id').primaryKey().generatedAlwaysAsIdentity(),
    tgUserId: (0, pg_core_1.bigint)('tg_user_id', { mode: 'number' }).notNull(),
    address: (0, pg_core_1.varchar)('address').notNull(),
    rooms: (0, pg_core_1.integer)('rooms').notNull(),
    floor: (0, pg_core_1.integer)('floor').notNull(),
    ...utils_1.timestamps,
}, (t) => [(0, pg_core_1.index)('user_flats_tg_user_id_idx').on(t.tgUserId)]);
exports.ads = exports.usersSchema.table('ads', {
    id: (0, pg_core_1.integer)('id').primaryKey().generatedAlwaysAsIdentity(),
    flatId: (0, pg_core_1.integer)('flat_id').notNull(), // Привязка к квартире
    url: (0, pg_core_1.varchar)('url').notNull(),
    address: (0, pg_core_1.varchar)('address').notNull(),
    price: (0, pg_core_1.integer)('price').notNull(),
    rooms: (0, pg_core_1.integer)('rooms').notNull(),
    views: (0, pg_core_1.integer)('views').default(0).notNull(),
    // Новые колонки для данных от API парсинга
    totalArea: (0, pg_core_1.decimal)('total_area', { precision: 5, scale: 2 }),
    livingArea: (0, pg_core_1.decimal)('living_area', { precision: 5, scale: 2 }),
    kitchenArea: (0, pg_core_1.decimal)('kitchen_area', { precision: 5, scale: 2 }),
    floor: (0, pg_core_1.smallint)('floor'),
    totalFloors: (0, pg_core_1.smallint)('total_floors'),
    bathroom: (0, pg_core_1.varchar)('bathroom'),
    balcony: (0, pg_core_1.varchar)('balcony'),
    renovation: (0, pg_core_1.varchar)('renovation'),
    furniture: (0, pg_core_1.varchar)('furniture'),
    constructionYear: (0, pg_core_1.smallint)('construction_year'),
    houseType: (0, pg_core_1.varchar)('house_type'),
    ceilingHeight: (0, pg_core_1.decimal)('ceiling_height', { precision: 3, scale: 2 }),
    metroStation: (0, pg_core_1.varchar)('metro_station'),
    metroTime: (0, pg_core_1.varchar)('metro_time'),
    tags: (0, pg_core_1.text)('tags'),
    description: (0, pg_core_1.text)('description'),
    photoUrls: (0, pg_core_1.text)('photo_urls').array(),
    source: (0, pg_core_1.smallint)('source'),
    status: (0, pg_core_1.boolean)('status'),
    viewsToday: (0, pg_core_1.smallint)('views_today'),
    from: (0, pg_core_1.smallint)('from').default(2).notNull(), // 1 - найдено по кнопке "Объявления", 2 - добавлено вручную
    sma: (0, pg_core_1.smallint)('sma').default(0).notNull(), // 0 - обычное объявление, 1 - в сравнении квартир
    // Временные метки из источника
    sourceCreated: (0, pg_core_1.timestamp)('source_created'), // Время создания из источника
    sourceUpdated: (0, pg_core_1.timestamp)('source_updated'), // Время обновления из источника
    ...utils_1.timestamps,
}, (t) => [
    (0, pg_core_1.index)('ads_flat_id_idx').on(t.flatId), // Индекс для быстрого поиска по квартире
    (0, pg_core_1.index)('ads_address_idx').on(t.address),
    (0, pg_core_1.index)('ads_price_idx').on(t.price),
    (0, pg_core_1.index)('ads_sma_idx').on(t.sma), // Индекс для фильтрации объявлений в сравнении
    (0, pg_core_1.index)('ads_flat_sma_idx').on(t.flatId, t.sma), // Композитный индекс для частых запросов
]);
exports.adHistory = exports.usersSchema.table('ad_history', {
    id: (0, pg_core_1.integer)('id').primaryKey().generatedAlwaysAsIdentity(),
    adId: (0, pg_core_1.integer)('ad_id').notNull(),
    price: (0, pg_core_1.integer)('price'),
    viewsToday: (0, pg_core_1.integer)('views_today'),
    recordedAt: (0, pg_core_1.timestamp)('recorded_at').defaultNow(),
    status: (0, pg_core_1.boolean)('status'),
    updatedAt: (0, pg_core_1.timestamp)('updated_at'),
}, (t) => [(0, pg_core_1.index)('ad_history_ad_id_idx').on(t.adId)]);
// Определяем связи между таблицами
exports.userFlatsRelations = (0, drizzle_orm_1.relations)(exports.userFlats, ({ many }) => ({
    ads: many(exports.ads),
}));
exports.adsRelations = (0, drizzle_orm_1.relations)(exports.ads, ({ one, many }) => ({
    flat: one(exports.userFlats, {
        fields: [exports.ads.flatId],
        references: [exports.userFlats.id],
    }),
    history: many(exports.adHistory),
}));
exports.adHistoryRelations = (0, drizzle_orm_1.relations)(exports.adHistory, ({ one }) => ({
    ad: one(exports.ads, {
        fields: [exports.adHistory.adId],
        references: [exports.ads.id],
    }),
}));
//# sourceMappingURL=schema.js.map