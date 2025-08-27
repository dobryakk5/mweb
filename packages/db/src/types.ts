import type { z } from 'zod'

import type {
  selectUserSchema,
  upsertUserSchema,
  getUsersQuerySchema,
  getUsersCountQuerySchema,
} from './schemas'

export type User = z.infer<typeof selectUserSchema>
export type UpsertUser = z.infer<typeof upsertUserSchema>
export type UsersQuerySchema = z.infer<typeof getUsersQuerySchema>
export type UsersCountQuerySchema = z.infer<typeof getUsersCountQuerySchema>

export type { PostgresError } from 'postgres'
