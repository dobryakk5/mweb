'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

export interface AdHistoryItem {
  id: number
  adId: number
  price?: number
  viewsToday?: number
  status?: boolean
  recordedAt: string
  updatedAt?: string
}

export interface PriceChangeItem {
  date: string
  price: number
  is_actual?: number
  description?: string
  ad_id?: number
  url?: string
}

async function fetchAdHistory(adId: number): Promise<AdHistoryItem[]> {
  const response = await api.get(`/ads/${adId}/history`)
  return response.data
}

export function useAdHistory(adId: number) {
  return useQuery({
    queryKey: ['ad-history', adId],
    queryFn: () => fetchAdHistory(adId),
    enabled: !!adId,
  })
}

async function fetchMultipleAdHistory(adIds: number[]): Promise<AdHistoryItem[]> {
  const promises = adIds.map(id => fetchAdHistory(id))
  const results = await Promise.all(promises)
  
  // Объединяем все записи и группируем по дате для агрегации
  const allHistory = results.flat()
  
  // Группируем по дате и суммируем просмотры
  const groupedByDate = allHistory.reduce((acc, item) => {
    const date = item.recordedAt?.split('T')[0] // Берём только дату без времени
    if (!date) return acc
    
    if (!acc[date]) {
      acc[date] = {
        id: 0,
        adId: 0,
        viewsToday: 0,
        recordedAt: item.recordedAt,
        status: true
      }
    }
    if (item.viewsToday !== null && item.viewsToday !== undefined) {
      acc[date].viewsToday = (acc[date].viewsToday || 0) + item.viewsToday
    }
    return acc
  }, {} as Record<string, AdHistoryItem>)
  
  return Object.values(groupedByDate).sort((a, b) => 
    new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  )
}

export function useMultipleAdHistory(adIds: number[]) {
  return useQuery({
    queryKey: ['multiple-ad-history', adIds.sort()],
    queryFn: () => fetchMultipleAdHistory(adIds),
    enabled: adIds.length > 0,
  })
}

// Функции для работы с изменениями цены из public.flats_changes
async function fetchPriceChanges(adId: number): Promise<PriceChangeItem[]> {
  const response = await api.get(`/ads/${adId}/price-changes`)
  return response.data
}

async function fetchMultiplePriceChanges(adIds: number[]): Promise<PriceChangeItem[]> {
  const response = await api.post('/ads/price-changes', { adIds })
  return response.data
}

export function usePriceChanges(adId: number) {
  return useQuery({
    queryKey: ['price-changes', adId],
    queryFn: () => fetchPriceChanges(adId),
    enabled: !!adId,
  })
}

export function useMultiplePriceChanges(adIds: number[]) {
  return useQuery({
    queryKey: ['multiple-price-changes', adIds.sort()],
    queryFn: () => fetchMultiplePriceChanges(adIds),
    enabled: adIds.length > 0,
  })
}