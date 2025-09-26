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
  isLoading = false,
  onToggleComparison,
  onAddToComparison,
  onUpdateAd,
  updatingAdIds,
  onFindSimilar,
  isLoadingSimilar,
  updatedTodayAdIds = new Set(),
  onUpdateStatuses,
  isUpdatingStatuses,
}: HouseAdsBlockProps) {
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
      key: 'area',
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
      key: 'createdAt',
      label: 'Создано',
      sortable: true,
      filterable: true,
      filterType: 'date',
    },
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
      <MultiUpdateButtons
        onUpdate={onUpdate}
        isUpdating={isUpdating}
        label='Искать объявления'
      />
      <MultiUpdateButtons
        onUpdate={onUpdateStatuses}
        isUpdating={isUpdatingStatuses}
        label='Обновить статусы'
      />
    </div>
  )

  const loadingContent = (
    <div className='flex justify-center items-center py-8'>
      <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
      <span className='ml-2 text-sm text-gray-600'>
        Загружаем объявления по дому...
      </span>
    </div>
  )

  return (
    <CollapsibleBlock
      title='Объявления по этому дому'
      isCollapsed={isCollapsed}
      onToggle={onToggleCollapse}
      headerActions={headerActions}
    >
      {isLoading ? (
        loadingContent
      ) : (
        <AdsTable
          ads={ads}
          columns={columns}
          onToggleComparison={onToggleComparison}
          onAddToComparison={onAddToComparison}
          onUpdateAd={onUpdateAd}
          updatingAdIds={updatingAdIds || new Set()}
          showActions={true}
          showComparison={true}
          showDelete={false}
          isBulkUpdating={isUpdatingStatuses}
          updatedTodayAdIds={updatedTodayAdIds}
        />
      )}
    </CollapsibleBlock>
  )
}
