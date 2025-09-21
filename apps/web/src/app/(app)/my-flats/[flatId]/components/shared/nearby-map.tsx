'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

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
}

export default function NearbyMap({
  flatAddress,
  flatCoordinates,
  nearbyAds,
  currentFlat,
  onHouseClick,
}: NearbyMapProps) {
  const [selectedHouse, setSelectedHouse] = useState<any>(null)
  const [houseAds, setHouseAds] = useState<any[]>([])
  const [loadingHouseAds, setLoadingHouseAds] = useState(false)

  const handleHouseClick = async (house: any) => {
    setSelectedHouse(house)
    setLoadingHouseAds(true)

    try {
      // Получаем объявления для выбранного дома
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/map/house-ads?address=${encodeURIComponent(house.address)}`,
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

              {/* Список объявлений */}
              <div className='flex-1 overflow-y-auto p-4'>
                {loadingHouseAds ? (
                  <div className='flex items-center justify-center h-32'>
                    <div className='text-gray-500'>Загрузка объявлений...</div>
                  </div>
                ) : houseAds.length > 0 ? (
                  <div className='space-y-3'>
                    {houseAds.map((ad, index) => (
                      <div
                        key={index}
                        className='bg-white rounded-lg p-4 border shadow-sm'
                      >
                        <div className='flex justify-between items-start mb-2'>
                          <div className='font-semibold text-lg text-green-600'>
                            {Number(ad.price).toLocaleString('ru-RU')} ₽
                          </div>
                          <div className='text-sm text-gray-500'>
                            {ad.rooms} комн.
                          </div>
                        </div>
                        <div className='text-sm space-y-1'>
                          <div>
                            Этаж: {ad.floor} | Площадь: {ad.area}м²
                          </div>
                          {ad.kitchen_area && (
                            <div>Кухня: {ad.kitchen_area}м²</div>
                          )}
                          {ad.person_type && <div>Автор: {ad.person_type}</div>}
                        </div>
                        {ad.url && (
                          <div className='mt-3'>
                            <a
                              href={ad.url}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='text-blue-600 hover:underline text-sm'
                            >
                              Посмотреть объявление →
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='flex items-center justify-center h-32'>
                    <div className='text-gray-500'>Объявления не найдены</div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className='h-full flex items-center justify-center'>
              <div className='text-center text-gray-500'>
                <div className='text-4xl mb-2'>🏢</div>
                <div className='font-medium'>Выберите дом на карте</div>
                <div className='text-sm'>
                  Нажмите на оранжевый маркер дома, чтобы увидеть объявления
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
