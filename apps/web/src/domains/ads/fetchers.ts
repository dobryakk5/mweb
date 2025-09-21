import api from '@/lib/api'

export interface CreateAdData {
  flatId: number // ID квартиры
  url: string
  address: string
  price: number
  rooms: number
  from?: number // 1 - найдено по кнопке "Объявления", 2 - добавлено вручную
  sma?: number // 0 - обычное объявление, 1 - в сравнении квартир
  updatedAt?: string // Время обновления из источника
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

export async function fetchAds(
  filters: {
    search?: string
    sortBy?: string
    page?: number
    flatId?: number
  } = {},
) {
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
  if (!id || id === undefined || id === null || typeof id !== 'number') {
    throw new Error(`Invalid ad id: ${id}`)
  }

  console.log(`Sending PATCH request to /ads/${id} with data:`, data)
  const response = await api.patch<Ad>(`/ads/${id}`, data)
  console.log(`PATCH response:`, response.data)
  return response.data
}

export async function forceUpdateAd(id: number, data: UpdateAdData) {
  if (!id || id === undefined || id === null || typeof id !== 'number') {
    throw new Error(`Invalid ad id: ${id}`)
  }

  console.log(`Sending PUT request to /ads/${id} with data:`, data)
  const response = await api.put<Ad>(`/ads/${id}`, data)
  console.log(`PUT response:`, response.data)
  return response.data
}

export async function deleteAd(id: number) {
  if (!id || id === undefined || id === null || typeof id !== 'number') {
    throw new Error(`Invalid ad id: ${id}`)
  }

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

export async function findSimilarAdsByFlat(
  flatId: number,
): Promise<SimilarAd[]> {
  const response = await api.get<SimilarAd[]>(`/ads/similar-by-flat/${flatId}`)
  return response.data
}

export async function findBroaderAdsByAddress(
  flatId: number,
): Promise<SimilarAd[]> {
  const response = await api.get<SimilarAd[]>(
    `/ads/broader-by-address/${flatId}`,
  )
  return response.data
}

// Функция для переключения статуса сравнения объявления
export async function toggleAdComparison(
  adId: number,
  inComparison: boolean,
): Promise<Ad> {
  const response = await api.patch<Ad>(`/ads/${adId}`, {
    sma: inComparison ? 1 : 0,
  })
  return response.data
}

// Функция для создания объявления из данных похожего объявления с настраиваемым from
export async function createAdFromSimilarWithFrom(
  similarAd: SimilarAd,
  flatId: number,
  fromValue: number,
  flatAddress?: string,
): Promise<Ad> {
  console.log('Creating ad from similar with custom from:', {
    similarAd,
    flatId,
    fromValue,
    flatAddress,
  })

  const adData: CreateAdData = {
    flatId,
    url: similarAd.url,
    address: flatAddress || '', // Используем адрес квартиры если передан
    price: parseInt(similarAd.price.toString()),
    rooms: similarAd.rooms,
    updatedAt: similarAd.updated, // Время обновления из источника
  }

  console.log('Sending ad data to API:', {
    ...adData,
    from: fromValue,
  })

  try {
    const response = await api.post<Ad>('/ads', {
      ...adData,
      from: fromValue, // Используем переданное значение from
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
export async function createAdFromSimilar(
  similarAd: SimilarAd,
  flatId: number,
  flatAddress?: string,
): Promise<Ad> {
  console.log('Creating ad from similar:', { similarAd, flatId, flatAddress })

  const adData: CreateAdData = {
    flatId,
    url: similarAd.url,
    address: flatAddress || '', // Используем адрес квартиры если передан
    price: parseInt(similarAd.price.toString()),
    rooms: similarAd.rooms,
    updatedAt: similarAd.updated, // Время обновления из источника
  }

  console.log('Sending ad data to API:', {
    ...adData,
    from: 1,
  })

  try {
    const response = await api.post<Ad>('/ads', {
      ...adData,
      from: 1, // Найдено по кнопке "Объявления"
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
export async function findNearbyAdsByFlat(
  flatId: number,
  filters?: {
    maxPrice?: number
    minArea?: number
    rooms?: number
    minKitchenArea?: number
    radius?: number
  },
): Promise<{ ads: SimilarAd[]; filters: any; count: number }> {
  const params = new URLSearchParams()
  if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString())
  if (filters?.minArea) params.append('minArea', filters.minArea.toString())
  if (filters?.rooms) params.append('rooms', filters.rooms.toString())
  if (filters?.minKitchenArea)
    params.append('minKitchenArea', filters.minKitchenArea.toString())
  if (filters?.radius) params.append('radius', filters.radius.toString())

  const queryString = params.toString()
  const url = `/ads/nearby-by-flat/${flatId}${queryString ? `?${queryString}` : ''}`

  const response = await api.get<{
    ads: SimilarAd[]
    filters: any
    count: number
  }>(url)
  return response.data
}

// Python API endpoints for ad updates
export async function updateAdStatusSingle(adId: number): Promise<Ad> {
  // Validate adId before making API call
  if (
    !adId ||
    adId === undefined ||
    adId === null ||
    typeof adId !== 'number'
  ) {
    throw new Error(`Invalid adId: ${adId}`)
  }

  console.log(
    `Updating ad status via Python API single endpoint for ad ${adId}`,
  )
  // First get the ad to extract URL for Python API call
  const ad = await fetchAd(adId)
  const response = await api.put<Ad>(`/ads/${adId}`, {
    parseUrl: ad.url,
    parseType: 'single',
  })
  console.log(`Single update response:`, response.data)
  return response.data
}

export async function updateAdStatusExtended(adId: number): Promise<Ad> {
  console.log(
    `Updating ad status via Python API extended endpoint for ad ${adId}`,
  )
  // First get the ad to extract URL for Python API call
  const ad = await fetchAd(adId)
  const response = await api.put<Ad>(`/ads/${adId}`, {
    parseUrl: ad.url,
    parseType: 'extended',
  })
  console.log(`Extended update response:`, response.data)
  return response.data
}
