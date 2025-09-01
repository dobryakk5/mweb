'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'

import { insertAdSchema } from '@acme/db/schemas'
import { useCreateAd, forceUpdateAd } from '@/domains/ads'
import { useParseProperty } from '@/domains/property-parser'
import { buttonVariants } from '@acme/ui/components/button'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@acme/ui/components/form'
import { Input } from '@acme/ui/components/input'
import { toast } from 'sonner'

type FormData = {
  url: string
}

interface AddAdFormProps {
  flatId: number
  flatAddress: string
  flatRooms: number
  onSuccess?: () => void
}

export default function AddAdForm({ flatId, flatAddress, flatRooms, onSuccess }: AddAdFormProps) {
  const router = useRouter()
  const createAd = useCreateAd()
  const parseProperty = useParseProperty()

  const form = useForm<FormData>({
    resolver: zodResolver(z.object({
      url: z.string().url(),
    })),
    defaultValues: {
      url: '',
    },
  })

  // Функция для автоматического добавления при вставке URL
  const handleUrlChange = async (value: string) => {
    // Проверяем, что это валидный URL
    try {
      new URL(value)
      // Если URL валидный, автоматически добавляем объявление
      await onSubmit({ url: value })
    } catch {
      // Если не валидный URL, ничего не делаем
    }
  }

  // Универсальная функция для подготовки всех данных с парсинга
  const prepareUpdateData = (parsedData: any) => {
    const updateData: any = {
      status: parsedData.status || 'active',
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
    
    if (parsedData.total_views || parsedData.totalViews) {
      const views = parsedData.total_views || parsedData.totalViews
      updateData.totalViews = typeof views === 'number' ? views : parseInt(String(views))
    }

    // Фильтруем undefined значения
    return Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined && value !== null && value !== '')
    )
  }

  const onSubmit = async (data: FormData) => {
    try {
      // Создаем объявление с минимальными данными
      const createdAd = await createAd.mutateAsync({
        flatId: flatId, // ID квартиры для привязки
        url: data.url,
        address: flatAddress, // Берем из пропсов квартиры
        price: 0, // Пока не знаем цену
        rooms: 1, // Пока ставим 1, но это будет обновлено при парсинге
        sma: 1, // Добавляем в группу сравнения
      })

      // Проверяем, является ли URL сайтом Cian и запускаем автоматический парсинг
      const isCianUrl = data.url.toLowerCase().includes('cian.ru')
      
      if (isCianUrl && createdAd) {
        try {
          console.log(`🔄 Автоматический парсинг Cian объявления: ${data.url}`)
          const parseResult = await parseProperty.mutateAsync(data.url)
          
          if (parseResult.success && parseResult.data) {
            const updateData = prepareUpdateData(parseResult.data)
            
            await forceUpdateAd(createdAd.id, updateData)
            console.log(`✅ Cian объявление ${createdAd.id} автоматически обновлено после добавления`)
            toast.success('Объявление добавлено и данные обновлены с Cian!')
          } else {
            console.log(`⚠️ Не удалось автоматически спарсить Cian объявление: ${data.url}`)
            toast.success('Объявление добавлено (данные можно будет обновить позже)')
          }
        } catch (parseError) {
          console.error('Ошибка автоматического парсинга:', parseError)
          toast.success('Объявление добавлено (данные можно будет обновить позже)')
        }
      } else {
        toast.success('Объявление добавлено в сравнение!')
      }

      // Сбрасываем форму и закрываем её
      form.reset()
      onSuccess?.()
    } catch (error) {
      console.error('Error creating ad:', error)
      toast.error('Ошибка при добавлении объявления')
    }
  }

  return (
    <div className='space-y-4'>
      <FormField
        control={form.control}
        name='url'
        render={({ field }) => (
          <FormItem>
            <FormLabel>URL объявления</FormLabel>
            <FormControl>
              <Input 
                type='url' 
                placeholder='https://...' 
                {...field}
                onPaste={(e) => {
                  // Получаем вставленный текст
                  const pastedText = e.clipboardData.getData('text')
                  // Обновляем поле формы
                  field.onChange(pastedText)
                  // Запускаем автоматическое добавление
                  setTimeout(() => handleUrlChange(pastedText), 100)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    form.handleSubmit(onSubmit)()
                  }
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className='flex gap-2'>
        <button
          type='button'
          onClick={form.handleSubmit(onSubmit)}
          disabled={createAd.isPending}
          className={buttonVariants()}
        >
          {createAd.isPending ? 'Создание...' : 'Добавить объявление'}
        </button>
        
        <button
          type='button'
          onClick={() => form.reset()}
          className={buttonVariants({ variant: 'outline' })}
        >
          Сбросить
        </button>
      </div>
    </div>
  )
}
