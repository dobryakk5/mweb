import { useState, useEffect, useCallback, useMemo } from 'react'
import { useDebounce } from '../../../../../../hooks/use-debounce'

interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

interface FlatFilters {
  rooms: number
  maxPrice: number
  minArea?: number
  minKitchenArea?: number
}

interface AdData {
  price: number
  lat: number
  lng: number
  rooms: number
  area?: number
  kitchen_area?: number
  floor: number
  total_floors?: number
  house_id: number
  url: string
  updated_at: string
  distance_m: number
  is_active: boolean | number // API может возвращать 0/1 или true/false
}

interface UseMapAdsFilterOptions {
  flatFilters: FlatFilters
  enabled?: boolean
  debounceMs?: number
  selectedHouseId?: number | null
}

interface UseMapAdsFilterReturn {
  ads: AdData[]
  mapAds: AdData[] // Данные для карты (всегда все дома в области)
  loading: boolean
  error: string | null
  bounds: MapBounds | null
  setBounds: (bounds: MapBounds | null) => void
  refetch: () => void
  adsCount: number
  selectedHouseId: number | null
  setSelectedHouseId: (houseId: number | null) => void
  updateAdsStatuses: () => Promise<void>
  isUpdatingStatuses: boolean
  cachedAdsCount: number // Количество объявлений в кеше
}

export const useMapAdsFilter = ({
  flatFilters,
  enabled = true,
  debounceMs = 300,
  selectedHouseId = null,
}: UseMapAdsFilterOptions): UseMapAdsFilterReturn => {
  const [bounds, setBounds] = useState<MapBounds | null>(null)
  const [ads, setAds] = useState<AdData[]>([]) // Отображаемые объявления (для preview)
  const [cachedAds, setCachedAds] = useState<AdData[]>([]) // КЕШ всех объявлений в области
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentSelectedHouseId, setCurrentSelectedHouseId] = useState<
    number | null
  >(selectedHouseId)
  const [isUpdatingStatuses, setIsUpdatingStatuses] = useState(false)

  // Debounce bounds changes to avoid too many API calls
  const debouncedBounds = useDebounce(bounds, debounceMs)

  // Debounce house selection to avoid multiple requests
  const debouncedSelectedHouseId = useDebounce(currentSelectedHouseId, 100)

  // URL для загрузки ВСЕХ объявлений в области (для кеша)
  const cacheApiUrl = useMemo(() => {
    if (!enabled || !debouncedBounds) return null

    const params = new URLSearchParams({
      north: debouncedBounds.north.toString(),
      south: debouncedBounds.south.toString(),
      east: debouncedBounds.east.toString(),
      west: debouncedBounds.west.toString(),
      rooms: flatFilters.rooms.toString(),
      maxPrice: flatFilters.maxPrice.toString(),
      limit: '500', // Максимальный лимит для кеша
    })

    if (flatFilters.minArea) {
      params.append('minArea', flatFilters.minArea.toString())
    }

    if (flatFilters.minKitchenArea) {
      params.append('minKitchenArea', flatFilters.minKitchenArea.toString())
    }

    return `${process.env.NEXT_PUBLIC_API_URL}/map/ads?${params}`
  }, [debouncedBounds, flatFilters, enabled])

  // Функция для применения фильтров к кешу (для отображения в preview)
  const applyFiltersToCache = useCallback(
    (houseId?: number | null): AdData[] => {
      let filtered = cachedAds

      // Если выбран дом - фильтруем по house_id
      if (houseId) {
        filtered = filtered.filter((ad) => ad.house_id === houseId)
      }

      // Применяем дополнительные фильтры
      filtered = filtered.filter((ad) => {
        // Фильтр по комнатам
        if (ad.rooms < flatFilters.rooms) return false

        // Фильтр по цене
        if (ad.price >= flatFilters.maxPrice) return false

        // Фильтр по общей площади
        if (flatFilters.minArea && ad.area && ad.area < flatFilters.minArea)
          return false

        // Фильтр по кухне (включаем null значения)
        if (
          flatFilters.minKitchenArea &&
          ad.kitchen_area &&
          ad.kitchen_area < flatFilters.minKitchenArea
        )
          return false

        return true
      })

      return filtered
    },
    [cachedAds, flatFilters],
  )

  // mapAds - всегда все объявления из кеша (для карты)
  const mapAds = useMemo(() => {
    return applyFiltersToCache() // Без фильтра по дому
  }, [applyFiltersToCache])

  // Функция для загрузки объявлений в кеш
  const fetchAndCacheAds = useCallback(async () => {
    if (!cacheApiUrl) return

    setLoading(true)
    setError(null)

    try {
      if (process.env.NODE_ENV === 'development') {
        const timestamp = new Date().toISOString().slice(11, 23)
        console.log(
          `🗂️ [${timestamp}] CACHE_LOAD - Fetching all ads for bounds:`,
          cacheApiUrl,
        )
      }

      const response = await fetch(cacheApiUrl)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      const responseAds = data.ads || []
      setCachedAds(responseAds)

      if (process.env.NODE_ENV === 'development') {
        const timestamp = new Date().toISOString().slice(11, 23)
        console.log(
          `✅ [${timestamp}] CACHE_LOADED - ${responseAds.length} ads cached`,
        )
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Error fetching and caching ads:', err)
    } finally {
      setLoading(false)
    }
  }, [cacheApiUrl])

  // Refetch function for manual refresh
  const refetch = useCallback(() => {
    fetchAndCacheAds()
  }, [fetchAndCacheAds])

  // Загружаем кеш при изменении bounds (движение карты)
  useEffect(() => {
    if (cacheApiUrl) {
      fetchAndCacheAds().then(() => {
        // Автоматически обновляем статусы после загрузки данных из БД
        setTimeout(() => {
          updateAdsStatuses()
        }, 500)
      })
    } else {
      setCachedAds([])
      setError(null)
    }
  }, [cacheApiUrl])

  // Обновляем отображаемые объявления при изменении выбранного дома
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString().slice(11, 23)
      if (debouncedSelectedHouseId) {
        console.log(
          `🏠 [${timestamp}] HOUSE_FILTER - Filtering cache for house ${debouncedSelectedHouseId}`,
        )
      } else {
        console.log(
          `🗺️ [${timestamp}] BOUNDS_FILTER - Showing all ads in bounds`,
        )
      }
    }

    // Фильтруем кеш в зависимости от выбранного дома
    const filteredAds = applyFiltersToCache(debouncedSelectedHouseId)
    setAds(filteredAds)

    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString().slice(11, 23)
      console.log(
        `📊 [${timestamp}] FILTERED - Showing ${filteredAds.length} ads from cache of ${cachedAds.length}`,
      )
    }
  }, [debouncedSelectedHouseId, applyFiltersToCache, cachedAds.length])

  // Clear data when disabled
  useEffect(() => {
    if (!enabled) {
      setAds([])
      setCachedAds([])
      setError(null)
      setLoading(false)
    }
  }, [enabled])

  // Function to update ads statuses via Python API
  const updateAdsStatuses = useCallback(async () => {
    if (!debouncedBounds || isUpdatingStatuses) return

    setIsUpdatingStatuses(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/map/update-ads-statuses`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            north: debouncedBounds.north,
            south: debouncedBounds.south,
            east: debouncedBounds.east,
            west: debouncedBounds.west,
            rooms: Number(flatFilters.rooms),
            maxPrice: Number(flatFilters.maxPrice),
            minArea: flatFilters.minArea
              ? Number(flatFilters.minArea)
              : undefined,
            minKitchenArea: flatFilters.minKitchenArea
              ? Number(flatFilters.minKitchenArea)
              : undefined,
          }),
        },
      )

      if (response.ok) {
        const result = await response.json()
        console.log('Ads status update result:', result)

        // Refetch cache to get updated statuses
        fetchAndCacheAds()
      }
    } catch (error) {
      console.error('Error updating ads statuses:', error)
    } finally {
      setIsUpdatingStatuses(false)
    }
  }, [debouncedBounds, flatFilters, isUpdatingStatuses, fetchAndCacheAds])

  return {
    ads,
    mapAds,
    loading,
    error,
    bounds,
    setBounds,
    refetch,
    adsCount: ads.length,
    cachedAdsCount: cachedAds.length,
    selectedHouseId: currentSelectedHouseId,
    setSelectedHouseId: setCurrentSelectedHouseId,
    updateAdsStatuses,
    isUpdatingStatuses,
  }
}

export type { MapBounds, FlatFilters, AdData, UseMapAdsFilterOptions }
