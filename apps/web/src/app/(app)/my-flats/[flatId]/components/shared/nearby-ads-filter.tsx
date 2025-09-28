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

  // Проверяем изменения для всех полей фильтра
  const hasChanges =
    filters.maxPrice !== currentFilters.maxPrice ||
    filters.rooms !== currentFilters.rooms ||
    filters.minArea !== currentFilters.minArea ||
    filters.minKitchenArea !== currentFilters.minKitchenArea ||
    filters.radius !== currentFilters.radius

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
          className='!w-13 h-8 text-xs [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
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
          className='!w-10 h-8 text-xs [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
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
          className='!w-12 h-8 text-xs [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
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
          placeholder='9'
          className='!w-10 h-8 text-xs [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
        />
        <span className='text-xs text-gray-600'>м²</span>
      </div>

      {/* Кнопка "Искать" в том же стиле как "Искать объявления" */}
      <UpdateButton
        isLoading={isLoading}
        onClick={handleSearch}
        disabled={!hasChanges}
        variant='default'
        size='sm'
      >
        {isLoading ? 'Поиск...' : 'Искать'}
      </UpdateButton>
    </div>
  )
}
