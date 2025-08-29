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

export interface TelegramUser {
  id: string
  tgUserId: number
  firstName?: string
  lastName?: string
  username?: string
  photoUrl?: string
  createdAt: Date
  updatedAt: Date
}

export interface Session {
  id: string
  tgUserId: number
  sessionToken: string
  expiresAt: string
  createdAt: Date
  updatedAt: Date
}

export interface UserFlat {
  id: number
  tgUserId: number
  address: string
  rooms: number
  floor: number
  createdAt: Date
  updatedAt: Date
}

export interface Ad {
  id: number
  flatId: number // Привязка к квартире
  url: string
  address: string
  price: number
  rooms: number
  views: number
  createdAt: Date
  updatedAt: Date
}

export type { PostgresError } from 'postgres'
