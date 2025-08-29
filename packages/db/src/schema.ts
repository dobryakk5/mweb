import { pgTable, varchar, index, bigint, integer, pgSchema, decimal, smallint, text } from 'drizzle-orm/pg-core'

import { id, timestamps } from './utils'

// Создаем схему users
export const usersSchema = pgSchema('users')

export const users = usersSchema.table(
  'users',
  {
    ...id,
    username: varchar('username').notNull().unique(),
    email: varchar('email').notNull().unique(),
    firstName: varchar('first_name').notNull(),
    lastName: varchar('last_name').notNull(),
    ...timestamps,
  },
  (t) => [
    index('users_username_idx').on(t.username),
    index('users_email_idx').on(t.email),
  ],
)

export const telegramUsers = usersSchema.table(
  'telegram_users',
  {
    ...id,
    tgUserId: bigint('tg_user_id', { mode: 'number' }).notNull().unique(),
    firstName: varchar('first_name'),
    lastName: varchar('last_name'),
    username: varchar('username'),
    photoUrl: varchar('photo_url'),
    ...timestamps,
  },
  (t) => [
    index('telegram_users_tg_user_id_idx').on(t.tgUserId),
  ],
)

export const sessions = usersSchema.table(
  'sessions',
  {
    ...id,
    tgUserId: bigint('tg_user_id', { mode: 'number' }).notNull(),
    sessionToken: varchar('session_token').notNull().unique(),
    expiresAt: varchar('expires_at').notNull(),
    ...timestamps,
  },
  (t) => [
    index('sessions_tg_user_id_idx').on(t.tgUserId),
    index('sessions_token_idx').on(t.sessionToken),
  ],
)

export const userFlats = usersSchema.table(
  'user_flats',
  {
    id: integer('id').primaryKey().notNull(),
    tgUserId: bigint('tg_user_id', { mode: 'number' }).notNull(),
    address: varchar('address').notNull(),
    rooms: integer('rooms').notNull(),
    floor: integer('floor').notNull(),
    ...timestamps,
  },
  (t) => [
    index('user_flats_tg_user_id_idx').on(t.tgUserId),
  ],
)

export const ads = usersSchema.table(
  'ads',
  {
    id: integer('id').primaryKey().notNull(),
    flatId: integer('flat_id').notNull(), // Привязка к квартире
    url: varchar('url').notNull(),
    address: varchar('address').notNull(),
    price: integer('price').notNull(),
    rooms: integer('rooms').notNull(),
    views: integer('views').default(0).notNull(),
    
    // Новые колонки для данных от API парсинга
    totalArea: decimal('total_area', { precision: 5, scale: 2 }),
    livingArea: decimal('living_area', { precision: 5, scale: 2 }),
    kitchenArea: decimal('kitchen_area', { precision: 5, scale: 2 }),
    totalFloors: smallint('total_floors'),
    bathroom: varchar('bathroom'),
    balcony: varchar('balcony'),
    renovation: varchar('renovation'),
    furniture: varchar('furniture'),
    constructionYear: smallint('construction_year'),
    houseType: varchar('house_type'),
    ceilingHeight: decimal('ceiling_height', { precision: 3, scale: 2 }),
    metroStation: varchar('metro_station'),
    metroTime: varchar('metro_time'),
    tags: text('tags'),
    description: text('description'),
    photoUrls: text('photo_urls').array(),
    source: smallint('source'),
    status: varchar('status'),
    viewsToday: smallint('views_today'),
    totalViews: integer('total_views'),
    
    ...timestamps,
  },
  (t) => [
    index('ads_flat_id_idx').on(t.flatId), // Индекс для быстрого поиска по квартире
    index('ads_address_idx').on(t.address),
    index('ads_price_idx').on(t.price),
  ],
)
