import { useState, useEffect, useCallback, useMemo } from 'react'
import { useDebounce } from '../../../../../../hooks/use-debounce'
import { useMapCache } from '../../../../../../hooks/use-map-cache'

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
  showActive?: boolean
  showInactive?: boolean
  radius?: number
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
  setSelectedHouseId: (id: number | null) => void
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
  const [allAds, setAllAds] = useState<AdData[]>([]) // Все загруженные объявления
  const [error, setError] = useState<string | null>(null)
  const [currentSelectedHouseId, setCurrentSelectedHouseId] = useState<
    number | null
  >(selectedHouseId)
  const [isUpdatingStatuses, setIsUpdatingStatuses] = useState(false)

  // Используем новый кэширующий хук
  const { getFilteredData, loading, invalidateCache } = useMapCache()

  // Debounce bounds changes
  const debouncedBounds = useDebounce(bounds, debounceMs)

  // Фильтрация объявлений по выбранному дому и статусу активности
  const ads = useMemo(() => {
    let filteredAds = allAds

    // Фильтрация по дому
    if (currentSelectedHouseId) {
      filteredAds = filteredAds.filter(
        (ad) => ad.house_id === currentSelectedHouseId,
      )
    }

    // Клиентская фильтрация по статусу активности
    if (
      flatFilters.showActive !== undefined ||
      flatFilters.showInactive !== undefined
    ) {
      const showActive = flatFilters.showActive ?? true
      const showInactive = flatFilters.showInactive ?? true

      if (!showActive && !showInactive) {
        // Если оба false - показываем все (fallback)
      } else if (showActive && !showInactive) {
        // Только активные
        filteredAds = filteredAds.filter((ad) => ad.is_active)
      } else if (!showActive && showInactive) {
        // Только неактивные
        filteredAds = filteredAds.filter((ad) => !ad.is_active)
      }
      // Если оба true - показываем все (не фильтруем)
    }

    return filteredAds
  }, [
    allAds,
    currentSelectedHouseId,
    flatFilters.showActive,
    flatFilters.showInactive,
  ])

  // Состояние для контроля автопроверки CIAN
  const [lastCianCheckTime, setLastCianCheckTime] = useState<number>(0)
  const CIAN_CHECK_COOLDOWN = 60 * 1000 // 1 минута

  // Функция обновления статусов объявлений
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
            ...debouncedBounds,
            ...flatFilters,
          }),
        },
      )

      if (response.ok) {
        // Инвалидируем кэш и перезагружаем данные
        invalidateCache()
        console.log('🔄 Updated ads statuses, invalidated cache')

        // Перезагружаем данные
        const result = await getFilteredData(debouncedBounds, flatFilters)
        if (result) {
          const adsData = result.ads.map((ad) => ({
            price: ad.price,
            lat: ad.lat,
            lng: ad.lng,
            rooms: ad.rooms,
            area: ad.area,
            kitchen_area: ad.kitchen_area,
            floor: ad.floor,
            total_floors: ad.total_floors,
            house_id: ad.house_id,
            url: ad.url,
            updated_at: ad.updated_at,
            distance_m: ad.distance_m,
            is_active: ad.is_active,
          }))
          setAllAds(adsData)
        }

        // Обновляем время последней проверки при успешном ответе
        setLastCianCheckTime(Date.now())
      }
    } catch (error) {
      console.error('Error updating ads statuses:', error)
      // При ошибке тоже обновляем время, чтобы не спамить
      setLastCianCheckTime(Date.now())
    } finally {
      setIsUpdatingStatuses(false)
    }
  }, [
    debouncedBounds,
    flatFilters,
    isUpdatingStatuses,
    invalidateCache,
    getFilteredData,
  ])

  // Основная логика загрузки данных из кэша
  useEffect(() => {
    const loadData = async () => {
      if (!enabled || !debouncedBounds) return

      try {
        // Извлекаем только серверные фильтры (без клиентских фильтров статуса)
        const serverFilters = {
          rooms: flatFilters.rooms,
          maxPrice: flatFilters.maxPrice,
          minArea: flatFilters.minArea,
          minKitchenArea: flatFilters.minKitchenArea,
        }
        const result = await getFilteredData(debouncedBounds, serverFilters)

        if (result) {
          // Преобразуем данные в нужный формат
          const adsData = result.ads.map((ad) => ({
            price: ad.price,
            lat: ad.lat,
            lng: ad.lng,
            rooms: ad.rooms,
            area: ad.area,
            kitchen_area: ad.kitchen_area,
            floor: ad.floor,
            total_floors: ad.total_floors,
            house_id: ad.house_id,
            url: ad.url,
            updated_at: ad.updated_at,
            distance_m: ad.distance_m,
            is_active: ad.is_active,
          }))

          setAllAds(adsData)
          setError(null)

          // ВРЕМЕННО ОТКЛЮЧЕНО: Автоматическая проверка статусов CIAN
          // if (adsData.length > 0) {
          //   const cianAds = adsData.filter((ad) => ad.url?.includes('cian.ru'))
          //   if (cianAds.length > 0) {
          //     const now = Date.now()
          //     const timeSinceLastCheck = now - lastCianCheckTime
          //     if (timeSinceLastCheck >= CIAN_CHECK_COOLDOWN) {
          //       setTimeout(() => {
          //         updateAdsStatuses().catch(console.error)
          //       }, 1000)
          //     }
          //   }
          // }
        }
      } catch (err) {
        console.error('Failed to load data from cache:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    }

    loadData()
  }, [
    debouncedBounds,
    flatFilters.rooms,
    flatFilters.maxPrice,
    flatFilters.minArea,
    flatFilters.minKitchenArea,
    enabled,
    getFilteredData,
    updateAdsStatuses,
    lastCianCheckTime,
  ])

  const refetch = useCallback(() => {
    invalidateCache()
    if (debouncedBounds) {
      // Данные перезагрузятся автоматически через useEffect
    }
  }, [invalidateCache, debouncedBounds])

  // Клиентская фильтрация mapAds по статусу активности (без фильтрации по дому)
  const mapAds = useMemo(() => {
    let filteredMapAds = allAds

    // Применяем только фильтрацию по статусу активности, но не по дому
    if (
      flatFilters.showActive !== undefined ||
      flatFilters.showInactive !== undefined
    ) {
      const showActive = flatFilters.showActive ?? true
      const showInactive = flatFilters.showInactive ?? true

      if (!showActive && !showInactive) {
        // Если оба false - показываем все (fallback)
      } else if (showActive && !showInactive) {
        // Только активные
        filteredMapAds = filteredMapAds.filter((ad) => ad.is_active)
      } else if (!showActive && showInactive) {
        // Только неактивные
        filteredMapAds = filteredMapAds.filter((ad) => !ad.is_active)
      }
      // Если оба true - показываем все (не фильтруем)
    }

    return filteredMapAds
  }, [allAds, flatFilters.showActive, flatFilters.showInactive])

  return {
    ads, // Filtered ads for preview (by selectedHouseId and status)
    mapAds, // All ads for map markers (filtered by status only)
    loading,
    error,
    bounds,
    setBounds,
    refetch,
    adsCount: ads.length, // Filtered count
    cachedAdsCount: allAds.length, // Total count
    selectedHouseId: currentSelectedHouseId,
    setSelectedHouseId: setCurrentSelectedHouseId,
    updateAdsStatuses,
    isUpdatingStatuses,
  }
}

export type { MapBounds, FlatFilters, AdData, UseMapAdsFilterOptions }
