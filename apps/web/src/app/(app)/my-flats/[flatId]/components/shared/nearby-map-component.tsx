'use client'

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from 'react-leaflet'
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
  onBoundsChange?: (bounds: {
    north: number
    south: number
    east: number
    west: number
  }) => void
  filters?: {
    maxPrice?: number
    rooms?: number
    minArea?: number
    minKitchenArea?: number
  }
}

// Component to handle map events
function MapEventHandler({
  onBoundsChange,
}: { onBoundsChange: (bounds: L.LatLngBounds) => void }) {
  const map = useMapEvents({
    moveend: () => {
      onBoundsChange(map.getBounds())
    },
    zoomend: () => {
      onBoundsChange(map.getBounds())
    },
  })

  // Trigger initial bounds on mount
  useEffect(() => {
    if (map) {
      onBoundsChange(map.getBounds())
    }
  }, [map, onBoundsChange])

  return null
}

export default function NearbyMapComponent({
  flatAddress,
  flatCoordinates,
  nearbyAds,
  currentFlat,
  onHouseClick,
  onBoundsChange,
  filters,
}: NearbyMapComponentProps) {
  const [houses, setHouses] = useState<any[]>([])
  const [housePrices, setHousePrices] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(false)
  const [loadingPrices, setLoadingPrices] = useState(false)
  const [addressCoordinates, setAddressCoordinates] = useState<{
    lat: number
    lng: number
  } | null>(null)
  const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null)

  // Handler for map bounds changes
  const handleMapBoundsChange = useCallback(
    (bounds: L.LatLngBounds) => {
      setMapBounds(bounds)

      // Если передан onBoundsChange callback (новая система preview), вызываем его
      if (onBoundsChange) {
        onBoundsChange({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        })
      }
    },
    [onBoundsChange],
  )

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

  const inactiveHouseIcon = new L.DivIcon({
    className: 'marker-house-inactive',
    html: `<span style="display:inline-block;width:20px;height:20px;border-radius:50%;background:#9ca3af;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,.6);"></span>`,
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

  // This useEffect will be moved after loadHousesInBounds definition

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

  const loadHousePrices = useCallback(async (houseIds: number[]) => {
    if (houseIds.length === 0) return

    setLoadingPrices(true)
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/map/house-prices?houseIds=${houseIds.join(',')}`
      const response = await fetch(url)

      if (response.ok) {
        const data = await response.json()
        const pricesMap: Record<number, number> = {}

        data.prices.forEach((item: any) => {
          if (item.min_price) {
            pricesMap[item.house_id] = item.min_price
          }
        })

        setHousePrices(pricesMap)
      }
    } catch (error) {
      console.error('Error loading house prices:', error)
    } finally {
      setLoadingPrices(false)
    }
  }, [])

  const loadHousesInBounds = useCallback(
    async (bounds: L.LatLngBounds, flatId: number) => {
      setLoading(true)
      try {
        const north = bounds.getNorth()
        const south = bounds.getSouth()
        const east = bounds.getEast()
        const west = bounds.getWest()

        // КАРТА ВСЕГДА показывает ВСЕ дома без фильтрации
        // Фильтрация только для preview панели через отдельный API
        const url = `${process.env.NEXT_PUBLIC_API_URL}/map/houses-in-bounds?north=${north}&south=${south}&east=${east}&west=${west}&flatId=${flatId}`
        console.log('Loading all houses in bounds:', {
          north,
          south,
          east,
          west,
        })

        const response = await fetch(url)
        console.log('Response status:', response.status)

        if (!response.ok) {
          console.error('Failed to load houses in bounds:', response.status)
          setHouses([])
          return
        }

        const data = await response.json()
        console.log('Houses in bounds data:', data)

        // API уже исключает дома по тому же адресу, что и текущая квартира
        const housesData = data.houses || []
        setHouses(housesData)

        // Load prices for houses after setting houses
        const houseIds = housesData.map((house: any) => house.house_id)
        if (houseIds.length > 0) {
          loadHousePrices(houseIds)
        }
      } catch (error) {
        console.error('Error loading houses in bounds:', error)
        setHouses([])
      } finally {
        setLoading(false)
      }
    },
    [filters, loadHousePrices],
  )

  // Загружаем дома когда меняются bounds карты
  // ВАЖНО: Всегда показываем дома на карте, фильтры только для preview панели
  useEffect(() => {
    if (mapBounds && currentFlat?.id) {
      loadHousesInBounds(mapBounds, currentFlat.id)
    }
  }, [mapBounds, currentFlat?.id, loadHousesInBounds])

  const createPriceIcon = (price: number, isActive: boolean) => {
    const priceText = (price / 1000000).toFixed(1)
    const bgColor = isActive ? '#f59e0b' : '#9ca3af'
    return new L.DivIcon({
      className: 'marker-house-price',
      html: `<div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 24px;
        border-radius: 12px;
        background: ${bgColor};
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,.3);
        color: white;
        font-size: 11px;
        font-weight: bold;
        font-family: system-ui, -apple-system, sans-serif;
      ">${priceText}</div>`,
      iconSize: [48, 24],
      iconAnchor: [24, 12],
    })
  }

  const handleHouseClick = (house: any) => {
    if (onHouseClick) {
      onHouseClick(house)
    }
  }

  // Функция для группировки близких домов (чтобы избежать наложения маркеров)
  const groupNearbyHouses = (houses: any[], minDistance = 50) => {
    const groups: any[][] = []
    const processed = new Set<number>()

    houses.forEach((house, index) => {
      if (processed.has(index)) return

      const group = [house]
      processed.add(index)

      // Ищем дома в радиусе minDistance метров
      houses.forEach((otherHouse, otherIndex) => {
        if (processed.has(otherIndex) || index === otherIndex) return

        const distance = calculateDistance(
          house.lat,
          house.lng,
          otherHouse.lat,
          otherHouse.lng,
        )

        if (distance <= minDistance) {
          group.push(otherHouse)
          processed.add(otherIndex)
        }
      })

      groups.push(group)
    })

    return groups
  }

  // Функция для расчета расстояния между двумя точками в метрах
  const calculateDistance = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ) => {
    const R = 6371e3 // Радиус Земли в метрах
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lng2 - lng1) * Math.PI) / 180

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  // Функция для создания маркера группы домов
  const createGroupMarker = (group: any[]) => {
    if (group.length === 1) {
      // Один дом - обычный маркер
      const house = group[0]
      const hasActiveAds =
        house.has_active_ads === true || house.active_ads_count > 0
      const housePrice = housePrices[house.house_id]

      return {
        house,
        position: [house.lat, house.lng],
        icon: housePrice
          ? createPriceIcon(housePrice, hasActiveAds)
          : hasActiveAds
            ? houseIcon
            : inactiveHouseIcon,
        isGroup: false,
      }
    } else {
      // Группа домов - создаем сводный маркер
      const centerLat = group.reduce((sum, h) => sum + h.lat, 0) / group.length
      const centerLng = group.reduce((sum, h) => sum + h.lng, 0) / group.length
      const totalAds = group.reduce(
        (sum, h) => sum + (h.active_ads_count || 0),
        0,
      )
      const hasActiveAds = group.some(
        (h) => h.has_active_ads === true || h.active_ads_count > 0,
      )

      // Создаем маркер группы
      const groupIcon = new L.DivIcon({
        className: 'marker-house-group',
        html: `<div style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: ${hasActiveAds ? '#f59e0b' : '#9ca3af'};
          border: 3px solid white;
          box-shadow: 0 0 6px rgba(0,0,0,.6);
          color: white;
          font-weight: bold;
          font-size: 12px;
        ">${group.length}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })

      return {
        house: {
          house_id: `group-${group.map((h) => h.house_id).join('-')}`,
          address: `${group.length} домов`,
          lat: centerLat,
          lng: centerLng,
          ads_count: totalAds,
          dist_m: Math.min(...group.map((h) => h.dist_m || 0)),
          houses: group, // Сохраняем исходные дома в группе
        },
        position: [centerLat, centerLng],
        icon: groupIcon,
        isGroup: true,
      }
    }
  }

  // Группируем дома по близости
  const houseGroups = groupNearbyHouses(houses, 50) // 50 метров минимальное расстояние
  const markers = houseGroups.map((group) => createGroupMarker(group))

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

        {/* Map event handler for bounds tracking */}
        <MapEventHandler onBoundsChange={handleMapBoundsChange} />

        {/* Маркер текущей квартиры */}
        {addressCoordinates && currentFlat && (
          <Marker
            position={[addressCoordinates.lat, addressCoordinates.lng]}
            icon={currentFlatIcon}
            eventHandlers={{
              click: async () => {
                // Для текущей квартиры нужно сначала получить house_id по адресу
                try {
                  const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/map/address-to-house-id?address=${encodeURIComponent(flatAddress)}`,
                  )

                  if (!response.ok) {
                    console.warn(
                      'Failed to get house_id for current flat address:',
                      flatAddress,
                    )
                    return
                  }

                  const data = await response.json()
                  const house_id = data.house_id

                  if (!house_id) {
                    console.warn(
                      'No house_id found for current flat address:',
                      flatAddress,
                    )
                    return
                  }

                  const currentHouse = {
                    house_id: house_id,
                    address: flatAddress,
                    lat: addressCoordinates.lat,
                    lng: addressCoordinates.lng,
                    ads_count: 1, // Примерное значение
                    dist_m: 0, // Расстояние до себя = 0
                  }
                  handleHouseClick(currentHouse)
                } catch (error) {
                  console.error(
                    'Error getting house_id for current flat:',
                    error,
                  )
                }
              },
            }}
          />
        )}

        {/* Сгруппированные маркеры домов в видимой области */}
        {markers.map((marker, index) => {
          const handleClick = () => {
            if (marker.isGroup && marker.house.houses) {
              // Для группы домов - можем показать попап с выбором или взять первый дом
              console.log('Группа домов:', marker.house.houses)
              // Берем первый дом из группы для демонстрации
              handleHouseClick(marker.house.houses[0])
            } else {
              handleHouseClick(marker.house)
            }
          }

          return (
            <Marker
              key={`grouped-house-${marker.house.house_id}-${index}`}
              position={marker.position as [number, number]}
              icon={marker.icon}
              eventHandlers={{
                click: handleClick,
              }}
            >
              {marker.isGroup && (
                <Popup>
                  <div className='text-sm'>
                    <strong>{marker.house.address}</strong>
                    <div>Всего объявлений: {marker.house.ads_count}</div>
                    <div className='text-xs text-gray-600 mt-1'>
                      Дома в группе:
                    </div>
                    <div className='text-xs max-h-32 overflow-y-auto'>
                      {marker.house.houses?.map((h: any, i: number) => (
                        <div
                          key={i}
                          className='cursor-pointer hover:bg-gray-100 p-1 rounded'
                        >
                          {h.address || `Дом ${h.house_id}`}
                          {h.active_ads_count > 0 &&
                            ` (${h.active_ads_count} объявлений)`}
                        </div>
                      ))}
                    </div>
                  </div>
                </Popup>
              )}
            </Marker>
          )
        })}

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
          <span>Дома с активными объявлениями</span>
        </div>
        <div className='flex items-center gap-2 mb-1'>
          <div className='w-4 h-4 rounded-full bg-gray-400 border-2 border-white'></div>
          <span>Дома только с неактивными</span>
        </div>
        <div className='flex items-center gap-2'>
          <div className='w-5 h-5 rounded-full bg-orange-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold'>
            2
          </div>
          <span>Группа близких домов</span>
        </div>
      </div>
    </div>
  )
}
