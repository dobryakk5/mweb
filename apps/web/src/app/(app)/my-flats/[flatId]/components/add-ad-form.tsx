'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'

import { insertAdSchema } from '@acme/db/schemas'
import { useCreateAd } from '@/domains/ads'
import { buttonVariants } from '@acme/ui/components/button'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@acme/ui/components/form'
import { Input } from '@acme/ui/components/input'

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

  const form = useForm<FormData>({
    resolver: zodResolver(z.object({
      url: z.string().url(),
    })),
    defaultValues: {
      url: '',
    },
  })

  const onSubmit = async (data: FormData) => {
    try {
      // Отправляем только URL, остальные поля будут заполнены позже
      await createAd.mutateAsync({
        flatId: flatId, // ID квартиры для привязки
        url: data.url,
        address: flatAddress, // Берем из пропсов квартиры
        price: 0, // Пока 0
        rooms: flatRooms, // Берем из пропсов квартиры
      })
      // Остаемся на странице редактирования квартиры
      form.reset()
      // Закрываем форму после успешного создания
      // React Query автоматически обновит данные
      onSuccess?.()
    } catch (error) {
      console.error('Error creating ad:', error)
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
              <Input type='url' placeholder='https://...' {...field} />
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
