'use client'

import type { HTMLAttributes, JSX } from 'react'
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

import { useCreateFlat } from '@/domains/flats/hooks/mutations'
import HookFormDevtool from '@/components/hookform-devtool'

const formSchema = insertUserFlatSchema.pick({
  address: true,
  rooms: true,
  floor: true,
})

type FormValues = z.infer<typeof formSchema>

type AddFlatFormProps = HTMLAttributes<HTMLFormElement> & {
  className?: string
  isLoading?: boolean
  tgUserId: number
}

export default function AddFlatForm({
  className,
  isLoading,
  tgUserId,
  ...props
}: AddFlatFormProps): JSX.Element {
  const defaultValues = {
    address: '',
    rooms: 1,
    floor: 1,
  }

  const { reset, formState, control, handleSubmit, ...form } =
    useForm<FormValues>({
      mode: 'onChange',
      defaultValues,
      resolver: zodResolver(formSchema),
    })

  const { mutateAsync: createFlat, isPending } = useCreateFlat()

  const cancel = () => reset(defaultValues)

  const onSubmit: SubmitHandler<FormValues> = async (values: FormValues) => {
    try {
      await createFlat({
        ...values,
        tgUserId,
      })
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
                href='/my-flats'
              >
                <ArrowLeftIcon className='size-5' />

                <span className='sr-only'>Вернуться назад</span>
              </Link>

              <Page.Title>Добавить квартиру</Page.Title>

              {formState.isDirty ? (
                <div className='ml-auto flex items-center gap-x-4'>
                  <span className='text-muted-foreground text-xs'>
                    Несохраненная квартира
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
                      <span>Добавить</span>

                      {isPending ? (
                        <Loader2Icon className='size-4 animate-spin' />
                      ) : null}
                    </Button>
                  </div>
                </div>
              ) : null}
            </Page.Header>

            <Page.Content className='divide-y *:py-5 first:*:pt-0 last:*:pb-0'>
              <Fieldset className='xl:grid-cols-9' title='Детали'>
                <Card className='divide-y xl:col-span-6'>
                  <Card.Content>
                    <div className='grid gap-3 xl:grid-cols-2'>
                      <Form.Field
                        control={control}
                        name='address'
                        render={({ field }) => (
                          <Form.Item>
                            <Form.Label>Адрес</Form.Label>

                            <Form.Control>
                              {isLoading ? (
                                <Skeleton className='h-10' />
                              ) : (
                                <Input type='text' {...field} />
                              )}
                            </Form.Control>

                            <Form.Message />
                          </Form.Item>
                        )}
                      />

                      <Form.Field
                        control={control}
                        name='rooms'
                        render={({ field }) => (
                          <Form.Item>
                            <Form.Label>Количество комнат</Form.Label>

                            <Form.Control>
                              {isLoading ? (
                                <Skeleton className='h-10' />
                              ) : (
                                <Input 
                                  type='number' 
                                  min={1}
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                />
                              )}
                            </Form.Control>

                            <Form.Message />
                          </Form.Item>
                        )}
                      />

                      <Form.Field
                        control={control}
                        name='floor'
                        render={({ field }) => (
                          <Form.Item>
                            <Form.Label>Этаж</Form.Label>

                            <Form.Control>
                              {isLoading ? (
                                <Skeleton className='h-10' />
                              ) : (
                                <Input 
                                  type='number' 
                                  min={1}
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                />
                              )}
                            </Form.Control>

                            <Form.Message />
                          </Form.Item>
                        )}
                      />
                    </div>
                  </Card.Content>
                </Card>
              </Fieldset>
            </Page.Content>
          </Page>
        </form>
      </Form>
    </>
  )
}
