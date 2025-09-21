'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-defaulticon-compatibility'
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css'

interface NearbyMapComponentProps {
  flatAddress: string
  flatCoordinates?: { lat: number; lng: number }
  nearbyAds: any[]
  currentFlat?: any
  onHouseClick?: (house: any) => void
}

export default function NearbyMapComponent({
  flatAddress,
  flatCoordinates,
  nearbyAds,
  currentFlat,
  onHouseClick,
}: NearbyMapComponentProps) {
  const [houses, setHouses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [addressCoordinates, setAddressCoordinates] = useState<{
    lat: number
    lng: number
  } | null>(null)

  // Иконки
  const currentFlatIcon = new L.DivIcon({
    className: 'marker-current-flat',
    html: `<span style="display:inline-block;width:24px;height:24px;border-radius:50%;background:#ef4444;border:3px solid white;box-shadow:0 0 6px rgba(0,0,0,.8);"></span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  })

  const houseIcon = new L.DivIcon({
    className: 'marker-house',
    html: `<span style="display:inline-block;width:20px;height:20px;border-radius:50%;background:#f59e0b;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,.6);"></span>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })

  const nearbyAdIcon = new L.DivIcon({
    className: 'marker-nearby-ad',
    html: `<span style="display:inline-block;width:16px;height:16px;border-radius:50%;background:#8b5cf6;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,.4);"></span>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })

  // Получаем координаты адреса
  useEffect(() => {
    if (flatAddress) {
      loadAddressCoordinates()
    }
  }, [flatAddress])

  // Извлекаем уникальные house IDs из nearby ads с помощью useMemo
  const houseIdsFromAds = useMemo(() => {
    if (!nearbyAds || nearbyAds.length === 0) return []

    const adsCountByHouse = new Map<
      number,
      { count: number; minDistance: number }
    >()

    nearbyAds.forEach((ad: any) => {
      if (ad.house_id) {
        const houseId = Number(ad.house_id)
        const existing = adsCountByHouse.get(houseId)
        if (existing) {
          existing.count += 1
          existing.minDistance = Math.min(
            existing.minDistance,
            ad.distance_m || 0,
          )
        } else {
          adsCountByHouse.set(houseId, {
            count: 1,
            minDistance: ad.distance_m || 0,
          })
        }
      }
    })

    return Array.from(adsCountByHouse.entries()).map(([houseId, data]) => ({
      houseId,
      ...data,
    }))
  }, [nearbyAds])

  // Загружаем дома когда меняются house IDs
  useEffect(() => {
    if (houseIdsFromAds.length > 0) {
      loadHousesData(houseIdsFromAds)
    } else if (houses.length > 0) {
      setHouses([])
    }
  }, [houseIdsFromAds])

  const loadAddressCoordinates = async () => {
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/map/address-coordinates?address=${encodeURIComponent(flatAddress)}`
      console.log('Loading address coordinates:', url)

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        console.log('Address coordinates:', data)
        if (data.coordinates) {
          setAddressCoordinates({
            lat: data.coordinates.lat,
            lng: data.coordinates.lng,
          })
        }
      } else {
        console.error('Failed to get address coordinates:', response.status)
        // Fallback to specific address coordinates
        setAddressCoordinates({ lat: 55.7729, lng: 37.5897 })
      }
    } catch (error) {
      console.error('Error loading address coordinates:', error)
      // Fallback to specific address coordinates
      setAddressCoordinates({ lat: 55.7729, lng: 37.5897 })
    }
  }

  const loadHousesData = useCallback(
    async (
      houseData: Array<{ houseId: number; count: number; minDistance: number }>,
    ) => {
      setLoading(true)
      try {
        console.log('Loading houses data for:', houseData)

        // Получаем координаты только для домов, которые есть в объявлениях
        const houseIdsString = houseData.map((h) => h.houseId).join(',')
        const url = `${process.env.NEXT_PUBLIC_API_URL}/map/houses-by-ids?houseIds=${houseIdsString}`
        console.log('Fetching houses from URL:', url)

        const response = await fetch(url)
        console.log('Response status:', response.status)

        if (!response.ok) {
          console.error('Failed to load house coordinates:', response.status)
          setHouses([])
          return
        }

        const data = await response.json()
        console.log('Raw response data:', data)
        const housesData = data.houses || []

        console.log('Houses data from API:', housesData)

        // Добавляем количество объявлений и расстояние к каждому дому
        const housesWithAds = housesData.map((house: any) => {
          const houseId = Number(house.house_id)
          const adsData = houseData.find((h) => h.houseId === houseId)
          return {
            ...house,
            ads_count: adsData?.count || 0,
            dist_m: adsData?.minDistance || 0,
          }
        })

        console.log('Houses with ads:', housesWithAds)
        setHouses(housesWithAds)
      } catch (error) {
        console.error('Error loading houses data:', error)
        setHouses([])
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const handleHouseClick = (house: any) => {
    if (onHouseClick) {
      onHouseClick(house)
    }
  }

  // Определяем центр и зум карты
  const getMapCenter = (): [number, number] => {
    if (addressCoordinates) {
      return [addressCoordinates.lat, addressCoordinates.lng]
    }
    // Центр по адресу "1-я Тверская-Ямская улица, 13с1А" как fallback
    return [55.7729, 37.5897]
  }

  const mapCenter = getMapCenter()

  return (
    <div className='h-full w-full relative'>
      {loading && (
        <div className='absolute top-2 right-2 z-[1000] bg-white px-2 py-1 rounded shadow text-xs'>
          Загрузка домов...
        </div>
      )}

      <MapContainer
        center={mapCenter}
        zoom={16}
        style={{ height: '100%', width: '100%' }}
        className='rounded-lg border'
        attributionControl={false}
      >
        <TileLayer
          url='https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        {/* Круг радиуса 500м */}
        {addressCoordinates && (
          <Circle
            center={[addressCoordinates.lat, addressCoordinates.lng]}
            radius={500}
            pathOptions={{
              color: '#ef4444',
              weight: 2,
              opacity: 0.6,
              fillColor: '#ef4444',
              fillOpacity: 0.1,
            }}
          />
        )}

        {/* Маркер текущей квартиры */}
        {addressCoordinates && (
          <Marker
            position={[addressCoordinates.lat, addressCoordinates.lng]}
            icon={currentFlatIcon}
          >
            <Popup>
              <div style={{ minWidth: 200 }}>
                <strong>🏠 Моя квартира</strong>
                <div className='text-sm mt-1'>{flatAddress}</div>
                {currentFlat && (
                  <div className='text-sm text-gray-600 mt-1'>
                    {currentFlat.rooms} комн., {currentFlat.floor} этаж
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Маркеры домов в радиусе 500м */}
        {houses.map((house, index) => (
          <Marker
            key={`nearby-house-${house.house_id}-${index}`}
            position={[house.lat, house.lng]}
            icon={houseIcon}
          >
            <Popup>
              <div style={{ minWidth: 200 }}>
                <strong>🏢 Дом с объявлениями</strong>
                <div className='text-lg font-bold text-orange-600'>
                  {house.ads_count} объявлений
                </div>
                <div className='text-sm text-gray-600 mt-1'>
                  {house.address}
                </div>
                <div className='text-sm text-gray-500 mt-1'>
                  Расстояние: {house.dist_m}м
                </div>
                <div className='mt-2'>
                  <button
                    onClick={() => handleHouseClick(house)}
                    className='px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 transition-colors'
                  >
                    Показать объявления →
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Маркеры объявлений из таблицы (если у них есть координаты) */}
        {nearbyAds
          .filter((ad) => ad.coordinates?.lat && ad.coordinates?.lng)
          .slice(0, 20) // Ограничиваем количество для производительности
          .map((ad, index) => (
            <Marker
              key={`nearby-ad-${ad.id}-${index}`}
              position={[ad.coordinates.lat, ad.coordinates.lng]}
              icon={nearbyAdIcon}
            >
              <Popup>
                <div style={{ minWidth: 200 }}>
                  <strong>{ad.rooms}-комн. квартира</strong>
                  <div className='text-lg font-bold text-green-600'>
                    {Number(ad.price).toLocaleString('ru-RU')} ₽
                  </div>
                  <div className='text-sm'>
                    Этаж: {ad.floor} | Площадь: {ad.area}м²
                  </div>
                  <div className='text-sm text-gray-500 mt-1'>
                    Расстояние: {ad.distance}м
                  </div>
                  <div className='mt-2'>
                    <a
                      href={ad.url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-blue-600 hover:underline text-sm'
                    >
                      Посмотреть объявление →
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>

      {/* Легенда */}
      <div className='absolute bottom-2 left-2 z-[1000] bg-white px-3 py-2 rounded shadow text-xs'>
        <div className='flex items-center gap-2 mb-1'>
          <div className='w-4 h-4 rounded-full bg-red-500 border-2 border-white'></div>
          <span>Моя квартира</span>
        </div>
        <div className='flex items-center gap-2 mb-1'>
          <div className='w-4 h-4 rounded-full bg-orange-500 border-2 border-white'></div>
          <span>Дома с объявлениями</span>
        </div>
        <div className='flex items-center gap-2'>
          <div className='w-3 h-3 rounded-full bg-purple-500 border border-white'></div>
          <span>Объявления из таблицы</span>
        </div>
      </div>

      {/* Информация в правом верхнем углу */}
      <div className='absolute top-2 left-2 z-[1000] bg-white px-2 py-1 rounded shadow text-xs'>
        <div>Радиус: 500м</div>
        <div>Домов: {houses.length}</div>
        <div>Объявлений в таблице: {nearbyAds.length}</div>
      </div>
    </div>
  )
}
