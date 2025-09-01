import db from './db'
import { users, ads } from './schema'
import { eq } from './orm'
import type { UpsertUser } from './types'

// ========== USERS MUTATIONS (существующие) ==========

export async function addUser(
  values: Pick<UpsertUser, 'username' | 'firstName' | 'lastName' | 'email'>,
) {
  return await db.insert(users).values({
    username: values.username!,
    firstName: values.firstName!,
    lastName: values.lastName!,
    email: values.email!,
  }).returning({ id: users.id })
}

export async function updateUserById(id: string, values: Partial<UpsertUser>) {
  return await db
    .update(users)
    .set({
      ...values,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning({
      id: users.id,
      username: users.username,
      firstName: users.firstName,
      lastName: users.lastName,
    })
}

export async function deleteUserById(id: string) {
  return await db.delete(users).where(eq(users.id, id))
}

// ========== ADS MUTATIONS (новые) ==========

// Типы для работы с ads
export type CreateAd = {
  flatId: number
  url: string
  address: string
  price: number
  rooms: number
}

export type UpdateAd = {
  address?: string
  price?: number
  rooms?: number
  totalArea?: string
  livingArea?: string
  kitchenArea?: string
  floor?: number
  totalFloors?: number
  bathroom?: string
  balcony?: string
  renovation?: string
  furniture?: string
  constructionYear?: number
  houseType?: string
  ceilingHeight?: string
  metroStation?: string
  metroTime?: string
  tags?: string
  description?: string
  photoUrls?: string[]
  source?: number
  status?: string
  viewsToday?: number
  totalViews?: number
}

// Создать новое объявление
export async function addAd(values: CreateAd) {
  return await db.insert(ads).values({
    flatId: values.flatId,
    url: values.url,
    address: values.address,
    price: values.price,
    rooms: values.rooms,
    views: 0,
  }).returning({ 
    id: ads.id,
    url: ads.url,
    flatId: ads.flatId 
  })
}

// Обновить объявление по ID (НЕ трогаем id, url, flatId)
export async function updateAdById(id: number, values: UpdateAd) {
  const updateData: any = {
    updatedAt: new Date(),
  }

  // Обновляем только переданные поля
  if (values.address !== undefined) updateData.address = values.address
  if (values.price !== undefined) updateData.price = values.price
  if (values.rooms !== undefined) updateData.rooms = values.rooms
  if (values.totalArea !== undefined) updateData.totalArea = values.totalArea
  if (values.livingArea !== undefined) updateData.livingArea = values.livingArea
  if (values.kitchenArea !== undefined) updateData.kitchenArea = values.kitchenArea
  if (values.floor !== undefined) updateData.floor = values.floor
  if (values.totalFloors !== undefined) updateData.totalFloors = values.totalFloors
  if (values.bathroom !== undefined) updateData.bathroom = values.bathroom
  if (values.balcony !== undefined) updateData.balcony = values.balcony
  if (values.renovation !== undefined) updateData.renovation = values.renovation
  if (values.furniture !== undefined) updateData.furniture = values.furniture
  if (values.constructionYear !== undefined) updateData.constructionYear = values.constructionYear
  if (values.houseType !== undefined) updateData.houseType = values.houseType
  if (values.ceilingHeight !== undefined) updateData.ceilingHeight = values.ceilingHeight
  if (values.metroStation !== undefined) updateData.metroStation = values.metroStation
  if (values.metroTime !== undefined) updateData.metroTime = values.metroTime
  if (values.tags !== undefined) updateData.tags = values.tags
  if (values.description !== undefined) updateData.description = values.description
  if (values.photoUrls !== undefined) updateData.photoUrls = values.photoUrls
  if (values.source !== undefined) updateData.source = values.source
  if (values.status !== undefined) updateData.status = values.status
  if (values.viewsToday !== undefined) updateData.viewsToday = values.viewsToday
  if (values.totalViews !== undefined) updateData.totalViews = values.totalViews

  return await db
    .update(ads)
    .set(updateData)
    .where(eq(ads.id, id))
    .returning({
      id: ads.id,
      url: ads.url,
      flatId: ads.flatId,
      address: ads.address,
      price: ads.price,
      updatedAt: ads.updatedAt,
    })
}

// Обновить объявление по URL (находим по URL, обновляем по ID)
export async function updateAdByUrl(url: string, values: UpdateAd) {
  // Сначала находим запись по URL
  const existingAd = await db
    .select({ id: ads.id })
    .from(ads)
    .where(eq(ads.url, url))
    .limit(1)

  if (existingAd.length === 0) {
    throw new Error(`No ad found with URL: ${url}`)
  }

  const adToUpdate = existingAd[0]
  if (!adToUpdate) {
    throw new Error(`Ad data is undefined for URL: ${url}`)
  }

  // Обновляем найденную запись
  return await updateAdById(adToUpdate.id, values)
}

// Получить объявление по URL
export async function getAdByUrl(url: string) {
  return await db
    .select()
    .from(ads)
    .where(eq(ads.url, url))
    .limit(1)
}

// Получить объявление по ID
export async function getAdById(id: number) {
  return await db
    .select()
    .from(ads)
    .where(eq(ads.id, id))
    .limit(1)
}

// Получить все объявления для квартиры
export async function getAdsByFlatId(flatId: number) {
  return await db
    .select()
    .from(ads)
    .where(eq(ads.flatId, flatId))
    .orderBy(ads.createdAt)
}

// Удалить объявление по ID
export async function deleteAdById(id: number) {
  return await db.delete(ads).where(eq(ads.id, id))
}

// Удалить объявление по URL
export async function deleteAdByUrl(url: string) {
  return await db.delete(ads).where(eq(ads.url, url))
}