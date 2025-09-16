import { useCallback } from 'react'
import { toast } from 'sonner'
import type { UserFlat } from '@acme/db/types'
import {
  exportComparisonToExcel,
  exportFlatAdsToExcel,
  exportHouseAdsToExcel,
  exportNearbyAdsToExcel
} from '../utils/excel-export'

/**
 * Hook for Excel export functionality
 */
export const useExcelExport = (flat?: UserFlat) => {
  // Export comparison ads to Excel
  const exportComparison = useCallback((ads: any[]) => {
    if (ads.length === 0) {
      toast.error('Нет данных для экспорта')
      return
    }

    try {
      exportComparisonToExcel(ads, flat?.address)
      toast.success('Данные сравнения экспортированы в Excel')
    } catch (error) {
      console.error('Ошибка экспорта в Excel:', error)
      toast.error('Ошибка при экспорте в Excel')
    }
  }, [flat?.address])

  // Export flat ads to Excel
  const exportFlatAds = useCallback((ads: any[]) => {
    if (ads.length === 0) {
      toast.error('Нет данных для экспорта')
      return
    }

    try {
      exportFlatAdsToExcel(ads, flat?.address)
      toast.success('Объявления по квартире экспортированы в Excel')
    } catch (error) {
      console.error('Ошибка экспорта в Excel:', error)
      toast.error('Ошибка при экспорте в Excel')
    }
  }, [flat?.address])

  // Export house ads to Excel
  const exportHouseAds = useCallback((ads: any[]) => {
    if (ads.length === 0) {
      toast.error('Нет данных для экспорта')
      return
    }

    try {
      exportHouseAdsToExcel(ads, flat?.address)
      toast.success('Объявления по дому экспортированы в Excel')
    } catch (error) {
      console.error('Ошибка экспорта в Excel:', error)
      toast.error('Ошибка при экспорте в Excel')
    }
  }, [flat?.address])

  // Export nearby ads to Excel
  const exportNearbyAds = useCallback((ads: any[]) => {
    if (ads.length === 0) {
      toast.error('Нет данных для экспорта')
      return
    }

    try {
      exportNearbyAdsToExcel(ads, flat?.address)
      toast.success('Близлежащие объявления экспортированы в Excel')
    } catch (error) {
      console.error('Ошибка экспорта в Excel:', error)
      toast.error('Ошибка при экспорте в Excel')
    }
  }, [flat?.address])

  return {
    exportComparison,
    exportFlatAds,
    exportHouseAds,
    exportNearbyAds
  }
}