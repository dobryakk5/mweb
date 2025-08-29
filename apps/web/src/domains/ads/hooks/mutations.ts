import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { adKeys } from '../query-keys'
import { createAd, updateAd, deleteAd, type CreateAdData } from '../fetchers'

export function useCreateAd() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createAd,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adKeys.lists() })
      toast.success('Объявление создано успешно')
    },
    onError: (error) => {
      console.error('Error creating ad:', error)
      toast.error('Ошибка при создании объявления')
    },
  })
}

export function useUpdateAd() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateAdData> }) =>
      updateAd(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: adKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: adKeys.lists() })
      toast.success('Объявление обновлено успешно')
    },
    onError: (error) => {
      console.error('Error updating ad:', error)
      toast.error('Ошибка при обновлении объявления')
    },
  })
}

export function useDeleteAd() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteAd,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adKeys.lists() })
      toast.success('Объявление удалено успешно')
    },
    onError: (error) => {
      console.error('Error deleting ad:', error)
      toast.error('Ошибка при удалении объявления')
    },
  })
}
