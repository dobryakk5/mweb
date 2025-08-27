import type { User } from '@acme/db/types'

import type { SearchParams } from '@/types'
import api from '@/lib/api'

const fetchUsers = async (params: SearchParams) => {
  return (await api
    .get('users', {
      params,
    })
    .then((res) => res.data)) as Promise<User[]>
}

const fetchUsersCount = async (params: SearchParams) => {
  return (await api
    .get('users/count', {
      params,
    })
    .then((res) => res.data)) as Promise<{
    total: number
  }>
}

const fetchUser = async (id: string) => {
  return (await api.get(`users/${id}`).then((res) => res.data)) as Promise<User>
}

export { fetchUsers, fetchUsersCount, fetchUser }
