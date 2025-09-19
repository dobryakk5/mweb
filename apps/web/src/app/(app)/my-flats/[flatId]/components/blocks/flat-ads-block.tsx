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
  onToggleComparison,
  onUpdateAd,
  updatingAdIds,
  onFindSimilar,
  isLoadingSimilar,
  onUpdateAllOld,
  isUpdatingAllOld,
  updatedTodayAdIds = new Set(),
}: FlatAdsBlockProps) {
  const columns: ColumnConfig[] = [
    {
      key: 'url',
      label: 'URL',
      className: 'w-40',
      filterable: true,
      filterType: 'text',
    },
    {
      key: 'price',
      label: 'Цена, млн',
      sortable: true,
      filterable: true,
      filterType: 'number',
    },
    {
      key: 'rooms',
      label: 'Комнат',
      sortable: true,
      filterable: true,
      filterType: 'number',
    },
    {
      key: 'floor',
      label: 'Этаж',
      sortable: true,
      filterable: true,
      filterType: 'number',
    },
    {
      key: 'totalArea',
      label: 'Площадь',
      sortable: true,
      filterable: true,
      filterType: 'number',
    },
    {
      key: 'kitchenArea',
      label: 'Кухня',
      sortable: true,
      filterable: true,
      filterType: 'number',
    },
    { key: 'status', label: 'Статус', filterable: true, filterType: 'boolean' },
    {
      key: 'updatedAt',
      label: 'Обновлено',
      sortable: true,
      filterable: true,
      filterType: 'date',
    },
  ]

  const headerActions = (
    <div className='flex gap-2'>
      <FindSimilarButton
        onFind={onFindSimilar}
        isLoading={isLoadingSimilar}
        label='Искать объявления'
      />
      <MultiUpdateButtons
        onUpdate={onUpdateAllOld}
        isUpdating={isUpdatingAllOld}
        label='Обновить статусы'
      />
    </div>
  )

  return (
    <CollapsibleBlock
      title='Объявления по этой квартире'
      isCollapsed={isCollapsed}
      onToggle={onToggleCollapse}
      headerActions={headerActions}
    >
      <AdsTable
        ads={ads || []}
        columns={columns}
        onToggleComparison={onToggleComparison}
        onUpdateAd={onUpdateAd}
        updatingAdIds={updatingAdIds || new Set()}
        showActions={true}
        showComparison={true}
        isBulkUpdating={isUpdatingAllOld}
        updatedTodayAdIds={updatedTodayAdIds}
      />
    </CollapsibleBlock>
  )
}
