import { forceUpdateAd } from '@/domains/ads'
import type { AdSource, AdUpdateResult } from '../types/ads-blocks.types'

/**
 * Update ad from a specific source
 */
export const updateAdFromSource = async (
  adId: number,
  source: AdSource
): Promise<AdUpdateResult> => {
  try {
    await forceUpdateAd(adId, { source } as any) // Type assertion for compatibility
    return {
      success: true,
      adId,
      source
    }
  } catch (error) {
    return {
      success: false,
      adId,
      source,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Update ads from multiple sources sequentially
 */
export const updateAdsFromSources = async (
  adIds: number[],
  sources: AdSource[]
): Promise<AdUpdateResult[]> => {
  const results: AdUpdateResult[] = []

  for (const adId of adIds) {
    for (const source of sources) {
      const result = await updateAdFromSource(adId, source)
      results.push(result)
    }
  }

  return results
}

/**
 * Update all ads from all sources
 */
export const updateAllAdsFromAllSources = async (
  adIds: number[]
): Promise<AdUpdateResult[]> => {
  const sources: AdSource[] = ['cian', 'avito', 'yandex']
  return updateAdsFromSources(adIds, sources)
}

/**
 * Update ads with progress tracking
 */
export const updateAdsWithProgress = async (
  adIds: number[],
  sources: AdSource[],
  onProgress?: (completed: number, total: number, currentAd: number, currentSource: AdSource) => void
): Promise<AdUpdateResult[]> => {
  const results: AdUpdateResult[] = []
  const total = adIds.length * sources.length
  let completed = 0

  for (const adId of adIds) {
    for (const source of sources) {
      onProgress?.(completed, total, adId, source)

      const result = await updateAdFromSource(adId, source)
      results.push(result)

      completed++
    }
  }

  return results
}

/**
 * Get failed updates from results
 */
export const getFailedUpdates = (results: AdUpdateResult[]): AdUpdateResult[] => {
  return results.filter(result => !result.success)
}

/**
 * Get successful updates from results
 */
export const getSuccessfulUpdates = (results: AdUpdateResult[]): AdUpdateResult[] => {
  return results.filter(result => result.success)
}

/**
 * Format update results summary
 */
export const formatUpdateSummary = (results: AdUpdateResult[]): string => {
  const successful = getSuccessfulUpdates(results)
  const failed = getFailedUpdates(results)

  if (failed.length === 0) {
    return `Все ${successful.length} обновлений прошли успешно`
  }

  if (successful.length === 0) {
    return `Все ${failed.length} обновлений завершились ошибкой`
  }

  return `Успешно: ${successful.length}, ошибок: ${failed.length}`
}

/**
 * Delay utility for rate limiting
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Update ads with rate limiting
 */
export const updateAdsWithRateLimit = async (
  adIds: number[],
  sources: AdSource[],
  delayMs = 1000,
  onProgress?: (completed: number, total: number) => void
): Promise<AdUpdateResult[]> => {
  const results: AdUpdateResult[] = []
  const total = adIds.length * sources.length
  let completed = 0

  for (const adId of adIds) {
    for (const source of sources) {
      onProgress?.(completed, total)

      const result = await updateAdFromSource(adId, source)
      results.push(result)

      completed++

      // Add delay between requests
      if (completed < total) {
        await delay(delayMs)
      }
    }
  }

  return results
}