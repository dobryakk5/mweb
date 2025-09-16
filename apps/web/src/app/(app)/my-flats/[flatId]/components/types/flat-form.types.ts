import type { HTMLAttributes } from 'react'
import type { UserFlat } from '@acme/db/types'
import type { z } from '@acme/ui/lib/zod'
import { insertUserFlatSchema } from '@acme/db/schemas'

// Form schema and values
export const formSchema = insertUserFlatSchema.pick({
  address: true,
  rooms: true,
  floor: true,
})

export type FormValues = z.infer<typeof formSchema>

// Component props
export type EditFlatFormProps = HTMLAttributes<HTMLFormElement> & {
  flat?: UserFlat
  className?: string
  isLoading?: boolean
}

// Collapse state
export type CollapseState = {
  flatAds: boolean      // Объявления по этой квартире
  houseAds: boolean     // Объявления по этому дому
  nearbyAds: boolean    // Объявления в радиусе 500м
  comparison: boolean   // Сравнение квартир
}

export type CollapseBlockName = keyof CollapseState

// Update states for different blocks
export type UpdateStates = {
  // Flat ads update states
  flatCian: boolean
  flatAvito: boolean
  flatYandex: boolean

  // House ads update states
  houseCian: boolean
  houseAvito: boolean
  houseYandex: boolean

  // Comparison ads update states
  comparisonCian: boolean
  comparisonAvito: boolean
  comparisonYandex: boolean
}

// Loading states
export type LoadingStates = {
  similar: boolean
  nearbyAds: boolean
  addAdForm: boolean
  expandedView: boolean
  mounted: boolean
}

// Update handlers type
export type UpdateHandler = () => Promise<void>

// Ad action handlers
export type AdActionHandlers = {
  handleToggleComparison: (adId: number, inComparison: boolean) => Promise<void>
  handleDeleteAd: (adId: number) => Promise<void>
  handleUpdateAd: (adId: number) => Promise<void>
}