import React, { useCallback } from 'react'
import { toast } from 'sonner'
import type { UserFlat } from '@acme/db/types'
import {
  forceUpdateAd,
  findSimilarAds,
  findSimilarAdsByFlat,
  findBroaderAdsByAddress,
  createAd,
  createAdFromSimilar,
  createAdFromSimilarWithFrom,
  toggleAdComparison,
  updateAdStatusSingle,
  updateAdStatusExtended,
  type SimilarAd,
} from '@/domains/ads'
import { isStatusOld, isUpdatedToday } from '../utils/ad-formatters'
import { useDeleteAd } from '@/domains/ads/hooks/mutations'
import { useDeleteFlat } from '@/domains/flats/hooks/mutations'

type AdActionHookProps = {
  flat?: UserFlat
  refetch: () => Promise<any>
  refetchNearbyAds?: () => Promise<any>
  refetchBroaderAds?: () => Promise<any>
  startUpdatingAd?: (adId: number) => void
  stopUpdatingAd?: (adId: number) => void
  markAdAsUpdatedToday?: (adId: number) => void
}

/**
 * Hook for ad-related actions
 */
export const useFlatAdsActions = ({
  flat,
  refetch,
  refetchNearbyAds,
  refetchBroaderAds,
  startUpdatingAd,
  stopUpdatingAd,
  markAdAsUpdatedToday,
}: AdActionHookProps) => {
  const { mutateAsync: deleteAd } = useDeleteAd()
  const { mutateAsync: deleteFlat } = useDeleteFlat(flat?.id || 0)

  // Toggle comparison status for an ad
  const handleToggleComparison = useCallback(
    async (adId: number, inComparison: boolean) => {
      console.log('handleToggleComparison called with:', {
        adId,
        inComparison,
        typeof_adId: typeof adId,
      })

      // Валидация adId
      if (
        !adId ||
        adId === undefined ||
        adId === null ||
        typeof adId !== 'number'
      ) {
        console.error('Invalid adId in handleToggleComparison:', adId)
        toast.error('Ошибка: неверный ID объявления')
        return
      }

      try {
        await toggleAdComparison(adId, inComparison)
        await refetch()
        toast.success(
          inComparison
            ? 'Объявление добавлено в сравнение'
            : 'Объявление убрано из сравнения',
        )
      } catch (error) {
        console.error('Ошибка при изменении статуса сравнения:', error)
        console.error('Error details:', { adId, inComparison, error })
        toast.error('Ошибка при изменении статуса сравнения')
      }
    },
    [refetch],
  )

  // Delete an ad
  const handleDeleteAd = useCallback(
    async (adId: number) => {
      if (window.confirm('Вы уверены, что хотите удалить это объявление?')) {
        try {
          await deleteAd(adId)
          await refetch()
          toast.success('Объявление удалено')
        } catch (error) {
          console.error('Ошибка удаления объявления:', error)
          toast.error('Ошибка при удалении объявления')
        }
      }
    },
    [deleteAd, refetch],
  )

  // Delete the flat
  const handleDeleteFlat = useCallback(async () => {
    if (!flat) {
      toast.error('Квартира не найдена')
      return
    }

    if (
      window.confirm(
        'Вы уверены, что хотите удалить эту квартиру? Вся статистика по объявлениям будет удалена безвозвратно.',
      )
    ) {
      try {
        console.log('Starting flat deletion...')
        await deleteFlat()
        console.log('Flat deletion completed successfully')
      } catch (error) {
        console.error('Ошибка удаления квартиры:', error)
        toast.error('Ошибка при удалении квартиры')
      }
    }
  }, [deleteFlat, flat])

  // Add an ad to comparison from nearby ads or other sources
  const handleAddToComparison = useCallback(
    async (adData: any) => {
      if (!flat) {
        toast.error('Квартира не найдена')
        return
      }

      try {
        // Create ad object for adding to database
        const adToAdd = {
          flatId: flat.id,
          url: adData.url,
          address: flat.address, // использем адрес квартиры
          price: adData.price
            ? parseFloat(adData.price.toString().replace(/[^\d.]/g, ''))
            : 0,
          rooms: adData.rooms || flat.rooms, // используем количество комнат из данных или из квартиры
          from: 2, // добавлено вручную
          sma: 1, // добавляем в сравнение
        }

        // Add ad through API
        await createAd(adToAdd)

        // Refresh ad list to reflect changes
        await refetch()

        toast.success('Объявление добавлено в сравнение')
      } catch (error) {
        console.error('Ошибка добавления в сравнение:', error)
        toast.error('Ошибка при добавлении в сравнение')
      }
    },
    [flat, refetch],
  )

  // Update single ad from specific source
  const handleUpdateAdFromSource = useCallback(
    async (adId: number, source: string) => {
      if (startUpdatingAd) startUpdatingAd(adId)

      try {
        // For nearby sources, we still need to use flats_history update
        if (source === 'nearby') {
          throw new Error(
            'Индивидуальное обновление соседних объявлений временно недоступно.',
          )
        } else {
          // For all other sources (including 'house' now), use users.ads method
          await updateAdStatusSingle(adId)
        }

        await refetch()

        // Also refresh specific data sources based on the source
        if (source === 'house' && refetchBroaderAds) {
          await refetchBroaderAds()
        } else if (source === 'nearby' && refetchNearbyAds) {
          await refetchNearbyAds()
        }

        if (markAdAsUpdatedToday) markAdAsUpdatedToday(adId)
        toast.success('Объявление обновлено')
      } catch (error) {
        console.error(`Ошибка обновления объявления из ${source}:`, error)
        toast.error(`Ошибка при обновлении из ${source}`)
      } finally {
        if (stopUpdatingAd) stopUpdatingAd(adId)
      }
    },
    [
      refetch,
      refetchBroaderAds,
      refetchNearbyAds,
      startUpdatingAd,
      stopUpdatingAd,
      markAdAsUpdatedToday,
    ],
  )

  // Find and add similar ads automatically
  const handleAutoFindSimilar = useCallback(
    async (
      ads: any[],
      setSimilarAds: (ads: SimilarAd[]) => void,
      setIsLoading: (loading: boolean) => void,
    ) => {
      if (!flat) {
        toast.error('Квартира не найдена')
        return
      }

      setIsLoading(true)
      try {
        const similar = await findSimilarAdsByFlat(flat.id)
        setSimilarAds(similar)

        // Filter out already existing ads
        const existingUrls = new Set(ads.map((ad) => ad.url))
        const newAds = similar.filter((ad) => !existingUrls.has(ad.url))

        if (newAds.length === 0) {
          toast.info('Новых похожих объявлений не найдено')
          return
        }

        // Add new ads to database
        let addedCount = 0
        let skippedCount = 0

        for (const similarAd of newAds) {
          try {
            await createAdFromSimilar(similarAd, flat.id, flat.address) // Pass flat address
            addedCount++
          } catch (error) {
            console.error('Ошибка добавления похожего объявления:', error)
            skippedCount++
          }
        }

        const message =
          skippedCount > 0
            ? `Найдено ${similar.length} похожих объявлений, добавлено ${addedCount}, пропущено ${skippedCount} дубликатов`
            : `Найдено ${similar.length} похожих объявлений, добавлено ${addedCount} в таблицу`

        toast.success(message)

        // Refresh ads list
        await refetch()
      } catch (error) {
        console.error('Ошибка автопоиска похожих объявлений:', error)
        toast.error('Ошибка при поиске похожих объявлений')
      } finally {
        setIsLoading(false)
      }
    },
    [flat, refetch],
  )

  // Find broader ads by address
  const handleFindBroaderAds = useCallback(
    async (setIsLoading: (loading: boolean) => void) => {
      if (!flat) {
        toast.error('Квартира не найдена')
        return
      }

      setIsLoading(true)
      try {
        // Используем новый эндпоинт для сохранения объявлений по дому
        const response = await fetch(`/api/ads/save-house-ads/${flat.id}`, {
          method: 'POST',
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()

        if (result.savedCount > 0) {
          toast.success(
            `Найдено ${result.totalFound} объявлений, сохранено ${result.savedCount} новых`,
          )
        } else if (result.totalFound > 0) {
          toast.info(
            `Найдено ${result.totalFound} объявлений, все уже существуют`,
          )
        } else {
          toast.info('Объявления по адресу не найдены')
        }

        await refetch()
      } catch (error) {
        console.error('Ошибка поиска объявлений по адресу:', error)
        toast.error('Ошибка при поиске объявлений по адресу')
      } finally {
        setIsLoading(false)
      }
    },
    [flat, refetch],
  )

  // Update all ads with old status (prioritize Cian)
  const handleUpdateAllOldAds = useCallback(
    async (
      ads: any[],
      setUpdatingIds: React.Dispatch<React.SetStateAction<Set<number>>>,
    ) => {
      // Safety check: ensure ads is a valid array
      if (!ads || !Array.isArray(ads)) {
        console.warn('handleUpdateAllOldAds: ads is not a valid array', ads)
        return
      }

      console.log(
        'handleUpdateAllOldAds: Starting with ads:',
        ads.map((ad) => ({
          id: ad?.id,
          typeof_id: typeof ad?.id,
          from: ad?.from,
          updatedAt: ad?.updatedAt,
          url: ad?.url?.substring(0, 50) + '...',
        })),
      )

      // Filter ads that haven't been updated today - add safety checks
      const adsToUpdate = ads.filter((ad) => {
        // Safety check: ensure ad has required properties
        if (!ad || !ad.id) {
          console.warn('Filtering out ad with missing/invalid id:', {
            ad,
            id: ad?.id,
            typeof_id: typeof ad?.id,
          })
          return false
        }

        const lastUpdate = ad.updatedAt || ad.updated || ad.time_source_updated
        const isToday = isUpdatedToday(lastUpdate)
        console.log('Ad update check:', {
          id: ad.id,
          updatedAt: ad.updatedAt,
          updated: ad.updated,
          time_source_updated: ad.time_source_updated,
          finalUpdate: lastUpdate,
          isUpdatedToday: isToday,
          willUpdate: !isToday,
        })
        return !isToday
      })

      if (adsToUpdate.length === 0) {
        toast.info('Все объявления уже обновлены сегодня')
        return
      }

      // Sort ads by priority: Cian first, then others
      const sortedAds = adsToUpdate.sort((a, b) => {
        const aIsCian = a.url?.includes('cian.ru') || a.source === 4 || false
        const bIsCian = b.url?.includes('cian.ru') || b.source === 4 || false
        if (aIsCian && !bIsCian) return -1
        if (!aIsCian && bIsCian) return 1

        // Secondary priority: Yandex (including ya.ru and realty.ya.ru)
        const aIsYandex =
          a.url?.includes('yandex.ru') ||
          a.url?.includes('ya.ru') ||
          a.url?.includes('realty.ya.ru') ||
          a.source === 3 ||
          false
        const bIsYandex =
          b.url?.includes('yandex.ru') ||
          b.url?.includes('ya.ru') ||
          b.url?.includes('realty.ya.ru') ||
          b.source === 3 ||
          false
        if (aIsYandex && !bIsYandex) return -1
        if (!aIsYandex && bIsYandex) return 1

        return 0
      })

      const updatingIds = new Set(sortedAds.map((ad) => ad.id))
      setUpdatingIds(updatingIds)

      try {
        let successCount = 0
        let errorCount = 0

        // Update ads one by one to show individual progress
        for (const ad of sortedAds) {
          try {
            // Double-check ad.id before API call
            if (!ad.id || ad.id === undefined || ad.id === null) {
              console.warn('Skipping ad with invalid id:', ad)
              errorCount++
              continue
            }

            await updateAdStatusSingle(ad.id)
            successCount++

            // Mark as updated today
            if (markAdAsUpdatedToday) markAdAsUpdatedToday(ad.id)

            // Remove from updating set as each completes
            setUpdatingIds((prev) => {
              const newSet = new Set(prev)
              newSet.delete(ad.id)
              return newSet
            })

            // Small delay to show progress
            await new Promise((resolve) => setTimeout(resolve, 100))
          } catch (error) {
            console.error(`Ошибка обновления объявления ${ad.id}:`, error)
            errorCount++
          }
        }

        await refetch()

        if (errorCount === 0) {
          toast.success(`Обновлено ${successCount} объявлений`)
        } else {
          toast.warning(
            `Обновлено ${successCount} объявлений, ошибок: ${errorCount}`,
          )
        }
      } catch (error) {
        console.error('Ошибка массового обновления:', error)
        toast.error('Ошибка при обновлении объявлений')
      } finally {
        setUpdatingIds(new Set())
      }
    },
    [refetch],
  )

  // Update single ad for comparison block (extended endpoint)
  const handleUpdateAdExtended = useCallback(
    async (adId: number) => {
      if (startUpdatingAd) startUpdatingAd(adId)

      try {
        await updateAdStatusExtended(adId)
        await refetch()
        toast.success('Объявление обновлено с расширенными данными')
      } catch (error) {
        console.error('Ошибка расширенного обновления объявления:', error)
        toast.error('Ошибка при расширенном обновлении')
      } finally {
        if (stopUpdatingAd) stopUpdatingAd(adId)
      }
    },
    [refetch, startUpdatingAd, stopUpdatingAd],
  )

  // House ads statuses update function
  const handleUpdateHouseStatuses = useCallback(
    async (
      ads: any[],
      setUpdatingIds: React.Dispatch<React.SetStateAction<Set<number>>>,
    ) => {
      if (ads.length === 0) {
        toast.info('Нет объявлений для обновления')
        return
      }

      // Filter ads that haven't been updated today - add safety checks
      const adsToUpdate = ads.filter((ad) => {
        // Safety check: ensure ad has required properties
        if (!ad || !ad.id) {
          console.warn('Filtering out ad with missing/invalid id:', {
            ad,
            id: ad?.id,
            typeof_id: typeof ad?.id,
          })
          return false
        }

        const lastUpdate = ad.updatedAt || ad.updated || ad.time_source_updated
        return !isUpdatedToday(lastUpdate)
      })

      if (adsToUpdate.length === 0) {
        toast.info('Все объявления уже обновлены сегодня')
        return
      }

      // Sort ads by priority: Cian first, then Yandex, then others
      const sortedAds = adsToUpdate.sort((a, b) => {
        const aIsCian = a.url?.includes('cian.ru') || a.source === 4 || false
        const bIsCian = b.url?.includes('cian.ru') || b.source === 4 || false
        if (aIsCian && !bIsCian) return -1
        if (!aIsCian && bIsCian) return 1

        const aIsYandex =
          a.url?.includes('yandex.ru') ||
          a.url?.includes('ya.ru') ||
          a.url?.includes('realty.ya.ru') ||
          a.source === 3 ||
          false
        const bIsYandex =
          b.url?.includes('yandex.ru') ||
          b.url?.includes('ya.ru') ||
          b.url?.includes('realty.ya.ru') ||
          b.source === 3 ||
          false
        if (aIsYandex && !bIsYandex) return -1
        if (!aIsYandex && bIsYandex) return 1

        return 0
      })

      try {
        // Check if ads have id property (users.ads) or just url (flats_history)
        const hasIds = sortedAds.some(
          (ad) => ad.id && typeof ad.id === 'number',
        )

        if (hasIds) {
          // Update ads from users.ads using individual ID updates
          let successCount = 0
          let errorCount = 0

          for (const ad of sortedAds) {
            try {
              if (!ad.id || ad.id === undefined || ad.id === null) {
                console.warn('Skipping ad with invalid id:', ad)
                errorCount++
                continue
              }

              // Add to updating set
              setUpdatingIds((prev) => new Set([...prev, ad.id]))

              await updateAdStatusSingle(ad.id)
              successCount++

              // Mark as updated today
              if (markAdAsUpdatedToday) markAdAsUpdatedToday(ad.id)

              // Remove from updating set
              setUpdatingIds((prev) => {
                const newSet = new Set(prev)
                newSet.delete(ad.id)
                return newSet
              })

              // Small delay to show progress
              await new Promise((resolve) => setTimeout(resolve, 100))
            } catch (error) {
              console.error(`Ошибка обновления объявления ${ad.id}:`, error)
              errorCount++

              // Remove from updating set on error
              setUpdatingIds((prev) => {
                const newSet = new Set(prev)
                newSet.delete(ad.id)
                return newSet
              })
            }
          }

          await refetch()

          if (errorCount === 0) {
            toast.success(`Обновлено ${successCount} объявлений`)
          } else {
            toast.warning(
              `Обновлено ${successCount} из ${sortedAds.length} объявлений. ${errorCount} ошибок.`,
            )
          }
        } else {
          // Use the flats_history status update endpoint for ads without IDs
          const urls = sortedAds
            .map((ad) => ad.url)
            .filter((url) => url && typeof url === 'string')

          if (urls.length === 0) {
            toast.info('Нет валидных URL для обновления')
            return
          }

          const response = await fetch('/api/ads/update-flats-history-status', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ urls }),
          })

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const result = await response.json()

          // Refresh data after update
          await refetch()
          if (refetchBroaderAds) {
            await refetchBroaderAds()
          }

          if (result.success) {
            toast.success(
              `Обновлено ${result.successCount} из ${urls.length} объявлений`,
            )
          } else {
            toast.warning(
              `Обновлено ${result.successCount} из ${urls.length} объявлений. Ошибок: ${result.errorCount}`,
            )
          }
        }
      } catch (error) {
        console.error('Ошибка массового обновления дома:', error)
        toast.error('Ошибка при обновлении объявлений дома')
      }
    },
    [refetch, refetchBroaderAds, markAdAsUpdatedToday],
  )

  // Update all ads in comparison block (single endpoint for bulk)
  const handleUpdateAllComparisonAds = useCallback(
    async (
      ads: any[],
      setUpdatingIds: React.Dispatch<React.SetStateAction<Set<number>>>,
    ) => {
      if (ads.length === 0) {
        toast.info('Нет объявлений для обновления')
        return
      }

      // Sort ads by priority: Cian first, then others
      const sortedAds = ads.sort((a, b) => {
        const aIsCian = a.url?.includes('cian.ru') || a.source === 4 || false
        const bIsCian = b.url?.includes('cian.ru') || b.source === 4 || false
        if (aIsCian && !bIsCian) return -1
        if (!aIsCian && bIsCian) return 1

        // Secondary priority: Yandex (including ya.ru and realty.ya.ru)
        const aIsYandex =
          a.url?.includes('yandex.ru') ||
          a.url?.includes('ya.ru') ||
          a.url?.includes('realty.ya.ru') ||
          a.source === 3 ||
          false
        const bIsYandex =
          b.url?.includes('yandex.ru') ||
          b.url?.includes('ya.ru') ||
          b.url?.includes('realty.ya.ru') ||
          b.source === 3 ||
          false
        if (aIsYandex && !bIsYandex) return -1
        if (!aIsYandex && bIsYandex) return 1

        return 0
      })

      const updatingIds = new Set(sortedAds.map((ad) => ad.id))
      setUpdatingIds(updatingIds)

      try {
        let successCount = 0
        let errorCount = 0

        // Update ads one by one using single endpoint for bulk update
        for (const ad of sortedAds) {
          try {
            // Double-check ad.id before API call
            if (!ad.id || ad.id === undefined || ad.id === null) {
              console.warn('Skipping ad with invalid id:', ad)
              errorCount++
              continue
            }

            await updateAdStatusSingle(ad.id)
            successCount++

            // Remove from updating set as each completes
            setUpdatingIds((prev) => {
              const newSet = new Set(prev)
              newSet.delete(ad.id)
              return newSet
            })

            // Small delay to show progress
            await new Promise((resolve) => setTimeout(resolve, 100))
          } catch (error) {
            console.error(`Ошибка обновления объявления ${ad.id}:`, error)
            errorCount++
          }
        }

        await refetch()

        if (errorCount === 0) {
          toast.success(`Обновлено ${successCount} объявлений в сравнении`)
        } else {
          toast.warning(
            `Обновлено ${successCount} объявлений, ошибок: ${errorCount}`,
          )
        }
      } catch (error) {
        console.error('Ошибка массового обновления сравнения:', error)
        toast.error('Ошибка при обновлении объявлений сравнения')
      } finally {
        setUpdatingIds(new Set())
      }
    },
    [refetch],
  )

  return {
    handleToggleComparison,
    handleDeleteAd,
    handleDeleteFlat,
    handleAddToComparison,
    handleUpdateAdFromSource,
    handleUpdateAdExtended,
    handleAutoFindSimilar,
    handleFindBroaderAds,
    handleUpdateAllOldAds,
    handleUpdateAllComparisonAds,
    handleUpdateHouseStatuses,
  }
}
