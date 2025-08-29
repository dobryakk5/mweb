import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { parseProperty, parsePropertiesByUrls, parsePropertiesFromText, parseWithRetry } from '../fetchers'

export function useParseProperty() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: parseProperty,
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Данные о недвижимости успешно загружены')
        // Инвалидируем кэш объявлений для обновления данных
        queryClient.invalidateQueries({ queryKey: ['ads'] })
      } else {
        toast.error('Не удалось загрузить данные о недвижимости')
      }
    },
    onError: (error) => {
      console.error('Parse property error:', error)
      toast.error('Ошибка при загрузке данных о недвижимости')
    },
  })
}

export function useParsePropertiesByUrls() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: parsePropertiesByUrls,
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Данные о недвижимости успешно загружены')
        queryClient.invalidateQueries({ queryKey: ['ads'] })
      } else {
        toast.error('Не удалось загрузить данные о недвижимости')
      }
    },
    onError: (error) => {
      console.error('Parse properties error:', error)
      toast.error('Ошибка при загрузке данных о недвижимости')
    },
  })
}

export function useParsePropertiesFromText() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: parsePropertiesFromText,
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Данные о недвижимости успешно загружены')
        queryClient.invalidateQueries({ queryKey: ['ads'] })
      } else {
        toast.error('Не удалось загрузить данные о недвижимости')
      }
    },
    onError: (error) => {
      console.error('Parse text error:', error)
      toast.error('Ошибка при загрузке данных о недвижимости')
    },
  })
}

export function useParseWithRetry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: parseWithRetry,
    onSuccess: (data) => {
      if (data.success) {
        const successCount = data.data.filter((item: any) => item.success).length
        const totalCount = data.data.length
        
        if (successCount === totalCount) {
          toast.success(`Все ${totalCount} объявлений успешно обработаны`)
        } else {
          toast.success(`${successCount} из ${totalCount} объявлений успешно обработаны`)
        }
        
        queryClient.invalidateQueries({ queryKey: ['ads'] })
      } else {
        toast.error('Не удалось загрузить данные о недвижимости')
      }
    },
    onError: (error) => {
      console.error('Parse with retry error:', error)
      toast.error('Ошибка при загрузке данных о недвижимости')
    },
  })
}
