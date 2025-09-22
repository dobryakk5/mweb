'use client'

import { useMemo } from 'react'
import {
  Loader2Icon,
  FilterIcon,
  AlertCircleIcon,
} from '@acme/ui/components/icon'
import type { AdData, FlatFilters } from '../hooks/use-map-ads-filter'
import {
  formatPrice,
  formatDateShort,
  formatUrlForDisplay,
} from '../utils/ad-formatters'

interface AdsPreviewProps {
  ads: AdData[]
  loading: boolean
  error: string | null
  filters: FlatFilters
  onAdHover?: (ad: AdData | null) => void
  onAdClick?: (ad: AdData) => void
  className?: string
}

interface AdItemProps {
  ad: AdData
  onHover?: () => void
  onLeave?: () => void
  onClick?: () => void
}

const AdItem = ({ ad, onHover, onLeave, onClick }: AdItemProps) => {
  const area = ad.area ? Number(ad.area).toFixed(1) : '—'
  const kitchen = ad.kitchen_area ? Number(ad.kitchen_area).toFixed(1) : '—'
  const floor = ad.total_floors ? `${ad.floor}/${ad.total_floors}` : ad.floor
  const domain = formatUrlForDisplay(ad.url).domain
  const price = formatPrice(ad.price)

  return (
    <div
      className='border-b border-gray-200 px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors text-sm flex justify-between items-center'
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      <span className='truncate mr-2'>
        {ad.rooms}-комн., {area} м², {floor} этаж, {kitchen} кухня {domain}
      </span>
      <span className='font-bold text-green-600 whitespace-nowrap'>
        {price} млн ₽
      </span>
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
          До: {formatPrice(filters.maxPrice)} млн ₽
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
}: AdsPreviewProps) {
  // Sort ads by price (cheapest first)
  const sortedAds = useMemo(() => {
    return [...ads].sort((a, b) => a.price - b.price)
  }, [ads])

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
            Объявления в области
          </h3>
          <div className='text-sm text-gray-500'>
            {loading ? '...' : `${ads.length} шт.`}
          </div>
        </div>

        {/* Filters display */}
        <FiltersBadges filters={filters} />
      </div>

      {/* Content */}
      <div className='max-h-96 overflow-y-auto'>
        {error ? (
          <ErrorState error={error} />
        ) : loading ? (
          <LoadingState />
        ) : sortedAds.length === 0 ? (
          <EmptyState />
        ) : (
          <div>
            {sortedAds.map((ad, index) => (
              <AdItem
                key={`${ad.house_id}-${ad.floor}-${ad.rooms}-${index}`}
                ad={ad}
                onHover={() => handleAdHover(ad)}
                onLeave={handleAdLeave}
                onClick={() => handleAdClick(ad)}
              />
            ))}
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
