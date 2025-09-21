import { useQuery } from '@tanstack/react-query'

import { adKeys } from '../query-keys'
import {
  fetchAds,
  fetchAd,
  findSimilarAdsByFlat,
  findBroaderAdsByAddress,
  findNearbyAdsByFlat,
} from '../fetchers'

export function useAds(
  filters: {
    search?: string
    sortBy?: string
    page?: number
    flatId?: number
  } = {},
) {
  return useQuery({
    queryKey: adKeys.list(filters),
    queryFn: () => fetchAds(filters),
  })
}

export function useAd(id: number) {
  return useQuery({
    queryKey: adKeys.detail(id),
    queryFn: () => fetchAd(id),
    enabled: !!id,
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
export function useBroaderAdsFromFindAds(flatId: number) {
  return useQuery({
    queryKey: ['findAds', 'broader', flatId],
    queryFn: () => findBroaderAdsByAddress(flatId),
    enabled: !!flatId,
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
) {
  return useQuery({
    queryKey: ['findAds', 'nearby', flatId, filters],
    queryFn: () => findNearbyAdsByFlat(flatId, filters),
    enabled: !!flatId,
    select: (data) => ({
      ads: data.ads,
      filters: data.filters,
      count: data.count,
    }),
  })
}
