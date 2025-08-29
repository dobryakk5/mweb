import { createSelectSchema, createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

import { users, userFlats, ads } from './schema'

export const selectUserSchema = createSelectSchema(users)
export const upsertUserSchema = createInsertSchema(users, {
  firstName: z.string().min(2).max(20),
  lastName: z.string().min(2).max(20),
  username: z.string().min(2).max(20),
  email: z.string().email(),
})

const UsersQuerySchema = z.object({
  search: z.string().optional(),
})

export const getUsersQuerySchema = UsersQuerySchema.merge(
  z.object({
    sortBy: z.enum(['createdAt', 'firstName']).optional().default('createdAt'),
    page: z.coerce.number().optional(),
  }),
)

export const getUsersCountQuerySchema = UsersQuerySchema

// User flats schemas
export const selectUserFlatSchema = createSelectSchema(userFlats)
export const insertUserFlatSchema = createInsertSchema(userFlats)

export const selectAdSchema = createSelectSchema(ads)
export const insertAdSchema = createInsertSchema(ads)

// Экспортируем таблицы для использования в API
export { ads, userFlats, users }


