'use client'

import CollapsibleBlock from '../shared/collapsible-block'
import AdsTable from '../shared/ads-table'
import { MultiUpdateButtons } from '../shared/update-buttons'
import type {
  HouseAdsBlockProps,
  ColumnConfig,
} from '../types/ads-blocks.types'

/**
 * Block component for house-specific ads (from = 2)
 */
export default function HouseAdsBlock({
  flat,
  ads,
  isCollapsed,
  onToggleCollapse,
  onUpdate,
  isUpdating,
  onDeleteAd,
  onToggleComparison,
  onUpdateAd,
  updatingAdIds,
  onFindSimilar,
  isLoadingSimilar,
}: HouseAdsBlockProps) {
  const columns: ColumnConfig[] = [
    { key: 'url', label: 'URL', className: 'w-40' },
    { key: 'price', label: 'Цена, млн' },
    { key: 'rooms', label: 'Комнат' },
    { key: 'floor', label: 'Этаж' },
    { key: 'area', label: 'Площадь' },
    { key: 'kitchenArea', label: 'Кухня' },
    { key: 'status', label: 'Статус' },
    { key: 'updatedAt', label: 'Обновлено' },
  ]

  const headerActions = (
    <MultiUpdateButtons
      onUpdate={onUpdate}
      isUpdating={isUpdating}
      label='Обновить статусы'
    />
  )

  return (
    <CollapsibleBlock
      title='Объявления по этому дому'
      isCollapsed={isCollapsed}
      onToggle={onToggleCollapse}
      headerActions={headerActions}
    >
      <AdsTable
        ads={ads}
        columns={columns}
        onDeleteAd={onDeleteAd}
        onToggleComparison={onToggleComparison}
        onUpdateAd={onUpdateAd}
        updatingAdIds={updatingAdIds || new Set()}
        showActions={true}
        showComparison={true}
      />
    </CollapsibleBlock>
  )
}
