'use client'

import { Suspense, useState } from 'react'
import dynamic from 'next/dynamic'
import Page from '@acme/ui/components/page'

const MapComponent = dynamic(() => import('./components/map-component'), {
  ssr: false,
  loading: () => (
    <div className='flex items-center justify-center h-full'>
      <div className='text-lg'>Загрузка карты...</div>
    </div>
  ),
})

interface SelectedObject {
  type: 'flat' | 'house' | 'ad' | 'poi'
  data: any
}

export default function MapPage() {
  const [selectedObject, setSelectedObject] = useState<SelectedObject | null>(
    null,
  )

  const renderSelectedObjectInfo = () => {
    if (!selectedObject) {
      return (
        <div className='text-center text-gray-500 mt-20'>
          <div className='text-lg mb-2'>👆 Выберите объект на карте</div>
          <div className='text-sm'>
            Информация о выбранном объекте появится здесь
          </div>
        </div>
      )
    }

    const { type, data } = selectedObject

    switch (type) {
      case 'flat':
        return (
          <div>
            <h3 className='text-lg font-semibold mb-4 text-green-600'>
              🏠 Моя квартира #{data.id}
            </h3>
            <div className='space-y-2'>
              <div>
                <strong>Адрес:</strong> {data.address}
              </div>
              <div>
                <strong>Комнат:</strong> {data.rooms}
              </div>
              <div>
                <strong>Этаж:</strong> {data.floor}
              </div>
              {data.lat && data.lng && (
                <div className='text-sm text-gray-500'>
                  Координаты: {data.lat.toFixed(6)}, {data.lng.toFixed(6)}
                </div>
              )}
            </div>
          </div>
        )

      case 'house':
        return (
          <div>
            <h3 className='text-lg font-semibold mb-4 text-orange-600'>
              🏢 Дом с объявлениями
            </h3>
            <div className='space-y-2'>
              <div>
                <strong>Адрес:</strong> {data.address}
              </div>
              <div>
                <strong>Объявлений:</strong> {data.ads_count}
              </div>
              <div>
                <strong>Расстояние:</strong> {data.dist_m}м
              </div>
              <div className='text-sm text-gray-500 mt-4'>
                Кликните для просмотра объявлений в доме
              </div>
            </div>
          </div>
        )

      case 'ad':
        return (
          <div>
            <h3 className='text-lg font-semibold mb-4 text-purple-600'>
              🏡 Объявление
            </h3>
            <div className='space-y-2'>
              <div className='text-2xl font-bold text-green-600'>
                {Number(data.price).toLocaleString('ru-RU')} ₽
              </div>
              <div>
                <strong>Комнат:</strong> {data.rooms}
              </div>
              <div>
                <strong>Этаж:</strong> {data.floor}
              </div>
              <div>
                <strong>Адрес:</strong> {data.address}
              </div>
              <div>
                <strong>Расстояние:</strong> {data.dist_m}м
              </div>
              <div className='mt-4'>
                <a
                  href={data.url}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 inline-block'
                >
                  Посмотреть объявление →
                </a>
              </div>
            </div>
          </div>
        )

      case 'poi':
        return (
          <div>
            <h3 className='text-lg font-semibold mb-4'>
              {data.type === 'school' ? '📚 Школа' : '🧸 Детский сад'}
            </h3>
            <div className='space-y-2'>
              <div>
                <strong>Название:</strong> {data.name}
              </div>
              <div>
                <strong>Адрес:</strong> {data.address}
              </div>
              <div>
                <strong>Расстояние:</strong> {data.distance_m}м
              </div>
            </div>
          </div>
        )

      default:
        return <div>Неизвестный тип объекта</div>
    }
  }

  return (
    <Page className='w-full h-screen'>
      <Page.Header>
        <Page.Title>Карта моих квартир</Page.Title>
      </Page.Header>

      <Page.Content className='h-full flex-1 overflow-hidden'>
        <div className='h-full flex'>
          {/* Карта - левая половина */}
          <div className='w-1/2 h-full'>
            <Suspense
              fallback={
                <div className='flex items-center justify-center h-full'>
                  <div className='text-lg'>Загрузка карты...</div>
                </div>
              }
            >
              <MapComponent onObjectSelect={setSelectedObject} />
            </Suspense>
          </div>

          {/* Информационная панель - правая половина */}
          <div className='w-1/2 h-full bg-gray-50 border-l'>
            <div className='p-4 h-full overflow-y-auto'>
              {renderSelectedObjectInfo()}
            </div>
          </div>
        </div>
      </Page.Content>
    </Page>
  )
}
