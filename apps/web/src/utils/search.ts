import type { SearchParams } from '@/types'

export const cleanParams = (params: SearchParams) => ({
  ...Object.fromEntries(
    Object.entries(params).filter(
      ([_, value]) => value != null && value !== '',
    ),
  ),
})
