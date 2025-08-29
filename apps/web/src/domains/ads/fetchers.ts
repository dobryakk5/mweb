import api from '@/lib/api'

export interface CreateAdData {
  flatId: number // ID квартиры
  url: string
  address: string
  price: number
  rooms: number
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

export async function updateAd(id: number, data: Partial<CreateAdData>) {
  const response = await api.patch<Ad>(`/ads/${id}`, data)
  return response.data
}

export async function deleteAd(id: number) {
  const response = await api.delete(`/ads/${id}`)
  return response.data
}
