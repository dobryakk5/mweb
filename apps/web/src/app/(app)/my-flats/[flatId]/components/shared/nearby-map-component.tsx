'use client'

import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  memo,
} from 'react'
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
  selectedHouseId?: number | null
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

const NearbyMapComponent = memo(function NearbyMapComponent({
  flatAddress,
  flatCoordinates,
  nearbyAds,
  currentFlat,
  selectedHouseId,
  onHouseClick,
  onBoundsChange,
  filters,
}: NearbyMapComponentProps) {
  const [housePrices, setHousePrices] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(false)
  const [loadingPrices, setLoadingPrices] = useState(false)
  const [addressCoordinates, setAddressCoordinates] = useState<{
    lat: number
    lng: number
  } | null>(null)
  const [currentFlatHouseId, setCurrentFlatHouseId] = useState<number | null>(
    null,
  )
  const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null)

  // Handler for map bounds changes
  const handleMapBoundsChange = useCallback(
    (bounds: L.LatLngBounds) => {
      setMapBounds(bounds)

      // Новая логика: устанавливаем bounds для загрузки домов
      setCurrentBounds(bounds)

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

  // Получаем координаты адреса и house_id
  useEffect(() => {
    if (flatAddress) {
      loadAddressCoordinates()
      loadCurrentFlatHouseId()
    }
  }, [flatAddress])

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

  const loadCurrentFlatHouseId = async () => {
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/map/address-to-house-id?address=${encodeURIComponent(flatAddress)}`
      console.log('Loading current flat house ID:', url)

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        console.log('Current flat house ID:', data)
        if (data.house_id) {
          setCurrentFlatHouseId(data.house_id)
        }
      } else {
        console.error('Failed to get house ID:', response.status)
      }
    } catch (error) {
      console.error('Error loading current flat house ID:', error)
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

  const createPriceIcon = (
    price: number,
    isActive: boolean,
    isCurrentUserHouse: boolean = false,
  ) => {
    const priceText = (price / 1000000).toFixed(1)
    const bgColor = isCurrentUserHouse
      ? '#ef4444'
      : isActive
        ? '#f59e0b'
        : '#9ca3af'
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
    // Сохраняем данные выбранного дома, чтобы он оставался видимым даже без объявлений
    setSelectedHouseData(house)

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

      // Ищем дома с тем же house_id или в радиусе minDistance метров
      houses.forEach((otherHouse, otherIndex) => {
        if (processed.has(otherIndex) || index === otherIndex) return

        // ПРИОРИТЕТ 1: Дома с одинаковым house_id всегда группируются вместе
        const sameHouseId =
          house.house_id &&
          otherHouse.house_id &&
          house.house_id === otherHouse.house_id

        // ПРИОРИТЕТ 2: Дома в радиусе minDistance метров (только если разные house_id)
        const distance = calculateDistance(
          house.lat,
          house.lng,
          otherHouse.lat,
          otherHouse.lng,
        )
        const nearbyHouses = distance <= minDistance

        if (sameHouseId || nearbyHouses) {
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
      const isCurrentUserHouse =
        currentFlatHouseId && house.house_id === currentFlatHouseId

      // Если это дом пользователя, создаем красный маркер
      if (isCurrentUserHouse) {
        const currentHouseIcon = housePrice
          ? createPriceIcon(housePrice, hasActiveAds, true) // true = isCurrentUserHouse
          : new L.DivIcon({
              className: 'marker-current-house',
              html: `<span style="display:inline-block;width:24px;height:24px;border-radius:50%;background:#ef4444;border:3px solid white;box-shadow:0 0 6px rgba(0,0,0,.8);"></span>`,
              iconSize: [30, 30],
              iconAnchor: [15, 15],
            })

        return {
          house,
          position: [house.lat, house.lng],
          icon: currentHouseIcon,
          isGroup: false,
          isCurrentUserHouse: true,
        }
      }

      return {
        house,
        position: [house.lat, house.lng],
        icon: housePrice
          ? createPriceIcon(housePrice, hasActiveAds, false)
          : hasActiveAds
            ? houseIcon
            : inactiveHouseIcon,
        isGroup: false,
        isCurrentUserHouse: false,
      }
    } else {
      // Группа домов - проверяем, есть ли в группе дом пользователя
      const hasCurrentUserHouse =
        currentFlatHouseId &&
        group.some((h) => h.house_id === currentFlatHouseId)
      const centerLat = group.reduce((sum, h) => sum + h.lat, 0) / group.length
      const centerLng = group.reduce((sum, h) => sum + h.lng, 0) / group.length
      const totalAds = group.reduce(
        (sum, h) => sum + (h.active_ads_count || 0),
        0,
      )
      const hasActiveAds = group.some(
        (h) => h.has_active_ads === true || h.active_ads_count > 0,
      )

      // Определяем адрес группы в зависимости от того, одинаковые ли house_id
      const uniqueHouseIds = [...new Set(group.map((h) => h.house_id))]
      const isOneLogicalHouse = uniqueHouseIds.length === 1

      // Создаем маркер группы (красный если содержит дом пользователя)
      const bgColor = hasCurrentUserHouse
        ? '#ef4444'
        : hasActiveAds
          ? '#f59e0b'
          : '#9ca3af'

      // Для одного логического дома показываем "1", для группы - количество уникальных домов
      const displayNumber = isOneLogicalHouse ? 1 : uniqueHouseIds.length

      const groupIcon = new L.DivIcon({
        className: 'marker-house-group',
        html: `<div style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: ${bgColor};
          border: 3px solid white;
          box-shadow: 0 0 6px rgba(0,0,0,.6);
          color: white;
          font-weight: bold;
          font-size: 12px;
        ">${displayNumber}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })

      const groupAddress = isOneLogicalHouse
        ? group[0].address || `Дом ${uniqueHouseIds[0]}` // Один логический дом
        : `${uniqueHouseIds.length} домов` // Несколько разных домов

      return {
        house: {
          house_id: isOneLogicalHouse
            ? uniqueHouseIds[0]
            : `group-${uniqueHouseIds.join('-')}`,
          address: groupAddress,
          lat: centerLat,
          lng: centerLng,
          ads_count: totalAds,
          dist_m: Math.min(...group.map((h) => h.dist_m || 0)),
          houses: group, // Сохраняем исходные дома в группе
        },
        position: [centerLat, centerLng],
        icon: groupIcon,
        isGroup: true,
        isCurrentUserHouse: hasCurrentUserHouse,
      }
    }
  }

  // State для хранения выбранного дома
  const [selectedHouseData, setSelectedHouseData] = useState<any>(null)

  // State для домов из API
  const [housesFromAPI, setHousesFromAPI] = useState<any[]>([])
  const [loadingHouses, setLoadingHouses] = useState(false)
  const [currentBounds, setCurrentBounds] = useState<any>(null)

  // Очищаем данные выбранного дома при сбросе selectedHouseId
  useEffect(() => {
    if (!selectedHouseId) {
      setSelectedHouseData(null)
    }
  }, [selectedHouseId])

  // Функция загрузки домов из API
  const fetchHousesInBounds = useCallback(async (bounds: any, filters: any) => {
    if (!bounds) return

    setLoadingHouses(true)
    try {
      const params = new URLSearchParams({
        north: bounds.north.toString(),
        south: bounds.south.toString(),
        east: bounds.east.toString(),
        west: bounds.west.toString(),
      })

      if (filters?.rooms) params.append('rooms', filters.rooms.toString())
      if (filters?.maxPrice)
        params.append('maxPrice', filters.maxPrice.toString())
      if (filters?.minArea) params.append('minArea', filters.minArea.toString())
      if (filters?.minKitchenArea)
        params.append('minKitchenArea', filters.minKitchenArea.toString())

      const url = `${process.env.NEXT_PUBLIC_API_URL}/map/houses-in-bounds?${params}`

      if (process.env.NODE_ENV === 'development') {
        const timestamp = new Date().toISOString().slice(11, 23)
        console.log(`🏠 [${timestamp}] Fetching houses from API:`, url)
      }

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const houses = data.houses || []

      setHousesFromAPI(houses)

      if (process.env.NODE_ENV === 'development') {
        const timestamp = new Date().toISOString().slice(11, 23)
        console.log(`🏠 [${timestamp}] Loaded ${houses.length} houses from API`)
      }
    } catch (error) {
      console.error('Error fetching houses:', error)
      setHousesFromAPI([])
    } finally {
      setLoadingHouses(false)
    }
  }, [])

  // Загружаем дома когда изменяются bounds или фильтры
  useEffect(() => {
    if (currentBounds && filters) {
      const boundsObj = {
        north: currentBounds.getNorth(),
        south: currentBounds.getSouth(),
        east: currentBounds.getEast(),
        west: currentBounds.getWest(),
      }
      fetchHousesInBounds(boundsObj, filters)
    }
  }, [currentBounds, filters, fetchHousesInBounds])

  // Добавляем текущий дом пользователя и выбранный дом, если их нет в housesFromAPI
  const allHouses = useMemo(() => {
    let houses = [...housesFromAPI]

    // Проверяем, есть ли дом пользователя в отфильтрованных домах
    const hasCurrentUserHouse =
      currentFlatHouseId &&
      houses.some((house) => house.house_id === currentFlatHouseId)

    // Если дома пользователя нет и у нас есть координаты, добавляем его
    if (!hasCurrentUserHouse && currentFlatHouseId && addressCoordinates) {
      // Логируем только один раз при добавлении
      if (process.env.NODE_ENV === 'development') {
        const timestamp = new Date().toISOString().slice(11, 23)
        console.log(
          `🏠 [${timestamp}] Adding current user house to map: ${currentFlatHouseId}`,
        )
      }

      houses.push({
        house_id: currentFlatHouseId,
        lat: addressCoordinates.lat,
        lng: addressCoordinates.lng,
        address: flatAddress,
        active_ads_count: 0,
        total_ads_count: 0,
        has_active_ads: false,
        dist_m: 0,
      })
    }

    // Проверяем, есть ли выбранный дом в отфильтрованных домах
    const hasSelectedHouse =
      selectedHouseId &&
      houses.some((house) => house.house_id === selectedHouseId)

    // Если выбранного дома нет и у нас есть его данные, добавляем его
    if (!hasSelectedHouse && selectedHouseId && selectedHouseData) {
      if (process.env.NODE_ENV === 'development') {
        const timestamp = new Date().toISOString().slice(11, 23)
        console.log(
          `🏠 [${timestamp}] Adding selected house to map: ${selectedHouseId}`,
        )
      }

      houses.push(selectedHouseData)
    }

    return houses
  }, [
    housesFromAPI,
    currentFlatHouseId,
    addressCoordinates,
    flatAddress,
    selectedHouseId,
    selectedHouseData,
  ])

  // Группируем дома по близости
  const houseGroups = groupNearbyHouses(allHouses, 50) // 50 метров минимальное расстояние
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
        zoom={15}
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

        {/* Сгруппированные маркеры домов в видимой области */}
        {markers.map((marker, index) => {
          const handleClick = () => {
            if (marker.isGroup && marker.house.houses) {
              // Для группы домов - можем показать попап с выбором или взять первый дом
              console.log('Группа домов:', marker.house.houses)
              // Если группа содержит дом пользователя, предпочитаем его
              if (marker.isCurrentUserHouse && currentFlatHouseId) {
                const userHouse = marker.house.houses.find(
                  (h: any) => h.house_id === currentFlatHouseId,
                )
                if (userHouse) {
                  handleHouseClick(userHouse)
                  return
                }
              }
              // Иначе берем первый дом из группы
              handleHouseClick(marker.house.houses[0])
            } else {
              // Для одиночного дома - кликаем как обычно
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
          <span>Мой дом</span>
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
})

export default NearbyMapComponent
