'use client'

import { useState, useCallback, useRef } from 'react'

export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

export interface Ad {
  house_id: number
  lat: number
  lng: number
  price: number
  rooms: number
  floor: number
  area?: number
  kitchen_area?: number
  total_floors?: number
  url: string
  updated_at: string
  is_active: boolean
  distance_m: number
}

export interface House {
  house_id: number
  lat: number
  lng: number
  address: string
  active_ads_count: number
  total_ads_count: number
  has_active_ads: boolean
}

export interface CachedMapData {
  bounds: MapBounds
  houses: House[]
  ads: Ad[]
  timestamp: number
}

export interface MapFilters {
  rooms?: number
  maxPrice?: number
  minArea?: number
  minKitchenArea?: number
  showActive?: boolean
  showInactive?: boolean
}

// Время жизни кэша в миллисекундах (5 минут)
const CACHE_TTL = 5 * 60 * 1000

// Функция для проверки, содержит ли кэшированная область новые bounds
const boundsContainsBounds = (
  cached: MapBounds,
  requested: MapBounds,
): boolean => {
  return (
    cached.north >= requested.north &&
    cached.south <= requested.south &&
    cached.east >= requested.east &&
    cached.west <= requested.west
  )
}

// Функция для фильтрации объявлений по заданным параметрам
const filterAds = (ads: Ad[], filters: MapFilters): Ad[] => {
  if (process.env.NODE_ENV === 'development' && Math.random() < 0.01) {
    console.log('🔍 FILTER_DEBUG - Applied filters:', filters)
    console.log('🔍 FILTER_DEBUG - Total ads before filtering:', ads.length)
  }

  const filteredAds = ads.filter((ad) => {
    // Debug price filtering specifically
    if (filters.maxPrice && ad.price > filters.maxPrice) {
      if (process.env.NODE_ENV === 'development' && Math.random() < 0.01) {
        console.log(
          `🚫 PRICE_FILTER_DEBUG: Excluding ad ${ad.price} > ${filters.maxPrice}`,
        )
      }
      return false
    }

    if (filters.rooms && ad.rooms < filters.rooms) return false
    if (filters.minArea && ad.area && ad.area < filters.minArea) return false
    if (
      filters.minKitchenArea &&
      ad.kitchen_area &&
      ad.kitchen_area < filters.minKitchenArea
    )
      return false
    return true
  })

  if (process.env.NODE_ENV === 'development' && Math.random() < 0.01) {
    console.log('🔍 FILTER_DEBUG - Ads after filtering:', filteredAds.length)
  }

  return filteredAds
}

// Функция для фильтрации домов на основе ОТФИЛЬТРОВАННЫХ объявлений в области и окрашивания маркеров
const filterAndColorHouses = (
  houses: House[],
  filteredAds: Ad[],
  bounds: MapBounds,
): House[] => {
  // Получаем ОТФИЛЬТРОВАННЫЕ объявления в текущих bounds
  const adsInBounds = filteredAds.filter(
    (ad) =>
      ad.lat >= bounds.south &&
      ad.lat <= bounds.north &&
      ad.lng >= bounds.west &&
      ad.lng <= bounds.east,
  )

  console.log(
    `🏠 filterAndColorHouses: ${adsInBounds.length} filtered ads in bounds from total ${filteredAds.length}`,
  )

  return houses
    .filter(
      (house) =>
        house.lat >= bounds.south &&
        house.lat <= bounds.north &&
        house.lng >= bounds.west &&
        house.lng <= bounds.east,
    )
    .map((house) => {
      const houseAdsInBounds = adsInBounds.filter(
        (ad) => ad.house_id === house.house_id,
      )
      const activeAdsInBounds = houseAdsInBounds.filter((ad) => ad.is_active)

      console.log(
        `🏠 House ${house.house_id}: ${houseAdsInBounds.length} total ads, ${activeAdsInBounds.length} active ads`,
      )

      return {
        ...house,
        // Оранжевый маркер если есть АКТИВНЫЕ объявления среди ОТФИЛЬТРОВАННЫХ
        has_active_ads: activeAdsInBounds.length > 0,
        active_ads_count: activeAdsInBounds.length,
        total_ads_count: houseAdsInBounds.length,
      }
    })
}

export const useMapCache = () => {
  const [cache, setCache] = useState<CachedMapData | null>(null)
  const [loading, setLoading] = useState(false)
  const lastRequestRef = useRef<number>(0)

  const isCacheValid = useCallback(
    (bounds: MapBounds): boolean => {
      if (!cache) return false

      const now = Date.now()
      const isNotExpired = now - cache.timestamp < CACHE_TTL
      const boundsMatch = boundsContainsBounds(cache.bounds, bounds)

      return isNotExpired && boundsMatch
    },
    [cache],
  )

  const fetchMapData = useCallback(
    async (bounds: MapBounds): Promise<CachedMapData | null> => {
      const requestId = Date.now()
      lastRequestRef.current = requestId

      try {
        setLoading(true)

        // Делаем область для кэша немного больше чем запрашиваемая для эффективности
        const BOUNDS_PADDING = 0.01 // ~1км
        const expandedBounds = {
          north: bounds.north + BOUNDS_PADDING,
          south: bounds.south - BOUNDS_PADDING,
          east: bounds.east + BOUNDS_PADDING,
          west: bounds.west - BOUNDS_PADDING,
        }

        // Загружаем все объявления без фильтров из API
        const params = new URLSearchParams({
          north: expandedBounds.north.toString(),
          south: expandedBounds.south.toString(),
          east: expandedBounds.east.toString(),
          west: expandedBounds.west.toString(),
          limit: '5000', // Увеличенный лимит для получения всех объявлений
        })

        console.log('🔄 Fetching map data for bounds:', expandedBounds)
        console.log(
          '🔄 API URL:',
          `${process.env.NEXT_PUBLIC_API_URL}/map/ads?${params.toString()}`,
        )

        const adsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/map/ads?${params}`,
        )

        if (!adsResponse.ok) {
          throw new Error(`Failed to fetch ads: ${adsResponse.status}`)
        }

        const adsData = await adsResponse.json()

        console.log(
          '🔄 Raw API response sample:',
          JSON.stringify(adsData.ads?.slice(0, 2), null, 2),
        )

        // Дополнительная проверка is_actual значений
        if (adsData.ads && adsData.ads.length > 0) {
          const isActualValues = adsData.ads
            .map((ad: any) => ad.is_actual)
            .filter((val: any) => val !== undefined)
          const uniqueIsActual = [...new Set(isActualValues)]
          console.log(
            `📋 is_actual values in API response: ${JSON.stringify(uniqueIsActual)} (${isActualValues.length} total ads)`,
          )
        }

        // Проверяем, что это последний запрос
        if (lastRequestRef.current !== requestId) {
          return null // Отменяем устаревший запрос
        }

        // Преобразуем данные в нужный формат
        const ads: Ad[] =
          adsData.ads?.map((ad: any) => {
            // Определяем активность объявления
            // is_actual = 1 или 11 - активное, is_actual = 0 - неактивное
            const isActive = ad.is_actual === 1 || ad.is_actual === 11

            // Отладочное логирование для понимания преобразования
            if (ad.is_actual === 0) {
              console.log(
                `❌ INACTIVE Ad ${ad.house_id}-${ad.floor}: is_actual=${ad.is_actual} -> is_active=${isActive}`,
              )
            } else {
              console.log(
                `✅ ACTIVE Ad ${ad.house_id}-${ad.floor}: is_actual=${ad.is_actual} -> is_active=${isActive}`,
              )
            }

            return {
              house_id: ad.house_id,
              lat: Number(ad.lat),
              lng: Number(ad.lng),
              price: Number(ad.price),
              rooms: Number(ad.rooms),
              floor: Number(ad.floor),
              area: ad.area ? Number(ad.area) : undefined,
              kitchen_area: ad.kitchen_area
                ? Number(ad.kitchen_area)
                : undefined,
              total_floors: ad.total_floors
                ? Number(ad.total_floors)
                : undefined,
              url: ad.url,
              updated_at: ad.updated_at,
              is_active: isActive,
              distance_m: ad.distance_m || 0,
            }
          }) || []

        const activeCount = ads.filter((ad) => ad.is_active).length
        const inactiveCount = ads.length - activeCount
        console.log(
          `🔍 FINAL STATS: Processed ${ads.length} ads: ${activeCount} active, ${inactiveCount} inactive`,
        )

        // Дополнительная проверка: показываем несколько неактивных для проверки
        const inactiveAds = ads.filter((ad) => !ad.is_active).slice(0, 3)
        if (inactiveAds.length > 0) {
          console.log(
            `🚫 Sample inactive ads:`,
            inactiveAds.map((ad) => `${ad.house_id}-${ad.floor} (${ad.price})`),
          )
        }

        // Создаем дома из уникальных house_id
        const uniqueHouseIds = [...new Set(ads.map((ad) => ad.house_id))]
        const houses: House[] = uniqueHouseIds.map((houseId) => {
          const houseAds = ads.filter((ad) => ad.house_id === houseId)
          const activeAds = houseAds.filter((ad) => ad.is_active)
          const firstAd = houseAds[0]

          return {
            house_id: houseId,
            lat: firstAd?.lat || 0,
            lng: firstAd?.lng || 0,
            address: `Дом ${houseId}`, // Заглушка, можно улучшить через отдельный API
            active_ads_count: activeAds.length,
            total_ads_count: houseAds.length,
            has_active_ads: activeAds.length > 0,
          }
        })

        const cachedData: CachedMapData = {
          bounds: expandedBounds, // Сохраняем расширенные bounds
          houses,
          ads,
          timestamp: Date.now(),
        }

        console.log(
          `Cached ${ads.length} ads and ${houses.length} houses for area`,
        )
        return cachedData
      } catch (error) {
        console.error('Failed to fetch map data:', error)
        return null
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const getFilteredData = useCallback(
    async (
      bounds: MapBounds,
      filters: MapFilters = {},
    ): Promise<{ houses: House[]; ads: Ad[] } | null> => {
      // Проверяем кэш
      if (isCacheValid(bounds)) {
        console.log(
          '✅ Using cached data for bounds, applying filters:',
          filters,
        )
        console.log(
          '✅ CACHE_DEBUG - Cache has',
          cache!.ads.length,
          'ads, filters.maxPrice =',
          filters.maxPrice,
        )

        // Фильтруем объявления на клиентской стороне
        const filteredAds = filterAds(cache!.ads, filters)

        // Фильтруем и окрашиваем дома на основе активных объявлений в области
        const filteredHouses = filterAndColorHouses(
          cache!.houses,
          filteredAds,
          bounds,
        )

        return { houses: filteredHouses, ads: filteredAds }
      }

      // Загружаем новые данные
      console.log('🔄 Cache miss, fetching new data for bounds:', bounds)
      const newCacheData = await fetchMapData(bounds)

      if (!newCacheData) return null

      // Обновляем кэш
      setCache(newCacheData)

      // Фильтруем новые данные
      const filteredAds = filterAds(newCacheData.ads, filters)
      const filteredHouses = filterAndColorHouses(
        newCacheData.houses,
        filteredAds,
        bounds,
      )

      return { houses: filteredHouses, ads: filteredAds }
    },
    [cache, isCacheValid, fetchMapData],
  )

  const invalidateCache = useCallback(() => {
    console.log('🗑️ Invalidating map cache')
    setCache(null)
  }, [])

  const getCacheInfo = useCallback(() => {
    if (!cache) return { hasCache: false, age: 0, bounds: null }

    return {
      hasCache: true,
      age: Date.now() - cache.timestamp,
      bounds: cache.bounds,
      housesCount: cache.houses.length,
      adsCount: cache.ads.length,
      ttl: CACHE_TTL,
    }
  }, [cache])

  return {
    getFilteredData,
    invalidateCache,
    getCacheInfo,
    loading,
    hasCache: !!cache,
  }
}
