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
}

interface UseMapAdsFilterReturn {
  ads: AdData[]
  loading: boolean
  error: string | null
  bounds: MapBounds | null
  setBounds: (bounds: MapBounds | null) => void
  refetch: () => void
  adsCount: number
}

export const useMapAdsFilter = ({
  flatFilters,
  enabled = true,
  debounceMs = 300,
}: UseMapAdsFilterOptions): UseMapAdsFilterReturn => {
  const [bounds, setBounds] = useState<MapBounds | null>(null)
  const [ads, setAds] = useState<AdData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Debounce bounds changes to avoid too many API calls
  const debouncedBounds = useDebounce(bounds, debounceMs)

  // Create API URL from bounds and filters
  const apiUrl = useMemo(() => {
    if (!debouncedBounds || !enabled) return null

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

  // Fetch ads function
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

      setAds(data.ads || [])
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Error fetching ads in bounds:', err)
    } finally {
      setLoading(false)
    }
  }, [apiUrl])

  // Refetch function for manual refresh
  const refetch = useCallback(() => {
    if (apiUrl) {
      fetchAds()
    }
  }, [fetchAds, apiUrl])

  // Auto-fetch when apiUrl changes
  useEffect(() => {
    if (apiUrl) {
      fetchAds()
    } else {
      setAds([])
      setError(null)
    }
  }, [fetchAds, apiUrl])

  // Clear data when disabled
  useEffect(() => {
    if (!enabled) {
      setAds([])
      setError(null)
      setLoading(false)
    }
  }, [enabled])

  return {
    ads,
    loading,
    error,
    bounds,
    setBounds,
    refetch,
    adsCount: ads.length,
  }
}

export type { MapBounds, FlatFilters, AdData, UseMapAdsFilterOptions }
