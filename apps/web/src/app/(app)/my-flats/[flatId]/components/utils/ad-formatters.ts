/**
 * Utility functions for formatting ad data
 */

// Clean "dirty" values that might be string "null", 0, or actually null/undefined
export const cleanValue = (value: any): any => {
  if (
    value === null ||
    value === undefined ||
    value === 'null' ||
    value === 0
  ) {
    return null
  }
  return value
}

// Format price to millions
export const formatPrice = (price: number | null | undefined): string => {
  if (price === null || price === undefined) return '\u00A0'
  return (price / 1_000_000).toFixed(2)
}

// Format date to Russian locale
export const formatDate = (
  dateStr: string | Date | null | undefined,
): string => {
  if (!dateStr) return '\u00A0'
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  return date.toLocaleDateString('ru-RU')
}

// Format date to short format (dd.mm)
export const formatDateShort = (
  dateStr: string | Date | null | undefined,
): string => {
  if (!dateStr) return ''
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  if (isNaN(date.getTime())) return ''
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
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
  if (views === null || views === undefined) return '\u00A0'
  return views.toString()
}

// Format floor display
export const formatFloor = (
  floor: number | null | undefined,
  totalFloors?: number | null,
): string => {
  if (floor === null || floor === undefined) return '\u00A0'
  if (totalFloors) {
    return `${floor}/${totalFloors}`
  }
  return floor.toString()
}

// Format area (square meters)
export const formatArea = (area: number | null | undefined): string => {
  if (area === null || area === undefined) return '\u00A0'
  return `${area} м²`
}

// Format boolean fields to readable text
export const formatBoolean = (
  value: boolean | null | undefined,
  trueText = 'Да',
  falseText = 'Нет',
): string => {
  if (value === null || value === undefined) return '\u00A0'
  return value ? trueText : falseText
}

// Format person type
export const formatPersonType = (
  personType: number | null | undefined,
): string => {
  if (personType === null || personType === undefined) return '\u00A0'
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
  if (sourceType === null || sourceType === undefined) return '\u00A0'
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
  if (!time) return '\u00A0'
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
  if (!text) return '\u00A0'
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Format status with checkmark or dash
export const formatStatus = (status: boolean | null | undefined): string => {
  if (status === null || status === undefined) return '\u00A0'
  return status ? '✓' : '−'
}

// Format distance in meters
export const formatDistance = (distance: number | null | undefined): string => {
  if (distance === null || distance === undefined) return '\u00A0'
  if (distance < 1000) {
    return `${distance} м`
  }
  return `${(distance / 1000).toFixed(1)} км`
}

// Clean and format room count
export const formatRooms = (rooms: number | null | undefined): string => {
  if (rooms === null || rooms === undefined) return '\u00A0'
  return rooms.toString()
}

// Format ceiling height
export const formatCeilingHeight = (
  height: number | string | null | undefined,
): string => {
  if (!height) return '\u00A0'
  return `${height} м`
}

// Format construction year
export const formatConstructionYear = (
  year: number | string | null | undefined,
): string => {
  if (!year) return '\u00A0'
  return year.toString()
}

// Check if status is older than 7 days
export const isStatusOld = (
  updatedAt: string | Date | null | undefined,
): boolean => {
  if (!updatedAt) return true

  try {
    const updated =
      typeof updatedAt === 'string' ? new Date(updatedAt) : updatedAt

    // Check if the date is valid
    if (isNaN(updated.getTime())) return true

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    return updated < sevenDaysAgo
  } catch (error) {
    console.warn('isStatusOld: Invalid date', updatedAt, error)
    return true
  }
}

// Check if ad was updated today
export const isUpdatedToday = (
  updatedAt: string | Date | null | undefined,
): boolean => {
  if (!updatedAt) return false

  try {
    const updated =
      typeof updatedAt === 'string' ? new Date(updatedAt) : updatedAt
    const today = new Date()

    // Check if the date is valid
    if (isNaN(updated.getTime())) return false

    return (
      updated.getFullYear() === today.getFullYear() &&
      updated.getMonth() === today.getMonth() &&
      updated.getDate() === today.getDate()
    )
  } catch (error) {
    console.warn('isUpdatedToday: Invalid date', updatedAt, error)
    return false
  }
}
