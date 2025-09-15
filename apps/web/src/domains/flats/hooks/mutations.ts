import {
  useMutation,
  type UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

import type { UserFlat } from '@acme/db/types'
import toast from '@acme/ui/lib/toast'

import api, { type AxiosResponse, type AxiosError } from '@/lib/api'

import { flatKeys } from '../query-keys'

interface CreateFlatData {
  tgUserId: number
  address: string
  rooms: number
  floor: number
}

export const useCreateFlat: () => UseMutationResult<
  AxiosResponse,
  AxiosError,
  CreateFlatData
> = () => {
  const queryClient = useQueryClient()
  const { push } = useRouter()

  return useMutation<AxiosResponse, AxiosError, CreateFlatData>({
    mutationKey: flatKeys.addFlat(),
    mutationFn: (values: CreateFlatData) => api.post('/user-flats', values),
    onError(err) {
      toast.error(
        'Добавление квартиры временно недоступно. Попробуйте позже. 🙁',
      )
    },
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({
        queryKey: flatKeys.getUserFlats(data.tgUserId, {}),
      })

      push(`/my-flats/${data.id}`)

      toast.success('Квартира добавлена успешно!')
    },
  })
}

export const useUpdateFlat: (
  id: number,
) => UseMutationResult<AxiosResponse, AxiosError, Partial<CreateFlatData>> = (id) => {
  const queryClient = useQueryClient()

  return useMutation<AxiosResponse, AxiosError, Partial<CreateFlatData>>({
    mutationKey: flatKeys.updateFlat(id),
    mutationFn: (values: Partial<CreateFlatData>) => api.patch(`/user-flats/${id}`, values),
    onError() {
      toast.error(
        'Обновление квартиры временно недоступно. Попробуйте позже. 🙁',
      )
    },
    onSuccess: async ({ data }) => {
      // Обновляем кеш для списка квартир
      for (const query of queryClient
        .getQueryCache()
        .findAll({ queryKey: flatKeys.getUserFlats(data.tgUserId, {}) })) {
        queryClient.setQueryData<UserFlat[]>(query.queryKey, (flats) =>
          flats?.map((flat) =>
            flat.id === data.id ? { ...flat, ...data } : flat,
          ),
        )
      }

      // Обновляем кеш для конкретной квартиры
      queryClient.setQueryData<UserFlat>(flatKeys.getFlat(id), (flat) =>
        flat ? { ...flat, ...data } : data,
      )

      toast.success('Квартира обновлена успешно! 🎉')
    },
  })
}

export const useDeleteFlat: (
  id: number,
) => UseMutationResult<AxiosResponse, AxiosError, void> = (id) => {
  const queryClient = useQueryClient()
  const { push } = useRouter()

  return useMutation<AxiosResponse, AxiosError, void>({
    mutationKey: flatKeys.deleteFlat(id),
    mutationFn: () => api.delete(`/user-flats/${id}`),
    onError() {
      toast.error(
        'Удаление квартиры временно недоступно. Попробуйте позже. 🙁',
      )
    },
    onSuccess: async () => {
      // Инвалидируем все кеши, связанные с квартирами
      queryClient.invalidateQueries({
        queryKey: flatKeys.all(),
      })

      // Перенаправляем на список квартир
      push('/my-flats')

      toast.success('Квартира и вся связанная статистика удалена успешно!')
    },
  })
}
