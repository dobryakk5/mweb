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
import { ArrowLeftIcon, Loader2Icon } from '@acme/ui/components/icon'
import Fieldset from '@acme/ui/components/fieldset'
import Card from '@acme/ui/components/card'
import Skeleton from '@acme/ui/components/skeleton'
import Input from '@acme/ui/components/input'

import { useUpdateFlat } from '@/domains/flats/hooks/mutations'
import { useAds, useUpdateAd } from '@/domains/ads'
import { useParseProperty } from '@/domains/property-parser'
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
  
  // Получаем объявления для этой квартиры
  const { data: ads = [] } = useAds({ flatId: flat?.id })

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

              <div className='flex items-center gap-6'>
                <Form.Field
                  control={control}
                  name='address'
                  render={({ field }) => (
                    <Form.Item className='space-y-0'>
                      <Form.Label className='sr-only'>Адрес</Form.Label>
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
                <Form.Field
                  control={control}
                  name='rooms'
                  render={({ field }) => (
                    <Form.Item className='space-y-0'>
                      <Form.Label className='sr-only'>Комнат</Form.Label>
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
                    <Form.Item className='space-y-0'>
                      <Form.Label className='sr-only'>Этаж</Form.Label>
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

                {/* Форма добавления объявления */}
                {showAddAdForm && flat && (
                  <div className='mb-6 p-4 border rounded-lg bg-muted/50'>
                    <h4 className='text-md font-medium mb-4'>Новое объявление</h4>
                    <AddAdForm 
                      flatId={flat.id}
                      flatAddress={flat.address}
                      flatRooms={flat.rooms}
                      onSuccess={() => setShowAddAdForm(false)}
                    />
                  </div>
                )}
                
                {/* Таблица объявлений */}
                <div className='rounded-lg border'>
                  <div className='relative w-full overflow-auto'>
                    <table className='w-full caption-bottom text-sm'>
                      <thead className='[&_tr]:border-b'>
                        <tr className='border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted'>
                          <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 w-80'>
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
                              Загрузить
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className='[&_tr:last-child]:border-0'>
                        {ads.length === 0 ? (
                          <tr className='border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted'>
                            <td className='p-4 align-middle [&:has([role=checkbox])]:pr-0'>
                              <div className='text-sm'>Пока нет объявлений</div>
                            </td>
                            <td className='p-4 align-middle [&:has([role=checkbox])]:pr-0'>
                              <div className='text-sm text-muted-foreground'>-</div>
                            </td>
                            <td className='p-4 align-middle [&:has([role=checkbox])]:pr-0'>
                              <div className='text-sm text-muted-foreground'>-</div>
                            </td>
                          </tr>
                        ) : (
                          ads.map((ad) => (
                            <tr key={ad.id} className='border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted'>
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
                                  {ad.price > 0 ? `Цена: ${ad.price} ₽` : 'Цена не указана'}
                                </div>
                              </td>
                              <td className='p-4 align-middle [&:has([role=checkbox])]:pr-0'>
                                <button
                                  type='button'
                                  className='p-2 rounded-md hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                                  title='Загрузить данные объявления'
                                  disabled={isParsing}
                                  onClick={async () => {
                                    try {
                                      const result = await parseProperty(ad.url)
                                      if (result.success && result.data.price) {
                                        // Обновляем цену в базе данных
                                        await updateAd({
                                          id: ad.id,
                                          data: { price: result.data.price }
                                        })
                                      }
                                    } catch (error) {
                                      console.error('Ошибка загрузки данных:', error)
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
                              </td>
                            </tr>
                          ))
                        )}
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
