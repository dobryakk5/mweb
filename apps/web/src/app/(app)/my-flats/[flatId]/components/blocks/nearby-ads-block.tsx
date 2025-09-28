'use client'

import { useState, useMemo, useEffect, memo, useCallback } from 'react'
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
  // Находим активное объявление с минимальной ценой для базовых значений площадей
  const getBaseAreaValues = () => {
    const activeAdsWithAreas = flatAds.filter(
      (ad) =>
        (ad.status === true || ad.status === 1) &&
        ad.totalArea &&
        ad.kitchenArea,
    )

    if (activeAdsWithAreas.length === 0) {
      return { minArea: undefined, minKitchenArea: undefined }
    }

    // Находим объявление с минимальной ценой среди всех активных объявлений с площадями
    const minPriceAd = activeAdsWithAreas.reduce((min, current) =>
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

      // Получаем минимальную цену из объявлений текущей квартиры (сначала активные, потом неактивные)
      const getMinPriceFromCurrentFlatAds = () => {
        const allAds = flatAds.length
        const activeAds = flatAds.filter(
          (ad) => (ad.status === true || ad.status === 1) && ad.price,
        )
        const inactiveAds = flatAds.filter(
          (ad) => (ad.status === false || ad.status === 0) && ad.price,
        )

        // Используем активные, если есть, иначе неактивные
        const adsToUse = activeAds.length > 0 ? activeAds : inactiveAds

        if (process.env.NODE_ENV === 'development') {
          const timestamp = new Date().toISOString().slice(11, 23)
          if (activeAds.length > 0) {
            console.log(
              `💰 [${timestamp}] Using ACTIVE ads for filters (${activeAds.length} ads)`,
            )
          } else if (inactiveAds.length > 0) {
            console.log(
              `💰 [${timestamp}] Using INACTIVE ads for filters (${inactiveAds.length} ads)`,
            )
          }
        }

        // Если нет объявлений о квартире - используем максимальную цену в доме
        if (adsToUse.length === 0) {
          const maxHousePrice = getMaxHousePrice()
          if (process.env.NODE_ENV === 'development') {
            const timestamp = new Date().toISOString().slice(11, 23)
            console.log(
              `🏠 [${timestamp}] No flat ads, using max house price: ${maxHousePrice}`,
            )
          }
          return maxHousePrice
        }

        const minPriceAd = adsToUse.reduce((min, current) =>
          current.price && (!min.price || current.price < min.price)
            ? current
            : min,
        )

        const finalPrice = minPriceAd.price || 50000000

        if (process.env.NODE_ENV === 'development') {
          const timestamp = new Date().toISOString().slice(11, 23)
          console.log(
            `💰 [${timestamp}] MIN_PRICE - Selected: ${finalPrice} from ad: ${minPriceAd.url}`,
          )
        }

        return finalPrice
      }

      // Получаем максимальную цену в доме из объявлений по дому
      const getMaxHousePrice = () => {
        // flatAds в контексте должны включать объявления по дому (from=2)
        // Если это не так, используем fallback значение
        const houseAds = flatAds.filter((ad) => ad.from === 2 && ad.price)

        if (houseAds.length === 0) {
          return 50000000 // fallback если нет объявлений по дому
        }

        const maxPriceAd = houseAds.reduce((max, current) =>
          current.price && (!max.price || current.price > max.price)
            ? current
            : max,
        )

        return maxPriceAd.price || 50000000
      }

      const newDefaultFilters = {
        rooms: flat.rooms || 3,
        maxPrice: getMinPriceFromCurrentFlatAds(),
        minArea: baseAreaValues.minArea,
        minKitchenArea: baseAreaValues.minKitchenArea,
      }

      setDefaultFiltersFromFlatAds(newDefaultFilters)
    }
  }, [flatAds]) // Зависит только от flatAds, не от flat.rooms

  // State for map filters - используем параметры текущей квартиры согласно MAPS.md
  const [mapFilters, setMapFilters] = useState<FlatFilters | null>(null)

  // Status toggles state for header
  const [statusToggles, setStatusToggles] = useState({
    showActive: true,
    showInactive: true,
  })

  // Инициализируем mapFilters когда defaultFilters готовы
  useEffect(() => {
    // Устанавливаем фильтры даже с дефолтными значениями, чтобы карта всегда загружалась

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
      // Если первая инициализация (prevFilters === null), просто устанавливаем
      if (!prevFilters) {
        if (process.env.NODE_ENV === 'development') {
          const timestamp = new Date().toISOString().slice(11, 23)
          console.log(
            `🗺️ [${timestamp}] INIT - Map filters initialized:`,
            newFilters,
          )
        }
        return newFilters
      }

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
          trigger: nearbyFilters ? 'user_input' : 'update',
        })
      }

      return hasChanged ? newFilters : prevFilters
    })
  }, [defaultFiltersFromFlatAds, nearbyFilters])

  // Handle status toggle changes - только обновляем состояние переключателей
  const handleStatusToggle = (
    key: 'showActive' | 'showInactive',
    value: boolean,
  ) => {
    const newToggles = { ...statusToggles, [key]: value }
    setStatusToggles(newToggles)
    // НЕ обновляем mapFilters - пусть карта получает статусы отдельно

    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 [STATUS_TOGGLE] ${key}=${value}, isLoading=${isLoading}`)
    }
  }

  // Status toggles component for header
  const statusToggleComponent = (
    <div className='flex items-center gap-2'>
      <label className='flex items-center gap-1 cursor-pointer'>
        <input
          type='checkbox'
          checked={statusToggles.showActive}
          onChange={(e) => handleStatusToggle('showActive', e.target.checked)}
          className='sr-only'
        />
        <div
          className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
            statusToggles.showActive ? 'bg-orange-500' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
              statusToggles.showActive ? 'translate-x-3.5' : 'translate-x-0.5'
            }`}
          />
        </div>
        <span className='text-xs text-gray-600'>Активные</span>
      </label>

      <label className='flex items-center gap-1 cursor-pointer'>
        <input
          type='checkbox'
          checked={statusToggles.showInactive}
          onChange={(e) => handleStatusToggle('showInactive', e.target.checked)}
          className='sr-only'
        />
        <div
          className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
            statusToggles.showInactive ? 'bg-gray-500' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
              statusToggles.showInactive ? 'translate-x-3.5' : 'translate-x-0.5'
            }`}
          />
        </div>
        <span className='text-xs text-gray-600'>Неактивные</span>
      </label>
    </div>
  )

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

    // Update map filters (без статусов - они передаются отдельно)
    const newMapFilters = {
      rooms: filters.rooms,
      maxPrice: filters.maxPrice,
      minArea: filters.minArea,
      minKitchenArea: filters.minKitchenArea,
    }

    setMapFilters(newMapFilters)

    // Call original search callback for server filters
    if (onSearchWithFilters) {
      onSearchWithFilters(filters)
    }
  }

  // Мемоизируем external filters для карты
  // Статусы включены но не должны вызывать серверные запросы (только клиентская фильтрация)
  const memoizedExternalFilters = useMemo(() => {
    if (!mapFilters) return null

    return {
      rooms: mapFilters.rooms,
      maxPrice: mapFilters.maxPrice,
      minArea: mapFilters.minArea,
      minKitchenArea: mapFilters.minKitchenArea,
      showActive: statusToggles.showActive,
      showInactive: statusToggles.showInactive,
    }
  }, [
    mapFilters?.rooms,
    mapFilters?.maxPrice,
    mapFilters?.minArea,
    mapFilters?.minKitchenArea,
    statusToggles.showActive,
    statusToggles.showInactive,
  ])

  const loadingContent = (
    <div className='flex justify-center items-center py-8'>
      <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
      <span className='ml-2 text-sm text-gray-600'>
        Загружаем объявления рядом...
      </span>
    </div>
  )

  return (
    <CollapsibleBlock
      title='Объявления рядом'
      isCollapsed={isCollapsed}
      onToggle={onToggleCollapse}
    >
      {isLoading ? (
        loadingContent
      ) : (
        <>
          {/* Переключатели статуса объявлений */}
          <div className='mb-4'>{statusToggleComponent}</div>

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
          {mapFilters ? (
            <MapWithPreview
              flatId={flat.id.toString()}
              className='w-full'
              externalFilters={memoizedExternalFilters}
              onAddToComparison={onAddToComparison}
              onToggleComparison={onToggleComparison}
              comparisonAds={comparisonAds}
            />
          ) : (
            <div className='w-full h-[500px] bg-gray-100 animate-pulse rounded-lg flex items-center justify-center'>
              <div className='text-sm text-gray-600'>Загрузка карты...</div>
            </div>
          )}
        </>
      )}
    </CollapsibleBlock>
  )
})

export default NearbyAdsBlock
