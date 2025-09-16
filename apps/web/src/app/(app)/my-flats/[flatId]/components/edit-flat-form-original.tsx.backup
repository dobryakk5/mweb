'use client'

import { type HTMLAttributes, type JSX, useMemo, useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

import type { UserFlat } from '@acme/db/types'
import { insertUserFlatSchema } from '@acme/db/schemas'
import { type z, zodResolver } from '@acme/ui/lib/zod'
import { useForm, type SubmitHandler } from '@acme/ui/hooks/use-form'
import Form from '@acme/ui/components/form'
import cn from '@acme/ui/utils/cn'
import Page from '@acme/ui/components/page'
import Button, { buttonVariants } from '@acme/ui/components/button'
import { ArrowLeftIcon, Loader2Icon, TrashIcon, PlusIcon, MinusIcon, DownloadIcon, RefreshCwIcon, ChevronUpIcon, ChevronDownIcon } from '@acme/ui/components/icon'
import Fieldset from '@acme/ui/components/fieldset'
import Card from '@acme/ui/components/card'
import Skeleton from '@acme/ui/components/skeleton'
import Input from '@acme/ui/components/input'

import { useUpdateFlat, useDeleteFlat } from '@/domains/flats/hooks/mutations'
import { useAds, useFlatAdsFromFindAds, useBroaderAdsFromFindAds, useNearbyAdsFromFindAds, useUpdateAd, forceUpdateAd, findSimilarAds, findSimilarAdsByFlat, findBroaderAdsByAddress, createAd, createAdFromSimilar, createAdFromSimilarWithFrom, toggleAdComparison, type SimilarAd } from '@/domains/ads'
import { useDeleteAd } from '@/domains/ads/hooks/mutations'
import { useParseProperty } from '@/domains/property-parser'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import HookFormDevtool from '@/components/hookform-devtool'
import AddAdForm from './add-ad-form'
import AdChangesHistory from '@/components/ad-changes-history'

const formSchema = insertUserFlatSchema.pick({
  address: true,
  rooms: true,
  floor: true,
})

type FormValues = z.infer<typeof formSchema>

type EditFlatFormProps = HTMLAttributes<HTMLFormElement> & {
  flat?: UserFlat
  className?: string
  isLoading?: boolean
}

export default function EditFlatForm({
  flat,
  className,
  isLoading,
  ...props
}: EditFlatFormProps): JSX.Element {
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo') || '/my-flats'
  const [showAddAdForm, setShowAddAdForm] = useState(false)
  const [expandedView, setExpandedView] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [similarAds, setSimilarAds] = useState<SimilarAd[]>([])
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false)
  // Состояния обновления для блока "По этой квартире"
  const [isUpdatingFlatCian, setIsUpdatingFlatCian] = useState(false)
  const [isUpdatingFlatAvito, setIsUpdatingFlatAvito] = useState(false)
  const [isUpdatingFlatYandex, setIsUpdatingFlatYandex] = useState(false)
  
  // Состояния обновления для блока "Объявления по этому дому"
  const [isUpdatingHouseCian, setIsUpdatingHouseCian] = useState(false)
  const [isUpdatingHouseAvito, setIsUpdatingHouseAvito] = useState(false)
  const [isUpdatingHouseYandex, setIsUpdatingHouseYandex] = useState(false)
  
  // Состояния обновления для блока "Сравнение квартир"
  const [isUpdatingComparisonCian, setIsUpdatingComparisonCian] = useState(false)
  const [isUpdatingComparisonAvito, setIsUpdatingComparisonAvito] = useState(false)
  const [isUpdatingComparisonYandex, setIsUpdatingComparisonYandex] = useState(false)

  // Состояния сворачивания блоков
  const [isBlocksCollapsed, setIsBlocksCollapsed] = useState({
    flatAds: false,      // Объявления по этой квартире
    houseAds: false,     // Объявления по этому дому
    nearbyAds: false,    // Объявления в радиусе 500м
    comparison: false    // Сравнение квартир
  })

  const toggleBlock = (blockName: keyof typeof isBlocksCollapsed) => {
    setIsBlocksCollapsed(prev => ({
      ...prev,
      [blockName]: !prev[blockName]
    }))
  }

  // Получаем объявления для этой квартиры (react-query)
  const { data: ads = [], refetch } = useAds({ flatId: flat?.id })
  const { mutateAsync: deleteAd } = useDeleteAd()
  
  // Получаем данные из find_ads для замены в таблицах
  const { data: flatAdsFromFindAds = [] } = useFlatAdsFromFindAds(flat?.id || 0)
  const { data: broaderAdsFromFindAds = [] } = useBroaderAdsFromFindAds(flat?.id || 0)
  const { data: nearbyAdsFromFindAds = [], refetch: refetchNearbyAds, isLoading: isLoadingNearbyAds } = useNearbyAdsFromFindAds(flat?.id || 0)
  
  // Исключаем из "Другие объявления" те, что уже попали в "По этой квартире"
  const filteredBroaderAds = broaderAdsFromFindAds.filter(broaderAd => {
    // Ищем точное совпадение по URL с объявлениями "по этой квартире"
    return !flatAdsFromFindAds.some(flatAd => flatAd.url === broaderAd.url)
  })

  // Группируем объявления по комнатам+этажу и показываем только последние Циан объявления
  const groupedBroaderAds = useMemo(() => {
    // Создаем группы по комнатам+этажу
    const groups = new Map<string, typeof filteredBroaderAds>()
    
    filteredBroaderAds.forEach(ad => {
      const key = `${ad.rooms}-${ad.floor || 'unknown'}`
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(ad)
    })
    
    // Из каждой группы берем только последнее Циан объявление (по дате обновления)
    const result: typeof filteredBroaderAds = []
    
    groups.forEach(groupAds => {
      // Фильтруем только Циан объявления
      const cianAds = groupAds.filter(ad => ad.url.includes('cian.ru'))
      
      if (cianAds.length > 0) {
        // Сортируем по дате обновления (последние сначала) и берем первое
        const latestCianAd = cianAds.sort((a, b) => 
          new Date(b.updated || '').getTime() - new Date(a.updated || '').getTime()
        )[0]
        
        if (latestCianAd) {
          result.push(latestCianAd)
        }
      } else {
        // Если нет Циан объявлений в группе, берем последнее обновленное любое
        const latestAd = groupAds.sort((a, b) => 
          new Date(b.updated || '').getTime() - new Date(a.updated || '').getTime()
        )[0]
        
        if (latestAd) {
          result.push(latestAd)
        }
      }
    })
    
    return result
  }, [filteredBroaderAds])

  // Разделяем объявления по группам
  const flatAds = ads.filter(ad => ad.from === 1) // По этой квартире (найдено автоматически)
  const otherAds = ads.filter(ad => ad.from === 2) // Другие объявления (добавлено вручную)
  const comparisonAds = ads.filter(ad => ad.sma === 1) // Сравнение квартир (отмеченные для сравнения)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Функция для форматирования значений в таблице
  const formatValue = (value: any, defaultText = '-') => {
    if (value === null || value === undefined || value === '') return defaultText
    if (typeof value === 'number') return value.toString()
    return value.toString()
  }

  // Функция для форматирования цены без знака ₽ (для сравнения - полная цена)
  const formatPrice = (price: number | string | null | undefined) => {
    if (!price) return ''
    const numPrice = typeof price === 'number' ? price : parseInt(String(price))
    if (isNaN(numPrice)) return ''
    return numPrice.toLocaleString('ru-RU')
  }

  // Функция для форматирования площади без лишних нулей
  const formatArea = (area: number | string | null | undefined) => {
    if (!area) return ''
    const numArea = typeof area === 'number' ? area : parseFloat(String(area))
    if (isNaN(numArea)) return ''
    // Убираем лишние нули после запятой
    return numArea % 1 === 0 ? numArea.toString() : numArea.toString()
  }

  // Состояния для отслеживания обновления отдельных строк в сравнении
  const [updatingAdIds, setUpdatingAdIds] = useState(new Set<number>())

  // Функция для обновления одной строки в сравнении
  const handleRefreshSingleAd = async (ad: any) => {
    try {
      setUpdatingAdIds(prev => new Set(prev).add(ad.id))
      console.log(`🔄 Обновляем объявление в сравнении: ${ad.url}`)
      
      const result = await parseProperty(ad.url)
      
      if (result.success && result.data) {
        const updateData = prepareUpdateData(result.data)
        await forceUpdateAd(ad.id, updateData)
        await refetch()
        console.log(`✅ Объявление в сравнении ${ad.id} обновлено`)
        toast.success('Объявление обновлено!')
      } else {
        console.log(`❌ Не удалось обновить объявление в сравнении ${ad.id}`)
        toast.error('Ошибка обновления объявления')
      }
    } catch (error) {
      console.error('Ошибка при обновлении объявления:', error)
      toast.error('Ошибка при обновлении объявления')
    } finally {
      setUpdatingAdIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(ad.id)
        return newSet
      })
    }
  }

  // Функция экспорта сравнения в Excel
  const exportComparisonToExcel = () => {
    if (comparisonAds.length === 0) {
      toast.error('Нет данных для экспорта')
      return
    }

    // Подготавливаем данные для экспорта
    const exportData = comparisonAds.map(ad => ({
      'URL': ad.url,
      'Цена': formatPrice(ad.price),
      'Комнаты': ad.rooms,
      'Общая пл.': formatArea(ad.totalArea),
      'Жилая пл.': formatArea(ad.livingArea),
      'Кухня пл.': formatArea(ad.kitchenArea),
      'Этаж': ad.floor || '',
      'Всего этажей': ad.totalFloors || '',
      'Санузел': ad.bathroom || '',
      'Балкон': ad.balcony || '',
      'Ремонт': ad.renovation || '',
      'Мебель': ad.furniture || '',
      'Год': ad.constructionYear || '',
      'Тип дома': ad.houseType || '',
      'Высота потолков': ad.ceilingHeight || '',
      'Метро': ad.metroStation || '',
      'Время до метро': ad.metroTime || '',
      'Теги': ad.tags || '',
      'Описание': ad.description || '',
      'Статус': ad.status || '',
      'Просмотры на дату': ad.viewsToday !== null && ad.viewsToday !== undefined ? ad.viewsToday : '—',
    }))

    // Создаем рабочую книгу и лист
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Сравнение квартир')

    // Экспортируем файл
    const fileName = `сравнение-квартир-${flat?.address || 'квартира'}-${new Date().toLocaleDateString('ru-RU')}.xlsx`
    XLSX.writeFile(wb, fileName)
    
    toast.success(`Экспорт завершен: ${fileName}`)
  }

  // Универсальная функция для подготовки всех данных с парсинга
  const prepareUpdateData = (parsedData: any) => {
    const updateData: any = {}
    
    // Правильно обрабатываем status - может быть boolean или undefined
    if (typeof parsedData.status === 'boolean') {
      updateData.status = parsedData.status
    } else if (parsedData.status === 'active' || parsedData.status === 'inactive') {
      updateData.status = parsedData.status === 'active'
    } else {
      updateData.status = true // по умолчанию активно
    }

    // Основные поля
    if (typeof parsedData.price === 'number' && parsedData.price > 0) {
      updateData.price = parsedData.price
    } else if (typeof parsedData.price === 'string' && parsedData.price !== 'Не найдено') {
      const parsedPrice = parseInt(parsedData.price)
      if (!isNaN(parsedPrice) && parsedPrice > 0) {
        updateData.price = parsedPrice
      }
    }

    if (typeof parsedData.rooms === 'number' && parsedData.rooms > 0) {
      updateData.rooms = parsedData.rooms
    } else if (parsedData.rooms) {
      const parsedRooms = parseInt(String(parsedData.rooms))
      if (!isNaN(parsedRooms) && parsedRooms > 0) {
        updateData.rooms = parsedRooms
      }
    }

    // Площади
    if (parsedData.total_area || parsedData.totalArea) {
      const area = parsedData.total_area || parsedData.totalArea
      updateData.totalArea = typeof area === 'number' ? area : parseFloat(String(area))
    }
    
    if (parsedData.living_area || parsedData.livingArea) {
      const area = parsedData.living_area || parsedData.livingArea
      updateData.livingArea = typeof area === 'number' ? area : parseFloat(String(area))
    }
    
    if (parsedData.kitchen_area || parsedData.kitchenArea) {
      const area = parsedData.kitchen_area || parsedData.kitchenArea
      updateData.kitchenArea = typeof area === 'number' ? area : parseFloat(String(area))
    }

    // Этаж и планировка
    if (typeof parsedData.floor === 'number' && parsedData.floor > 0) {
      updateData.floor = parsedData.floor
    } else if (parsedData.floor) {
      const parsedFloor = parseInt(String(parsedData.floor))
      if (!isNaN(parsedFloor) && parsedFloor > 0) {
        updateData.floor = parsedFloor
      }
    }

    if (typeof parsedData.total_floors === 'number' || typeof parsedData.totalFloors === 'number') {
      updateData.totalFloors = parsedData.total_floors || parsedData.totalFloors
    } else if (parsedData.total_floors || parsedData.totalFloors) {
      const floors = parsedData.total_floors || parsedData.totalFloors
      const parsedFloors = parseInt(String(floors))
      if (!isNaN(parsedFloors)) {
        updateData.totalFloors = parsedFloors
      }
    }

    // Характеристики квартиры
    if (parsedData.bathroom) updateData.bathroom = parsedData.bathroom
    if (parsedData.balcony) updateData.balcony = parsedData.balcony
    if (parsedData.renovation) updateData.renovation = parsedData.renovation
    if (parsedData.furniture) updateData.furniture = parsedData.furniture

    // Характеристики здания
    if (parsedData.construction_year || parsedData.constructionYear) {
      const year = parsedData.construction_year || parsedData.constructionYear
      updateData.constructionYear = typeof year === 'number' ? year : parseInt(String(year))
    }
    
    if (parsedData.house_type || parsedData.houseType) {
      updateData.houseType = parsedData.house_type || parsedData.houseType
    }
    
    if (parsedData.ceiling_height || parsedData.ceilingHeight) {
      const height = parsedData.ceiling_height || parsedData.ceilingHeight
      updateData.ceilingHeight = typeof height === 'number' ? height : parseFloat(String(height))
    }

    // Локация
    if (parsedData.metro_station || parsedData.metroStation) {
      updateData.metroStation = parsedData.metro_station || parsedData.metroStation
    }
    
    if (parsedData.metro_time || parsedData.metroTime) {
      updateData.metroTime = parsedData.metro_time || parsedData.metroTime
    }

    // Дополнительная информация
    if (parsedData.tags) updateData.tags = parsedData.tags
    if (parsedData.description) updateData.description = parsedData.description
    if (parsedData.photo_urls || parsedData.photoUrls) {
      updateData.photoUrls = parsedData.photo_urls || parsedData.photoUrls
    }

    // Статистика
    if (parsedData.source) {
      // Конвертируем строковые значения источника в числовые для API
      if (parsedData.source === 'cian') {
        updateData.source = 1
      } else if (parsedData.source === 'avito') {
        updateData.source = 2
      } else if (typeof parsedData.source === 'number') {
        updateData.source = parsedData.source
      }
    }
    
    if (parsedData.views_today || parsedData.viewsToday) {
      const views = parsedData.views_today || parsedData.viewsToday
      updateData.viewsToday = typeof views === 'number' ? views : parseInt(String(views))
    }
    

    // Фильтруем undefined значения
    return Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined && value !== null && value !== '')
    )
  }

  // Функция для получения названия источника
  const getSourceName = (source: number) => {
    if (source === 1) return 'Cian'
    if (source === 2) return 'Avito'
    return 'Unknown'
  }

  const defaultValues = useMemo(
    () => ({
      address: flat?.address ?? '',
      rooms: flat?.rooms ?? 1,
      floor: flat?.floor ?? 1,
    }),
    [flat],
  )

  const { reset, formState, control, handleSubmit, ...form } =
    useForm<FormValues>({
      mode: 'onChange',
      defaultValues,
      resolver: zodResolver(formSchema),
    })

  useEffect(() => {
    if (flat) {
      reset(defaultValues)
    }
  }, [flat, defaultValues, reset])

  const { mutateAsync: updateFlat } = useUpdateFlat(flat?.id as number)
  const { mutateAsync: deleteFlat } = useDeleteFlat(flat?.id as number)
  const { mutateAsync: parseProperty, isPending: isParsing } = useParseProperty()
  const { mutateAsync: updateAd } = useUpdateAd()

  const cancel = () => reset(defaultValues)

  const onSubmit: SubmitHandler<FormValues> = async (values: FormValues) => {
    try {
      const modifiedFields: Partial<FormValues> = Object.fromEntries(
        Object.keys(formState.dirtyFields).map((key) => [
          key,
          values[key as keyof FormValues],
        ]),
      )

      await updateFlat(modifiedFields)

      reset(values)
    } catch (err) {
      console.error(err)
    }
  }

  // Функция для поиска более широких объявлений по адресу (useCallback для стабильности)
  const autoFindBroaderAds = useCallback(async () => {
    if (!flat) return
    
    setIsLoadingSimilar(true)
    try {
      // Используем поиск по адресу без точного определения этажа и комнат
      const broaderAds: SimilarAd[] = await findBroaderAdsByAddress(flat.id)
      
      // Получаем текущие URL объявлений для проверки дубликатов
      const existingUrls = new Set(ads.map(ad => ad.url))
      
      // Добавляем найденные объявления в таблицу ads
      let addedCount = 0
      let skippedCount = 0
      
      for (const broaderAd of broaderAds) {
        try {
          // Проверяем, нет ли уже такого URL
          if (existingUrls.has(broaderAd.url)) {
            console.log(`Объявление с URL ${broaderAd.url} уже существует, пропускаем`)
            skippedCount++
            continue
          }
          
          console.log(`Создаем объявление из broader search:`, {
            url: broaderAd.url,
            price: broaderAd.price,
            rooms: broaderAd.rooms,
            flatId: flat.id,
            flatAddress: flat.address
          })
          
          // Создаем объявление с from = 2 (добавлено как "другие")
          await createAdFromSimilarWithFrom(broaderAd, flat.id, 2, flat.address)
          addedCount++
          console.log(`Успешно добавлено объявление: ${broaderAd.url}`)
        } catch (error) {
          console.error('Ошибка при добавлении объявления:', error)
          console.error('Данные объявления:', broaderAd)
        }
      }
      
      const message = skippedCount > 0 
        ? `Найдено ${broaderAds.length} объявлений по адресу, добавлено ${addedCount}, пропущено ${skippedCount} дубликатов`
        : `Найдено ${broaderAds.length} объявлений по адресу, добавлено ${addedCount} в таблицу`
      
      toast.success(message)
      
      // Обновляем список объявлений через react-query refetch
      try {
        await refetch()
      } catch (err) {
        console.warn('Ошибка при refetch объявлений:', err)
      }
    } catch (error) {
      console.error('Ошибка поиска объявлений по адресу:', error)
      toast.error('Ошибка при поиске объявлений по адресу')
    } finally {
      setIsLoadingSimilar(false)
    }
  }, [ads, flat, refetch])

  // Функция для автоматического поиска похожих объявлений (useCallback для стабильности)
  const autoFindSimilarAds = useCallback(async () => {
    if (!flat) return
    
    setIsLoadingSimilar(true)
    try {
      // Если есть объявления, используем поиск по объявлению
      // Иначе используем поиск по параметрам квартиры
      const similar: SimilarAd[] = (ads.length > 0 && ads[0]?.id)
        ? await findSimilarAds(ads[0].id)
        : await findSimilarAdsByFlat(flat.id)
      
      setSimilarAds(similar)
      
      // Получаем текущие URL объявлений для проверки дубликатов
      const existingUrls = new Set(ads.map(ad => ad.url))
      
      // Добавляем найденные объявления в таблицу ads
      let addedCount = 0
      let skippedCount = 0
      
      for (const similarAd of similar) {
        try {
          // Проверяем, нет ли уже такого URL
          if (existingUrls.has(similarAd.url)) {
            console.log(`Объявление с URL ${similarAd.url} уже существует, пропускаем`)
            skippedCount++
            continue
          }
          
          console.log(`Создаем объявление из похожего:`, {
            url: similarAd.url,
            price: similarAd.price,
            rooms: similarAd.rooms,
            flatId: flat.id,
            flatAddress: flat.address
          })
          
          // Передаем адрес квартиры напрямую
          await createAdFromSimilar(similarAd, flat.id, flat.address)
          addedCount++
          console.log(`Успешно добавлено объявление: ${similarAd.url}`)
        } catch (error) {
          console.error('Ошибка при добавлении объявления:', error)
          console.error('Данные объявления:', similarAd)
        }
      }
      
      const message = skippedCount > 0 
        ? `Найдено ${similar.length} похожих объявлений, добавлено ${addedCount}, пропущено ${skippedCount} дубликатов`
        : `Найдено ${similar.length} похожих объявлений, добавлено ${addedCount} в таблицу`
      
      toast.success(message)
      
      // Обновляем список объявлений через react-query refetch
      // Если у тебя есть сложная логика/фильтры — можно использовать queryClient.invalidateQueries
      try {
        await refetch()
      } catch (err) {
        console.warn('Ошибка при refetch объявлений:', err)
      }
    } catch (error) {
      console.error('Ошибка автопоиска похожих объявлений:', error)
      toast.error('Ошибка при поиске похожих объявлений')
    } finally {
      setIsLoadingSimilar(false)
    }
  }, [ads, flat, refetch])

  // Функция для переключения статуса сравнения объявления
  const handleToggleComparison = async (adId: number, inComparison: boolean) => {
    try {
      await toggleAdComparison(adId, inComparison)
      await refetch()
      toast.success(inComparison ? 'Объявление добавлено в сравнение' : 'Объявление убрано из сравнения')
    } catch (error) {
      console.error('Ошибка при изменении статуса сравнения:', error)
      toast.error('Ошибка при изменении статуса сравнения')
    }
  }

  // Функция для удаления объявления
  const handleDeleteAd = async (adId: number) => {
    if (window.confirm('Вы уверены, что хотите удалить это объявление?')) {
      try {
        await deleteAd(adId)
        await refetch()
        toast.success('Объявление удалено')
      } catch (error) {
        console.error('Ошибка удаления объявления:', error)
        toast.error('Ошибка при удалении объявления')
      }
    }
  }

  // Функция для удаления квартиры
  const handleDeleteFlat = async () => {
    if (window.confirm('Вы уверены, что хотите удалить эту квартиру? Вся статистика по объявлениям будет удалена безвозвратно.')) {
      try {
        await deleteFlat()
      } catch (error) {
        console.error('Ошибка удаления квартиры:', error)
        toast.error('Ошибка при удалении квартиры')
      }
    }
  }

  // Функция для добавления объявления в сравнение
  const handleAddToComparison = async (adData: any) => {
    if (!flat) {
      toast.error('Квартира не найдена')
      return
    }

    try {
      // Проверим, есть ли уже такое объявление в сравнении
      const existingAd = comparisonAds.find(ad => ad.url === adData.url)
      if (existingAd) {
        toast.info('Объявление уже добавлено в сравнение')
        return
      }

      // Создаем объект объявления для добавления в базу
      const adToAdd = {
        flatId: flat.id,
        url: adData.url,
        address: flat.address, // используем адрес квартиры
        price: adData.price ? parseFloat(adData.price.toString().replace(/[^\d.]/g, '')) : 0,
        rooms: adData.rooms || flat.rooms, // используем количество комнат из данных или из квартиры
        from: 2, // добавлено вручную
        sma: 1 // добавляем в сравнение
      }

      // Добавляем объявление через API
      await createAd(adToAdd)

      // Обновляем список объявлений чтобы отразить изменения
      await refetch()

      toast.success('Объявление добавлено в сравнение')
    } catch (error) {
      console.error('Ошибка добавления в сравнение:', error)
      toast.error('Ошибка при добавлении в сравнение')
    }
  }

  // Функция для обновления объявлений по дому
  const handleUpdateHouseAds = async () => {
    if (!flat) {
      toast.error('Квартира не найдена')
      return
    }

    // Получаем объявления по дому из groupedBroaderAds
    if (groupedBroaderAds.length === 0) {
      toast.info('Нет объявлений для обновления')
      return
    }

    console.log(`=== Начинаем обновление ${groupedBroaderAds.length} объявлений по дому ===`)
    
    // Определяем объявления по источникам
    const cianAds = groupedBroaderAds.filter(ad => ad.url.includes('cian.ru'))
    const avitoAds = groupedBroaderAds.filter(ad => ad.url.includes('avito.ru'))
    const yandexAds = groupedBroaderAds.filter(ad => ad.url.includes('yandex.ru'))
    
    console.log(`Источники: Cian (${cianAds.length}), Avito (${avitoAds.length}), Yandex (${yandexAds.length})`)

    let totalUpdated = 0
    let totalErrors = 0

    // 1. Cian - ждем ответа и ставим новые данные
    if (cianAds.length > 0) {
      setIsUpdatingHouseCian(true)
      console.log(`📊 Обновляем ${cianAds.length} объявлений Cian по дому...`)
      
      try {
        for (const houseAd of cianAds) {
          console.log(`🔄 Парсим Cian объявление по дому: ${houseAd.url}`)
          const result = await parseProperty(houseAd.url)
          
          if (result.success && result.data) {
            // Находим соответствующий объект в ads для обновления
            const adsItem = ads.find(ad => ad.url === houseAd.url)
            if (adsItem) {
              const updateData = prepareUpdateData(result.data)
              
              await forceUpdateAd(adsItem.id, updateData)
              totalUpdated++
              console.log(`✅ Cian объявление по дому ${adsItem.id} обновлено (цена: ${updateData.price || 'не изменена'}, статус: ${updateData.status})`)
            } else {
              console.log(`⚠️ Не найден соответствующий объект в ads для URL: ${houseAd.url}`)
            }
          } else {
            totalErrors++
            console.log(`❌ Не удалось спарсить Cian объявление по дому: ${houseAd.url}`)
          }
        }
        toast.success(`Cian (дом): обновлено ${totalUpdated - totalErrors} из ${cianAds.length} объявлений`)
      } catch (error) {
        console.error('Ошибка обновления Cian (дом):', error)
        toast.error('Ошибка обновления Cian (дом)')
        totalErrors++
      } finally {
        setIsUpdatingHouseCian(false)
      }
    }

    // 2. Avito - запускаем анимацию и обновляем  
    if (avitoAds.length > 0) {
      setIsUpdatingHouseAvito(true)
      console.log(`📊 Обновляем ${avitoAds.length} объявлений Avito по дому...`)
      
      try {
        for (const houseAd of avitoAds) {
          console.log(`🔄 Парсим Avito объявление по дому: ${houseAd.url}`)
          const result = await parseProperty(houseAd.url)
          
          if (result.success && result.data) {
            // Находим соответствующий объект в ads для обновления
            const adsItem = ads.find(ad => ad.url === houseAd.url)
            if (adsItem) {
              const updateData = prepareUpdateData(result.data)
              
              await forceUpdateAd(adsItem.id, updateData)
              totalUpdated++
              console.log(`✅ Avito объявление по дому ${adsItem.id} обновлено (цена: ${updateData.price || 'не изменена'}, статус: ${updateData.status})`)
            } else {
              console.log(`⚠️ Не найден соответствующий объект в ads для URL: ${houseAd.url}`)
            }
          } else {
            totalErrors++
            console.log(`❌ Не удалось спарсить Avito объявление по дому: ${houseAd.url}`)
          }
        }
        toast.success(`Avito (дом): обновлено ${totalUpdated - totalErrors} из ${avitoAds.length} объявлений`)
      } catch (error) {
        console.error('Ошибка обновления Avito (дом):', error)
        toast.error('Ошибка обновления Avito (дом)')
        totalErrors++
      } finally {
        setIsUpdatingHouseAvito(false)
      }
    }

    // 3. Yandex - пока без функционала, только уведомляем
    if (yandexAds.length > 0) {
      setIsUpdatingHouseYandex(true)
      console.log(`⚠️ Yandex объявления по дому (${yandexAds.length}) - функционал не реализован`)
      setTimeout(() => {
        setIsUpdatingHouseYandex(false)
        toast.info(`Yandex (дом, ${yandexAds.length} объявлений): функционал пока не реализован`)
      }, 1000)
    }

    // Итоговый результат
    console.log(`=== Обновление по дому завершено: ${totalUpdated} успешно, ${totalErrors} ошибок ===`)
    
    if (totalUpdated > 0) {
      toast.success(`Обновлено ${totalUpdated} объявлений по дому`)
      // Обновляем данные после обновления
      await refetch()
    }
  }

  // Функция для обновления объявлений в сравнении
  const handleUpdateComparisonAds = async () => {
    if (!flat) {
      toast.error('Квартира не найдена')
      return
    }

    // Получаем объявления для сравнения
    if (comparisonAds.length === 0) {
      toast.info('Нет объявлений для обновления в сравнении')
      return
    }

    console.log(`=== Начинаем обновление ${comparisonAds.length} объявлений в сравнении ===`)
    
    // Определяем объявления по источникам
    const cianAds = comparisonAds.filter(ad => ad.url.includes('cian.ru'))
    const avitoAds = comparisonAds.filter(ad => ad.url.includes('avito.ru'))
    const yandexAds = comparisonAds.filter(ad => ad.url.includes('yandex.ru'))
    
    console.log(`Источники: Cian (${cianAds.length}), Avito (${avitoAds.length}), Yandex (${yandexAds.length})`)

    let totalUpdated = 0
    let totalErrors = 0

    // 1. Cian - ждем ответа и ставим новые данные
    if (cianAds.length > 0) {
      setIsUpdatingComparisonCian(true)
      console.log(`📊 Обновляем ${cianAds.length} объявлений Cian в сравнении...`)
      
      try {
        for (const ad of cianAds) {
          console.log(`🔄 Парсим Cian объявление в сравнении: ${ad.url}`)
          const result = await parseProperty(ad.url)
          
          if (result.success && result.data) {
            const updateData = prepareUpdateData(result.data)
            
            await forceUpdateAd(ad.id, updateData)
            totalUpdated++
            console.log(`✅ Cian объявление в сравнении ${ad.id} обновлено (цена: ${updateData.price || 'не изменена'}, статус: ${updateData.status})`)
            
            // Сразу обновляем данные в таблице после каждого объявления
            await refetch()
          } else {
            totalErrors++
            console.log(`❌ Не удалось спарсить Cian объявление в сравнении ${ad.id}`)
          }
        }
        toast.success(`Cian (сравнение): обновлено ${totalUpdated - totalErrors} из ${cianAds.length} объявлений`)
      } catch (error) {
        console.error('Ошибка обновления Cian (сравнение):', error)
        toast.error('Ошибка обновления Cian (сравнение)')
        totalErrors++
      } finally {
        setIsUpdatingComparisonCian(false)
      }
    }

    // 2. Avito - запускаем анимацию и обновляем
    if (avitoAds.length > 0) {
      setIsUpdatingComparisonAvito(true)
      console.log(`📊 Обновляем ${avitoAds.length} объявлений Avito в сравнении...`)
      
      try {
        for (const ad of avitoAds) {
          console.log(`🔄 Парсим Avito объявление в сравнении: ${ad.url}`)
          const result = await parseProperty(ad.url)
          
          if (result.success && result.data) {
            const updateData = prepareUpdateData(result.data)
            
            await forceUpdateAd(ad.id, updateData)
            totalUpdated++
            console.log(`✅ Avito объявление в сравнении ${ad.id} обновлено (цена: ${updateData.price || 'не изменена'}, статус: ${updateData.status})`)
            
            // Сразу обновляем данные в таблице после каждого объявления
            await refetch()
          } else {
            totalErrors++
            console.log(`❌ Не удалось спарсить Avito объявление в сравнении ${ad.id}`)
          }
        }
        toast.success(`Avito (сравнение): обновлено ${totalUpdated - totalErrors} из ${avitoAds.length} объявлений`)
      } catch (error) {
        console.error('Ошибка обновления Avito (сравнение):', error)
        toast.error('Ошибка обновления Avito (сравнение)')
        totalErrors++
      } finally {
        setIsUpdatingComparisonAvito(false)
      }
    }

    // 3. Yandex - пока без функционала, только уведомляем
    if (yandexAds.length > 0) {
      setIsUpdatingComparisonYandex(true)
      console.log(`⚠️ Yandex объявления в сравнении (${yandexAds.length}) - функционал не реализован`)
      setTimeout(() => {
        setIsUpdatingComparisonYandex(false)
        toast.info(`Yandex (сравнение, ${yandexAds.length} объявлений): функционал пока не реализован`)
      }, 1000)
    }

    // Итоговый результат
    console.log(`=== Обновление сравнения завершено: ${totalUpdated} успешно, ${totalErrors} ошибок ===`)
    
    if (totalUpdated > 0) {
      toast.success(`Обновлено ${totalUpdated} объявлений в сравнении`)
    }
  }

  // Функция для обновления объявлений по всем источникам
  const handleUpdateAllSources = async () => {
    if (!flat) {
      toast.error('Квартира не найдена')
      return
    }

    // Получаем объявления по этой квартире
    const flatAdsToUpdate = flatAds

    if (flatAdsToUpdate.length === 0) {
      toast.info('Нет объявлений для обновления')
      return
    }

    console.log(`=== Начинаем обновление ${flatAdsToUpdate.length} объявлений ===`)
    
    // Определяем объявления по источникам
    const cianAds = flatAdsToUpdate.filter(ad => ad.url.includes('cian.ru'))
    const avitoAds = flatAdsToUpdate.filter(ad => ad.url.includes('avito.ru'))
    const yandexAds = flatAdsToUpdate.filter(ad => ad.url.includes('yandex.ru'))
    
    console.log(`Источники: Cian (${cianAds.length}), Avito (${avitoAds.length}), Yandex (${yandexAds.length})`)

    let totalUpdated = 0
    let totalErrors = 0

    // 1. Cian - ждем ответа и ставим новые данные
    if (cianAds.length > 0) {
      setIsUpdatingFlatCian(true)
      console.log(`📊 Обновляем ${cianAds.length} объявлений Cian...`)
      
      try {
        for (const ad of cianAds) {
          console.log(`🔄 Парсим Cian объявление: ${ad.url}`)
          const result = await parseProperty(ad.url)
          
          if (result.success && result.data) {
            const updateData = prepareUpdateData(result.data)
            
            await forceUpdateAd(ad.id, updateData)
            totalUpdated++
            console.log(`✅ Cian объявление ${ad.id} обновлено (цена: ${updateData.price || 'не изменена'}, статус: ${updateData.status})`)
            
            // Сразу обновляем данные в таблице после каждого объявления
            await refetch()
          } else {
            totalErrors++
            console.log(`❌ Не удалось спарсить Cian объявление ${ad.id}`)
          }
        }
        toast.success(`Cian: обновлено ${totalUpdated - totalErrors} из ${cianAds.length} объявлений`)
      } catch (error) {
        console.error('Ошибка обновления Cian:', error)
        toast.error('Ошибка обновления Cian')
        totalErrors++
      } finally {
        setIsUpdatingFlatCian(false)
      }
    }

    // 2. Avito - запускаем анимацию и обновляем
    if (avitoAds.length > 0) {
      setIsUpdatingFlatAvito(true)
      console.log(`📊 Обновляем ${avitoAds.length} объявлений Avito...`)
      
      try {
        for (const ad of avitoAds) {
          console.log(`🔄 Парсим Avito объявление: ${ad.url}`)
          const result = await parseProperty(ad.url)
          
          if (result.success && result.data) {
            const updateData = prepareUpdateData(result.data)
            
            await forceUpdateAd(ad.id, updateData)
            totalUpdated++
            console.log(`✅ Avito объявление ${ad.id} обновлено (цена: ${updateData.price || 'не изменена'}, статус: ${updateData.status})`)
            
            // Сразу обновляем данные в таблице после каждого объявления
            await refetch()
          } else {
            totalErrors++
            console.log(`❌ Не удалось спарсить Avito объявление ${ad.id}`)
          }
        }
        toast.success(`Avito: обновлено ${totalUpdated - totalErrors} из ${avitoAds.length} объявлений`)
      } catch (error) {
        console.error('Ошибка обновления Avito:', error)
        toast.error('Ошибка обновления Avito')
        totalErrors++
      } finally {
        setIsUpdatingFlatAvito(false)
      }
    }

    // 3. Yandex - пока без функционала, только уведомляем
    if (yandexAds.length > 0) {
      setIsUpdatingFlatYandex(true)
      console.log(`⚠️  Yandex объявления (${yandexAds.length}) - функционал не реализован`)
      setTimeout(() => {
        setIsUpdatingFlatYandex(false)
        toast.info(`Yandex (${yandexAds.length} объявлений): функционал пока не реализован`)
      }, 1000)
    }

    // Итоговый результат
    console.log(`=== Обновление завершено: ${totalUpdated} успешно, ${totalErrors} ошибок ===`)
    
    if (totalUpdated > 0) {
      toast.success(`Обновлено ${totalUpdated} объявлений`)
    }
  }

  return (
    <>
      <HookFormDevtool control={control} />

      <Form {...{ reset, formState, control, handleSubmit, ...form }}>
        <form
          className={cn('h-full w-full', className)}
          onSubmit={handleSubmit(onSubmit)}
          {...props}
        >
          <Page>
            <Page.Header>
              <Link
                className={buttonVariants({ size: 'icon', variant: 'outline' })}
                href={returnTo}
              >
                <ArrowLeftIcon className='size-5' />

                <span className='sr-only'>Вернуться назад</span>
              </Link>

              <div className='flex items-end gap-6 w-full'>
                <Form.Field
                  control={control}
                  name='address'
                  render={({ field }) => (
                    <Form.Item className='space-y-1 flex-1'>
                      <Form.Label className='text-sm text-muted-foreground'>Адрес</Form.Label>
                      <Form.Control>
                        <Input
                          type='text'
                          placeholder='Адрес'
                          className='h-8 text-lg font-semibold border-none focus-visible:ring-0 focus-visible:ring-offset-0'
                          {...field}
                        />
                      </Form.Control>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
                <div className='flex items-end gap-4'>
                  <Form.Field
                    control={control}
                    name='rooms'
                    render={({ field }) => (
                      <Form.Item className='space-y-1'>
                        <Form.Label className='text-sm text-muted-foreground'>Комнат</Form.Label>
                        <Form.Control>
                          <Input
                            type='number'
                            min={1}
                            placeholder='Комнат'
                            className='h-8 w-20 text-lg font-semibold border-none focus-visible:ring-0 focus-visible:ring-offset-0'
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 1)
                            }
                          />
                        </Form.Control>
                        <Form.Message />
                      </Form.Item>
                    )}
                  />
                  <Form.Field
                    control={control}
                    name='floor'
                    render={({ field }) => (
                      <Form.Item className='space-y-1'>
                        <Form.Label className='text-sm text-muted-foreground'>Этаж</Form.Label>
                        <Form.Control>
                          <Input
                            type='number'
                            min={1}
                            placeholder='Этаж'
                            className='h-8 w-20 text-lg font-semibold border-none focus-visible:ring-0 focus-visible:ring-offset-0'
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 1)
                            }
                          />
                        </Form.Control>
                        <Form.Message />
                      </Form.Item>
                    )}
                  />
                  
                  {/* Кнопка "Искать объявления" */}
                  <button
                    type='button'
                    className={buttonVariants({
                      variant: 'default',
                      size: 'sm',
                    })}
                    disabled={isLoadingSimilar}
                    onClick={autoFindSimilarAds}
                  >
                    {isLoadingSimilar ? 'Поиск...' : 'Объявления'}
                  </button>

                  {/* Кнопка удаления квартиры */}
                  <button
                    type='button'
                    className={buttonVariants({
                      variant: 'destructive',
                      size: 'sm',
                    })}
                    onClick={handleDeleteFlat}
                    title="Удалить квартиру"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {formState.isDirty ? (
                <div className='ml-auto flex items-center gap-x-4'>
                  <span className='text-muted-foreground text-xs'>
                    Несохраненные изменения
                  </span>

                  <div className='flex gap-x-2'>
                    <Button onClick={cancel} variant='outline'>
                      Отмена
                    </Button>

                    <Button
                      className='gap-x-2'
                      disabled={!formState.isValid}
                      type='submit'
                    >
                      <span>Сохранить</span>

                      {formState.isSubmitting ? (
                        <Loader2Icon className='size-4 animate-spin' />
                      ) : null}
                    </Button>
                  </div>
                </div>
              ) : null}
            </Page.Header>

            <Page.Content className='divide-y *:py-5 first:*:pt-0 last:*:pb-0'>

              {/* Блок объявлений по этой квартире (from = 1) */}
              <div className='py-4 px-4 bg-gray-50 rounded-lg mb-4'>
                <div className='flex items-center justify-between mb-4'>
                  <div
                    className='flex items-center gap-2 cursor-pointer hover:text-blue-600'
                    onClick={() => toggleBlock('flatAds')}
                  >
                    <h3 className='text-lg font-medium'>Объявления по этой квартире</h3>
                    {isBlocksCollapsed.flatAds ? (
                      <ChevronDownIcon className='w-5 h-5' />
                    ) : (
                      <ChevronUpIcon className='w-5 h-5' />
                    )}
                  </div>
                  <div className='flex items-center gap-2'>
                    <div className='flex items-center gap-2'>
                      <button
                        type='button'
                        className={buttonVariants({
                          variant: 'default',
                          size: 'sm',
                        })}
                        disabled={isUpdatingFlatCian || isUpdatingFlatAvito || isUpdatingFlatYandex}
                        onClick={handleUpdateAllSources}
                      >
                        {(isUpdatingFlatCian || isUpdatingFlatAvito || isUpdatingFlatYandex) ? (
                          <div className='flex items-center gap-2'>
                            <svg className='w-4 h-4 animate-spin' fill='none' viewBox='0 0 24 24'>
                              <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                              <path className='opacity-75' fill='currentColor' d='m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                            </svg>
                            Обновление...
                          </div>
                        ) : 'Обновить'}
                      </button>
                      
                      {/* Индикаторы прогресса по источникам */}
                      {(isUpdatingFlatCian || isUpdatingFlatAvito || isUpdatingFlatYandex) && (
                        <div className='flex items-center gap-3 text-sm'>
                          <div className='flex items-center gap-1'>
                            <span className='text-orange-600'>Cian:</span>
                            {isUpdatingFlatCian ? (
                              <svg className='w-3 h-3 animate-spin text-orange-600' fill='none' viewBox='0 0 24 24'>
                                <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                                <path className='opacity-75' fill='currentColor' d='m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                              </svg>
                            ) : (
                              <span className='text-green-600'>✓</span>
                            )}
                          </div>
                          <div className='flex items-center gap-1'>
                            <span className='text-blue-600'>Avito:</span>
                            {isUpdatingFlatAvito ? (
                              <svg className='w-3 h-3 animate-spin text-blue-600' fill='none' viewBox='0 0 24 24'>
                                <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                                <path className='opacity-75' fill='currentColor' d='m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                              </svg>
                            ) : (
                              <span className='text-green-600'>✓</span>
                            )}
                          </div>
                          <div className='flex items-center gap-1'>
                            <span className='text-red-600'>Yandex:</span>
                            <span className='text-gray-400'>не реализован</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Таблица объявлений о продаже */}
                <div className='rounded-lg border'>
                  <div className='relative w-full overflow-auto'>
                    <table className='w-full caption-bottom text-sm'>
                      <thead className='[&_tr]:border-b'>
                        <tr className='border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted'>
                          <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 w-96'>
                            <div className='flex items-center gap-2'>
                              URL объявления
                            </div>
                          </th>
                          <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                            <div className='flex items-center gap-2'>
                              Цена
                            </div>
                          </th>
                          <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                            <div className='flex items-center gap-2'>
                              Создано
                            </div>
                          </th>
                          <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                            <div className='flex items-center gap-2'>
                              Обновлено
                            </div>
                          </th>
                          <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                            <div className='flex items-center gap-2'>
                              Активно
                            </div>
                          </th>
                          <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                            <div className='flex items-center gap-2'>
                              Автор
                            </div>
                          </th>
                          <th className='h-12 px-4 text-center align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                            <div className='flex items-center justify-center gap-2'>
                              Сравнить
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className='[&_tr:last-child]:border-0'>
                        {flatAdsFromFindAds.length === 0 ? (
                          <tr className='border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted'>
                            <td className='p-4 align-middle [&:has([role=checkbox])]:pr-0' colSpan={7}>
                              <div className='text-sm text-center'>Нет объявлений по этой квартире</div>
                            </td>
                          </tr>
                        ) : (
                          flatAdsFromFindAds.map((findAdsItem) => {
                            // Находим соответствующий объект из ads по URL для кнопок
                            const adsItem = ads.find(ad => ad.url === findAdsItem.url)
                            const loadButton = adsItem && (
                              <button
                                type='button'
                                className={expandedView ? 
                                  'p-1 rounded text-xs hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed' :
                                  'p-2 rounded-md hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                                }
                                title='Загрузить данные объявления'
                                disabled={isParsing}
                                onClick={async () => {
                                  try {
                                    console.log('Начинаем парсинг объявления:', findAdsItem.url)
                                    const result = await parseProperty(findAdsItem.url)
                                    console.log('Результат парсинга:', result)
                                    
                                    if (result.success && result.data) {
                                      console.log('Данные для обновления:', result.data)
                                      
                                      // Используем универсальную функцию для подготовки всех данных
                                      const updateData = prepareUpdateData(result.data)
                                      
                                      // Используем принудительное обновление для гарантии перезаписи всех полей
                                      await forceUpdateAd(adsItem!.id, updateData)
                                      
                                      toast.success('Данные объявления обновлены успешно!')
                                      console.log('Объявление успешно обновлено в БД')
                                    } else {
                                      console.error('API вернул ошибку:', result.message)
                                      toast.error(`Ошибка парсинга: ${result.message}`)
                                    }
                                  } catch (error) {
                                    console.error('Ошибка загрузки данных:', error)
                                    toast.error('Ошибка при загрузке данных объявления')
                                  }
                                }}
                              >
                                {isParsing ? (
                                  <svg 
                                    className='h-4 w-4 animate-spin' 
                                    fill='none' 
                                    viewBox='0 0 24 24' 
                                    stroke='currentColor'
                                  >
                                    <path 
                                      strokeLinecap='round' 
                                      strokeLinejoin='round' 
                                      strokeWidth={2} 
                                      d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' 
                                    />
                                  </svg>
                                ) : (
                                  <svg 
                                    className='h-4 w-4' 
                                    fill='none' 
                                    viewBox='0 0 24 24' 
                                    stroke='currentColor'
                                  >
                                    <path 
                                      strokeLinecap='round' 
                                      strokeLinejoin='round' 
                                      strokeWidth={2} 
                                      d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' 
                                    />
                                  </svg>
                                )}
                              </button>
                            )

                            const deleteButton = adsItem && (
                              <button
                                type='button'
                                className={expandedView ? 
                                  'p-1 rounded text-xs text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors' :
                                  'p-2 rounded-md text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors'
                                }
                                title='Удалить объявление'
                                onClick={async () => {
                                  if (window.confirm('Вы уверены, что хотите удалить это объявление?')) {
                                    try {
                                      await deleteAd(adsItem!.id)
                                      // обновим список после удаления
                                      try {
                                        await refetch()
                                      } catch (err) {
                                        console.warn('Ошибка при refetch после удаления:', err)
                                      }
                                    } catch (error) {
                                      console.error('Ошибка удаления объявления:', error)
                                      toast.error('Ошибка при удалении объявления')
                                    }
                                  }
                                }}
                              >
                                <TrashIcon className='h-4 w-4' />
                              </button>
                            )

                            return (
                              <tr key={findAdsItem.url} className='border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted'>
                                {/* URL */}
                                <td className='p-4 align-middle'>
                                  <div className='text-sm max-w-96 text-ellipsis overflow-hidden'>
                                    <a 
                                      href={findAdsItem.url} 
                                      target='_blank' 
                                      rel='noopener noreferrer'
                                      className='text-blue-600 hover:underline'
                                      title={findAdsItem.url}
                                    >
                                      {findAdsItem.url}
                                    </a>
                                    {/* Индикаторы обновления по источникам */}
                                    <div className='flex items-center gap-1 mt-1'>
                                      {adsItem?.source === 1 && isUpdatingFlatCian && (
                                        <div className='flex items-center text-xs text-blue-600'>
                                          <svg className='w-3 h-3 animate-spin mr-1' fill='none' viewBox='0 0 24 24'>
                                            <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                                            <path className='opacity-75' fill='currentColor' d='m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                                          </svg>
                                          Cian
                                        </div>
                                      )}
                                      {adsItem?.source === 2 && isUpdatingFlatAvito && (
                                        <div className='flex items-center text-xs text-green-600'>
                                          <svg className='w-3 h-3 animate-spin mr-1' fill='none' viewBox='0 0 24 24'>
                                            <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                                            <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                                          </svg>
                                          Avito
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                {/* Цена */}
                                <td className='p-4 align-middle text-sm'>
                                  {findAdsItem.price > 0 ? `${findAdsItem.price.toLocaleString()} ₽` : '-'}
                                </td>
                                {/* Создано */}
                                <td className='p-4 align-middle text-sm'>
                                  {findAdsItem.created ? new Date(findAdsItem.created).toLocaleDateString('ru-RU') : '-'}
                                </td>
                                {/* Обновлено */}
                                <td className='p-4 align-middle text-sm'>
                                  {adsItem?.updatedAt ? new Date(adsItem.updatedAt).toLocaleDateString('ru-RU') : 
                                   (findAdsItem.updated ? new Date(findAdsItem.updated).toLocaleDateString('ru-RU') : '-')}
                                </td>
                                {/* Активно */}
                                <td className='p-4 align-middle text-sm'>
                                  {findAdsItem.is_active ? (
                                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  ) : (
                                    <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800">
                                      Неактивно
                                    </span>
                                  )}
                                </td>
                                {/* Тип лица (person_type) */}
                                <td className='p-4 align-middle text-sm'>
                                  {findAdsItem.person_type || '-'}
                                </td>
                                {/* Кнопка добавления в сравнение */}
                                <td className='p-4 align-middle text-sm text-center'>
                                  {(() => {
                                    // Проверяем есть ли уже объявление с таким URL в сравнении
                                    const isInComparison = ads.some(ad => ad.url === findAdsItem.url && ad.sma === 1)
                                    return (
                                      <button
                                        type='button'
                                        onClick={() => handleAddToComparison(findAdsItem)}
                                        disabled={isInComparison}
                                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                                          isInComparison
                                            ? 'bg-green-100 text-green-600 cursor-not-allowed'
                                            : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                                        }`}
                                        title={isInComparison ? 'Уже в сравнении' : 'Добавить в сравнение'}
                                      >
                                        {isInComparison ? (
                                          <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                                            <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                                          </svg>
                                        ) : (
                                          <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                                            <path fillRule='evenodd' d='M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z' clipRule='evenodd' />
                                          </svg>
                                        )}
                                      </button>
                                    )
                                  })()}
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>


              {/* Блок остальных объявлений */}
              {/* Блок других объявлений (from = 2) */}
              <div className='py-4 px-4 bg-gray-50 rounded-lg mb-4'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-medium'>Объявления по этому дому</h3>
                  <div className='flex items-center gap-2'>
                    <button
                      type='button'
                      className={buttonVariants({
                        variant: 'default',
                        size: 'sm',
                      })}
                      disabled={isUpdatingHouseCian || isUpdatingHouseAvito || isUpdatingHouseYandex}
                      onClick={() => handleUpdateHouseAds()}
                    >
                      {(isUpdatingHouseCian || isUpdatingHouseAvito || isUpdatingHouseYandex) ? (
                        <div className='flex items-center gap-2'>
                          <svg className='w-4 h-4 animate-spin' fill='none' viewBox='0 0 24 24'>
                            <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                            <path className='opacity-75' fill='currentColor' d='m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                          </svg>
                          Обновление...
                        </div>
                      ) : 'Обновить'}
                    </button>
                    <button
                      type='button'
                      className={buttonVariants({
                        variant: 'outline',
                        size: 'sm',
                      })}
                      disabled={isLoadingSimilar}
                      onClick={autoFindBroaderAds}
                    >
                      {isLoadingSimilar ? 'Поиск...' : 'Найти по адресу'}
                    </button>
                  </div>
                </div>

                {/* Таблица других объявлений */}
                <div className='rounded-lg border'>
                  <div className='relative w-full overflow-auto'>
                    <table className='w-full caption-bottom text-sm'>
                      <thead className='[&_tr]:border-b'>
                        <tr className='border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted'>
                          <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                            URL
                          </th>
                          <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                            Цена, млн
                          </th>
                          <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                            Комнат
                          </th>
                          <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                            Этаж
                          </th>
                          <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                            Создано
                          </th>
                          <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                            Обновлено
                          </th>
                          <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                            Автор
                          </th>
                          <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                            Активно
                          </th>
                          <th className='h-12 px-4 text-center align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 w-12'>
                            Сравнить
                          </th>
                        </tr>
                      </thead>
                      <tbody className='[&_tr:last-child]:border-0'>
                        {groupedBroaderAds.length === 0 ? (
                          <tr className='border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted'>
                            <td className='p-4 align-middle [&:has([role=checkbox])]:pr-0' colSpan={9}>
                              <div className='text-sm text-center'>Нет объявлений по этому дому</div>
                            </td>
                          </tr>
                        ) : (
                          groupedBroaderAds.map((findAdsItem) => {
                            // Функция для извлечения названия сайта без .ru
                            const getDomainFromUrl = (url: string) => {
                              try {
                                const urlObj = new URL(url)
                                const hostnameParts = urlObj.hostname.split('.')
                                if (hostnameParts.length >= 2) {
                                  // Возвращаем только название сайта без .ru (cian, avito, yandex)
                                  return hostnameParts[hostnameParts.length - 2]
                                }
                                return urlObj.hostname
                              } catch {
                                return url
                              }
                            }

                            // Функция для форматирования цены в миллионах
                            const formatPriceInMillions = (price: number) => {
                              return (price / 1000000).toFixed(1)
                            }

                            // Функция для форматирования даты
                            const formatDate = (dateStr: string) => {
                              return new Date(dateStr).toLocaleDateString('ru-RU', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })
                            }

                            // Находим соответствующий объект из ads по URL для кнопки удаления
                            const adsItem = ads.find(ad => ad.url === findAdsItem.url)
                            const deleteButton = adsItem && (
                              <button
                                type='button'
                                onClick={() => handleDeleteAd(adsItem.id)}
                                className='p-1 rounded text-red-600 hover:bg-red-50 transition-colors'
                                title='Удалить'
                              >
                                <TrashIcon className='h-4 w-4' />
                              </button>
                            )

                            return (
                              <tr
                                key={findAdsItem.url}
                                className='border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted'
                              >
                                <td className='p-2 align-middle text-sm'>
                                  <a
                                    href={findAdsItem.url}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='text-blue-600 hover:underline'
                                  >
                                    {getDomainFromUrl(findAdsItem.url)}
                                  </a>
                                </td>
                                <td className='p-2 align-middle text-sm'>{formatPriceInMillions(findAdsItem.price)}</td>
                                <td className='p-2 align-middle text-sm'>{findAdsItem.rooms}</td>
                                <td className='p-2 align-middle text-sm'>{findAdsItem.floor || '-'}</td>
                                <td className='p-2 align-middle text-sm'>{findAdsItem.created ? formatDate(findAdsItem.created) : '-'}</td>
                                <td className='p-2 align-middle text-sm'>
                                  {adsItem?.updatedAt ? formatDate(adsItem.updatedAt) : 
                                   (findAdsItem.updated ? formatDate(findAdsItem.updated) : '-')}
                                </td>
                                <td className='p-2 align-middle text-sm'>{findAdsItem.person_type || '-'}</td>
                                <td className='p-2 align-middle text-sm'>
                                  {findAdsItem.is_active ? (
                                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  ) : (
                                    <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800">
                                      Неактивно
                                    </span>
                                  )}
                                </td>
                                <td className='p-2 align-middle text-sm text-center'>
                                  {(() => {
                                    // Проверяем есть ли уже объявление с таким URL в сравнении
                                    const isInComparison = ads.some(ad => ad.url === findAdsItem.url && ad.sma === 1)
                                    return (
                                      <button
                                        type='button'
                                        onClick={() => handleAddToComparison(findAdsItem)}
                                        disabled={isInComparison}
                                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                                          isInComparison
                                            ? 'bg-green-100 text-green-600 cursor-not-allowed'
                                            : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                                        }`}
                                        title={isInComparison ? 'Уже в сравнении' : 'Добавить в сравнение'}
                                      >
                                        {isInComparison ? (
                                          <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                                            <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                                          </svg>
                                        ) : (
                                          <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                                            <path fillRule='evenodd' d='M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z' clipRule='evenodd' />
                                          </svg>
                                        )}
                                      </button>
                                    )
                                  })()}
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Блок близлежащих объявлений в радиусе 500м */}
              <div className='py-4 px-4 bg-gray-50 rounded-lg mb-4'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-medium'>Объявления в радиусе 500м и дешевле</h3>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!flat) return
                      try {
                        await refetchNearbyAds()
                        toast.success('Данные о близлежащих объявлениях обновлены')
                      } catch (error) {
                        console.error('Ошибка при обновлении близлежащих объявлений:', error)
                        toast.error('Ошибка при обновлении данных')
                      }
                    }}
                    disabled={isLoadingNearbyAds}
                    className={buttonVariants({
                      variant: 'outline',
                      size: 'sm',
                    })}
                  >
                    {isLoadingNearbyAds ? 'Поиск...' : 'Искать еще'}
                  </button>
                </div>

                <div className='overflow-hidden rounded-md border border-gray-200'>
                  <div className='relative w-full overflow-auto'>
                    <table className='w-full caption-bottom text-sm'>
                      <thead className='[&_tr]:border-b'>
                        <tr className='border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted'>
                          <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                            Сайт
                          </th>
                          <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                            Цена, млн
                          </th>
                          <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                            Комнат
                          </th>
                          <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                            Этаж
                          </th>
                          <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                            Расстояние, м
                          </th>
                          <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                            Создано
                          </th>
                          <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                            Обновлено
                          </th>
                          <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                            Автор
                          </th>
                          <th className='h-12 px-4 text-center align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 w-12'>
                            Сравнить
                          </th>
                        </tr>
                      </thead>
                      <tbody className='[&_tr:last-child]:border-0'>
                        {nearbyAdsFromFindAds.length === 0 ? (
                          <tr className='border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted'>
                            <td className='p-4 align-middle [&:has([role=checkbox])]:pr-0' colSpan={9}>
                              <div className='text-sm text-center'>Нет близлежащих объявлений</div>
                            </td>
                          </tr>
                        ) : (
                          nearbyAdsFromFindAds.map((findAdsItem, index) => {
                            const formatDate = (dateStr: string | Date) => {
                              if (!dateStr) return '-'
                              const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
                              return date.toLocaleDateString('ru-RU')
                            }

                            const getDomainFromUrl = (url: string) => {
                              if (url.includes('cian.ru')) return 'cian'
                              if (url.includes('avito.ru')) return 'avito'
                              if (url.includes('yandex.ru') || url.includes('realty.ya.ru')) return 'yandex'
                              return 'другое'
                            }

                            return (
                              <tr key={`${findAdsItem.url}-${index}`} className='border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted'>
                                <td className='p-2 align-middle text-sm'>
                                  <a href={findAdsItem.url} target='_blank' rel='noopener noreferrer' className='text-blue-600 hover:underline'>
                                    {getDomainFromUrl(findAdsItem.url)}
                                  </a>
                                </td>
                                <td className='p-2 align-middle text-sm'>{(findAdsItem.price / 1000000).toFixed(2)}</td>
                                <td className='p-2 align-middle text-sm'>{findAdsItem.rooms}</td>
                                <td className='p-2 align-middle text-sm'>{findAdsItem.floor || '-'}</td>
                                <td className='p-2 align-middle text-sm'>{(findAdsItem as any).distance_m || '-'}</td>
                                <td className='p-2 align-middle text-sm'>{findAdsItem.created ? formatDate(findAdsItem.created) : '-'}</td>
                                <td className='p-2 align-middle text-sm'>
                                  {findAdsItem.updated ? formatDate(findAdsItem.updated) : '-'}
                                </td>
                                <td className='p-2 align-middle text-sm'>{findAdsItem.person_type || '-'}</td>
                                <td className='p-2 align-middle text-sm text-center'>
                                  {(() => {
                                    // Проверяем есть ли уже объявление с таким URL в сравнении
                                    const isInComparison = ads.some(ad => ad.url === findAdsItem.url && ad.sma === 1)
                                    return (
                                      <button
                                        type='button'
                                        onClick={() => handleAddToComparison(findAdsItem)}
                                        disabled={isInComparison}
                                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                                          isInComparison
                                            ? 'bg-green-100 text-green-600 cursor-not-allowed'
                                            : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                                        }`}
                                        title={isInComparison ? 'Уже в сравнении' : 'Добавить в сравнение'}
                                      >
                                        {isInComparison ? (
                                          <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                                            <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                                          </svg>
                                        ) : (
                                          <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                                            <path fillRule='evenodd' d='M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z' clipRule='evenodd' />
                                          </svg>
                                        )}
                                      </button>
                                    )
                                  })()}
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Блок сравнения квартир (sma = 1) */}
              <div className='py-4 px-4 bg-gray-50 rounded-lg mb-4'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='flex items-center gap-3'>
                    <h3 className='text-lg font-medium'>Сравнение квартир</h3>
                    <button
                      type='button'
                      className={buttonVariants({
                        variant: expandedView ? 'default' : 'outline',
                        size: 'sm',
                      })}
                      onClick={() => setExpandedView(!expandedView)}
                    >
                      {expandedView ? 'Компактный вид' : 'Расширенный вид'}
                    </button>
                  </div>
                  <div className='flex items-center gap-2'>
                    <button
                      type='button'
                      className={buttonVariants({
                        variant: 'outline',
                        size: 'sm',
                      })}
                      onClick={exportComparisonToExcel}
                      disabled={comparisonAds.length === 0}
                    >
                      <DownloadIcon className='h-4 w-4 mr-2' />
                      Экспорт Excel
                    </button>
                    <button
                      type='button'
                      className={buttonVariants({
                        variant: 'default',
                        size: 'sm',
                      })}
                      disabled={isUpdatingComparisonCian || isUpdatingComparisonAvito || isUpdatingComparisonYandex}
                      onClick={handleUpdateComparisonAds}
                    >
                      {(isUpdatingComparisonCian || isUpdatingComparisonAvito || isUpdatingComparisonYandex) ? (
                        <div className='flex items-center gap-2'>
                          <svg className='w-4 h-4 animate-spin' fill='none' viewBox='0 0 24 24'>
                            <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                            <path className='opacity-75' fill='currentColor' d='m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                          </svg>
                          Обновление...
                        </div>
                      ) : 'Обновить'}
                    </button>
                    <button
                      type='button'
                      className={buttonVariants({
                        variant: 'secondary',
                        size: 'sm',
                      })}
                      onClick={() => {
                        setShowAddAdForm(!showAddAdForm)
                      }}
                    >
                      {showAddAdForm ? 'Скрыть форму' : 'Добавить в сравнение'}
                    </button>
                  </div>
                </div>

                {/* Форма добавления объявления */}
                {showAddAdForm && flat && (
                  <div className='mb-6 p-4 border rounded-lg bg-muted/50'>
                    <h4 className='text-md font-medium mb-4'>Новое объявление</h4>
                    <AddAdForm 
                      flatId={flat.id}
                      flatAddress={flat.address}
                      flatRooms={flat.rooms}
                      onSuccess={() => {
                        setShowAddAdForm(false)
                      }}
                    />
                  </div>
                )}
                
                {/* Таблица объявлений сравнения */}
                <div className='rounded-lg border'>
                  <div className='relative w-full overflow-auto'>
                    <table className='w-full caption-bottom text-sm'>
                      <thead className='[&_tr]:border-b'>
                        <tr className='border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted'>
                          {mounted && expandedView ? (
                            <>
                              <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 w-40'>
                                URL
                              </th>
                              <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                                Цена
                              </th>
                              <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                                Комнаты
                              </th>
                              <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                                Общая пл.
                              </th>
                              <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                                Жилая пл.
                              </th>
                              <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                                Кухня пл.
                              </th>
                              <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                                Этаж
                              </th>
                              <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                                Всего этажей
                              </th>
                              <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                                Санузел
                              </th>
                              <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                                Балкон
                              </th>
                              <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                                Ремонт
                              </th>
                              <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                                Мебель
                              </th>
                              <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                                Год
                              </th>
                              <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                                Тип дома
                              </th>
                              <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                                Высота потолков
                              </th>
                              <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                                Метро
                              </th>
                              <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                                Время до метро
                              </th>
                              <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                                Теги
                              </th>
                              <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                                Описание
                              </th>
                              <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                                Статус
                              </th>
                              <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                                <div className='flex items-center gap-1'>
                                  Просмотры на дату
                                  <AdChangesHistory 
                                    adId={comparisonAds.map(ad => ad.id)}
                                    trigger="hover"
                                    chartType="views"
                                  />
                                </div>
                              </th>
                              <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 w-32'>
                                Действия
                              </th>
                            </>
                          ) : (
                            <>
                              <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 w-96'>
                                <div className='flex items-center gap-2'>
                                  URL объявления
                                </div>
                              </th>
                              <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                                Цена
                              </th>
                              <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                                <div className='flex items-center gap-1'>
                                  Просмотров на дату
                                  <AdChangesHistory 
                                    adId={comparisonAds.map(ad => ad.id)}
                                    trigger="hover"
                                    chartType="views"
                                  />
                                </div>
                              </th>
                              <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                                Статус
                              </th>
                              <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                                Обновлено
                              </th>
                              <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 w-32'>
                                Действия
                              </th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className='[&_tr:last-child]:border-0'>
                        {comparisonAds.map((ad) => {
                          const isUpdating = updatingAdIds.has(ad.id)
                          
                          const refreshButton = (
                            <button
                              type='button'
                              onClick={() => handleRefreshSingleAd(ad)}
                              disabled={isUpdating}
                              className='p-1 rounded text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                              title='Обновить данные объявления'
                            >
                              <RefreshCwIcon className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
                            </button>
                          )

                          const deleteButton = (
                            <button
                              type='button'
                              onClick={() => handleDeleteAd(ad.id)}
                              className='p-1 rounded text-red-600 hover:bg-red-50 transition-colors'
                              title='Удалить объявление'
                            >
                              <TrashIcon className='h-4 w-4' />
                            </button>
                          )

                          return (
                            <tr
                              key={ad.id}
                              className='border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted'
                            >
                              {mounted && expandedView ? (
                                <>
                                  <td className='p-2 align-middle text-sm'>
                                    <div className='max-w-40 text-ellipsis overflow-hidden'>
                                      <a
                                        href={ad.url}
                                        target='_blank'
                                        rel='noopener noreferrer'
                                        className='text-blue-600 hover:underline'
                                      >
                                        {ad.url}
                                      </a>
                                    </div>
                                  </td>
                                  <td className='p-2 align-middle text-sm'>
                                    <div className='flex items-center gap-1'>
                                      <span>{formatPrice(ad.price)}</span>
                                      <AdChangesHistory 
                                        adId={ad.id}
                                        currentPrice={ad.price}
                                        trigger="hover"
                                        chartType="price"
                                      />
                                    </div>
                                  </td>
                                  <td className='p-2 align-middle text-sm'>{ad.rooms}</td>
                                  <td className='p-2 align-middle text-sm'>{formatArea(ad.totalArea)}</td>
                                  <td className='p-2 align-middle text-sm'>{formatArea(ad.livingArea)}</td>
                                  <td className='p-2 align-middle text-sm'>{formatArea(ad.kitchenArea)}</td>
                                  <td className='p-2 align-middle text-sm'>{ad.floor || ''}</td>
                                  <td className='p-2 align-middle text-sm'>{ad.totalFloors || ''}</td>
                                  <td className='p-2 align-middle text-sm'>{ad.bathroom || ''}</td>
                                  <td className='p-2 align-middle text-sm'>{ad.balcony || ''}</td>
                                  <td className='p-2 align-middle text-sm'>{ad.renovation || ''}</td>
                                  <td className='p-2 align-middle text-sm'>{ad.furniture || ''}</td>
                                  <td className='p-2 align-middle text-sm'>{ad.constructionYear || ''}</td>
                                  <td className='p-2 align-middle text-sm'>{ad.houseType || ''}</td>
                                  <td className='p-2 align-middle text-sm'>{ad.ceilingHeight || ''}</td>
                                  <td className='p-2 align-middle text-sm'>{ad.metroStation || ''}</td>
                                  <td className='p-2 align-middle text-sm'>{ad.metroTime || ''}</td>
                                  <td className='p-2 align-middle text-sm'>{ad.tags || ''}</td>
                                  <td className='p-2 align-middle text-sm'>{ad.description || ''}</td>
                                  <td className='p-2 align-middle text-sm'>{ad.status || ''}</td>
                                  <td className='p-2 align-middle text-sm'>
                                    <div className='flex items-center gap-1'>
                                      <span>{ad.viewsToday !== null && ad.viewsToday !== undefined ? ad.viewsToday : '—'}</span>
                                      <AdChangesHistory 
                                        adId={ad.id}
                                        currentViewsToday={ad.viewsToday}
                                        trigger="hover"
                                        chartType="views"
                                      />
                                    </div>
                                  </td>
                                  <td className='p-2 align-middle text-sm'>
                                    <div className='flex gap-2'>
                                      {refreshButton}
                                      {deleteButton}
                                    </div>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className='p-2 align-middle text-sm'>
                                    <div className='max-w-96 text-ellipsis overflow-hidden'>
                                      <a
                                        href={ad.url}
                                        target='_blank'
                                        rel='noopener noreferrer'
                                        className='text-blue-600 hover:underline'
                                      >
                                        {ad.url}
                                      </a>
                                    </div>
                                  </td>
                                  <td className='p-2 align-middle text-sm'>
                                    <div className='flex items-center gap-1'>
                                      <span>{formatPrice(ad.price)}</span>
                                      <AdChangesHistory 
                                        adId={ad.id}
                                        currentPrice={ad.price}
                                        trigger="click"
                                        chartType="price"
                                      />
                                    </div>
                                  </td>
                                  <td className='p-2 align-middle text-sm'>
                                    <div className='flex items-center gap-1'>
                                      <span>{ad.viewsToday !== null && ad.viewsToday !== undefined ? ad.viewsToday : '—'}</span>
                                      <AdChangesHistory 
                                        adId={ad.id}
                                        currentViewsToday={ad.viewsToday}
                                        trigger="click"
                                        chartType="views"
                                      />
                                    </div>
                                  </td>
                                  <td className='p-2 align-middle text-sm'>
                                    <div className='flex items-center justify-center'>
                                      {ad.status ? (
                                        <span className='text-green-600'>✓</span>
                                      ) : (
                                        <span className='text-gray-400'>−</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className='p-2 align-middle text-sm'>
                                    {new Date(ad.updatedAt).toLocaleDateString('ru-RU')}
                                  </td>
                                  <td className='p-2 align-middle text-sm'>
                                    <div className='flex gap-2'>
                                      {refreshButton}
                                      {deleteButton}
                                    </div>
                                  </td>
                                </>
                              )}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div> 
            </Page.Content>
          </Page>
        </form>
        </Form>
      </>
    )
  }
