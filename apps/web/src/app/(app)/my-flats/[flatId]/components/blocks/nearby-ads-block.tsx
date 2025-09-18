'use client'

import CollapsibleBlock from '../shared/collapsible-block'
import AdsTable from '../shared/ads-table'
import { RefreshNearbyButton } from '../shared/update-buttons'
import type {
  NearbyAdsBlockProps,
  ColumnConfig,
} from '../types/ads-blocks.types'

/**
 * Block component for nearby ads within 500m radius
 */
export default function NearbyAdsBlock({
  flat,
  nearbyAds,
  isCollapsed,
  onToggleCollapse,
  onRefetch,
  isLoading,
  onAddToComparison,
  onToggleComparison,
  onUpdateAd,
  updatingAdIds,
  comparisonAds,
}: NearbyAdsBlockProps) {
  const columns: ColumnConfig[] = [
    { key: 'url', label: 'URL', className: 'w-40' },
    { key: 'price', label: 'Цена, млн' },
    { key: 'rooms', label: 'Комнат' },
    { key: 'floor', label: 'Этаж' },
    { key: 'area', label: 'Площадь' },
    { key: 'kitchenArea', label: 'Кухня' },
    { key: 'distance', label: 'Расстояние, м' },
    { key: 'createdAt', label: 'Создано' },
    { key: 'updatedAt', label: 'Обновлено' },
    { key: 'personType', label: 'Автор' },
  ]

  const headerActions = (
    <RefreshNearbyButton onRefresh={onRefetch} isLoading={isLoading} />
  )

  return (
    <CollapsibleBlock
      title='Объявления в радиусе 500м и дешевле'
      isCollapsed={isCollapsed}
      onToggle={onToggleCollapse}
      headerActions={headerActions}
    >
      <AdsTable
        ads={nearbyAds}
        columns={columns}
        onToggleComparison={onToggleComparison}
        onUpdateAd={onUpdateAd}
        updatingAdIds={updatingAdIds || new Set()}
        showActions={true}
        showComparison={true}
      />
    </CollapsibleBlock>
  )
}
