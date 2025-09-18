import { useState, useCallback } from 'react'
import type { UpdateStates, LoadingStates } from '../types/flat-form.types'
import type { SimilarAd } from '@/domains/ads'

/**
 * Hook for managing all states in the flat ads form
 */
export const useFlatAdsState = () => {
  // Form states
  const [showAddAdForm, setShowAddAdForm] = useState(false)
  const [expandedView, setExpandedView] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Similar ads state
  const [similarAds, setSimilarAds] = useState<SimilarAd[]>([])
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false)

  // Nearby ads loading
  const [isLoadingNearbyAds, setIsLoadingNearbyAds] = useState(false)

  // Update states for flat ads
  const [isUpdatingFlatCian, setIsUpdatingFlatCian] = useState(false)
  const [isUpdatingFlatAvito, setIsUpdatingFlatAvito] = useState(false)
  const [isUpdatingFlatYandex, setIsUpdatingFlatYandex] = useState(false)

  // Update states for house ads
  const [isUpdatingHouseCian, setIsUpdatingHouseCian] = useState(false)
  const [isUpdatingHouseAvito, setIsUpdatingHouseAvito] = useState(false)
  const [isUpdatingHouseYandex, setIsUpdatingHouseYandex] = useState(false)

  // Update states for house ads statuses
  const [isUpdatingHouseStatuses, setIsUpdatingHouseStatuses] = useState(false)

  // Update states for comparison ads
  const [isUpdatingComparisonCian, setIsUpdatingComparisonCian] =
    useState(false)
  const [isUpdatingComparisonAvito, setIsUpdatingComparisonAvito] =
    useState(false)
  const [isUpdatingComparisonYandex, setIsUpdatingComparisonYandex] =
    useState(false)

  // Individual ad update tracking
  const [updatingAdIds, setUpdatingAdIds] = useState(new Set<number>())

  // Track ads updated today (session only)
  const [updatedTodayAdIds, setUpdatedTodayAdIds] = useState(new Set<number>())

  // Bulk update states
  const [isUpdatingAllOldAds, setIsUpdatingAllOldAds] = useState(false)

  // Computed states
  const updateStates: UpdateStates = {
    flatCian: isUpdatingFlatCian,
    flatAvito: isUpdatingFlatAvito,
    flatYandex: isUpdatingFlatYandex,
    houseCian: isUpdatingHouseCian,
    houseAvito: isUpdatingHouseAvito,
    houseYandex: isUpdatingHouseYandex,
    comparisonCian: isUpdatingComparisonCian,
    comparisonAvito: isUpdatingComparisonAvito,
    comparisonYandex: isUpdatingComparisonYandex,
  }

  const loadingStates: LoadingStates = {
    similar: isLoadingSimilar,
    nearbyAds: isLoadingNearbyAds,
    addAdForm: showAddAdForm,
    expandedView,
    mounted,
  }

  // Helper functions for flat ads
  const setFlatUpdateStates = useCallback(
    (cian: boolean, avito: boolean, yandex: boolean) => {
      setIsUpdatingFlatCian(cian)
      setIsUpdatingFlatAvito(avito)
      setIsUpdatingFlatYandex(yandex)
    },
    [],
  )

  // Helper functions for house ads
  const setHouseUpdateStates = useCallback(
    (cian: boolean, avito: boolean, yandex: boolean) => {
      setIsUpdatingHouseCian(cian)
      setIsUpdatingHouseAvito(avito)
      setIsUpdatingHouseYandex(yandex)
    },
    [],
  )

  // Helper functions for comparison ads
  const setComparisonUpdateStates = useCallback(
    (cian: boolean, avito: boolean, yandex: boolean) => {
      setIsUpdatingComparisonCian(cian)
      setIsUpdatingComparisonAvito(avito)
      setIsUpdatingComparisonYandex(yandex)
    },
    [],
  )

  // Individual ad update tracking
  const startUpdatingAd = useCallback((adId: number) => {
    setUpdatingAdIds((prev) => new Set(prev).add(adId))
  }, [])

  const stopUpdatingAd = useCallback((adId: number) => {
    setUpdatingAdIds((prev) => {
      const newSet = new Set(prev)
      newSet.delete(adId)
      return newSet
    })
  }, [])

  // Mark ad as updated today (session only)
  const markAdAsUpdatedToday = useCallback((adId: number) => {
    setUpdatedTodayAdIds((prev) => new Set(prev).add(adId))
  }, [])

  const isUpdatingAd = useCallback(
    (adId: number): boolean => {
      return updatingAdIds.has(adId)
    },
    [updatingAdIds],
  )

  // Check if any updates are in progress
  const isAnyUpdateInProgress = Object.values(updateStates).some(Boolean)

  return {
    // Basic form states
    showAddAdForm,
    setShowAddAdForm,
    expandedView,
    setExpandedView,
    mounted,
    setMounted,

    // Similar ads
    similarAds,
    setSimilarAds,
    isLoadingSimilar,
    setIsLoadingSimilar,

    // Nearby ads
    isLoadingNearbyAds,
    setIsLoadingNearbyAds,

    // Individual update states
    isUpdatingFlatCian,
    setIsUpdatingFlatCian,
    isUpdatingFlatAvito,
    setIsUpdatingFlatAvito,
    isUpdatingFlatYandex,
    setIsUpdatingFlatYandex,

    isUpdatingHouseCian,
    setIsUpdatingHouseCian,
    isUpdatingHouseAvito,
    setIsUpdatingHouseAvito,
    isUpdatingHouseYandex,
    setIsUpdatingHouseYandex,

    isUpdatingHouseStatuses,
    setIsUpdatingHouseStatuses,

    isUpdatingComparisonCian,
    setIsUpdatingComparisonCian,
    isUpdatingComparisonAvito,
    setIsUpdatingComparisonAvito,
    isUpdatingComparisonYandex,
    setIsUpdatingComparisonYandex,

    // Individual ad tracking
    updatingAdIds,
    setUpdatingAdIds,
    startUpdatingAd,
    stopUpdatingAd,
    isUpdatingAd,

    // Updated today tracking
    updatedTodayAdIds,
    setUpdatedTodayAdIds,
    markAdAsUpdatedToday,

    // Bulk update states
    isUpdatingAllOldAds,
    setIsUpdatingAllOldAds,

    // Helper functions
    setFlatUpdateStates,
    setHouseUpdateStates,
    setComparisonUpdateStates,

    // Computed states
    updateStates,
    loadingStates,
    isAnyUpdateInProgress,
  }
}
