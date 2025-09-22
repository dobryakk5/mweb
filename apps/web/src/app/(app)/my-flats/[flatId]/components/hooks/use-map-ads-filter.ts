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
}

interface UseMapAdsFilterOptions {
  flatFilters: FlatFilters
  enabled?: boolean
  debounceMs?: number
  selectedHouseId?: number | null
}

interface UseMapAdsFilterReturn {
  ads: AdData[]
  mapAds: AdData[] // Отдельные данные для карты (всегда все дома в области)
  loading: boolean
  error: string | null
  bounds: MapBounds | null
  setBounds: (bounds: MapBounds | null) => void
  refetch: () => void
  adsCount: number
  selectedHouseId: number | null
  setSelectedHouseId: (houseId: number | null) => void
}

export const useMapAdsFilter = ({
  flatFilters,
  enabled = true,
  debounceMs = 300,
  selectedHouseId = null,
}: UseMapAdsFilterOptions): UseMapAdsFilterReturn => {
  const [bounds, setBounds] = useState<MapBounds | null>(null)
  const [ads, setAds] = useState<AdData[]>([])
  const [mapAds, setMapAds] = useState<AdData[]>([]) // Отдельные данные для карты
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentSelectedHouseId, setCurrentSelectedHouseId] = useState<
    number | null
  >(selectedHouseId)

  // Debounce bounds changes to avoid too many API calls
  const debouncedBounds = useDebounce(bounds, debounceMs)

  // Create API URL from bounds and filters OR house-specific URL
  const apiUrl = useMemo(() => {
    if (!enabled) return null

    // If a house is selected, show ads for that specific house
    if (currentSelectedHouseId) {
      const params = new URLSearchParams({
        houseId: currentSelectedHouseId.toString(),
        maxPrice: flatFilters.maxPrice.toString(),
        rooms: flatFilters.rooms.toString(),
      })

      if (flatFilters.minArea) {
        params.append('minArea', flatFilters.minArea.toString())
      }

      if (flatFilters.minKitchenArea) {
        params.append('minKitchenArea', flatFilters.minKitchenArea.toString())
      }

      return `${process.env.NEXT_PUBLIC_API_URL}/map/house-ads?${params}`
    }

    // Otherwise, show ads in bounds (default behavior)
    if (!debouncedBounds) return null

    const params = new URLSearchParams({
      north: debouncedBounds.north.toString(),
      south: debouncedBounds.south.toString(),
      east: debouncedBounds.east.toString(),
      west: debouncedBounds.west.toString(),
      rooms: flatFilters.rooms.toString(),
      maxPrice: flatFilters.maxPrice.toString(),
    })

    if (flatFilters.minArea) {
      params.append('minArea', flatFilters.minArea.toString())
    }

    if (flatFilters.minKitchenArea) {
      params.append('minKitchenArea', flatFilters.minKitchenArea.toString())
    }

    return `${process.env.NEXT_PUBLIC_API_URL}/map/ads-in-bounds?${params}`
  }, [debouncedBounds, flatFilters, enabled, currentSelectedHouseId])

  // Отдельный URL для данных карты - всегда показывает все дома в области
  const mapApiUrl = useMemo(() => {
    if (!enabled || !debouncedBounds) return null

    const params = new URLSearchParams({
      north: debouncedBounds.north.toString(),
      south: debouncedBounds.south.toString(),
      east: debouncedBounds.east.toString(),
      west: debouncedBounds.west.toString(),
      rooms: flatFilters.rooms.toString(),
      maxPrice: flatFilters.maxPrice.toString(),
    })

    if (flatFilters.minArea) {
      params.append('minArea', flatFilters.minArea.toString())
    }

    if (flatFilters.minKitchenArea) {
      params.append('minKitchenArea', flatFilters.minKitchenArea.toString())
    }

    return `${process.env.NEXT_PUBLIC_API_URL}/map/ads-in-bounds?${params}`
  }, [debouncedBounds, flatFilters, enabled])

  // Fetch ads function (для preview панели)
  const fetchAds = useCallback(async () => {
    if (!apiUrl) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(apiUrl)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      // Handle different API response structures
      const responseAds = data.ads || []

      // If it's from house-ads endpoint, transform the structure to match ads-in-bounds
      if (currentSelectedHouseId && responseAds.length > 0) {
        const transformedAds = responseAds.map((ad: any) => ({
          ...ad,
          lat: 0, // House ads don't need lat/lng for preview
          lng: 0,
          distance_m: 0,
        }))
        setAds(transformedAds)
      } else {
        setAds(responseAds)
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Error fetching ads in bounds:', err)
    } finally {
      setLoading(false)
    }
  }, [apiUrl, currentSelectedHouseId])

  // Fetch map ads function (для карты - всегда все дома в области)
  const fetchMapAds = useCallback(async () => {
    if (!mapApiUrl) return

    try {
      const response = await fetch(mapApiUrl)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      const responseAds = data.ads || []
      setMapAds(responseAds)
    } catch (err) {
      console.error('Error fetching map ads:', err)
    }
  }, [mapApiUrl])

  // Refetch function for manual refresh
  const refetch = useCallback(() => {
    if (apiUrl) {
      fetchAds()
    }
    if (mapApiUrl) {
      fetchMapAds()
    }
  }, [fetchAds, fetchMapAds, apiUrl, mapApiUrl])

  // Auto-fetch when apiUrl changes (для preview панели)
  useEffect(() => {
    if (apiUrl) {
      fetchAds()
    } else {
      setAds([])
      setError(null)
    }
  }, [fetchAds, apiUrl])

  // Auto-fetch when mapApiUrl changes (для карты)
  useEffect(() => {
    if (mapApiUrl) {
      fetchMapAds()
    } else {
      setMapAds([])
    }
  }, [fetchMapAds, mapApiUrl])

  // Clear data when disabled
  useEffect(() => {
    if (!enabled) {
      setAds([])
      setMapAds([])
      setError(null)
      setLoading(false)
    }
  }, [enabled])

  return {
    ads,
    mapAds,
    loading,
    error,
    bounds,
    setBounds,
    refetch,
    adsCount: ads.length,
    selectedHouseId: currentSelectedHouseId,
    setSelectedHouseId: setCurrentSelectedHouseId,
  }
}

export type { MapBounds, FlatFilters, AdData, UseMapAdsFilterOptions }
