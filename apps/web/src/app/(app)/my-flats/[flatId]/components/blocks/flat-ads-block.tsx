'use client'

import CollapsibleBlock from '../shared/collapsible-block'
import AdsTable from '../shared/ads-table'
import { MultiUpdateButtons, FindSimilarButton } from '../shared/update-buttons'
import type { FlatAdsBlockProps, ColumnConfig } from '../types/ads-blocks.types'

/**
 * Block component for flat-specific ads (from = 1)
 */
export default function FlatAdsBlock({
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
  isLoadingSimilar
}: FlatAdsBlockProps) {
  const columns: ColumnConfig[] = [
    { key: 'url', label: 'URL', className: 'w-40' },
    { key: 'price', label: 'Цена, млн' },
    { key: 'rooms', label: 'Комнат' },
    { key: 'floor', label: 'Этаж' },
    { key: 'area', label: 'Площадь' },
    { key: 'kitchenArea', label: 'Кухня' },
    { key: 'status', label: 'Статус' },
    { key: 'updatedAt', label: 'Обновлено' }
  ]

  const headerActions = (
    <>
      <MultiUpdateButtons
        onUpdate={onUpdate}
        isUpdating={isUpdating}
        label="Обновить все источники"
      />
      <FindSimilarButton
        onFind={onFindSimilar}
        isLoading={isLoadingSimilar}
        label="Автопоиск"
      />
    </>
  )

  return (
    <CollapsibleBlock
      title="Объявления по этой квартире"
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
        updatingAdIds={updatingAdIds}
        showActions={true}
        showComparison={true}
      />
    </CollapsibleBlock>
  )
}