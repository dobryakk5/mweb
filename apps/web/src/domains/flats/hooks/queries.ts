import { type UseQueryResult, useQuery } from '@tanstack/react-query'

import type { UserFlat } from '@acme/db/types'

import type { SearchParams } from '@/types'

import { flatKeys } from '../query-keys'
import { fetchUserFlats, fetchUserFlatsCount, fetchFlat } from '../fetchers'

const useUserFlats = (
  tgUserId: number,
  searchParams: SearchParams,
): UseQueryResult<UserFlat[] | undefined, Error> => {
  return useQuery({
    queryKey: flatKeys.getUserFlats(tgUserId, searchParams),
    queryFn: () => fetchUserFlats(tgUserId, searchParams),
  })
}

const useUserFlatsCount = (
  tgUserId: number,
  searchParams: SearchParams,
): UseQueryResult<{ total: number } | undefined, Error> => {
  return useQuery({
    queryKey: flatKeys.getUserFlatsCount(tgUserId, searchParams),
    queryFn: () => fetchUserFlatsCount(tgUserId, searchParams),
  })
}

const useFlat = (id: number): UseQueryResult<UserFlat | undefined, Error> => {
  return useQuery({
    queryKey: flatKeys.getFlat(id),
    queryFn: () => fetchFlat(id),
    retry: (failureCount, error: any) => {
      // Не повторяем запрос если квартира не найдена (404)
      if (error?.response?.status === 404) {
        return false
      }
      return failureCount < 3
    },
  })
}

export { useUserFlats, useUserFlatsCount, useFlat }
