'use client'

import { useState, useMemo, useEffect, memo } from 'react'
import CollapsibleBlock from '../shared/collapsible-block'
import MapWithPreview from '../shared/map-with-preview'
import NearbyAdsFilter from '../shared/nearby-ads-filter'
import type { NearbyAdsBlockProps } from '../types/ads-blocks.types'
import type { FlatFilters } from '../hooks/use-map-ads-filter'

/**
 * Block component for nearby ads within 500m radius
 */
const NearbyAdsBlock = memo(function NearbyAdsBlock({
  flat,
  nearbyAds,
  nearbyFilters,
  flatAds = [],
  isCollapsed,
  onToggleCollapse,
  onRefetch,
  isLoading,
  onAddToComparison,
  onToggleComparison,
  comparisonAds,
  onSearchWithFilters,
}: NearbyAdsBlockProps) {
  // Находим активное объявление CIAN с минимальной ценой для базовых значений площадей
  const getBaseAreaValues = () => {
    const cianActiveAds = flatAds.filter(
      (ad) =>
        ad.url &&
        ad.url.includes('cian.ru') &&
        (ad.status === true || ad.status === 1) &&
        ad.totalArea &&
        ad.kitchenArea,
    )

    if (cianActiveAds.length === 0) {
      return { minArea: undefined, minKitchenArea: undefined }
    }

    // Находим объявление с минимальной ценой среди активных CIAN
    const minPriceAd = cianActiveAds.reduce((min, current) =>
      current.price && (!min.price || current.price < min.price)
        ? current
        : min,
    )

    return {
      minArea: minPriceAd.totalArea
        ? Math.round(Number(minPriceAd.totalArea) * 0.9 * 10) / 10 // 90% от площади текущей квартиры
        : undefined,
      minKitchenArea: minPriceAd.kitchenArea
        ? Math.round(Number(minPriceAd.kitchenArea) * 0.9 * 10) / 10 // 90% от кухни текущей квартиры
        : undefined,
    }
  }

  // Вычисляем базовые фильтры ТОЛЬКО при первой загрузке flatAds
  const [defaultFiltersFromFlatAds, setDefaultFiltersFromFlatAds] = useState<{
    rooms: number
    maxPrice: number
    minArea?: number
    minKitchenArea?: number
  }>(() => ({
    rooms: 3,
    maxPrice: 50000000,
    minArea: undefined,
    minKitchenArea: undefined,
  }))

  // Обновляем фильтры ТОЛЬКО при первой загрузке данных
  useEffect(() => {
    if (flatAds.length > 0 && defaultFiltersFromFlatAds.maxPrice === 50000000) {
      // Получаем базовые значения площадей
      const baseAreaValues = getBaseAreaValues()

      // Получаем минимальную цену из активных CIAN объявлений текущей квартиры
      const getMinPriceFromCurrentFlatAds = () => {
        const cianActiveAds = flatAds.filter(
          (ad) =>
            ad.url &&
            ad.url.includes('cian.ru') &&
            (ad.status === true || ad.status === 1) &&
            ad.price,
        )

        if (cianActiveAds.length === 0) return 50000000 // fallback

        const minPriceAd = cianActiveAds.reduce((min, current) =>
          current.price && (!min.price || current.price < min.price)
            ? current
            : min,
        )

        return minPriceAd.price || 50000000
      }

      const newDefaultFilters = {
        rooms: flat.rooms || 3,
        maxPrice: getMinPriceFromCurrentFlatAds(),
        minArea: baseAreaValues.minArea,
        minKitchenArea: baseAreaValues.minKitchenArea,
      }

      if (process.env.NODE_ENV === 'development') {
        const timestamp = new Date().toISOString().slice(11, 23)
        console.log(
          `🔄 [${timestamp}] Initial calculation of defaultFilters (flatAds: ${flatAds.length}):`,
          {
            baseAreaValues,
            newDefaultFilters,
          },
        )
      }

      setDefaultFiltersFromFlatAds(newDefaultFilters)
    }
  }, [flatAds]) // Зависит только от flatAds, не от flat.rooms

  // State for map filters - используем параметры текущей квартиры согласно MAPS.md
  const [mapFilters, setMapFilters] = useState<FlatFilters>(() => {
    return {
      rooms: 3,
      maxPrice: 50000000,
      minArea: undefined,
      minKitchenArea: undefined,
    }
  })

  // Обновляем mapFilters ТОЛЬКО при первой инициализации или изменении nearbyFilters пользователем
  useEffect(() => {
    // Обновляем только если defaultFilters уже установлены (не начальные значения)
    if (defaultFiltersFromFlatAds.maxPrice === 50000000) return

    const initialMaxPrice =
      nearbyFilters?.currentPrice ||
      nearbyFilters?.maxPrice ||
      defaultFiltersFromFlatAds.maxPrice

    const newFilters = {
      rooms: nearbyFilters?.rooms || defaultFiltersFromFlatAds.rooms,
      maxPrice: initialMaxPrice,
      minArea: nearbyFilters?.minArea || defaultFiltersFromFlatAds.minArea,
      minKitchenArea:
        nearbyFilters?.minKitchenArea ||
        defaultFiltersFromFlatAds.minKitchenArea,
    }

    setMapFilters((prevFilters) => {
      // Проверяем изменились ли фильтры перед обновлением
      const hasChanged =
        prevFilters.rooms !== newFilters.rooms ||
        prevFilters.maxPrice !== newFilters.maxPrice ||
        prevFilters.minArea !== newFilters.minArea ||
        prevFilters.minKitchenArea !== newFilters.minKitchenArea

      if (hasChanged && process.env.NODE_ENV === 'development') {
        const timestamp = new Date().toISOString().slice(11, 23)
        console.log(`📝 [${timestamp}] Updating mapFilters:`, {
          newFilters,
          trigger: nearbyFilters ? 'user_input' : 'initial',
        })
      }

      return hasChanged ? newFilters : prevFilters
    })
  }, [defaultFiltersFromFlatAds, nearbyFilters])

  // Handle filter updates from NearbyAdsFilter (случай 3: пользовательский ввод)
  const handleFilterUpdate = (filters: {
    maxPrice: number
    minArea?: number
    rooms: number
    minKitchenArea?: number
    radius: number
  }) => {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString().slice(11, 23)
      console.log(`🔥 [${timestamp}] USER INPUT - Filter update:`, filters)
    }

    // Update map filters (excluding radius since map uses bounds)
    const newMapFilters = {
      rooms: filters.rooms,
      maxPrice: filters.maxPrice,
      minArea: filters.minArea,
      minKitchenArea: filters.minKitchenArea,
    }

    setMapFilters(newMapFilters)

    // Call original search callback
    if (onSearchWithFilters) {
      onSearchWithFilters(filters)
    }
  }

  return (
    <CollapsibleBlock
      title='Объявления рядом'
      isCollapsed={isCollapsed}
      onToggle={onToggleCollapse}
    >
      {/* Фильтры поиска - теперь сверху и в одну строку */}
      {nearbyAds && nearbyAds.length > 0 && nearbyFilters && (
        <div className='mb-4'>
          <NearbyAdsFilter
            currentFilters={{
              maxPrice:
                nearbyFilters?.currentPrice ||
                nearbyFilters?.maxPrice ||
                defaultFiltersFromFlatAds.maxPrice,
              rooms: nearbyFilters?.rooms || flat.rooms || 3, // ≥ комнат текущей квартиры
              minArea:
                nearbyFilters?.minArea || defaultFiltersFromFlatAds.minArea, // 90% от площади текущей квартиры
              minKitchenArea:
                nearbyFilters?.minKitchenArea ||
                defaultFiltersFromFlatAds.minKitchenArea, // 90% от кухни текущей квартиры
              radius: nearbyFilters?.radius || 500,
            }}
            onSearch={handleFilterUpdate}
            isLoading={isLoading}
            inline={true}
          />
        </div>
      )}

      {/* Карта с preview панелью для объявлений в видимой области */}
      <MapWithPreview
        flatId={flat.id.toString()}
        className='w-full'
        externalFilters={mapFilters}
        onAddToComparison={onAddToComparison}
        onToggleComparison={onToggleComparison}
        comparisonAds={comparisonAds}
      />
    </CollapsibleBlock>
  )
})

export default NearbyAdsBlock
