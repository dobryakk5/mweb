import type { UserFlat } from '@acme/db/types'
import type { SimilarAd } from '@/domains/ads'

// Base block props
export type BaseBlockProps = {
  flat: UserFlat
  isCollapsed: boolean
  onToggleCollapse: () => void
}

// Table column configuration
export type ColumnConfig = {
  key: string
  label: string
  className?: string
  sortable?: boolean
  filterable?: boolean
  filterType?: 'text' | 'number' | 'date' | 'boolean' | 'select'
  filterOptions?: string[] // Для select типа
}

// Update button props
export type UpdateButtonProps = {
  isLoading: boolean
  onClick: () => void
  children: React.ReactNode
  variant?: 'default' | 'outline' | 'secondary'
  size?: 'sm' | 'lg'
  disabled?: boolean
}

// Collapsible block props
export type CollapsibleBlockProps = {
  title: string
  isCollapsed: boolean
  onToggle: () => void
  children: React.ReactNode
  headerActions?: React.ReactNode
  className?: string
}

// Sorting configuration
export type SortConfig = {
  key: string
  direction: 'asc' | 'desc'
} | null

// Filter configuration
export type FilterConfig = {
  [key: string]: any
}

// Ads table props
export type AdsTableProps = {
  ads: any[]
  columns: ColumnConfig[]
  expandedView?: boolean
  onDeleteAd?: (adId: number) => Promise<void>
  onToggleComparison?: (adId: number, inComparison: boolean) => Promise<void>
  onAddToComparison?: (adData: any) => Promise<void>
  onUpdateAd?: (adId: number) => Promise<void>
  updatingAdIds?: Set<number>
  showActions?: boolean
  showComparison?: boolean
  showDelete?: boolean
  isBulkUpdating?: boolean
  updatedTodayAdIds?: Set<number>
}

// Flat ads block specific types
export type FlatAdsBlockProps = BaseBlockProps & {
  ads: any[]
  onUpdate: () => Promise<void>
  isUpdating: boolean
  onToggleComparison: (adId: number, inComparison: boolean) => Promise<void>
  onUpdateAd: (adId: number) => Promise<void>
  updatingAdIds: Set<number>
  onFindSimilar: () => Promise<void>
  isLoadingSimilar: boolean
  onUpdateAllOld: () => Promise<void>
  isUpdatingAllOld: boolean
  updatedTodayAdIds?: Set<number>
}

// House ads block specific types
export type HouseAdsBlockProps = BaseBlockProps & {
  ads: any[]
  onUpdate: () => Promise<void>
  isUpdating: boolean
  onToggleComparison: (adId: number, inComparison: boolean) => Promise<void>
  onAddToComparison: (adData: any) => Promise<void>
  onUpdateAd?: (adId: number) => Promise<void>
  updatingAdIds?: Set<number>
  onFindSimilar: () => Promise<void>
  isLoadingSimilar: boolean
  updatedTodayAdIds?: Set<number>
  onUpdateStatuses: () => Promise<void>
  isUpdatingStatuses: boolean
}

// Nearby ads block specific types
export type NearbyAdsBlockProps = BaseBlockProps & {
  nearbyAds: any[]
  nearbyFilters?: any
  flatAds?: any[] // Добавляем объявления по этой квартире для вычисления базовых значений
  onRefetch: () => Promise<void>
  isLoading: boolean
  onAddToComparison: (adData: any) => Promise<void>
  onToggleComparison: (adId: number, inComparison: boolean) => Promise<void>
  comparisonAds: any[]
  onUpdateAd?: (adId: number) => Promise<void>
  updatingAdIds?: Set<number>
  onSearchWithFilters?: (filters: {
    maxPrice?: number
    minArea?: number
    rooms?: number
    minKitchenArea?: number
    radius?: number
  }) => void
}

// Comparison ads block specific types
export type ComparisonAdsBlockProps = BaseBlockProps & {
  ads: any[]
  expandedView: boolean
  onToggleExpandedView: () => void
  onUpdate: () => Promise<void>
  isUpdating: boolean
  onDeleteAd: (adId: number) => Promise<void>
  onUpdateAd: (adId: number) => Promise<void>
  updatingAdIds: Set<number>
  onExportToExcel: () => void
  onSendToTelegram?: () => void
  isSendingToTelegram?: boolean
  telegramSendSuccess?: boolean
  showAddAdForm: boolean
  onToggleAddAdForm: () => void
}

// Excel export data structure
export type ExcelExportData = {
  URL: string
  'Цена, млн': string
  Комнаты: number
  'Общая площадь': string
  'Жилая площадь': string
  'Площадь кухни': string
  Этаж: string
  'Всего этажей': string
  Санузел: string
  Балкон: string
  Ремонт: string
  Мебель: string
  'Год постройки': string
  'Тип дома': string
  'Высота потолков': string
  Метро: string
  'Время до метро': string
  Теги: string
  Описание: string
  'Просмотры сегодня': string
  Обновлено: string
}

// Source types for ads
export type AdSource = 'cian' | 'avito' | 'yandex'

// Ad update result
export type AdUpdateResult = {
  success: boolean
  adId: number
  source: AdSource
  error?: string
}
