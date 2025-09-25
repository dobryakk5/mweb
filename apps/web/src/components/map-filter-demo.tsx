'use client'

import React, { useState, useEffect } from 'react'
import {
  useMapCache,
  type MapFilters,
  type MapBounds,
} from '@/hooks/use-map-cache'

interface MapFilterDemoProps {
  bounds: MapBounds
  onDataChange?: (data: { houses: any[]; ads: any[] }) => void
}

export const MapFilterDemo: React.FC<MapFilterDemoProps> = ({
  bounds,
  onDataChange,
}) => {
  const { getFilteredData, getCacheInfo, invalidateCache, loading } =
    useMapCache()
  const [filters, setFilters] = useState<MapFilters>({
    rooms: 2,
    maxPrice: 10000000,
    minArea: 50,
    minKitchenArea: 8,
  })

  const [data, setData] = useState<{ houses: any[]; ads: any[] } | null>(null)
  const cacheInfo = getCacheInfo()

  // Загрузка данных при изменении bounds или фильтров
  useEffect(() => {
    const loadData = async () => {
      const result = await getFilteredData(bounds, filters)
      if (result) {
        setData(result)
        onDataChange?.(result)
      }
    }

    loadData()
  }, [bounds, filters, getFilteredData, onDataChange])

  const handleFilterChange = (
    key: keyof MapFilters,
    value: number | undefined,
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className='p-4 bg-white rounded-lg shadow'>
      <h3 className='text-lg font-semibold mb-4'>
        Фильтры карты с кэшированием
      </h3>

      {/* Статус кэша */}
      <div className='mb-4 p-2 bg-gray-100 rounded text-sm'>
        {cacheInfo.hasCache ? (
          <div className='text-green-600'>
            ✅ Кэш активен: {cacheInfo.adsCount} объявлений,{' '}
            {cacheInfo.housesCount} домов
            <br />
            Возраст: {Math.round(cacheInfo.age / 1000)} секунд
          </div>
        ) : (
          <div className='text-gray-500'>📦 Кэш пуст</div>
        )}

        {loading && <div className='text-blue-600 mt-1'>🔄 Загрузка...</div>}
      </div>

      {/* Фильтры */}
      <div className='grid grid-cols-2 gap-4 mb-4'>
        <div>
          <label className='block text-sm font-medium mb-1'>Комнат от:</label>
          <input
            type='number'
            value={filters.rooms || ''}
            onChange={(e) =>
              handleFilterChange('rooms', Number(e.target.value) || undefined)
            }
            className='w-full px-3 py-2 border rounded-md'
            min='1'
            max='10'
          />
        </div>

        <div>
          <label className='block text-sm font-medium mb-1'>
            Цена до (млн ₽):
          </label>
          <input
            type='number'
            value={
              filters.maxPrice ? Math.round(filters.maxPrice / 1000000) : ''
            }
            onChange={(e) =>
              handleFilterChange(
                'maxPrice',
                Number(e.target.value) * 1000000 || undefined,
              )
            }
            className='w-full px-3 py-2 border rounded-md'
            min='1'
            max='100'
          />
        </div>

        <div>
          <label className='block text-sm font-medium mb-1'>
            Площадь от (м²):
          </label>
          <input
            type='number'
            value={filters.minArea || ''}
            onChange={(e) =>
              handleFilterChange('minArea', Number(e.target.value) || undefined)
            }
            className='w-full px-3 py-2 border rounded-md'
            min='20'
            max='300'
          />
        </div>

        <div>
          <label className='block text-sm font-medium mb-1'>
            Кухня от (м²):
          </label>
          <input
            type='number'
            value={filters.minKitchenArea || ''}
            onChange={(e) =>
              handleFilterChange(
                'minKitchenArea',
                Number(e.target.value) || undefined,
              )
            }
            className='w-full px-3 py-2 border rounded-md'
            min='5'
            max='50'
          />
        </div>
      </div>

      {/* Результаты */}
      {data && (
        <div className='space-y-2 text-sm'>
          <div className='text-gray-600'>
            🏠 Найдено домов: {data.houses.length}
          </div>
          <div className='text-gray-600'>📝 Объявлений: {data.ads.length}</div>
          <div className='text-green-600'>
            🟠 Домов с активными объявлениями:{' '}
            {data.houses.filter((h) => h.has_active_ads).length}
          </div>
          <div className='text-gray-500'>
            ⚪ Домов только с неактивными:{' '}
            {data.houses.filter((h) => !h.has_active_ads).length}
          </div>
        </div>
      )}

      {/* Управление */}
      <div className='mt-4 flex gap-2'>
        <button
          onClick={invalidateCache}
          className='px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors text-sm'
          disabled={!cacheInfo.hasCache}
        >
          🗑️ Очистить кэш
        </button>

        <button
          onClick={() =>
            setFilters({
              rooms: 3,
              maxPrice: 20000000,
              minArea: 60,
              minKitchenArea: 10,
            })
          }
          className='px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors text-sm'
        >
          🏠 Пример фильтра
        </button>
      </div>
    </div>
  )
}
