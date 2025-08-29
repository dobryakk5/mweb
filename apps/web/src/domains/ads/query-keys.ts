export const adKeys = {
  all: ['ads'] as const,
  lists: () => [...adKeys.all, 'list'] as const,
  list: (filters: { search?: string; sortBy?: string; page?: number }) => 
    [...adKeys.lists(), filters] as const,
  details: () => [...adKeys.all, 'detail'] as const,
  detail: (id: number) => [...adKeys.details(), id] as const,
  mutations: () => [...adKeys.all, 'mutation'] as const,
  createAd: () => [...adKeys.mutations(), 'create'] as const,
  updateAd: () => [...adKeys.mutations(), 'update'] as const,
  deleteAd: () => [...adKeys.mutations(), 'delete'] as const,
}
