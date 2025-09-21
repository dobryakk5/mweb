'use client'

import CollapsibleBlock from '../shared/collapsible-block'
import AdsTable from '../shared/ads-table'
import NearbyMap from '../shared/nearby-map'
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
    {
      key: 'distance',
      label: 'Расстояние, м',
      sortable: true,
      filterable: true,
      filterType: 'number',
    },
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
    {
      key: 'personType',
      label: 'Автор',
      filterable: true,
      filterType: 'select',
      filterOptions: ['собственник', 'агентство', 'неизвестно'],
    },
  ]

  const headerActions = (
    <RefreshNearbyButton onRefresh={onRefetch} isLoading={isLoading} />
  )

  // Карта не использует координаты квартиры - получает координаты по адресу

  return (
    <CollapsibleBlock
      title='Объявления в радиусе 500м и дешевле'
      isCollapsed={isCollapsed}
      onToggle={onToggleCollapse}
      headerActions={headerActions}
    >
      {/* Карта с объектами в радиусе 500м */}
      <NearbyMap
        flatAddress={flat.address}
        flatCoordinates={undefined}
        nearbyAds={nearbyAds}
        currentFlat={flat}
      />

      {/* Таблица объявлений */}
      <AdsTable
        ads={nearbyAds}
        columns={columns}
        onToggleComparison={onToggleComparison}
        onAddToComparison={onAddToComparison}
        onUpdateAd={onUpdateAd}
        updatingAdIds={updatingAdIds || new Set()}
        showActions={true}
        showComparison={true}
        showDelete={false}
      />
    </CollapsibleBlock>
  )
}
