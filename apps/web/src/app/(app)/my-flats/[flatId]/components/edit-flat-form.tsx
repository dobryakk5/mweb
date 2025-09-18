'use client'

import { type HTMLAttributes, type JSX, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

import type { UserFlat } from '@acme/db/types'
import { zodResolver } from '@acme/ui/lib/zod'
import { useForm } from '@acme/ui/hooks/use-form'
import Form from '@acme/ui/components/form'
import cn from '@acme/ui/utils/cn'
import Page from '@acme/ui/components/page'
import { ArrowLeftIcon } from '@acme/ui/components/icon'

import { useUpdateFlat } from '@/domains/flats/hooks/mutations'
import {
  useAds,
  useNearbyAdsFromFindAds,
  useBroaderAdsFromFindAds,
} from '@/domains/ads'
import HookFormDevtool from '@/components/hookform-devtool'

// Import our refactored components
import FlatFormFields from './shared/flat-form-fields'
import FlatAdsBlock from './blocks/flat-ads-block'
import HouseAdsBlock from './blocks/house-ads-block'
import NearbyAdsBlock from './blocks/nearby-ads-block'
import ComparisonAdsBlock from './blocks/comparison-ads-block'

// Import hooks and types
import { useCollapseState } from './hooks/use-collapse-state'
import { useFlatAdsState } from './hooks/use-flat-ads-state'
import { useFlatAdsActions } from './hooks/use-flat-ads-actions'
import { useExcelExport } from './hooks/use-excel-export'
import { isUpdatedToday } from './utils/ad-formatters'
import {
  formSchema,
  type FormValues,
  type EditFlatFormProps,
} from './types/flat-form.types'

export default function EditFlatFormRefactored({
  flat,
  className,
  isLoading,
  ...props
}: EditFlatFormProps): JSX.Element {
  const searchParams = useSearchParams()

  // Initialize all hooks
  const { toggleBlock, isCollapsed } = useCollapseState()
  const state = useFlatAdsState()
  const { exportComparison } = useExcelExport(flat)

  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: flat?.address || '',
      rooms: flat?.rooms || 1,
      floor: flat?.floor || 1,
    },
  })

  const { mutateAsync: updateFlat } = useUpdateFlat(flat?.id || 0)

  // Data fetching hooks
  const { data: ads = [], refetch } = useAds({ flatId: flat?.id })
  const { data: broaderAdsFromFindAds = [], refetch: refetchBroaderAds } =
    useBroaderAdsFromFindAds(flat?.id || 0)
  const {
    data: nearbyAdsFromFindAds = [],
    refetch: refetchNearbyAds,
    isLoading: isLoadingNearbyAds,
  } = useNearbyAdsFromFindAds(flat?.id || 0)

  // Actions hook
  const actions = useFlatAdsActions({
    flat,
    refetch,
    refetchNearbyAds,
    startUpdatingAd: state.startUpdatingAd,
    stopUpdatingAd: state.stopUpdatingAd,
    markAdAsUpdatedToday: state.markAdAsUpdatedToday,
  })

  // Set mounted state
  useEffect(() => {
    state.setMounted(true)
  }, [state])

  // Update form when flat data loads
  useEffect(() => {
    if (flat && !isLoading) {
      const currentValues = form.getValues()
      const newValues = {
        address: flat.address || '',
        rooms: flat.rooms || 1,
        floor: flat.floor || 1,
      }

      // Only reset if values actually changed to avoid unnecessary re-renders
      if (
        currentValues.address !== newValues.address ||
        currentValues.rooms !== newValues.rooms ||
        currentValues.floor !== newValues.floor
      ) {
        form.reset(newValues)
      }
    }
  }, [flat, isLoading, form])

  // Initialize ads updated today state when ads data loads
  useEffect(() => {
    if (ads && ads.length > 0) {
      const updatedTodayIds = new Set<number>()
      ads.forEach((ad) => {
        if (isUpdatedToday(ad.updatedAt || ad.updated)) {
          updatedTodayIds.add(ad.id)
        }
      })
      state.setUpdatedTodayAdIds(updatedTodayIds)
    }
  }, [ads, state])

  // Separate ads by type
  const flatAds = ads.filter((ad) => ad.from === 1) // По этой квартире (найдено автоматически)
  const otherAds = ads.filter((ad) => ad.from === 2) // Другие объявления (добавлено вручную)
  const comparisonAds = ads.filter((ad) => ad.sma === 1) // Сравнение квартир (отмеченные для сравнения)

  // Form submission handlers
  const onSubmit = async (data: FormValues) => {
    if (!flat) return

    try {
      await updateFlat(data)
    } catch (error) {
      console.error('Error updating flat:', error)
    }
  }

  const handleExportComparison = () => {
    exportComparison(comparisonAds)
  }

  // Update handlers for different blocks
  const handleUpdateFlatAds = async () => {
    // Implementation would be similar to original
    // Set update states and call update functions
    state.setFlatUpdateStates(true, true, true)
    try {
      // Update logic here
      await refetch()
      // Data will be refreshed automatically through useAds
    } finally {
      state.setFlatUpdateStates(false, false, false)
    }
  }

  const handleUpdateHouseAds = async () => {
    state.setHouseUpdateStates(true, true, true)
    try {
      // Update logic here
      await refetch()
      await refetchBroaderAds() // Refresh broader ads data
    } finally {
      state.setHouseUpdateStates(false, false, false)
    }
  }

  const handleUpdateHouseStatuses = async () => {
    state.setIsUpdatingHouseStatuses(true)
    try {
      await actions.handleUpdateHouseStatuses(
        broaderAdsFromFindAds,
        state.setUpdatingAdIds,
      )
      await refetch()
      await refetchBroaderAds()
    } finally {
      state.setIsUpdatingHouseStatuses(false)
    }
  }

  const handleUpdateComparisonAds = async () => {
    state.setComparisonUpdateStates(true, true, true)
    try {
      await actions.handleUpdateAllComparisonAds(
        comparisonAds,
        state.setUpdatingAdIds,
      )
      await refetch()
    } finally {
      state.setComparisonUpdateStates(false, false, false)
    }
  }

  const handleAutoFindSimilar = async () => {
    await actions.handleAutoFindSimilar(
      flatAds,
      state.setSimilarAds,
      state.setIsLoadingSimilar,
    )
  }

  const handleFindBroaderAds = async () => {
    await actions.handleFindBroaderAds(state.setIsLoadingSimilar)
    await refetchBroaderAds() // Refresh broader ads data after finding new ones
  }

  const handleUpdateAllOldAds = async () => {
    state.setIsUpdatingAllOldAds(true)
    try {
      await actions.handleUpdateAllOldAds(flatAds, state.setUpdatingAdIds)
      await refetch()
    } finally {
      state.setIsUpdatingAllOldAds(false)
    }
  }

  return (
    <>
      <Page className={cn('w-full', className)} {...props}>
        <Page.Header>
          <div className='flex items-center gap-3'>
            <Link href='/my-flats'>
              <ArrowLeftIcon className='h-5 w-5' />
            </Link>
            <Page.Title>
              {flat ? `Редактировать квартиру #${flat.id}` : 'Новая квартира'}
            </Page.Title>
          </div>
        </Page.Header>

        <Page.Content className='divide-y *:py-5 first:*:pt-0 last:*:pb-0'>
          {/* Flat Form Fields */}
          <FlatFormFields
            flat={flat}
            form={form}
            onSubmit={onSubmit}
            onDelete={actions.handleDeleteFlat}
            isLoading={isLoading}
          />

          {/* Flat Ads Block */}
          <FlatAdsBlock
            flat={flat!}
            ads={flatAds}
            isCollapsed={isCollapsed('flatAds')}
            onToggleCollapse={() => toggleBlock('flatAds')}
            onUpdate={handleUpdateFlatAds}
            isUpdating={
              state.updateStates.flatCian ||
              state.updateStates.flatAvito ||
              state.updateStates.flatYandex
            }
            onDeleteAd={actions.handleDeleteAd}
            onToggleComparison={actions.handleToggleComparison}
            onUpdateAd={(adId) =>
              actions.handleUpdateAdFromSource(adId, 'cian')
            }
            updatingAdIds={state.updatingAdIds}
            onFindSimilar={handleAutoFindSimilar}
            isLoadingSimilar={state.isLoadingSimilar}
            onUpdateAllOld={handleUpdateAllOldAds}
            isUpdatingAllOld={state.isUpdatingAllOldAds}
            updatedTodayAdIds={state.updatedTodayAdIds}
          />

          {/* House Ads Block */}
          <HouseAdsBlock
            flat={flat!}
            ads={broaderAdsFromFindAds}
            isCollapsed={isCollapsed('houseAds')}
            onToggleCollapse={() => toggleBlock('houseAds')}
            onUpdate={handleUpdateHouseAds}
            isUpdating={
              state.updateStates.houseCian ||
              state.updateStates.houseAvito ||
              state.updateStates.houseYandex
            }
            onDeleteAd={actions.handleDeleteAd}
            onToggleComparison={actions.handleToggleComparison}
            onUpdateAd={(adId) =>
              actions.handleUpdateAdFromSource(adId, 'house')
            }
            updatingAdIds={state.updatingAdIds}
            onFindSimilar={handleFindBroaderAds}
            isLoadingSimilar={state.isLoadingSimilar}
            updatedTodayAdIds={state.updatedTodayAdIds}
            onUpdateStatuses={handleUpdateHouseStatuses}
            isUpdatingStatuses={state.isUpdatingHouseStatuses}
          />

          {/* Nearby Ads Block */}
          <NearbyAdsBlock
            flat={flat!}
            nearbyAds={nearbyAdsFromFindAds}
            isCollapsed={isCollapsed('nearbyAds')}
            onToggleCollapse={() => toggleBlock('nearbyAds')}
            onRefetch={async () => {
              await refetchNearbyAds()
            }}
            isLoading={isLoadingNearbyAds}
            onAddToComparison={actions.handleAddToComparison}
            onToggleComparison={actions.handleToggleComparison}
            onUpdateAd={(adId) =>
              actions.handleUpdateAdFromSource(adId, 'nearby')
            }
            updatingAdIds={state.updatingAdIds}
            comparisonAds={comparisonAds}
          />

          {/* Comparison Ads Block */}
          <ComparisonAdsBlock
            flat={flat!}
            ads={comparisonAds}
            expandedView={state.expandedView}
            onToggleExpandedView={() =>
              state.setExpandedView(!state.expandedView)
            }
            isCollapsed={isCollapsed('comparison')}
            onToggleCollapse={() => toggleBlock('comparison')}
            onUpdate={handleUpdateComparisonAds}
            isUpdating={
              state.updateStates.comparisonCian ||
              state.updateStates.comparisonAvito ||
              state.updateStates.comparisonYandex
            }
            onDeleteAd={actions.handleDeleteAd}
            onUpdateAd={actions.handleUpdateAdExtended}
            updatingAdIds={state.updatingAdIds}
            onExportToExcel={handleExportComparison}
            showAddAdForm={state.showAddAdForm}
            onToggleAddAdForm={() =>
              state.setShowAddAdForm(!state.showAddAdForm)
            }
          />
        </Page.Content>
      </Page>

      <HookFormDevtool control={form.control} />
    </>
  )
}
