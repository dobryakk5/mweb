'use client'

import { useState } from 'react'
import Input from '@acme/ui/components/input'
import { UpdateButton } from './update-buttons'

interface NearbyAdsFilterProps {
  currentFilters: {
    maxPrice: number
    minArea?: number
    rooms: number
    minKitchenArea?: number
    radius: number
  }
  onSearch: (filters: {
    maxPrice: number
    minArea?: number
    rooms: number
    minKitchenArea?: number
    radius: number
  }) => void
  isLoading?: boolean
  inline?: boolean
}

export default function NearbyAdsFilter({
  currentFilters,
  onSearch,
  isLoading = false,
  inline = false,
}: NearbyAdsFilterProps) {
  const [filters, setFilters] = useState(currentFilters)

  const handleSearch = () => {
    onSearch(filters)
  }

  const hasChanges = JSON.stringify(filters) !== JSON.stringify(currentFilters)

  return (
    <div className='flex items-center gap-3 flex-wrap'>
      {/* Компактные поля ввода в одну строку */}
      <div className='flex items-center gap-1'>
        <span className='text-xs text-gray-600'>Цена до:</span>
        <Input
          type='number'
          step='0.1'
          min='0'
          value={filters.maxPrice / 1000000}
          onChange={(e) =>
            setFilters({
              ...filters,
              maxPrice: parseFloat(e.target.value) * 1000000,
            })
          }
          className='w-12 h-8 text-xs'
          placeholder='36.2'
        />
        <span className='text-xs text-gray-600'>млн</span>
      </div>

      <div className='flex items-center gap-1'>
        <span className='text-xs text-gray-600'>Комнат от:</span>
        <Input
          type='number'
          min='1'
          max='10'
          value={filters.rooms}
          onChange={(e) =>
            setFilters({ ...filters, rooms: parseInt(e.target.value) || 1 })
          }
          className='w-8 h-8 text-xs'
        />
      </div>

      <div className='flex items-center gap-1'>
        <span className='text-xs text-gray-600'>Площадь от:</span>
        <Input
          type='number'
          min='0'
          value={filters.minArea || ''}
          onChange={(e) =>
            setFilters({
              ...filters,
              minArea: e.target.value ? parseFloat(e.target.value) : undefined,
            })
          }
          placeholder='50'
          className='w-10 h-8 text-xs'
        />
        <span className='text-xs text-gray-600'>м²</span>
      </div>

      <div className='flex items-center gap-1'>
        <span className='text-xs text-gray-600'>Кухня от:</span>
        <Input
          type='number'
          min='0'
          value={filters.minKitchenArea || ''}
          onChange={(e) =>
            setFilters({
              ...filters,
              minKitchenArea: e.target.value
                ? parseFloat(e.target.value)
                : undefined,
            })
          }
          placeholder='7'
          className='w-8 h-8 text-xs'
        />
        <span className='text-xs text-gray-600'>м²</span>
      </div>

      {/* Кнопка "Искать еще" в стиле RefreshNearbyButton */}
      <UpdateButton
        isLoading={isLoading}
        onClick={handleSearch}
        disabled={!hasChanges}
        variant='outline'
        size='sm'
      >
        {isLoading ? 'Поиск...' : 'Искать еще'}
      </UpdateButton>
    </div>
  )
}
