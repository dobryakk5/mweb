'use client'

import { type HTMLAttributes, type JSX, useMemo, useEffect, useState } from 'react'
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
import { ArrowLeftIcon, Loader2Icon, TrashIcon } from '@acme/ui/components/icon'
import Fieldset from '@acme/ui/components/fieldset'
import Card from '@acme/ui/components/card'
import Skeleton from '@acme/ui/components/skeleton'
import Input from '@acme/ui/components/input'

import { useUpdateFlat } from '@/domains/flats/hooks/mutations'
import { useAds, useUpdateAd, forceUpdateAd, findSimilarAds, findSimilarAdsByFlat, createAdFromSimilar, type SimilarAd } from '@/domains/ads'
import { useDeleteAd } from '@/domains/ads/hooks/mutations'
import { useParseProperty } from '@/domains/property-parser'
import { toast } from 'sonner'
import HookFormDevtool from '@/components/hookform-devtool'
import AddAdForm from './add-ad-form'

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
  
  // Функция для автоматического поиска похожих объявлений
  const autoFindSimilarAds = async () => {
    if (!flat) return
    
    setIsLoadingSimilar(true)
    try {
      // Если есть объявления, используем поиск по объявлению
      // Иначе используем поиск по параметрам квартиры
      const similar = ads.length > 0 
        ? await findSimilarAds(ads[0].id)
        : await findSimilarAdsByFlat(flat.id)
      
      setSimilarAds(similar)
      
      // Добавляем найденные объявления в таблицу ads
      let addedCount = 0
      for (const similarAd of similar) {
        try {
          await createAdFromSimilar(similarAd, flat.id)
          addedCount++
        } catch (error) {
          console.error('Ошибка при добавлении объявления:', error)
        }
      }
      
      toast.success(`Найдено ${similar.length} похожих объявлений, добавлено ${addedCount} в таблицу`)
      
      // Обновляем список объявлений
      mutateAds()
    } catch (error) {
      console.error('Ошибка автопоиска похожих объявлений:', error)
      toast.error('Ошибка при поиске похожих объявлений')
    } finally {
      setIsLoadingSimilar(false)
    }
  }
  
  // Получаем объявления для этой квартиры
  const { data: ads = [] } = useAds({ flatId: flat?.id })
  const { mutateAsync: deleteAd } = useDeleteAd()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Функция для форматирования значений в таблице
  const formatValue = (value: any, defaultText = '-') => {
    if (value === null || value === undefined || value === '') return defaultText
    if (typeof value === 'number') return value.toString()
    return value.toString()
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
                  
                  {/* Кнопка "Искать похожие" */}
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

              {/* Блок с объявлениями о продаже квартиры */}
              <div className='py-4'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-medium'>Объявления о продаже</h3>
                  <div className='flex items-center gap-2'>
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
                      {showAddAdForm ? 'Скрыть форму' : 'Добавить объявление'}
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
                        // Автоматически ищем похожие объявления после добавления
                        setTimeout(() => {
                          autoFindSimilarAds()
                        }, 1000) // Небольшая задержка для обновления списка объявлений
                      }}
                    />
                  </div>
                )}
                
                {/* Таблица объявлений */}
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
                                Год постр.
                              </th>
                              <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                                Тип дома
                              </th>
                              <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                                Потолки
                              </th>
                              <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                                Метро
                              </th>
                              <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                                Источник
                              </th>
                              <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                                Статус
                              </th>
                              <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                                Просмотры
                              </th>
                              <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                                Загрузить
                              </th>
                              <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                                Удалить
                              </th>
                            </>
                          ) : (
                            <>
                              <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 w-96'>
                                <div className='flex items-center gap-2'>
                                  URL объявления
                                </div>
                              </th>
                              <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 w-32'>
                                <div className='flex items-center gap-2'>
                                  Цена
                                </div>
                              </th>
                              <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 w-24'>
                                <div className='flex items-center gap-2'>
                                  Загрузить
                                </div>
                              </th>
                              <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 w-24'>
                                <div className='flex items-center gap-2'>
                                  Удалить
                                </div>
                              </th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className='[&_tr:last-child]:border-0'>
                        {ads.length === 0 ? (
                          <tr className='border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted'>
                            <td className='p-4 align-middle [&:has([role=checkbox])]:pr-0' colSpan={mounted && expandedView ? 21 : 4}>
                              <div className='text-sm text-center'>Пока нет объявлений</div>
                            </td>
                          </tr>
                        ) : (
                          ads.map((ad) => {
                            const loadButton = (
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
                                    console.log('Начинаем парсинг объявления:', ad.url)
                                    const result = await parseProperty(ad.url)
                                    console.log('Результат парсинга:', result)
                                    
                                    if (result.success && result.data) {
                                      console.log('Данные для обновления:', result.data)
                                      
                                      // Обновляем все данные от API парсинга в базе данных
                                      const updateData = {
                                        // Основные поля (всегда обновляем) - приводим к правильным типам
                                        price: typeof result.data.price === 'number' ? result.data.price : parseInt(result.data.price),
                                        rooms: typeof result.data.rooms === 'number' ? result.data.rooms : parseInt(result.data.rooms),
                                        
                                        // Площади (числа с плавающей точкой)
                                        totalArea: result.data.total_area ? parseFloat(String(result.data.total_area)) : undefined,
                                        livingArea: result.data.living_area ? parseFloat(String(result.data.living_area)) : undefined,
                                        kitchenArea: result.data.kitchen_area ? parseFloat(String(result.data.kitchen_area)) : undefined,
                                        
                                        // Этаж и планировка - приводим к правильным типам
                                        floor: typeof result.data.floor === 'number' ? result.data.floor : (result.data.floor ? parseInt(String(result.data.floor)) : undefined),
                                        totalFloors: typeof result.data.total_floors === 'number' ? result.data.total_floors : (result.data.total_floors ? parseInt(String(result.data.total_floors)) : undefined),
                                        bathroom: result.data.bathroom || undefined,
                                        balcony: result.data.balcony || undefined,
                                        
                                        // Ремонт и отделка
                                        renovation: result.data.renovation || undefined,
                                        furniture: result.data.furniture || undefined,
                                        
                                        // Характеристики здания - приводим к правильным типам
                                        constructionYear: typeof result.data.construction_year === 'number' ? result.data.construction_year : (result.data.construction_year ? parseInt(String(result.data.construction_year)) : undefined),
                                        houseType: result.data.house_type || undefined,
                                        ceilingHeight: result.data.ceiling_height ? parseFloat(String(result.data.ceiling_height)) : undefined,
                                        
                                        // Локация
                                        metroStation: result.data.metro_station || undefined,
                                        metroTime: result.data.metro_time || undefined,
                                        
                                        // Дополнительная информация
                                        tags: result.data.tags || undefined,
                                        description: result.data.description || undefined,
                                        photoUrls: result.data.photo_urls,
                                        
                                        // Источник и статус - приводим к правильным типам
                                        source: result.data.source === 'cian' ? 1 : result.data.source === 'avito' ? 2 : undefined,
                                        status: result.data.status || undefined,
                                        viewsToday: typeof result.data.views_today === 'number' ? result.data.views_today : (result.data.views_today ? parseInt(String(result.data.views_today)) : undefined),
                                        totalViews: typeof result.data.total_views === 'number' ? result.data.total_views : (result.data.total_views ? parseInt(String(result.data.total_views)) : undefined),
                                      }
                                      
                                      // Логируем каждое поле отдельно для отладки
                                      console.log('Детальный разбор данных для БД:')
                                      Object.entries(updateData).forEach(([key, value]) => {
                                        console.log(`  ${key}: ${value} (type: ${typeof value})`)
                                      })
                                      
                                      // Фильтруем undefined значения
                                      const filteredUpdateData = Object.fromEntries(
                                        Object.entries(updateData).filter(([_, value]) => value !== undefined)
                                      )
                                      
                                      console.log('Фильтрованные данные для БД:', filteredUpdateData)
                                      
                                      console.log('Данные для отправки в БД:', updateData)
                                      
                                      console.log('=== ОТЛАДКА ПЕРЕД ОТПРАВКОЙ ===')
                                      console.log('ad.id:', ad.id)
                                      console.log('filteredUpdateData:', JSON.stringify(filteredUpdateData, null, 2))
                                      console.log('=== КОНЕЦ ОТЛАДКИ ===')
                                      
                                      // Используем принудительное обновление для гарантии перезаписи всех полей
                                      await forceUpdateAd(ad.id, filteredUpdateData)
                                      
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

                            const deleteButton = (
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
                                      await deleteAd(ad.id)
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
                              <tr key={ad.id} className='border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted'>
                                {mounted && expandedView ? (
                                  <>
                                    {/* URL - короткая версия */}
                                    <td className='p-2 align-middle text-xs'>
                                      <a 
                                        href={ad.url} 
                                        target='_blank' 
                                        rel='noopener noreferrer'
                                        className='hover:underline text-blue-600'
                                        title={ad.url}
                                      >
                                        {ad.url.length > 20 ? ad.url.substring(0, 20) + '...' : ad.url}
                                      </a>
                                    </td>
                                    {/* Цена */}
                                    <td className='p-2 align-middle text-xs'>
                                      {ad.price > 0 ? `${(ad.price / 1000000).toFixed(1)}М` : '-'}
                                    </td>
                                    {/* Комнаты */}
                                    <td className='p-2 align-middle text-xs'>
                                      {formatValue(ad.rooms)}
                                    </td>
                                    {/* Общая площадь */}
                                    <td className='p-2 align-middle text-xs'>
                                      {formatValue(ad.totalArea)}
                                    </td>
                                    {/* Жилая площадь */}
                                    <td className='p-2 align-middle text-xs'>
                                      {formatValue(ad.livingArea)}
                                    </td>
                                    {/* Площадь кухни */}
                                    <td className='p-2 align-middle text-xs'>
                                      {formatValue(ad.kitchenArea)}
                                    </td>
                                    {/* Этаж */}
                                    <td className='p-2 align-middle text-xs'>
                                      {ad.floor && ad.totalFloors ? `${ad.floor}/${ad.totalFloors}` : formatValue(ad.floor)}
                                    </td>
                                    {/* Санузел */}
                                    <td className='p-2 align-middle text-xs'>
                                      {formatValue(ad.bathroom)}
                                    </td>
                                    {/* Балкон */}
                                    <td className='p-2 align-middle text-xs'>
                                      {formatValue(ad.balcony)}
                                    </td>
                                    {/* Ремонт */}
                                    <td className='p-2 align-middle text-xs'>
                                      {formatValue(ad.renovation)}
                                    </td>
                                    {/* Мебель */}
                                    <td className='p-2 align-middle text-xs'>
                                      {formatValue(ad.furniture)}
                                    </td>
                                    {/* Год постройки */}
                                    <td className='p-2 align-middle text-xs'>
                                      {formatValue(ad.constructionYear)}
                                    </td>
                                    {/* Тип дома */}
                                    <td className='p-2 align-middle text-xs'>
                                      {formatValue(ad.houseType)}
                                    </td>
                                    {/* Высота потолков */}
                                    <td className='p-2 align-middle text-xs'>
                                      {formatValue(ad.ceilingHeight)}
                                    </td>
                                    {/* Метро */}
                                    <td className='p-2 align-middle text-xs'>
                                      {formatValue(ad.metroStation || ad.metroTime)}
                                    </td>
                                    {/* Источник */}
                                    <td className='p-2 align-middle text-xs'>
                                      {ad.source ? getSourceName(ad.source) : '-'}
                                    </td>
                                    {/* Статус */}
                                    <td className='p-2 align-middle text-xs'>
                                      <span className={`px-2 py-1 rounded text-xs ${
                                        ad.status === 'Активно' || ad.status === 'active' ? 'bg-green-100 text-green-800' :
                                        ad.status === 'Неактивно' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {formatValue(ad.status, 'Неизв.')}
                                      </span>
                                    </td>
                                    {/* Просмотры */}
                                    <td className='p-2 align-middle text-xs'>
                                      <div className='flex flex-col'>
                                        <span className='text-xs'>{formatValue(ad.totalViews, '0')}</span>
                                        {ad.viewsToday > 0 && (
                                          <span className='text-xs text-muted-foreground'>+{ad.viewsToday}</span>
                                        )}
                                      </div>
                                    </td>
                                    {/* Кнопка загрузки */}
                                    <td className='p-2 align-middle'>
                                      {loadButton}
                                    </td>
                                    {/* Кнопка удаления */}
                                    <td className='p-2 align-middle'>
                                      {deleteButton}
                                    </td>
                                  </>
                                ) : (
                                  <>
                                    <td className='p-4 align-middle [&:has([role=checkbox])]:pr-0'>
                                      <div className='text-sm'>
                                        <a 
                                          href={ad.url} 
                                          target='_blank' 
                                          rel='noopener noreferrer'
                                          className='cursor-pointer hover:underline'
                                        >
                                          {ad.url}
                                        </a>
                                      </div>
                                    </td>
                                    <td className='p-4 align-middle [&:has([role=checkbox])]:pr-0'>
                                      <div className='text-sm text-muted-foreground'>
                                        {ad.price > 0 ? `${ad.price}` : 'Цена не указана'}
                                      </div>
                                    </td>
                                    <td className='p-4 align-middle [&:has([role=checkbox])]:pr-0'>
                                      {loadButton}
                                    </td>
                                    <td className='p-4 align-middle [&:has([role=checkbox])]:pr-0'>
                                      {deleteButton}
                                    </td>
                                  </>
                                )}
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Таблица похожих объявлений */}
                {similarAds.length > 0 && (
                  <div className='mt-8 pt-6 border-t'>
                    <h4 className='text-lg font-medium mb-4'>Похожие объявления</h4>
                    <div className='overflow-x-auto'>
                      <table className='w-full border-collapse'>
                        <thead>
                          <tr className='border-b'>
                            <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground'>Цена</th>
                            <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground'>Комнаты</th>
                            <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground'>Тип лица</th>
                            <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground'>Создано</th>
                            <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground'>Обновлено</th>
                            <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground'>Ссылка</th>
                            <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground'>Активно</th>
                          </tr>
                        </thead>
                        <tbody>
                          {similarAds.map((similar, index) => (
                            <tr key={index} className='border-b'>
                              <td className='p-2 align-middle text-sm'>
                                {similar.price.toLocaleString()} ₽
                              </td>
                              <td className='p-2 align-middle text-sm'>
                                {similar.rooms}
                              </td>
                              <td className='p-2 align-middle text-sm'>
                                {similar.person_type}
                              </td>
                              <td className='p-2 align-middle text-sm'>
                                {new Date(similar.created).toLocaleDateString()}
                              </td>
                              <td className='p-2 align-middle text-sm'>
                                {new Date(similar.updated).toLocaleDateString()}
                              </td>
                              <td className='p-2 align-middle text-sm'>
                                <a 
                                  href={similar.url} 
                                  target='_blank' 
                                  rel='noopener noreferrer'
                                  className='text-blue-600 hover:underline'
                                >
                                  {(() => {
                                    try {
                                      const domain = new URL(similar.url).hostname
                                      if (domain.includes('cian.ru')) return 'cian'
                                      if (domain.includes('avito.ru')) return 'avito'
                                      if (domain.includes('realty.ya.ru')) return 'yandex'
                                      return domain.replace('www.', '').split('.')[0]
                                    } catch {
                                      return 'ссылка'
                                    }
                                  })()}
                                </a>
                              </td>
                              <td className='p-2 align-middle text-sm text-center'>
                                {similar.is_active ? '✓' : ''}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </Page.Content>
          </Page>
        </form>
      </Form>
    </>
  )
}
