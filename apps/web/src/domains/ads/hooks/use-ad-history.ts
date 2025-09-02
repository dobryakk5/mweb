'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

export interface AdHistoryItem {
  id: number
  adId: number
  price?: number
  viewsToday?: number
  totalViews?: number
  status?: string
  trackingType: string
  createdAt: string
  updatedAt: string
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