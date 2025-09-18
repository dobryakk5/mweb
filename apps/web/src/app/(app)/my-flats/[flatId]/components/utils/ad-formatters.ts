/**
 * Utility functions for formatting ad data
 */

// Format price to millions
export const formatPrice = (price: number | null | undefined): string => {
  if (price === null || price === undefined) return '—'
  return (price / 1_000_000).toFixed(2)
}

// Format date to Russian locale
export const formatDate = (
  dateStr: string | Date | null | undefined,
): string => {
  if (!dateStr) return '—'
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  return date.toLocaleDateString('ru-RU')
}

// Extract domain from URL
export const getDomainFromUrl = (url: string): string => {
  try {
    const domain = new URL(url).hostname.toLowerCase()

    if (domain.includes('avito.ru')) return 'avito'
    if (
      domain.includes('yandex.ru') ||
      domain.includes('realty.yandex.ru') ||
      domain.includes('ya.ru') ||
      domain.includes('realty.ya.ru')
    )
      return 'yandex'
    if (domain.includes('cian.ru')) return 'cian'

    // Fallback to domain without www
    return domain.replace('www.', '')
  } catch {
    return url
  }
}

// Format URL for display with proper domain names
export const formatUrlForDisplay = (
  url: string,
): { domain: string; url: string } => {
  const domain = getDomainFromUrl(url)
  return { domain, url }
}

// Format views count
export const formatViews = (views: number | null | undefined): string => {
  if (views === null || views === undefined) return '—'
  return views.toString()
}

// Format floor display
export const formatFloor = (
  floor: number | null | undefined,
  totalFloors?: number | null,
): string => {
  if (floor === null || floor === undefined) return '—'
  if (totalFloors) {
    return `${floor}/${totalFloors}`
  }
  return floor.toString()
}

// Format area (square meters)
export const formatArea = (area: number | null | undefined): string => {
  if (area === null || area === undefined) return '—'
  return `${area} м²`
}

// Format boolean fields to readable text
export const formatBoolean = (
  value: boolean | null | undefined,
  trueText = 'Да',
  falseText = 'Нет',
): string => {
  if (value === null || value === undefined) return '—'
  return value ? trueText : falseText
}

// Format person type
export const formatPersonType = (
  personType: number | null | undefined,
): string => {
  if (personType === null || personType === undefined) return '—'
  switch (personType) {
    case 3:
      return 'собственник'
    case 2:
      return 'агентство'
    default:
      return 'неизвестно'
  }
}

// Format source type
export const formatSourceType = (
  sourceType: number | null | undefined,
): string => {
  if (sourceType === null || sourceType === undefined) return '—'
  switch (sourceType) {
    case 1:
      return 'Avito'
    case 3:
      return 'Яндекс'
    case 4:
      return 'Cian'
    default:
      return 'Неизвестно'
  }
}

// Format metro time
export const formatMetroTime = (
  time: string | number | null | undefined,
): string => {
  if (!time) return '—'
  if (typeof time === 'number') {
    return `${time} мин`
  }
  // If it's already formatted string, return as is
  return time.toString()
}

// Truncate text with ellipsis
export const truncateText = (
  text: string | null | undefined,
  maxLength: number,
): string => {
  if (!text) return '—'
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Format status with checkmark or dash
export const formatStatus = (status: boolean | null | undefined): string => {
  if (status === null || status === undefined) return '—'
  return status ? '✓' : '—'
}

// Format distance in meters
export const formatDistance = (distance: number | null | undefined): string => {
  if (distance === null || distance === undefined) return '—'
  if (distance < 1000) {
    return `${distance} м`
  }
  return `${(distance / 1000).toFixed(1)} км`
}

// Clean and format room count
export const formatRooms = (rooms: number | null | undefined): string => {
  if (rooms === null || rooms === undefined) return '—'
  return rooms.toString()
}

// Format ceiling height
export const formatCeilingHeight = (
  height: number | string | null | undefined,
): string => {
  if (!height) return '—'
  return `${height} м`
}

// Format construction year
export const formatConstructionYear = (
  year: number | string | null | undefined,
): string => {
  if (!year) return '—'
  return year.toString()
}

// Check if status is older than 7 days
export const isStatusOld = (
  updatedAt: string | Date | null | undefined,
): boolean => {
  if (!updatedAt) return true
  const updated =
    typeof updatedAt === 'string' ? new Date(updatedAt) : updatedAt
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  return updated < sevenDaysAgo
}

// Check if ad was updated today
export const isUpdatedToday = (
  updatedAt: string | Date | null | undefined,
): boolean => {
  if (!updatedAt) return false

  const updated =
    typeof updatedAt === 'string' ? new Date(updatedAt) : updatedAt
  const today = new Date()

  return (
    updated.getFullYear() === today.getFullYear() &&
    updated.getMonth() === today.getMonth() &&
    updated.getDate() === today.getDate()
  )
}
