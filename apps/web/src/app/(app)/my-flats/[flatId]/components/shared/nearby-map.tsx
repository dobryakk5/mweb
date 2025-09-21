'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { getDomainFromUrl } from '../utils/ad-formatters'

// Динамический импорт карты для SSR совместимости
const DynamicMap = dynamic(() => import('./nearby-map-component'), {
  ssr: false,
  loading: () => (
    <div className='h-[400px] w-full flex items-center justify-center bg-gray-100 rounded-lg'>
      <div className='text-lg text-gray-600'>Загрузка карты...</div>
    </div>
  ),
})

interface NearbyMapProps {
  flatAddress: string
  flatCoordinates?: { lat: number; lng: number }
  nearbyAds: any[]
  currentFlat?: any
  onHouseClick?: (house: any) => void
  onAddToComparison?: (adData: any) => Promise<void>
  onToggleComparison?: (adId: number, inComparison: boolean) => Promise<void>
  comparisonAds?: any[]
  filters?: {
    maxPrice?: number
    rooms?: number
    minArea?: number
    minKitchenArea?: number
  }
}

export default function NearbyMap({
  flatAddress,
  flatCoordinates,
  nearbyAds,
  currentFlat,
  onHouseClick,
  onAddToComparison,
  onToggleComparison,
  comparisonAds = [],
  filters,
}: NearbyMapProps) {
  const [selectedHouse, setSelectedHouse] = useState<any>(null)
  const [houseAds, setHouseAds] = useState<any[]>([])
  const [loadingHouseAds, setLoadingHouseAds] = useState(false)

  // Helper function to check if an ad is in comparison
  const isAdInComparison = (ad: any) => {
    if (ad.id && typeof ad.id === 'number') {
      // For database ads, check if sma === 1
      return ad.sma === 1
    } else {
      // For external ads, check if URL exists in comparisonAds
      return comparisonAds.some((compAd) => compAd.url === ad.url)
    }
  }

  const handleHouseClick = async (house: any) => {
    setSelectedHouse(house)
    setLoadingHouseAds(true)

    try {
      // Получаем объявления для выбранного дома по house_id
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/map/house-ads?houseId=${house.house_id}`,
      )
      if (response.ok) {
        const data = await response.json()
        setHouseAds(data.ads || [])
      } else {
        console.error('Failed to load house ads:', response.status)
        setHouseAds([])
      }
    } catch (error) {
      console.error('Error loading house ads:', error)
      setHouseAds([])
    } finally {
      setLoadingHouseAds(false)
    }

    if (onHouseClick) {
      onHouseClick(house)
    }
  }

  return (
    <div className='mb-6'>
      {/* Контейнер для карты и панели */}
      <div className='flex flex-col lg:flex-row gap-4 h-[600px]'>
        {/* Карта - половина экрана слева, сверху на мобильных */}
        <div className='w-full lg:w-1/2 h-1/2 lg:h-full'>
          <DynamicMap
            flatAddress={flatAddress}
            flatCoordinates={flatCoordinates}
            nearbyAds={nearbyAds}
            currentFlat={currentFlat}
            onHouseClick={handleHouseClick}
            filters={filters}
          />
        </div>

        {/* Панель с объявлениями - половина экрана справа, снизу на мобильных */}
        <div className='w-full lg:w-1/2 h-1/2 lg:h-full bg-gray-50 rounded-lg border overflow-hidden'>
          {selectedHouse ? (
            <div className='h-full flex flex-col'>
              {/* Заголовок с информацией о доме */}
              <div className='p-4 bg-white border-b'>
                <div className='flex items-center justify-between'>
                  <div>
                    <h3 className='font-semibold text-lg'>
                      🏢 {selectedHouse.address}
                    </h3>
                    <p className='text-sm text-gray-600'>
                      {selectedHouse.ads_count} объявлений • Расстояние:{' '}
                      {selectedHouse.dist_m}м
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedHouse(null)}
                    className='text-gray-400 hover:text-gray-600 text-xl'
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Список объявлений по выбранному дому */}
              <div className='flex-1 overflow-y-auto p-4'>
                {loadingHouseAds ? (
                  <div className='flex items-center justify-center h-32'>
                    <div className='text-gray-500'>Загрузка объявлений...</div>
                  </div>
                ) : houseAds.length > 0 ? (
                  <div className='space-y-2'>
                    {houseAds
                      .sort((a, b) => {
                        const aActive =
                          a.is_active === 1 || a.is_active === true
                        const bActive =
                          b.is_active === 1 || b.is_active === true

                        // Сначала активные
                        if (aActive && !bActive) return -1
                        if (!aActive && bActive) return 1

                        // Потом по цене по возрастанию
                        return (a.price || 0) - (b.price || 0)
                      })
                      .map((ad, index) => {
                        const isActive =
                          ad.is_active === 1 || ad.is_active === true
                        const rooms = ad.rooms || 0
                        const area = ad.area || 0
                        const floor = ad.floor || 0
                        const totalFloors = ad.total_floors || 0
                        const kitchenArea = ad.kitchen_area || 0
                        const price = ad.price || 0
                        const source = getDomainFromUrl(ad.url || '')

                        return (
                          <div
                            key={index}
                            className={`bg-white rounded-lg p-3 border shadow-sm flex items-center justify-between ${!isActive ? 'opacity-60' : ''}`}
                          >
                            <div className='text-sm flex-1'>
                              {rooms} комн.
                              {area ? `, ${Number(area).toFixed(1)} м²` : ''}
                              {floor && totalFloors
                                ? `, ${floor}/${totalFloors} эт.`
                                : floor
                                  ? `, ${floor} эт.`
                                  : ''}
                              {kitchenArea
                                ? `, кухня ${Number(kitchenArea).toFixed(1)}м²`
                                : ', кухня -'}
                              {!isActive && (
                                <span className='text-xs ml-2 text-red-500'>
                                  (неактивно)
                                </span>
                              )}
                            </div>
                            <div className='flex items-center gap-2'>
                              <a
                                href={ad.url}
                                target='_blank'
                                rel='noopener noreferrer'
                                className={`text-xs ${isActive ? 'text-blue-600 hover:text-blue-800' : 'text-gray-500'}`}
                              >
                                {source}
                              </a>
                              <span
                                className={`text-right ${isActive ? 'text-gray-900' : 'text-gray-500'}`}
                              >
                                <span className='font-bold'>
                                  {(price / 1000000).toFixed(1)}
                                </span>
                                <span className='font-normal'> млн ₽</span>
                              </span>
                              {(onAddToComparison || onToggleComparison) && (
                                <button
                                  onClick={() => {
                                    const inComparison = isAdInComparison(ad)
                                    if (
                                      ad.id &&
                                      typeof ad.id === 'number' &&
                                      onToggleComparison
                                    ) {
                                      // For database ads, use toggle comparison
                                      onToggleComparison(ad.id, !inComparison)
                                    } else if (onAddToComparison) {
                                      // For external ads, use add to comparison
                                      onAddToComparison(ad)
                                    }
                                  }}
                                  className='ml-2 flex-shrink-0 w-6 h-6 text-blue-500 hover:text-blue-600 flex items-center justify-center text-lg font-bold'
                                  title={
                                    isAdInComparison(ad)
                                      ? 'Убрать из сравнения'
                                      : 'Добавить в сравнение'
                                  }
                                >
                                  {isAdInComparison(ad) ? '−' : '+'}
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                ) : (
                  <div className='flex items-center justify-center h-32'>
                    <div className='text-gray-500'>Объявления не найдены</div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className='h-full flex flex-col'>
              {/* Список всех объявлений в радиусе 500м */}
              <div className='flex-1 overflow-y-auto p-4'>
                {nearbyAds.length > 0 ? (
                  <div className='space-y-2'>
                    {nearbyAds
                      .sort((a, b) => {
                        const aActive =
                          a.is_active === 1 || a.is_active === true
                        const bActive =
                          b.is_active === 1 || b.is_active === true

                        // Сначала активные
                        if (aActive && !bActive) return -1
                        if (!aActive && bActive) return 1

                        // Потом по цене по возрастанию
                        return (a.price || 0) - (b.price || 0)
                      })
                      .map((ad, index) => {
                        const isActive =
                          ad.is_active === 1 || ad.is_active === true
                        const rooms = ad.rooms || 0
                        const area = ad.area || 0
                        const floor = ad.floor || 0
                        const totalFloors = ad.total_floors || 0
                        const kitchenArea = ad.kitchen_area || 0
                        const price = ad.price || 0
                        const source = getDomainFromUrl(ad.url || '')

                        return (
                          <div
                            key={index}
                            className={`bg-white rounded-lg p-3 border shadow-sm flex items-center justify-between ${!isActive ? 'opacity-60' : ''}`}
                          >
                            <div className='text-sm flex-1'>
                              {rooms} комн.
                              {area ? `, ${Number(area).toFixed(1)} м²` : ''}
                              {floor && totalFloors
                                ? `, ${floor}/${totalFloors} эт.`
                                : floor
                                  ? `, ${floor} эт.`
                                  : ''}
                              {kitchenArea
                                ? `, кухня ${Number(kitchenArea).toFixed(1)}м²`
                                : ', кухня -'}
                              {!isActive && (
                                <span className='text-xs ml-2 text-red-500'>
                                  (неактивно)
                                </span>
                              )}
                            </div>
                            <div className='flex items-center gap-2'>
                              <a
                                href={ad.url}
                                target='_blank'
                                rel='noopener noreferrer'
                                className={`text-xs ${isActive ? 'text-blue-600 hover:text-blue-800' : 'text-gray-500'}`}
                              >
                                {source}
                              </a>
                              <span
                                className={`text-right ${isActive ? 'text-gray-900' : 'text-gray-500'}`}
                              >
                                <span className='font-bold'>
                                  {(price / 1000000).toFixed(1)}
                                </span>
                                <span className='font-normal'> млн ₽</span>
                              </span>
                              {(onAddToComparison || onToggleComparison) && (
                                <button
                                  onClick={() => {
                                    const inComparison = isAdInComparison(ad)
                                    if (
                                      ad.id &&
                                      typeof ad.id === 'number' &&
                                      onToggleComparison
                                    ) {
                                      // For database ads, use toggle comparison
                                      onToggleComparison(ad.id, !inComparison)
                                    } else if (onAddToComparison) {
                                      // For external ads, use add to comparison
                                      onAddToComparison(ad)
                                    }
                                  }}
                                  className='ml-2 flex-shrink-0 w-6 h-6 text-blue-500 hover:text-blue-600 flex items-center justify-center text-lg font-bold'
                                  title={
                                    isAdInComparison(ad)
                                      ? 'Убрать из сравнения'
                                      : 'Добавить в сравнение'
                                  }
                                >
                                  {isAdInComparison(ad) ? '−' : '+'}
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                ) : (
                  <div className='flex items-center justify-center h-32'>
                    <div className='text-gray-500'>Объявления не найдены</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
