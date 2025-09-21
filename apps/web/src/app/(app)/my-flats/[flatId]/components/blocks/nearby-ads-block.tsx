'use client'

import CollapsibleBlock from '../shared/collapsible-block'
import NearbyMap from '../shared/nearby-map'
import NearbyAdsFilter from '../shared/nearby-ads-filter'
import { RefreshNearbyButton } from '../shared/update-buttons'
import type { NearbyAdsBlockProps } from '../types/ads-blocks.types'

/**
 * Block component for nearby ads within 500m radius
 */
export default function NearbyAdsBlock({
  flat,
  nearbyAds,
  nearbyFilters,
  flatAds = [],
  isCollapsed,
  onToggleCollapse,
  onRefetch,
  isLoading,
  onAddToComparison,
  onToggleComparison,
  comparisonAds,
  onSearchWithFilters,
}: NearbyAdsBlockProps) {
  const headerActions = (
    <RefreshNearbyButton onRefresh={onRefetch} isLoading={isLoading} />
  )

  // Находим активное объявление CIAN с минимальной ценой для базовых значений площадей
  const getBaseAreaValues = () => {
    const cianActiveAds = flatAds.filter(
      (ad) =>
        ad.url &&
        ad.url.includes('cian.ru') &&
        (ad.status === true || ad.status === 1) &&
        ad.totalArea &&
        ad.kitchenArea,
    )

    if (cianActiveAds.length === 0) {
      return { minArea: undefined, minKitchenArea: undefined }
    }

    // Находим объявление с минимальной ценой среди активных CIAN
    const minPriceAd = cianActiveAds.reduce((min, current) =>
      current.price && (!min.price || current.price < min.price)
        ? current
        : min,
    )

    return {
      minArea: minPriceAd.totalArea
        ? Math.floor(Number(minPriceAd.totalArea) * 0.9)
        : undefined,
      minKitchenArea: minPriceAd.kitchenArea
        ? Math.floor(Number(minPriceAd.kitchenArea) * 0.9)
        : undefined,
    }
  }

  const baseAreaValues = getBaseAreaValues()

  return (
    <CollapsibleBlock
      title='Объявления рядом'
      isCollapsed={isCollapsed}
      onToggle={onToggleCollapse}
      headerActions={headerActions}
    >
      {/* Фильтры поиска - теперь сверху и в одну строку */}
      {nearbyAds && nearbyAds.length > 0 && nearbyFilters && (
        <div className='mb-4'>
          <NearbyAdsFilter
            currentFilters={{
              maxPrice:
                nearbyFilters.maxPrice ||
                nearbyFilters.currentPrice ||
                50000000,
              rooms: nearbyFilters.rooms || flat.rooms || 3,
              minArea: nearbyFilters.minArea || baseAreaValues.minArea,
              minKitchenArea:
                nearbyFilters.minKitchenArea || baseAreaValues.minKitchenArea,
              radius: nearbyFilters.radius || 500,
            }}
            onSearch={(filters) => {
              console.log('New filters:', filters)
              if (onSearchWithFilters) {
                onSearchWithFilters(filters)
              }
            }}
            isLoading={isLoading}
            inline={true}
          />
        </div>
      )}

      {/* Карта с объектами в видимой области */}
      <NearbyMap
        flatAddress={flat.address}
        flatCoordinates={undefined}
        nearbyAds={nearbyAds}
        currentFlat={flat}
        onAddToComparison={onAddToComparison}
        onToggleComparison={onToggleComparison}
        comparisonAds={comparisonAds}
      />
    </CollapsibleBlock>
  )
}
