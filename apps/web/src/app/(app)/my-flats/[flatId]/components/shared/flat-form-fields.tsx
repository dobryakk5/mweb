'use client'

import { useForm } from '@acme/ui/hooks/use-form'
import Form from '@acme/ui/components/form'
import Fieldset from '@acme/ui/components/fieldset'
import Input from '@acme/ui/components/input'
import Button from '@acme/ui/components/button'
import { TrashIcon } from '@acme/ui/components/icon'
import type { FormValues } from '../types/flat-form.types'
import type { UserFlat } from '@acme/db/types'

type FlatFormFieldsProps = {
  flat?: UserFlat
  form: ReturnType<typeof useForm<FormValues>>
  onSubmit: (data: FormValues) => Promise<void>
  onDelete: () => Promise<void>
  isLoading?: boolean
}

/**
 * Reusable flat form fields component
 */
export default function FlatFormFields({
  flat,
  form,
  onSubmit,
  onDelete,
  isLoading = false
}: FlatFormFieldsProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className='flex flex-col lg:flex-row lg:items-end gap-6'>
          {/* Заголовок */}
          <div className='lg:w-48 flex-shrink-0'>
            <h3 className='text-lg font-medium text-gray-900'>Информация о квартире</h3>
          </div>

          {/* Поля формы */}
          <div className='flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 items-end'>
            <div className='md:col-span-6'>
              <Form.Field
                control={form.control}
                name='address'
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Адрес</Form.Label>
                    <Form.Control>
                      <Input
                        placeholder='Введите адрес квартиры'
                        {...field}
                      />
                    </Form.Control>
                    <Form.Message />
                  </Form.Item>
                )}
              />
            </div>

            <div className='md:col-span-2'>
              <Form.Field
                control={form.control}
                name='rooms'
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Комнат</Form.Label>
                    <Form.Control>
                      <Input
                        type='number'
                        placeholder='1'
                        min='1'
                        max='10'
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </Form.Control>
                    <Form.Message />
                  </Form.Item>
                )}
              />
            </div>

            <div className='md:col-span-2'>
              <Form.Field
                control={form.control}
                name='floor'
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Этаж</Form.Label>
                    <Form.Control>
                      <Input
                        type='number'
                        placeholder='1'
                        min='1'
                        max='50'
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </Form.Control>
                    <Form.Message />
                  </Form.Item>
                )}
              />
            </div>

            {/* Кнопки */}
            <div className='md:col-span-2 flex items-end gap-2'>
              <Button
                type='submit'
                size='sm'
                disabled={isLoading}
              >
                {isLoading ? 'Сохранение...' : 'Сохранить'}
              </Button>

              {flat && (
                <Button
                  type='button'
                  variant='destructive'
                  size='sm'
                  onClick={onDelete}
                >
                  <TrashIcon className='h-4 w-4' />
                </Button>
              )}
            </div>
          </div>
        </div>
      </form>
    </Form>
  )
}