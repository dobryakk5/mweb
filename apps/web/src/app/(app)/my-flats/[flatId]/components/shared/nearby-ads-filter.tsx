'use client'

import { useState } from 'react'
import Button from '@acme/ui/components/button'
import Input from '@acme/ui/components/input'
import Label from '@acme/ui/components/label'

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
}

export default function NearbyAdsFilter({
  currentFilters,
  onSearch,
  isLoading = false,
}: NearbyAdsFilterProps) {
  const [filters, setFilters] = useState(currentFilters)

  const handleSearch = () => {
    onSearch(filters)
  }

  const handleReset = () => {
    setFilters(currentFilters)
  }

  const formatPrice = (price: number) => {
    return (price / 1000000).toFixed(1) + ' млн ₽'
  }

  const hasChanges = JSON.stringify(filters) !== JSON.stringify(currentFilters)

  return (
    <div className='bg-gray-50 rounded-lg p-4 mb-4 border'>
      <div className='flex items-center justify-between mb-3'>
        <h3 className='font-medium text-gray-900'>Фильтры поиска</h3>
        <span className='text-sm text-gray-500'>Радиус: {filters.radius}м</span>
      </div>

      {/* Current filters display */}
      <div className='mb-4 text-sm text-gray-600'>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
          <div>
            <span className='font-medium'>Цена:</span> до{' '}
            {formatPrice(filters.maxPrice)}
          </div>
          <div>
            <span className='font-medium'>Комнат:</span> {filters.rooms}
          </div>
          <div>
            <span className='font-medium'>Площадь:</span>{' '}
            {filters.minArea ? `от ${filters.minArea}м²` : 'любая'}
          </div>
          <div>
            <span className='font-medium'>Кухня:</span>{' '}
            {filters.minKitchenArea
              ? `от ${filters.minKitchenArea}м²`
              : 'любая'}
          </div>
        </div>
      </div>

      {/* Editable filters */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-4'>
        <div>
          <Label htmlFor='maxPrice' className='text-xs'>
            Макс. цена (млн ₽)
          </Label>
          <Input
            id='maxPrice'
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
            className='text-sm'
          />
        </div>

        <div>
          <Label htmlFor='rooms' className='text-xs'>
            Комнат
          </Label>
          <Input
            id='rooms'
            type='number'
            min='1'
            max='10'
            value={filters.rooms}
            onChange={(e) =>
              setFilters({ ...filters, rooms: parseInt(e.target.value) || 1 })
            }
            className='text-sm'
          />
        </div>

        <div>
          <Label htmlFor='minArea' className='text-xs'>
            Мин. площадь (м²)
          </Label>
          <Input
            id='minArea'
            type='number'
            min='0'
            value={filters.minArea || ''}
            onChange={(e) =>
              setFilters({
                ...filters,
                minArea: e.target.value
                  ? parseFloat(e.target.value)
                  : undefined,
              })
            }
            placeholder='любая'
            className='text-sm'
          />
        </div>

        <div>
          <Label htmlFor='minKitchenArea' className='text-xs'>
            Мин. кухня (м²)
          </Label>
          <Input
            id='minKitchenArea'
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
            placeholder='любая'
            className='text-sm'
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className='flex gap-2'>
        <Button
          onClick={handleSearch}
          disabled={isLoading || !hasChanges}
          size='sm'
          className='flex-1'
        >
          {isLoading ? 'Поиск...' : 'Искать еще'}
        </Button>

        {hasChanges && (
          <Button onClick={handleReset} variant='outline' size='sm'>
            Сбросить
          </Button>
        )}
      </div>
    </div>
  )
}
