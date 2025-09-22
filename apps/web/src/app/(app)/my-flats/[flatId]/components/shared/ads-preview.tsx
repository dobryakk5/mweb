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
  return (
    <div
      className='border-b border-gray-200 p-3 hover:bg-gray-50 cursor-pointer transition-colors'
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      <div className='flex justify-between items-start mb-2'>
        <div className='font-semibold text-lg text-green-600'>
          {formatPrice(ad.price)}
        </div>
        <div className='text-sm text-gray-500'>{ad.rooms} комн.</div>
      </div>

      <div className='grid grid-cols-2 gap-2 text-sm text-gray-600 mb-2'>
        {ad.area && <div>Площадь: {ad.area} м²</div>}
        {ad.kitchen_area && <div>Кухня: {ad.kitchen_area} м²</div>}
        <div>
          Этаж: {ad.floor}
          {ad.total_floors ? `/${ad.total_floors}` : ''}
        </div>
        <div className='text-xs text-gray-500'>
          {formatDateShort(ad.updated_at)}
        </div>
      </div>

      <div className='text-xs text-blue-600 hover:text-blue-800 truncate'>
        {formatUrlForDisplay(ad.url)}
      </div>
    </div>
  )
}

const FiltersBadges = ({ filters }: { filters: FlatFilters }) => {
  return (
    <div className='flex flex-wrap gap-1 mb-3'>
      <div className='inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full'>
        <FilterIcon className='w-3 h-3 mr-1' />
        Комнат: {filters.rooms}+
      </div>
      <div className='inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full'>
        До: {formatPrice(filters.maxPrice)}
      </div>
      {filters.minArea && (
        <div className='inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full'>
          Площадь: {filters.minArea}+ м²
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
