'use client'

import { useMemo } from 'react'
import { buttonVariants } from '@acme/ui/components/button'
import {
  Loader2Icon,
  FilterIcon,
  AlertCircleIcon,
  XIcon,
  PlusIcon,
  MinusIcon,
} from '@acme/ui/components/icon'
import type { AdData, FlatFilters } from '../hooks/use-map-ads-filter'
import { useHouseInfo } from '../hooks/use-house-info'
import {
  formatPrice,
  formatDateShort,
  formatUrlForDisplay,
  deduplicateAdsBySourcePriority,
} from '../utils/ad-formatters'

interface AdsPreviewProps {
  ads: AdData[]
  loading: boolean
  error: string | null
  filters: FlatFilters
  onAdHover?: (ad: AdData | null) => void
  onAdClick?: (ad: AdData) => void
  className?: string
  selectedHouseId?: number | null
  onClearHouseSelection?: () => void
  onAddToComparison?: (ad: AdData) => void
  onToggleComparison?: (ad: AdData) => void // Новый коллбек для toggle
  comparisonAds?: AdData[] // Массив объявлений в сравнении
  showInitialLegend?: boolean
}

interface AdItemProps {
  ad: AdData
  onHover?: () => void
  onLeave?: () => void
  onClick?: () => void
  onAddToComparison?: () => void
  onToggleComparison?: () => void
  isInComparison?: boolean
}

const AdItem = ({
  ad,
  onHover,
  onLeave,
  onClick,
  onAddToComparison,
  onToggleComparison,
  isInComparison,
}: AdItemProps) => {
  const area = ad.area ? Number(ad.area).toFixed(1) : '—'
  const kitchen = ad.kitchen_area ? Number(ad.kitchen_area).toFixed(1) : '—'
  const floor = ad.total_floors ? `${ad.floor}/${ad.total_floors}` : ad.floor
  const { domain } = formatUrlForDisplay(ad.url)
  const price = formatPrice(ad.price)

  // Проверяем активность объявления (API может возвращать 0/1 или true/false)
  const isActive = ad.is_active === true || ad.is_active === 1

  // Определяем источник для бейджа
  const getSourceBadge = (url: string) => {
    const baseClasses = isActive ? '' : 'opacity-60'

    if (url.includes('cian.ru')) {
      return {
        text: 'cian',
        className: `bg-blue-100 text-blue-800 ${baseClasses}`,
      }
    }
    if (url.includes('avito.ru')) {
      return {
        text: 'avito',
        className: `bg-green-100 text-green-800 ${baseClasses}`,
      }
    }
    if (url.includes('yandex.ru')) {
      return {
        text: 'yandex',
        className: `bg-red-100 text-red-800 ${baseClasses}`,
      }
    }
    return {
      text: domain,
      className: `bg-gray-100 text-gray-800 ${baseClasses}`,
    }
  }

  const sourceBadge = getSourceBadge(ad.url)

  const handleClick = () => {
    window.open(ad.url, '_blank')
    onClick?.()
  }

  // Классы для неактивных объявлений
  const textColorClass = isActive ? 'text-black' : 'text-gray-500'
  const hoverClass = isActive ? 'hover:bg-gray-50' : 'hover:bg-gray-25'

  return (
    <div
      className={`border-b border-gray-200 px-3 py-2 ${hoverClass} transition-colors text-sm flex justify-between items-center ${isActive ? '' : 'opacity-75'}`}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <span
        className={`truncate mr-2 ${textColorClass} cursor-pointer`}
        onClick={handleClick}
      >
        {ad.rooms}-к., {area} м², {floor} эт, {kitchen} кух
      </span>
      <div className='flex items-center gap-2 whitespace-nowrap'>
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${sourceBadge.className}`}
        >
          {sourceBadge.text}
        </span>
        <span className={textColorClass}>
          <span className='font-bold'>{price}</span> млн
        </span>
        {(onAddToComparison || onToggleComparison) && (
          <button
            className={buttonVariants({
              variant: 'outline',
              size: 'sm',
            })}
            onClick={(e) => {
              e.stopPropagation()
              if (isInComparison && onToggleComparison) {
                onToggleComparison()
              } else if (onAddToComparison) {
                onAddToComparison()
              }
            }}
            title={
              isInComparison ? 'Убрать из сравнения' : 'Добавить в сравнение'
            }
            disabled={!isActive}
          >
            {isInComparison ? (
              <MinusIcon className='h-4 w-4' />
            ) : (
              <PlusIcon className='h-4 w-4' />
            )}
          </button>
        )}
      </div>
    </div>
  )
}

const FiltersBadges = ({ filters }: { filters: FlatFilters }) => {
  const showPrice = filters.maxPrice < 100000000 // Only show price if it's not the fallback value

  return (
    <div className='flex flex-wrap gap-1 mb-3'>
      <div className='inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full'>
        <FilterIcon className='w-3 h-3 mr-1' />
        Комнат: {filters.rooms}+
      </div>
      {showPrice && (
        <div className='inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full'>
          До: {formatPrice(filters.maxPrice)} млн
        </div>
      )}
      {filters.minArea && (
        <div className='inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full'>
          Площадь: {filters.minArea.toFixed(1)}+ м²
        </div>
      )}
      {filters.minKitchenArea && (
        <div className='inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full'>
          Кухня: {filters.minKitchenArea}+ м²
        </div>
      )}
    </div>
  )
}

const MapLegend = () => {
  return (
    <div className='p-6 text-center'>
      <h3 className='text-lg font-medium text-gray-900 mb-4'>Легенда карты</h3>
      <div className='space-y-4 text-left'>
        {/* Мой дом */}
        <div className='flex items-center gap-3'>
          <div className='w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-md flex items-center justify-center'>
            <div className='w-2 h-2 bg-white rounded-full'></div>
          </div>
          <span className='text-sm text-gray-700'>Мой дом</span>
        </div>

        {/* Дома с активными объявлениями */}
        <div className='flex items-center gap-3'>
          <div className='w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow-md flex items-center justify-center'>
            <span className='text-xs font-bold text-white'>₽</span>
          </div>
          <span className='text-sm text-gray-700'>
            Дома с активными объявлениями
          </span>
        </div>

        {/* Дома только с неактивными объявлениями */}
        <div className='flex items-center gap-3'>
          <div className='w-6 h-6 bg-gray-400 rounded-full border-2 border-white shadow-md flex items-center justify-center'>
            <span className='text-xs font-bold text-white'>₽</span>
          </div>
          <span className='text-sm text-gray-700'>
            Дома только с неактивными объявлениями
          </span>
        </div>
      </div>

      <div className='mt-6 p-3 bg-blue-50 rounded-lg'>
        <p className='text-xs text-blue-600'>
          💡 Передвигайте карту, чтобы увидеть объявления в выбранной области
        </p>
      </div>
    </div>
  )
}

const EmptyState = () => {
  return (
    <div className='flex flex-col items-center justify-center py-8 text-center'>
      <AlertCircleIcon className='w-12 h-12 text-gray-400 mb-3' />
      <h3 className='text-lg font-medium text-gray-900 mb-2'>
        Нет объявлений в данной области
      </h3>
      <p className='text-sm text-gray-500 mb-4'>
        Попробуйте изменить область карты или настройки фильтров
      </p>
    </div>
  )
}

const LoadingState = () => {
  return (
    <div className='flex items-center justify-center py-8'>
      <Loader2Icon className='w-6 h-6 animate-spin text-blue-600 mr-2' />
      <span className='text-sm text-gray-600'>Загрузка объявлений...</span>
    </div>
  )
}

const ErrorState = ({ error }: { error: string }) => {
  return (
    <div className='flex flex-col items-center justify-center py-8 text-center'>
      <AlertCircleIcon className='w-12 h-12 text-red-400 mb-3' />
      <h3 className='text-lg font-medium text-gray-900 mb-2'>
        Ошибка загрузки
      </h3>
      <p className='text-sm text-red-600 mb-4'>{error}</p>
    </div>
  )
}

/**
 * Preview panel component for displaying filtered ads from map bounds
 */
export default function AdsPreview({
  ads,
  loading,
  error,
  filters,
  onAdHover,
  onAdClick,
  className = '',
  selectedHouseId,
  onClearHouseSelection,
  onAddToComparison,
  onToggleComparison,
  comparisonAds = [],
  showInitialLegend = false,
}: AdsPreviewProps) {
  // Fetch house info when a specific house is selected
  const {
    houseInfo,
    loading: houseInfoLoading,
    error: houseInfoError,
  } = useHouseInfo({
    houseId: selectedHouseId,
    enabled: !!selectedHouseId,
  })
  // Filter duplicates with source priority: Cian > Yandex > Avito
  const deduplicatedAds = useMemo(() => {
    const originalCount = ads.length
    const deduplicated = deduplicateAdsBySourcePriority(ads)

    if (
      process.env.NODE_ENV === 'development' &&
      originalCount !== deduplicated.length
    ) {
      const timestamp = new Date().toISOString().slice(11, 23)
      console.log(
        `🔄 [${timestamp}] DEDUPLICATION - Original: ${originalCount}, After: ${deduplicated.length}`,
      )

      // Показываем какие объявления были удалены
      const removedCount = originalCount - deduplicated.length
      if (removedCount > 0) {
        console.log(`❌ [${timestamp}] REMOVED ${removedCount} duplicate ads`)

        // Группируем по ценам для понимания что удалилось
        const priceGroups = ads.reduce((groups: Record<number, number>, ad) => {
          groups[ad.price] = (groups[ad.price] || 0) + 1
          return groups
        }, {})

        console.log(`💰 [${timestamp}] Price distribution:`, priceGroups)
      }
    }

    return deduplicated
  }, [ads])

  // Sort ads: active first, then by price (cheapest first)
  const sortedAds = useMemo(() => {
    return [...deduplicatedAds].sort((a, b) => {
      // Проверяем активность
      const aActive = a.is_active === true || a.is_active === 1
      const bActive = b.is_active === true || b.is_active === 1

      // Сначала активные, потом неактивные
      if (aActive && !bActive) return -1
      if (!aActive && bActive) return 1

      // В рамках одной группы (активные или неактивные) сортируем по цене
      return a.price - b.price
    })
  }, [deduplicatedAds])

  const handleAdHover = (ad: AdData) => {
    onAdHover?.(ad)
  }

  const handleAdLeave = () => {
    onAdHover?.(null)
  }

  const handleAdClick = (ad: AdData) => {
    onAdClick?.(ad)
  }

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}
    >
      {/* Header */}
      <div className='p-4 border-b border-gray-200'>
        <div className='flex items-center justify-between mb-3'>
          <h3 className='text-lg font-semibold text-gray-900'>
            {selectedHouseId ? 'Объявления в доме' : 'Объявления в области'}
          </h3>
          <div className='flex items-center gap-2'>
            <div className='text-sm text-gray-500'>
              {loading ? '...' : `${ads.length} шт.`}
            </div>
            {selectedHouseId && onClearHouseSelection && (
              <button
                onClick={onClearHouseSelection}
                className='p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors'
                title='Показать все объявления в области'
              >
                <XIcon className='w-4 h-4' />
              </button>
            )}
          </div>
        </div>

        {/* House selection indicator */}
        {selectedHouseId && (
          <div className='mb-3 p-2 bg-blue-50 rounded-md border border-blue-200'>
            {houseInfoLoading ? (
              <div className='text-sm text-blue-800 flex items-center'>
                <Loader2Icon className='w-4 h-4 animate-spin mr-2' />📍 Загрузка
                информации о доме...
              </div>
            ) : houseInfoError ? (
              <div className='text-sm text-blue-800'>
                📍 Показаны объявления из дома #{selectedHouseId}
              </div>
            ) : houseInfo ? (
              <div className='text-sm text-blue-800'>
                📍 {houseInfo.address}
                {houseInfo.house_type_id ? ` (${houseInfo.house_type})` : ''}
              </div>
            ) : (
              <div className='text-sm text-blue-800'>
                📍 Показаны объявления из дома #{selectedHouseId}
              </div>
            )}
          </div>
        )}

        {/* Filters display */}
        {!selectedHouseId && <FiltersBadges filters={filters} />}
      </div>

      {/* Content */}
      <div className='max-h-96 overflow-y-auto'>
        {showInitialLegend ? (
          <MapLegend />
        ) : error ? (
          <ErrorState error={error} />
        ) : loading ? (
          <LoadingState />
        ) : sortedAds.length === 0 ? (
          <EmptyState />
        ) : (
          <div>
            {sortedAds.map((ad, index) => {
              // Check if this ad is in comparison by URL
              const isInComparison = comparisonAds.some(
                (compAd) => compAd.url === ad.url,
              )

              return (
                <AdItem
                  key={`${ad.house_id}-${ad.floor}-${ad.rooms}-${index}`}
                  ad={ad}
                  onHover={() => handleAdHover(ad)}
                  onLeave={handleAdLeave}
                  onClick={() => handleAdClick(ad)}
                  onAddToComparison={
                    onAddToComparison ? () => onAddToComparison(ad) : undefined
                  }
                  onToggleComparison={
                    onToggleComparison
                      ? () => onToggleComparison(ad)
                      : undefined
                  }
                  isInComparison={isInComparison}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* Footer with summary */}
      {!loading && !error && sortedAds.length > 0 && (
        <div className='p-3 border-t border-gray-200 bg-gray-50'>
          <div className='text-xs text-gray-600'>
            Цены от {formatPrice(Math.min(...sortedAds.map((ad) => ad.price)))}
            {' до '} {formatPrice(Math.max(...sortedAds.map((ad) => ad.price)))}
          </div>
        </div>
      )}
    </div>
  )
}
