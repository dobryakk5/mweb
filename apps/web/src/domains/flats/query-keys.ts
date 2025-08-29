import type { SearchParams } from '@/types'

export const flatKeys = {
  all: ['flats'] as const,
  lists: () => [...flatKeys.all, 'list'] as const,
  list: (tgUserId: number, filters: SearchParams) =>
    [...flatKeys.lists(), tgUserId, filters] as const,
  details: () => [...flatKeys.all, 'detail'] as const,
  detail: (id: number) => [...flatKeys.details(), id] as const,
  getUserFlats: (tgUserId: number, filters: SearchParams) =>
    [...flatKeys.lists(), tgUserId, filters] as const,
  getUserFlatsCount: (tgUserId: number, filters: SearchParams) =>
    [...flatKeys.lists(), tgUserId, 'count', filters] as const,
  getFlat: (id: number) => [...flatKeys.details(), id] as const,
  addFlat: () => [...flatKeys.all, 'add'] as const,
  updateFlat: (id: number) => [...flatKeys.all, 'update', { id }] as const,
}
