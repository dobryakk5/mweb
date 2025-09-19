'use client'

import { type HTMLAttributes, type JSX, useEffect } from 'react'

// Telegram Web App types
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        sendData: (data: string) => void
        showAlert: (message: string) => void
      }
    }
  }
}
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
    refetchBroaderAds,
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
        if (isUpdatedToday(ad.updatedAt)) {
          updatedTodayIds.add(ad.id)
        }
      })
      state.setUpdatedTodayAdIds(updatedTodayIds)
    }
  }, [ads, state])

  // Separate ads by type - with safety checks
  const flatAds = ads.filter((ad) => ad && ad.id && ad.from === 1) // По этой квартире (найдено автоматически)
  const otherAds = ads.filter((ad) => ad && ad.id && ad.from === 2) // Другие объявления (добавлено вручную)
  const comparisonAds = ads.filter((ad) => ad && ad.id && ad.sma === 1) // Сравнение квартир (отмеченные для сравнения)

  // Log if any ads are filtered out
  const invalidAds = ads.filter((ad) => !ad || !ad.id)
  if (invalidAds.length > 0) {
    console.warn('Found ads with invalid/missing IDs:', invalidAds)
  }

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

  const handleSendToTelegram = async () => {
    try {
      // Get user data from localStorage
      const userData = localStorage.getItem('telegram_user')
      if (!userData) {
        alert('Пользователь не найден. Попробуйте войти заново.')
        return
      }

      const user = JSON.parse(userData)
      if (!user.tgUserId) {
        alert('ID пользователя не найден. Попробуйте войти заново.')
        return
      }

      // Generate Excel data
      const { convertAdsToExcelData } = await import('./utils/excel-export')
      const exportData = convertAdsToExcelData(comparisonAds)

      // Create file name
      const fileName = `сравнение-квартир-${flat?.address || 'квартира'}-${new Date().toLocaleDateString('ru-RU')}.xlsx`

      // Send JSON data to our API
      const response = await fetch('/api/send-to-telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.tgUserId.toString(),
          caption: `📊 Сравнение квартир по адресу: ${flat?.address || 'адрес не указан'}\nКоличество объявлений: ${comparisonAds.length}`,
          filename: fileName,
          excelData: exportData,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        alert('✅ Файл отправлен в Telegram!')
        console.log('Telegram send result:', result)
      } else {
        const errorData = await response.json()
        console.error('API error:', errorData)

        // Fallback: download file
        const XLSX = await import('xlsx')
        const ws = XLSX.utils.json_to_sheet(exportData)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Сравнение квартир')
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
        const blob = new Blob([excelBuffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })

        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        alert(
          `❌ Не удалось отправить в Telegram: ${errorData.error || 'Unknown error'}\n\nФайл скачан на устройство.`,
        )
      }
    } catch (error) {
      console.error('Error sending to Telegram:', error)

      // Fallback: download file
      try {
        const { convertAdsToExcelData } = await import('./utils/excel-export')
        const exportData = convertAdsToExcelData(comparisonAds)

        const XLSX = await import('xlsx')
        const ws = XLSX.utils.json_to_sheet(exportData)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Сравнение квартир')
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
        const blob = new Blob([excelBuffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })

        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } catch (fallbackError) {
        console.error('Fallback download failed:', fallbackError)
      }

      alert(
        '❌ Произошла ошибка при отправке в Telegram. Файл скачан на устройство.',
      )
    }
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
          {flat && (
            <FlatAdsBlock
              flat={flat}
              ads={flatAds}
              isCollapsed={isCollapsed('flatAds')}
              onToggleCollapse={() => toggleBlock('flatAds')}
              onUpdate={handleUpdateFlatAds}
              isUpdating={
                state.updateStates.flatCian ||
                state.updateStates.flatAvito ||
                state.updateStates.flatYandex
              }
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
          )}

          {/* House Ads Block */}
          {flat && (
            <HouseAdsBlock
              flat={flat}
              ads={broaderAdsFromFindAds}
              isCollapsed={isCollapsed('houseAds')}
              onToggleCollapse={() => toggleBlock('houseAds')}
              onUpdate={handleUpdateHouseAds}
              isUpdating={
                state.updateStates.houseCian ||
                state.updateStates.houseAvito ||
                state.updateStates.houseYandex
              }
              onToggleComparison={actions.handleToggleComparison}
              onAddToComparison={actions.handleAddToComparison}
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
          )}

          {/* Nearby Ads Block */}
          {flat && (
            <NearbyAdsBlock
              flat={flat}
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
          )}

          {/* Comparison Ads Block */}
          {flat && (
            <ComparisonAdsBlock
              flat={flat}
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
              onSendToTelegram={handleSendToTelegram}
              showAddAdForm={state.showAddAdForm}
              onToggleAddAdForm={() =>
                state.setShowAddAdForm(!state.showAddAdForm)
              }
            />
          )}
        </Page.Content>
      </Page>

      <HookFormDevtool control={form.control} />
    </>
  )
}
