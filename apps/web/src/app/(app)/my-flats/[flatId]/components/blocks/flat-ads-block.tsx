'use client'

import CollapsibleBlock from '../shared/collapsible-block'
import AdsTable from '../shared/ads-table'
import { MultiUpdateButtons } from '../shared/update-buttons'
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
      className: 'w-20 sm:w-32 lg:w-40',
      filterable: true,
      filterType: 'text',
    },
    {
      key: 'price',
      label: 'Цена, млн',
      className: 'w-16 sm:w-20',
      sortable: true,
      filterable: true,
      filterType: 'number',
    },
    {
      key: 'rooms',
      label: 'Комнат',
      className: 'w-12 sm:w-16',
      sortable: true,
      filterable: true,
      filterType: 'number',
    },
    {
      key: 'floor',
      label: 'Этаж',
      className: 'w-12 sm:w-16',
      sortable: true,
      filterable: true,
      filterType: 'number',
    },
    {
      key: 'totalArea',
      label: 'Площадь',
      className: 'w-16 sm:w-20',
      sortable: true,
      filterable: true,
      filterType: 'number',
    },
    {
      key: 'kitchenArea',
      label: 'Кухня',
      className: 'w-16 sm:w-20',
      sortable: true,
      filterable: true,
      filterType: 'number',
    },
    {
      key: 'status',
      label: 'Статус',
      className: 'w-16 sm:w-20',
      filterable: true,
      filterType: 'boolean',
    },
    {
      key: 'updatedAt',
      label: 'Обновлено',
      className: 'w-20 sm:w-24',
      sortable: true,
      filterable: true,
      filterType: 'date',
    },
  ]

  const headerActions = (
    <div className='flex gap-2'>
      <MultiUpdateButtons
        onUpdate={onFindSimilar}
        isUpdating={isLoadingSimilar}
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
        showDelete={false}
        isBulkUpdating={isUpdatingAllOld}
        updatedTodayAdIds={updatedTodayAdIds}
      />
    </CollapsibleBlock>
  )
}
