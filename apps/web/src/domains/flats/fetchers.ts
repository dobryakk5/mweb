import type { UserFlat } from '@acme/db/types'

import type { SearchParams } from '@/types'
import api from '@/lib/api'

const fetchUserFlats = async (tgUserId: number, params: SearchParams) => {
  return (await api
    .get(`user-flats/user/${tgUserId}`, {
      params,
    })
    .then((res) => res.data)) as Promise<UserFlat[]>
}

const fetchUserFlatsCount = async (tgUserId: number, params: SearchParams) => {
  return (await api
    .get(`user-flats/user/${tgUserId}/count`, {
      params,
    })
    .then((res) => res.data)) as Promise<{
    total: number
  }>
}

const fetchFlat = async (id: number) => {
  return (await api
    .get(`user-flats/${id}`)
    .then((res) => res.data)) as Promise<UserFlat>
}

export { fetchUserFlats, fetchUserFlatsCount, fetchFlat }
