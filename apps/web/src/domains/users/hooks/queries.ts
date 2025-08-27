import { type UseQueryResult, useQuery } from '@tanstack/react-query'

import type { User } from '@acme/db/types'

import type { SearchParams } from '@/types'

import { userKeys } from '../query-keys'
import { fetchUsers, fetchUsersCount, fetchUser } from '../fetchers'

const useUsers = (
  searchParams: SearchParams,
): UseQueryResult<User[] | undefined, Error> => {
  return useQuery({
    queryKey: userKeys.getUsers(searchParams),
    queryFn: () => fetchUsers(searchParams),
  })
}

const useUsersCount = (
  searchParams: SearchParams,
): UseQueryResult<{ total: number } | undefined, Error> => {
  return useQuery({
    queryKey: userKeys.getUsersCount(searchParams),
    queryFn: () => fetchUsersCount(searchParams),
  })
}

const useUser = (id: string): UseQueryResult<User | undefined, Error> => {
  return useQuery({
    queryKey: userKeys.getUser(id),
    queryFn: () => fetchUser(id),
  })
}

export { useUsers, useUsersCount, useUser }
