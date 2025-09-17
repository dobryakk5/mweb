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
import { useAds, useNearbyAdsFromFindAds, useFlatAdsFromFindAds } from '@/domains/ads'
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
import { formSchema, type FormValues, type EditFlatFormProps } from './types/flat-form.types'

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
  const { data: flatAdsFromFindAds = [], refetch: refetchFlatAds } = useFlatAdsFromFindAds(flat?.id || 0)
  const { data: nearbyAdsFromFindAds = [], refetch: refetchNearbyAds, isLoading: isLoadingNearbyAds } = useNearbyAdsFromFindAds(flat?.id || 0)

  // Actions hook
  const actions = useFlatAdsActions({ flat, refetch, refetchNearbyAds })

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

  // Separate ads by type
  const flatAds = ads.filter(ad => ad.from === 1) // По этой квартире (найдено автоматически)
  const otherAds = ads.filter(ad => ad.from === 2) // Другие объявления (добавлено вручную)
  const comparisonAds = ads.filter(ad => ad.sma === 1) // Сравнение квартир (отмеченные для сравнения)

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
      await refetchFlatAds() // Refresh find_ads data
    } finally {
      state.setFlatUpdateStates(false, false, false)
    }
  }

  const handleUpdateHouseAds = async () => {
    state.setHouseUpdateStates(true, true, true)
    try {
      // Update logic here
      await refetch()
    } finally {
      state.setHouseUpdateStates(false, false, false)
    }
  }

  const handleUpdateComparisonAds = async () => {
    state.setComparisonUpdateStates(true, true, true)
    try {
      // Update logic here
      await refetch()
    } finally {
      state.setComparisonUpdateStates(false, false, false)
    }
  }

  const handleAutoFindSimilar = async () => {
    await actions.handleAutoFindSimilar(
      flatAdsFromFindAds,
      state.setSimilarAds,
      state.setIsLoadingSimilar
    )
  }

  const handleFindBroaderAds = async () => {
    await actions.handleFindBroaderAds(state.setIsLoadingSimilar)
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
            ads={flatAdsFromFindAds}
            isCollapsed={isCollapsed('flatAds')}
            onToggleCollapse={() => toggleBlock('flatAds')}
            onUpdate={handleUpdateFlatAds}
            isUpdating={state.updateStates.flatCian || state.updateStates.flatAvito || state.updateStates.flatYandex}
            onDeleteAd={actions.handleDeleteAd}
            onToggleComparison={actions.handleToggleComparison}
            onUpdateAd={(adId) => actions.handleUpdateAdFromSource(adId, 'cian')}
            updatingAdIds={state.updatingAdIds}
            onFindSimilar={handleAutoFindSimilar}
            isLoadingSimilar={state.isLoadingSimilar}
          />

          {/* House Ads Block */}
          <HouseAdsBlock
            flat={flat!}
            ads={otherAds}
            isCollapsed={isCollapsed('houseAds')}
            onToggleCollapse={() => toggleBlock('houseAds')}
            onUpdate={handleUpdateHouseAds}
            isUpdating={state.updateStates.houseCian || state.updateStates.houseAvito || state.updateStates.houseYandex}
            onDeleteAd={actions.handleDeleteAd}
            onToggleComparison={actions.handleToggleComparison}
            onFindSimilar={handleFindBroaderAds}
            isLoadingSimilar={state.isLoadingSimilar}
          />

          {/* Nearby Ads Block */}
          <NearbyAdsBlock
            flat={flat!}
            nearbyAds={nearbyAdsFromFindAds}
            isCollapsed={isCollapsed('nearbyAds')}
            onToggleCollapse={() => toggleBlock('nearbyAds')}
            onRefetch={async () => { await refetchNearbyAds() }}
            isLoading={isLoadingNearbyAds}
            onAddToComparison={actions.handleAddToComparison}
            comparisonAds={comparisonAds}
          />

          {/* Comparison Ads Block */}
          <ComparisonAdsBlock
            flat={flat!}
            ads={comparisonAds}
            expandedView={state.expandedView}
            onToggleExpandedView={() => state.setExpandedView(!state.expandedView)}
            isCollapsed={isCollapsed('comparison')}
            onToggleCollapse={() => toggleBlock('comparison')}
            onUpdate={handleUpdateComparisonAds}
            isUpdating={state.updateStates.comparisonCian || state.updateStates.comparisonAvito || state.updateStates.comparisonYandex}
            onDeleteAd={actions.handleDeleteAd}
            onExportToExcel={handleExportComparison}
            showAddAdForm={state.showAddAdForm}
            onToggleAddAdForm={() => state.setShowAddAdForm(!state.showAddAdForm)}
          />
        </Page.Content>
      </Page>

      <HookFormDevtool control={form.control} />
    </>
  )
}