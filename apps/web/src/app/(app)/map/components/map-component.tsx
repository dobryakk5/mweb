'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-defaulticon-compatibility'
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css'

interface UserFlat {
  id: number
  address: string
  rooms: number
  floor: number
  lat?: number
  lng?: number
}

interface POI {
  type: 'school' | 'kindergarten'
  name: string
  lat: number
  lng: number
  distance_m: number
}

interface Ad {
  price: string
  rooms: number
  floor: number
  person_type: string
  created: string
  updated: string
  url: string
  is_active: boolean
  house_id: number
  distance_m: number
  area?: string
  kitchen_area?: string
  // Computed from house_id for map display
  lat?: number
  lng?: number
  address?: string
}

interface House {
  house_id: number
  address: string
  lat: number
  lng: number
  ads_count: number
  dist_m: number
}

// Хук для автоматической подгонки bounds
function FitBounds({ flats }: { flats: UserFlat[] }) {
  const map = useMap()

  useEffect(() => {
    if (!map || !flats || flats.length === 0) return

    const flatsWithCoords = flats.filter((f) => f.lat && f.lng)
    if (flatsWithCoords.length === 0) return

    const latlngs = flatsWithCoords.map(
      (f) => [f.lat!, f.lng!] as [number, number],
    )
    const bounds = L.latLngBounds(latlngs)

    if (flatsWithCoords.length === 1) {
      // Если только одна квартира, центрируем на ней с зумом
      map.setView([flatsWithCoords[0].lat!, flatsWithCoords[0].lng!], 15)
    } else {
      map.fitBounds(bounds, { padding: [20, 20] })
    }
  }, [map, flats])

  return null
}

// Хук для обработки зума и подгрузки новых объектов
function ZoomHandler({
  onZoomChange,
}: { onZoomChange: (zoom: number, center: [number, number]) => void }) {
  const map = useMap()

  useEffect(() => {
    if (!map) return

    const handleZoomEnd = () => {
      const zoom = map.getZoom()
      const center = map.getCenter()
      onZoomChange(zoom, [center.lat, center.lng])
    }

    map.on('zoomend', handleZoomEnd)
    map.on('moveend', handleZoomEnd)

    return () => {
      map.off('zoomend', handleZoomEnd)
      map.off('moveend', handleZoomEnd)
    }
  }, [map, onZoomChange])

  return null
}

interface MapComponentProps {
  onObjectSelect?: (selectedObject: {
    type: 'flat' | 'house' | 'ad' | 'poi'
    data: any
  }) => void
}

export default function MapComponent({ onObjectSelect }: MapComponentProps) {
  const [flats, setFlats] = useState<UserFlat[]>([])
  const [pois, setPois] = useState<POI[]>([])
  const [ads, setAds] = useState<Ad[]>([])
  const [houses, setHouses] = useState<House[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFlatId, setSelectedFlatId] = useState<number | null>(null)
  const [tgUserId, setTgUserId] = useState<number | null>(null)

  // Состояние для чекбоксов POI
  const [showSchools, setShowSchools] = useState(false)
  const [showKindergartens, setShowKindergartens] = useState(false)

  // Состояние для зума карты
  const [currentZoom, setCurrentZoom] = useState(12)
  const [currentCenter, setCurrentCenter] = useState<[number, number]>([
    55.7558, 37.6176,
  ])

  // Центр Москвы как fallback
  const defaultCenter: [number, number] = [55.7558, 37.6176]

  // Иконка для квартир
  const flatIcon = new L.DivIcon({
    className: 'marker-flat',
    html: `<span style="display:inline-block;width:20px;height:20px;border-radius:50%;background:#10b981;border:3px solid white;box-shadow:0 0 4px rgba(0,0,0,.6);"></span>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  })

  const selectedFlatIcon = new L.DivIcon({
    className: 'marker-flat-selected',
    html: `<span style="display:inline-block;width:24px;height:24px;border-radius:50%;background:#ef4444;border:3px solid white;box-shadow:0 0 6px rgba(0,0,0,.8);"></span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  })

  // Иконки для POI - простые эмодзи
  const schoolIcon = new L.DivIcon({
    className: 'marker-school',
    html: `<span style="font-size:16px;">📚</span>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })

  const kindergartenIcon = new L.DivIcon({
    className: 'marker-kindergarten',
    html: `<span style="font-size:16px;">🧸</span>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })

  // Иконка для объявлений
  const adIcon = new L.DivIcon({
    className: 'marker-ad',
    html: `<span style="display:inline-block;width:16px;height:16px;border-radius:50%;background:#8b5cf6;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,.4);"></span>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })

  // Иконка для домов с объявлениями
  const houseIcon = new L.DivIcon({
    className: 'marker-house',
    html: `<span style="display:inline-block;width:22px;height:22px;border-radius:50%;background:#f59e0b;border:3px solid white;box-shadow:0 0 6px rgba(0,0,0,.6);font-size:12px;color:white;text-align:center;line-height:16px;font-weight:bold;">🏠</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })

  useEffect(() => {
    // Инициализация карты с тестовым пользователем для демо
    setFlats([])
    setPois([])
    setTgUserId(7852511755) // Тестовый пользователь для демо
    setLoading(false)
  }, [])

  // Отдельный эффект для загрузки данных после установки tgUserId
  useEffect(() => {
    if (tgUserId) {
      console.log('tgUserId установлен, загружаем данные:', tgUserId)
      // Сначала загружаем квартиры, затем центрируемся на квартире ID 20
      loadUserFlatsAndCenter()
    }
  }, [tgUserId])

  // Функция для загрузки квартир и центрирования на квартире ID 20
  const loadUserFlatsAndCenter = async () => {
    try {
      const userFlatsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/map/user-flats?tgUserId=${tgUserId}`,
      )

      if (userFlatsResponse.ok) {
        const userFlatsData = await userFlatsResponse.json()
        const flatsData = userFlatsData.flats || []
        setFlats(flatsData)

        // Найти квартиру ID 20 и центрироваться на неё с зумом 16
        const targetFlat = flatsData.find((flat: any) => flat.id === 20)
        if (targetFlat && targetFlat.lat && targetFlat.lng) {
          console.log('Центрируемся на квартире ID 20:', targetFlat)
          setSelectedFlatId(20)
          // Загружаем дома с объявлениями и близлежащие объявления
          handleZoomChange(16, [targetFlat.lat, targetFlat.lng])
          loadNearbyAds(20)
        } else {
          console.log(
            'Квартира ID 20 не найдена, используем стандартные настройки',
          )
          handleZoomChange(12, defaultCenter)
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки пользовательских квартир:', error)
      handleZoomChange(12, defaultCenter)
    }
  }

  const toggleSelect = (flatId: number) => {
    setSelectedFlatId((prev) => (prev === flatId ? null : flatId))
  }

  // Функция для загрузки объявлений в радиусе 500м от выбранной квартиры
  const loadNearbyAds = async (flatId: number) => {
    try {
      console.log('Загружаем объявления в радиусе 500м для квартиры:', flatId)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ads/nearby-by-flat/${flatId}`,
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch nearby ads: ${response.status}`)
      }

      const nearbyAdsData: Ad[] = await response.json()

      // Получаем координаты домов для объявлений
      const houseIds = [
        ...new Set(nearbyAdsData.map((ad) => ad.house_id).filter(Boolean)),
      ]
      const houseCoordinates = new Map<
        number,
        { lat: number; lng: number; address: string }
      >()

      // Загружаем координаты домов из пользовательских квартир (где есть координаты)
      flats.forEach((flat) => {
        if (flat.house_id && flat.lat && flat.lng) {
          houseCoordinates.set(flat.house_id, {
            lat: flat.lat,
            lng: flat.lng,
            address: flat.address,
          })
        }
      })

      // Для домов без координат можем попробовать загрузить из других источников
      // Но пока используем только те, которые есть

      // Обогащаем объявления координатами
      const adsWithCoordinates = nearbyAdsData
        .map((ad) => {
          const houseCoords = houseCoordinates.get(ad.house_id)
          return {
            ...ad,
            lat: houseCoords?.lat,
            lng: houseCoords?.lng,
            address: houseCoords?.address || `Дом ID ${ad.house_id}`,
          }
        })
        .filter((ad) => ad.lat && ad.lng) // Показываем только объявления с координатами

      setAds(adsWithCoordinates)
      console.log(
        `Загружено ${adsWithCoordinates.length} объявлений с координатами из ${nearbyAdsData.length} всего`,
      )
    } catch (error) {
      console.error('Ошибка загрузки близлежащих объявлений:', error)
    }
  }

  // Функция для генерации тестовых POI данных в области карты
  const generatePOIData = (
    center: [number, number],
    radius: number = 1000,
  ): POI[] => {
    const pois: POI[] = []
    const schools = ['Школа №123', 'Лицей №45', 'Гимназия №67', 'Школа №890']
    const kindergartens = [
      'Детский сад "Солнышко"',
      'Детский сад "Радуга"',
      'ДОУ №234',
    ]
    const hospitals = [
      'Поликлиника №1',
      'Больница им. Склифосовского',
      'Медцентр "Здоровье"',
    ]

    // Генерируем школы
    for (let i = 0; i < 3; i++) {
      const lat = center[0] + (Math.random() - 0.5) * 0.01
      const lng = center[1] + (Math.random() - 0.5) * 0.01
      pois.push({
        id: i + 1,
        name: schools[i % schools.length],
        type: 'school',
        lat,
        lng,
        address: `Улица Тестовая, ${i + 1}`,
      })
    }

    // Генерируем детские сады
    for (let i = 0; i < 2; i++) {
      const lat = center[0] + (Math.random() - 0.5) * 0.01
      const lng = center[1] + (Math.random() - 0.5) * 0.01
      pois.push({
        id: i + 10,
        name: kindergartens[i % kindergartens.length],
        type: 'kindergarten',
        lat,
        lng,
        address: `Проспект Детский, ${i + 1}`,
      })
    }

    // Генерируем больницы
    for (let i = 0; i < 2; i++) {
      const lat = center[0] + (Math.random() - 0.5) * 0.01
      const lng = center[1] + (Math.random() - 0.5) * 0.01
      pois.push({
        id: i + 20,
        name: hospitals[i % hospitals.length],
        type: 'hospital',
        lat,
        lng,
        address: `Улица Медицинская, ${i + 1}`,
      })
    }

    return pois
  }

  const handleZoomChange = async (zoom: number, center: [number, number]) => {
    // Обновляем текущий зум и центр
    setCurrentZoom(zoom)
    setCurrentCenter(center)

    try {
      if (zoom >= 16) {
        // На зуме 16+ загружаем дома с объявлениями
        console.log(
          'Зум 16+, загружаем дома с объявлениями для области',
          center,
        )
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/map/houses?lat=${center[0]}&lng=${center[1]}&radius=1000`
        console.log('API URL:', apiUrl)

        const response = await fetch(apiUrl)

        if (!response.ok) {
          console.error(
            'Response not ok:',
            response.status,
            response.statusText,
          )
          throw new Error(
            `Failed to fetch houses: ${response.status} ${response.statusText}`,
          )
        }

        const data = await response.json()

        // Конвертируем данные в формат House
        const newHouses: House[] = data.houses
          .filter((house: any) => house.lat && house.lng)
          .map((house: any) => ({
            house_id: house.house_id,
            address: house.address,
            lat: house.lat,
            lng: house.lng,
            ads_count: house.ads_count,
            dist_m: house.dist_m,
          }))

        // Заменяем дома полностью
        setHouses(newHouses)
        setAds([]) // Очищаем объявления

        console.log(`Загружено ${newHouses.length} домов с объявлениями`)
        console.log('Houses state after update:', newHouses)
      } else {
        // На зуме меньше 16 очищаем дома
        console.log('Зум меньше 16, очищаем дома с объявлениями')
        setHouses([])
        setAds([])
      }

      // Пользовательские квартиры загружаются отдельно в loadUserFlatsAndCenter

      // Перезагружаем POI если соответствующие чекбоксы включены
      if (showSchools) {
        await loadPOIInBounds('school')
      }
      if (showKindergartens) {
        await loadPOIInBounds('kindergarten')
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error)
    }
  }

  // Функции для обработки чекбоксов POI
  const handleSchoolsToggle = async (checked: boolean) => {
    setShowSchools(checked)
    if (checked) {
      await loadPOIInBounds('school')
    } else {
      // Удаляем школы из состояния
      setPois((prev) => prev.filter((p) => p.type !== 'school'))
    }
  }

  const handleKindergartensToggle = async (checked: boolean) => {
    setShowKindergartens(checked)
    if (checked) {
      await loadPOIInBounds('kindergarten')
    } else {
      // Удаляем детские сады из состояния
      setPois((prev) => prev.filter((p) => p.type !== 'kindergarten'))
    }
  }

  // Функция для загрузки POI в видимой области карты
  const loadPOIInBounds = async (poiType: 'school' | 'kindergarten') => {
    try {
      // Вычисляем радиус на основе зума карты для покрытия видимой области
      // Чем меньше зум, тем больше радиус нужен
      const getRadiusForZoom = (zoom: number) => {
        if (zoom >= 16) return 1000 // 1км для детального зума
        if (zoom >= 14) return 2000 // 2км для среднего зума
        if (zoom >= 12) return 5000 // 5км для широкого зума
        return 10000 // 10км для очень широкого зума
      }

      const radius = getRadiusForZoom(currentZoom)

      // Используем существующий endpoint с вычисленным радиусом
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/map/poi?lat=${currentCenter[0]}&lng=${currentCenter[1]}&radius=${radius}&types=${poiType}`,
      )
      const data = await response.json()
      if (data.poi) {
        setPois((prev) => [
          ...prev.filter((p) => p.type !== poiType),
          ...data.poi.filter((p: POI) => p.type === poiType),
        ])
        console.log(
          `Загружено ${poiType === 'school' ? 'школ' : 'детских садов'}: ${data.poi.filter((p: POI) => p.type === poiType).length} (радиус: ${radius}м, зум: ${currentZoom})`,
        )
      }
    } catch (error) {
      console.error(`Ошибка загрузки ${poiType}:`, error)
    }
  }

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <div style={{ marginBottom: 8, padding: '8px 0' }}>
        <strong>Карта объектов недвижимости</strong>
        {currentZoom >= 16 && houses.length > 0 && (
          <span className='ml-4 text-muted-foreground'>
            Домов с объявлениями: {houses.length}
          </span>
        )}
        {currentZoom < 16 && (
          <span className='ml-4 text-amber-600'>
            Приблизьте до зума 16+ для просмотра домов с объявлениями
          </span>
        )}
        {flats.length > 0 && (
          <span className='ml-4 text-muted-foreground'>
            Моих квартир: {flats.length}
          </span>
        )}
        {tgUserId && (
          <span className='ml-4 text-muted-foreground text-xs'>
            (ID: {tgUserId})
          </span>
        )}
        {flats.length > 0 && selectedFlatId && (
          <span className='ml-4 text-green-600'>
            Выбрана: квартира #{selectedFlatId}
          </span>
        )}
      </div>

      {/* Чекбоксы для POI */}
      <div
        style={{
          marginBottom: 12,
          padding: '8px 0',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <div className='flex gap-6 text-sm'>
          <label className='flex items-center cursor-pointer'>
            <input
              type='checkbox'
              checked={showSchools}
              onChange={(e) => handleSchoolsToggle(e.target.checked)}
              className='mr-2'
            />
            📚 Школы
          </label>
          <label className='flex items-center cursor-pointer'>
            <input
              type='checkbox'
              checked={showKindergartens}
              onChange={(e) => handleKindergartensToggle(e.target.checked)}
              className='mr-2'
            />
            🧸 Детские сады
          </label>
        </div>
      </div>

      {loading && (
        <div className='flex items-center justify-center h-32'>
          <div>Загрузка квартир...</div>
        </div>
      )}

      {error && (
        <div className='text-red-600 p-4 bg-red-50 border border-red-200 rounded'>
          Ошибка: {error}
        </div>
      )}

      <MapContainer
        center={defaultCenter}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        className='rounded-lg border'
        attributionControl={false}
      >
        <TileLayer
          url={
            currentZoom >= 14
              ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
              : 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png'
          }
          key={currentZoom >= 14 ? 'with-labels' : 'no-labels'}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        {/* Маркеры квартир */}
        {flats.map((flat, index) =>
          flat.lat && flat.lng ? (
            <Marker
              key={`flat-${flat.id}-${index}`}
              position={[flat.lat, flat.lng]}
              icon={selectedFlatId === flat.id ? selectedFlatIcon : flatIcon}
              eventHandlers={{
                click: () => {
                  toggleSelect(flat.id)
                  onObjectSelect?.({ type: 'flat', data: flat })
                  // Загружаем близлежащие объявления при клике на квартиру
                  loadNearbyAds(flat.id)
                },
              }}
            />
          ) : null,
        )}

        {/* Маркеры POI */}
        {pois
          .filter((poi) => {
            switch (poi.type) {
              case 'school':
                return showSchools
              case 'kindergarten':
                return showKindergartens
              default:
                return false
            }
          })
          .map((poi, index) => {
            const getIcon = () => {
              switch (poi.type) {
                case 'school':
                  return schoolIcon
                case 'kindergarten':
                  return kindergartenIcon
                default:
                  return schoolIcon
              }
            }

            const getTypeLabel = () => {
              switch (poi.type) {
                case 'school':
                  return 'Школа'
                case 'kindergarten':
                  return 'Детский сад'
                case 'hospital':
                  return 'Больница'
                default:
                  return 'Объект'
              }
            }

            return (
              <Marker
                key={`poi-${poi.type}-${poi.lat}-${poi.lng}-${index}`}
                position={[poi.lat, poi.lng]}
                icon={getIcon()}
                eventHandlers={{
                  click: () => onObjectSelect?.({ type: 'poi', data: poi }),
                }}
              />
            )
          })}

        {/* Маркеры объявлений */}
        {ads.map((ad) => (
          <Marker
            key={`ad-${ad.ad_id}`}
            position={[ad.lat, ad.lng]}
            icon={adIcon}
            eventHandlers={{
              click: () => onObjectSelect?.({ type: 'ad', data: ad }),
            }}
          />
        ))}

        {/* Маркеры домов с объявлениями (зум 16+) */}
        {(() => {
          console.log('Rendering houses:', houses.length, houses)
          return houses.map((house, index) => (
            <Marker
              key={`house-${house.house_id}-${index}`}
              position={[house.lat, house.lng]}
              icon={houseIcon}
              eventHandlers={{
                click: () => onObjectSelect?.({ type: 'house', data: house }),
              }}
            />
          ))
        })()}

        {/* Маркеры близлежащих объявлений */}
        {ads.map((ad, index) =>
          ad.lat && ad.lng ? (
            <Marker
              key={`ad-${ad.house_id}-${index}`}
              position={[ad.lat, ad.lng]}
              icon={adIcon}
              eventHandlers={{
                click: () =>
                  onObjectSelect?.({
                    type: 'ad',
                    data: { ...ad, dist_m: ad.distance_m },
                  }),
              }}
            />
          ) : null,
        )}

        {/* Автоматически подгонять вид под квартиры - отключено чтобы не сбрасывать зум */}
        {/* <FitBounds flats={flats} /> */}

        {/* Обработчик зума для подгрузки новых объектов */}
        <ZoomHandler onZoomChange={handleZoomChange} />
      </MapContainer>

      {flats.length === 0 &&
        ads.length === 0 &&
        pois.length === 0 &&
        !loading &&
        !error && (
          <div className='mt-4 p-4 text-center text-muted-foreground'>
            Увеличьте масштаб карты для загрузки объектов недвижимости.
          </div>
        )}
    </div>
  )
}
