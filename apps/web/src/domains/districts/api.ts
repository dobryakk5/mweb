import api from '@/lib/api'
import type { District, DistrictStatsResponse } from './types'

export async function fetchDistricts(): Promise<District[]> {
  const { data } = await api.get<District[]>('/analytics/districts')

  return data
}

export async function fetchDistrictStats(
  aoId: number,
): Promise<DistrictStatsResponse> {
  const { data } = await api.get<DistrictStatsResponse>(
    '/analytics/district-stats',
    {
      params: { aoId },
    },
  )

  return data
}
