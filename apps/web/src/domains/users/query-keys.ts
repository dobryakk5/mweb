import type { SearchParams } from '@/types'
import { cleanParams } from '@/utils/search'

export const userKeys = {
  getUser: (id: string) => ['users', 'item', { id }] as const,
  updateUser: (id: string) => ['users', 'update', { id }] as const,
  addUser: () => ['users', 'add'] as const,
  getUsers: (searchParams: SearchParams) =>
    ['users', 'list', cleanParams(searchParams)] as const,
  getUsersCount: (searchParams: SearchParams) =>
    ['users', 'count', cleanParams(searchParams)] as const,
}
