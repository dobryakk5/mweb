import { useQuery } from '@tanstack/react-query'

import { adKeys } from '../query-keys'
import { fetchAds, fetchAd } from '../fetchers'

export function useAds(filters: { search?: string; sortBy?: string; page?: number; flatId?: number } = {}) {
  return useQuery({
    queryKey: adKeys.list(filters),
    queryFn: () => fetchAds(filters),
  })
}

export function useAd(id: number) {
  return useQuery({
    queryKey: adKeys.detail(id),
    queryFn: () => fetchAd(id),
    enabled: !!id,
  })
}
