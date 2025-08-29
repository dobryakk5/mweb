import api from '@/lib/api'

export interface CreateAdData {
  flatId: number // ID квартиры
  url: string
  address: string
  price: number
  rooms: number
}

export interface UpdateAdData extends Partial<CreateAdData> {
  // Новые поля от API парсинга
  totalArea?: number
  livingArea?: number
  kitchenArea?: number
  totalFloors?: number
  bathroom?: string
  balcony?: string
  renovation?: string
  furniture?: string
  constructionYear?: number
  houseType?: string
  ceilingHeight?: number
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

export interface Ad {
  id: number
  flatId: number // ID квартиры
  url: string
  address: string
  price: number
  rooms: number
  views: number
  createdAt: string
  updatedAt: string
  
  // Новые поля от API парсинга
  totalArea?: number
  livingArea?: number
  kitchenArea?: number
  totalFloors?: number
  bathroom?: string
  balcony?: string
  renovation?: string
  furniture?: string
  constructionYear?: number
  houseType?: string
  ceilingHeight?: number
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

export async function fetchAds(filters: { search?: string; sortBy?: string; page?: number; flatId?: number } = {}) {
  const params = new URLSearchParams()
  if (filters.search) params.append('search', filters.search)
  if (filters.sortBy) params.append('sortBy', filters.sortBy)
  if (filters.page) params.append('page', filters.page.toString())
  if (filters.flatId) params.append('flatId', filters.flatId.toString())
  
  const response = await api.get<Ad[]>(`/ads?${params.toString()}`)
  return response.data
}

export async function fetchAd(id: number) {
  const response = await api.get<Ad>(`/ads/${id}`)
  return response.data
}

export async function createAd(data: CreateAdData) {
  const response = await api.post<Ad>('/ads', data)
  return response.data
}

export async function updateAd(id: number, data: UpdateAdData) {
  console.log(`Sending PATCH request to /ads/${id} with data:`, data)
  const response = await api.patch<Ad>(`/ads/${id}`, data)
  console.log(`PATCH response:`, response.data)
  return response.data
}

export async function forceUpdateAd(id: number, data: UpdateAdData) {
  console.log(`Sending PUT request to /ads/${id} with data:`, data)
  const response = await api.put<Ad>(`/ads/${id}`, data)
  console.log(`PUT response:`, response.data)
  return response.data
}

export async function deleteAd(id: number) {
  const response = await api.delete(`/ads/${id}`)
  return response.data
}
