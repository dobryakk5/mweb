import api from '@/lib/api'

export interface CreateAdData {
  flatId: number // ID квартиры
  url: string
  address: string
  price: number
  rooms: number
  from?: number // 1 - найдено по кнопке "Объявления", 2 - добавлено вручную
  sma?: number // 0 - обычное объявление, 1 - в сравнении квартир
}

export interface UpdateAdData extends Partial<CreateAdData> {
  // Новые поля от API парсинга
  totalArea?: number
  livingArea?: number
  kitchenArea?: number
  floor?: number
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
  status?: boolean
  viewsToday?: number
  totalViews?: number
  from?: number // 1 - найдено по кнопке "Объявления", 2 - добавлено вручную
  sma?: number // 0 - обычное объявление, 1 - в сравнении квартир
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
  floor?: number
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
  status?: boolean
  viewsToday?: number
  totalViews?: number
  from?: number // 1 - найдено по кнопке "Объявления", 2 - добавлено вручную
  sma?: number // 0 - обычное объявление, 1 - в сравнении квартир
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

export interface SimilarAd {
  price: number
  rooms: number
  person_type: string
  created: string
  updated: string
  url: string
  is_active: boolean
  floor: number
}

export async function findSimilarAds(id: number): Promise<SimilarAd[]> {
  const response = await api.get<SimilarAd[]>(`/ads/similar/${id}`)
  return response.data
}

export async function findSimilarAdsByFlat(flatId: number): Promise<SimilarAd[]> {
  const response = await api.get<SimilarAd[]>(`/ads/similar-by-flat/${flatId}`)
  return response.data
}

export async function findBroaderAdsByAddress(flatId: number): Promise<SimilarAd[]> {
  const response = await api.get<SimilarAd[]>(`/ads/broader-by-address/${flatId}`)
  return response.data
}

// Функция для переключения статуса сравнения объявления
export async function toggleAdComparison(adId: number, inComparison: boolean): Promise<Ad> {
  const response = await api.patch<Ad>(`/ads/${adId}`, {
    sma: inComparison ? 1 : 0
  })
  return response.data
}

// Функция для создания объявления из данных похожего объявления с настраиваемым from
export async function createAdFromSimilarWithFrom(similarAd: SimilarAd, flatId: number, fromValue: number, flatAddress?: string): Promise<Ad> {
  console.log('Creating ad from similar with custom from:', { similarAd, flatId, fromValue, flatAddress })
  
  const adData: CreateAdData = {
    flatId,
    url: similarAd.url,
    address: flatAddress || '', // Используем адрес квартиры если передан
    price: parseInt(similarAd.price.toString()),
    rooms: similarAd.rooms
  }
  
  console.log('Sending ad data to API:', {
    ...adData,
    from: fromValue
  })
  
  try {
    const response = await api.post<Ad>('/ads', {
      ...adData,
      from: fromValue // Используем переданное значение from
    })
    console.log('API response:', response.data)
    return response.data
  } catch (error) {
    console.error('Error creating ad from similar with custom from:', error)
    if (error && typeof error === 'object' && 'response' in error) {
      console.error('Response status:', (error as any).response.status)
      console.error('Response data:', (error as any).response.data)
    }
    throw error
  }
}

// Функция для создания объявления из данных похожего объявления
export async function createAdFromSimilar(similarAd: SimilarAd, flatId: number, flatAddress?: string): Promise<Ad> {
  console.log('Creating ad from similar:', { similarAd, flatId, flatAddress })
  
  const adData: CreateAdData = {
    flatId,
    url: similarAd.url,
    address: flatAddress || '', // Используем адрес квартиры если передан
    price: parseInt(similarAd.price.toString()),
    rooms: similarAd.rooms
  }
  
  console.log('Sending ad data to API:', {
    ...adData,
    from: 1
  })
  
  try {
    const response = await api.post<Ad>('/ads', {
      ...adData,
      from: 1 // Найдено по кнопке "Объявления"
    })
    console.log('API response:', response.data)
    return response.data
  } catch (error) {
    console.error('Error creating ad from similar:', error)
    if (error && typeof error === 'object' && 'response' in error) {
      console.error('Response status:', (error as any).response.status)
      console.error('Response data:', (error as any).response.data)
    }
    throw error
  }
}
export async function findNearbyAdsByFlat(flatId: number): Promise<SimilarAd[]> {
  const response = await api.get<SimilarAd[]>(`/ads/nearby-by-flat/${flatId}`)
  return response.data
}