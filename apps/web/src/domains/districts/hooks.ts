import { useQuery } from '@tanstack/react-query'

import { fetchDistricts, fetchDistrictStats } from './api'

export const useDistrictsQuery = () => {
  return useQuery({
    queryKey: ['districts'],
    queryFn: fetchDistricts,
    staleTime: 5 * 60 * 1000,
  })
}

export const useDistrictStatsQuery = (aoId?: number) => {
  return useQuery({
    queryKey: ['district-stats', aoId],
    queryFn: () => fetchDistrictStats(aoId as number),
    enabled: typeof aoId === 'number',
    staleTime: 60 * 1000,
  })
}
