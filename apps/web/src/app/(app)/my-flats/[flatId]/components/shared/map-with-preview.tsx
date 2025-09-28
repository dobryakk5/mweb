'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useMapAdsFilter } from '../hooks/use-map-ads-filter'
import AdsPreview from './ads-preview'
import type {
  AdData,
  FlatFilters,
  MapBounds,
} from '../hooks/use-map-ads-filter'

// Dynamic import for map component to avoid SSR issues
const NearbyMapComponent = dynamic(() => import('./nearby-map-component'), {
  ssr: false,
  loading: () => (
    <div className='w-full h-[500px] bg-gray-100 animate-pulse rounded-lg' />
  ),
})

interface MapWithPreviewProps {
  flatId: string
  className?: string
  externalFilters?: FlatFilters | null // Optional external filters to override automatic ones
  onAddToComparison?: (ad: AdData) => void
  onToggleComparison?: (adId: number, inComparison: boolean) => Promise<void>
  comparisonAds?: any[]
}

interface HoveredAdMarker {
  ad: AdData
  lat: number
  lng: number
}

export default function MapWithPreview({
  flatId,
  className = '',
  externalFilters,
  onAddToComparison,
  onToggleComparison,
  comparisonAds,
}: MapWithPreviewProps) {
  const [hoveredAd, setHoveredAd] = useState<AdData | null>(null)
  const [selectedAd, setSelectedAd] = useState<AdData | null>(null)
  const [mapCenter, setMapCenter] = useState<{
    lat: number
    lng: number
  } | null>(null)
  const [currentFlat, setCurrentFlat] = useState<any>(null)
  const [loadingFlat, setLoadingFlat] = useState(true)
  const [addressNotFound, setAddressNotFound] = useState(false)
  const [addressError, setAddressError] = useState<string | null>(null)
  const [viewedHouses, setViewedHouses] = useState<Set<number>>(new Set())

  // Load current flat data from API
  useEffect(() => {
    const loadFlatData = async () => {
      try {
        setLoadingFlat(true)
        setAddressNotFound(false)
        setAddressError(null)

        const url = `${process.env.NEXT_PUBLIC_API_URL}/map/flat-full-data/${flatId}`
        const response = await fetch(url)

        if (!response.ok) {
          // Handle specific "address not found" error
          if (response.status === 404) {
            const errorData = await response.json().catch(() => null)
            if (errorData?.error === 'Адрес не найден, используйте другой') {
              setAddressNotFound(true)
              setAddressError(errorData.error)
              setCurrentFlat(errorData.flatData)
              return
            }
          }
          throw new Error(`Failed to load flat data: ${response.status}`)
        }

        const data = await response.json()

        if (process.env.NODE_ENV === 'development') {
          console.log(`🏠 [MAP] Loaded flat ${flatId}:`, {
            flatId,
            address: data.flat?.address,
            coordinates: data.flat?.coordinates,
          })
        }

        setCurrentFlat(data.flat)
      } catch (error) {
        console.error('Error loading flat data:', error)
        // Fallback - use basic data without areas
        setCurrentFlat({
          id: parseInt(flatId),
          address: '',
          rooms: 3,
          floor: 1,
          area: null,
          kitchen_area: null,
          price: null,
        })
      } finally {
        setLoadingFlat(false)
      }
    }

    loadFlatData()
  }, [flatId])

  // Reset map center when flatId changes
  useEffect(() => {
    setMapCenter(null)
  }, [flatId])

  // Create filters based on external filters or current flat parameters
  const flatFilters: FlatFilters = useMemo(() => {
    // If external filters are provided and not null, use them
    if (externalFilters && externalFilters !== null) {
      return externalFilters
    }

    // Otherwise fallback to automatic filters from flat data
    if (!currentFlat) return { rooms: 1, maxPrice: 100000000 }

    return {
      rooms: currentFlat.rooms || 1,
      maxPrice: currentFlat.price || 100000000, // TODO: Get price from ads or form
      minArea: currentFlat.area ? currentFlat.area * 0.95 : undefined,
      minKitchenArea: currentFlat.kitchen_area || undefined,
      showActive: true,
      showInactive: true,
    }
  }, [externalFilters, currentFlat])

  // Initialize ads filter hook
  const {
    ads,
    mapAds,
    loading,
    error,
    bounds,
    setBounds,
    refetch,
    adsCount,
    cachedAdsCount,
    selectedHouseId,
    setSelectedHouseId,
    updateAdsStatuses,
    isUpdatingStatuses,
  } = useMapAdsFilter({
    flatFilters,
    enabled: !loadingFlat && !!currentFlat,
    debounceMs: 300,
  })

  // Handle map bounds change from the map component
  const handleMapBoundsChange = useCallback((newBounds: MapBounds) => {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString().slice(11, 23)
      console.log(
        `🗺️ [${timestamp}] MAP_BOUNDS_CHANGE:`,
        `N:${newBounds.north.toFixed(4)} S:${newBounds.south.toFixed(4)} E:${newBounds.east.toFixed(4)} W:${newBounds.west.toFixed(4)}`,
      )
    }
    setBounds(newBounds)
  }, [])

  // Handle ad hover in preview - should highlight marker on map
  const handleAdHover = (ad: AdData | null) => {
    setHoveredAd(ad)
  }

  // Handle ad click in preview - should center map on ad location
  const handleAdClick = (ad: AdData) => {
    setSelectedAd(ad)
    setMapCenter({ lat: ad.lat, lng: ad.lng })
  }

  // Handle house click on map - should show ads for that house in preview
  const handleHouseClick = useCallback(
    (house: any) => {
      console.log('House clicked:', house)
      setSelectedHouseId(house.house_id)
      // Mark house as viewed
      setViewedHouses((prev) => new Set(prev).add(house.house_id))
    },
    [setSelectedHouseId],
  )

  // Мемоизируем flatCoordinates чтобы избежать лишних ререндеров
  const memoizedFlatCoordinates = useMemo(() => {
    return (
      currentFlat?.coordinates ||
      (currentFlat?.house_id ? { houseId: currentFlat.house_id } : undefined)
    )
  }, [currentFlat?.coordinates, currentFlat?.house_id])

  // Handle clearing house selection - return to showing all ads in bounds
  const handleClearHouseSelection = useCallback(() => {
    setSelectedHouseId(null)
  }, [setSelectedHouseId])

  // Handle toggle comparison for map ads (which don't have database IDs)
  const handleToggleMapAdComparison = useCallback(
    async (ad: AdData) => {
      if (!comparisonAds || !onToggleComparison || !onAddToComparison) return

      // Check if this ad is already in comparison by URL
      const existingAd = comparisonAds.find((compAd) => compAd.url === ad.url)

      if (existingAd && existingAd.id) {
        // Ad exists in database - remove from comparison
        await onToggleComparison(existingAd.id, false)
      } else {
        // Ad doesn't exist in database - add it via onAddToComparison
        await onAddToComparison(ad)
      }
    },
    [comparisonAds, onToggleComparison, onAddToComparison],
  )

  // Create markers for hovered ads to highlight on map
  const hoveredMarkers: HoveredAdMarker[] = useMemo(() => {
    if (!hoveredAd) return []
    return [
      {
        ad: hoveredAd,
        lat: hoveredAd.lat,
        lng: hoveredAd.lng,
      },
    ]
  }, [hoveredAd])

  // Convert map ads to format compatible with AdsPreview comparisonAds
  const mapComparisonAds = useMemo(() => {
    if (!comparisonAds) return []
    return ads.filter((ad) =>
      comparisonAds.some((compAd) => compAd.url === ad.url),
    )
  }, [ads, comparisonAds])

  if (loadingFlat) {
    return (
      <div className={`flex flex-col lg:flex-row gap-4 ${className}`}>
        <div className='w-full lg:w-[600px] h-[400px] lg:h-[600px] bg-gray-100 animate-pulse rounded-lg'></div>
        <div className='w-full lg:w-[28rem] min-h-[400px] lg:min-h-[600px] bg-gray-100 animate-pulse rounded-lg'></div>
      </div>
    )
  }

  // Handle address not found error - don't show map at all
  if (addressNotFound) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-4 p-8 ${className}`}
      >
        <div className='text-center max-w-md'>
          <div className='text-lg font-medium text-red-600 mb-2'>
            {addressError || 'Адрес не найден, используйте другой'}
          </div>
          <div className='text-sm text-gray-600 mb-4'>
            Адрес "{currentFlat?.address}" не найден в базе адресов. Пожалуйста,
            проверьте правильность написания адреса или используйте другой
            адрес.
          </div>
          <div className='text-xs text-gray-500'>Квартира ID: {flatId}</div>
        </div>
      </div>
    )
  }

  if (!currentFlat) {
    return (
      <div className={`flex flex-col lg:flex-row gap-4 ${className}`}>
        <div className='w-full lg:w-[600px] h-[400px] lg:h-[600px] flex items-center justify-center bg-gray-50 rounded-lg'>
          <div className='text-center'>
            <div className='text-lg text-gray-600 mb-2'>
              Ошибка загрузки данных квартиры
            </div>
            <div className='text-sm text-gray-500'>
              Не удалось получить информацию о площадях
            </div>
          </div>
        </div>
        <div className='w-full lg:w-[28rem] min-h-[400px] lg:min-h-[600px] bg-gray-50 rounded-lg'></div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col lg:flex-row gap-4 ${className}`}>
      {/* Map Container - Left side */}
      <div className='w-full lg:w-[600px] h-[400px] lg:h-[600px]'>
        <div className='h-full w-full rounded-lg border border-gray-200'>
          <NearbyMapComponent
            flatAddress={currentFlat.address}
            nearbyAds={mapAds}
            currentFlat={currentFlat}
            filters={flatFilters}
            selectedHouseId={selectedHouseId}
            viewedHouses={viewedHouses}
            onBoundsChange={handleMapBoundsChange}
            onHouseClick={handleHouseClick}
            mapAds={mapAds}
            flatCoordinates={memoizedFlatCoordinates}
          />
        </div>
      </div>

      {/* Preview Panel - Right side */}
      <div className='w-full lg:w-[28rem] min-h-[400px] lg:min-h-[600px]'>
        <AdsPreview
          ads={ads}
          loading={loading}
          error={error}
          filters={flatFilters}
          onAdHover={handleAdHover}
          onAdClick={handleAdClick}
          selectedHouseId={selectedHouseId}
          onClearHouseSelection={handleClearHouseSelection}
          onAddToComparison={onAddToComparison}
          onToggleComparison={handleToggleMapAdComparison}
          comparisonAds={mapComparisonAds}
          showInitialLegend={false}
          className='h-[400px] lg:h-[600px] lg:sticky lg:top-4'
        />

        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className='mt-4 p-3 bg-gray-100 rounded-lg text-xs text-gray-600'>
            <div>Flat: {currentFlat.address}</div>
            <div>
              Areas: {currentFlat.area}м² / кухня {currentFlat.kitchen_area}м²
            </div>
            <div>
              Filters: комнат {flatFilters.rooms}+, цена до{' '}
              {flatFilters.maxPrice}, кухня {flatFilters.minKitchenArea}м²+
            </div>
            <div>
              Bounds:{' '}
              {bounds
                ? `${bounds.north.toFixed(4)}, ${bounds.south.toFixed(4)}`
                : 'null'}
            </div>
            <div>
              Ads displayed: {adsCount} / cached: {cachedAdsCount}
            </div>
            <div>Loading: {loading ? 'yes' : 'no'}</div>
            <div>Error: {error || 'none'}</div>
            <div>House selected: {selectedHouseId || 'none'}</div>
          </div>
        )}
      </div>
    </div>
  )
}
