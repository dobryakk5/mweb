import { useQuery } from '@tanstack/react-query'

import { adKeys } from '../query-keys'
import {
  fetchAds,
  fetchAd,
  fetchFlatSpecificAds,
  findSimilarAdsByFlat,
  findBroaderAdsByAddress,
  findNearbyAdsByFlat,
  type Ad,
} from '../fetchers'

export function useAds(
  filters: {
    search?: string
    sortBy?: string
    page?: number
    flatId?: number
    enabled?: boolean
  } = {},
) {
  const { enabled = true, ...queryFilters } = filters
  return useQuery({
    queryKey: adKeys.list(queryFilters),
    queryFn: () => fetchAds(queryFilters),
    enabled,
  })
}

export function useAd(id: number) {
  return useQuery({
    queryKey: adKeys.detail(id),
    queryFn: () => fetchAd(id),
    enabled: !!id,
  })
}

// Хук для получения объявлений конкретно по этой квартире (старые + новые)
export function useFlatSpecificAds(flatId: number) {
  return useQuery({
    queryKey: ['ads', 'flat-specific', flatId],
    queryFn: () => fetchFlatSpecificAds(flatId),
    enabled: !!flatId,
    select: (data) => ({
      saved: data.saved, // Ad[] - сохраненные объявления
      new: data.new, // SimilarAd[] - новые объявления
      total: data.total,
      all: [
        ...data.saved,
        ...data.new.map((ad) => ({
          ...ad,
          id: 0, // Временный ID для новых объявлений
          flatId: flatId,
          views: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          from: 1, // Помечаем как найденные
          sma: 0,
        })),
      ] as Ad[], // Объединенный массив для обратной совместимости
    }),
  })
}

// Хук для получения объявлений по точным параметрам квартиры из find_ads
export function useFlatAdsFromFindAds(flatId: number) {
  return useQuery({
    queryKey: ['findAds', 'exact', flatId],
    queryFn: () => findSimilarAdsByFlat(flatId),
    enabled: !!flatId,
  })
}

// Хук для получения других объявлений по адресу из find_ads (без точного этажа и комнат)
export function useBroaderAdsFromFindAds(
  flatId: number,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ['findAds', 'broader', flatId],
    queryFn: () => findBroaderAdsByAddress(flatId),
    enabled: (options?.enabled ?? true) && !!flatId,
  })
}

// Хук для получения близлежащих объявлений в радиусе 500м
export function useNearbyAdsFromFindAds(
  flatId: number,
  filters?: {
    maxPrice?: number
    minArea?: number
    rooms?: number
    minKitchenArea?: number
    radius?: number
  },
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ['findAds', 'nearby', flatId, filters],
    queryFn: () => findNearbyAdsByFlat(flatId, filters),
    enabled: (options?.enabled ?? true) && !!flatId,
    select: (data) => ({
      ads: data.ads,
      filters: data.filters,
      count: data.count,
    }),
  })
}
