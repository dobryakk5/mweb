import * as XLSX from 'xlsx'
import type { ExcelExportData } from '../types/ads-blocks.types'
import { formatDate } from './ad-formatters'

// Excel-специфичные функции форматирования (возвращают пустую строку вместо null)
const formatPriceForExcel = (
  price: number | null | undefined | string,
): string => {
  if (price === null || price === undefined || price === 'null' || price === '')
    return ''
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  if (isNaN(numPrice)) return ''
  return (numPrice / 1_000_000).toFixed(2)
}

const formatViewsForExcel = (
  views: number | null | undefined | string,
): string => {
  if (views === null || views === undefined || views === 'null' || views === '')
    return ''
  const numViews = typeof views === 'string' ? parseInt(views) : views
  if (isNaN(numViews)) return ''
  return numViews.toString()
}

const formatAreaForExcel = (
  area: number | null | undefined | string,
): string => {
  if (area === null || area === undefined || area === 'null' || area === '')
    return ''
  const numArea = typeof area === 'string' ? parseFloat(area) : area
  if (isNaN(numArea)) return ''
  return `${numArea} м²`
}

const formatBooleanForExcel = (
  value: boolean | null | undefined | string,
  trueText = 'Да',
  falseText = 'Нет',
): string => {
  if (value === null || value === undefined || value === 'null' || value === '')
    return ''
  if (typeof value === 'string') {
    const lowerValue = value.toLowerCase()
    if (lowerValue === 'true' || lowerValue === '1') return trueText
    if (lowerValue === 'false' || lowerValue === '0') return falseText
    return ''
  }
  return value ? trueText : falseText
}

const formatDateForExcel = (
  dateStr: string | Date | null | undefined,
): string => {
  if (!dateStr || dateStr === 'null') return ''
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  return date.toLocaleDateString('ru-RU')
}

// Helper function to clean null string values
const cleanNullValue = (value: any): any => {
  if (value === null || value === undefined || value === 'null') return ''
  return value
}

// Helper function to get display date for Excel export - prefer source timestamp, fallback to updated_at
const getExcelDisplayDate = (ad: any): string | null => {
  return ad.sourceUpdated || ad.updatedAt || null
}

/**
 * Convert ads data to Excel export format
 */
export const convertAdsToExcelData = (ads: any[]): ExcelExportData[] => {
  return ads.map((ad) => ({
    URL: cleanNullValue(ad.url),
    'Цена, млн': formatPriceForExcel(ad.price),
    Комнаты: cleanNullValue(ad.rooms),
    'Общая площадь': formatAreaForExcel(ad.totalArea),
    'Жилая площадь': formatAreaForExcel(ad.livingArea),
    'Площадь кухни': formatAreaForExcel(ad.kitchenArea),
    Этаж: cleanNullValue(ad.floor?.toString()),
    'Всего этажей': cleanNullValue(ad.totalFloors?.toString()),
    Санузел: cleanNullValue(ad.bathroom),
    Балкон: cleanNullValue(ad.balcony),
    Ремонт: cleanNullValue(ad.renovation),
    Мебель: formatBooleanForExcel(ad.furniture, 'Есть', 'Нет'),
    'Год постройки': cleanNullValue(ad.constructionYear?.toString()),
    'Тип дома': cleanNullValue(ad.houseType),
    'Высота потолков':
      ad.ceilingHeight && ad.ceilingHeight !== 'null'
        ? `${ad.ceilingHeight} м`
        : '',
    Метро: cleanNullValue(ad.metroStation),
    'Время до метро': cleanNullValue(ad.metroTime),
    Теги: cleanNullValue(ad.tags),
    Описание: cleanNullValue(ad.description),
    'Просмотры сегодня': formatViewsForExcel(ad.viewsToday),
    Обновлено: formatDateForExcel(getExcelDisplayDate(ad)),
  }))
}

/**
 * Export ads to Excel file
 */
export const exportAdsToExcel = (
  ads: any[],
  filename: string,
  sheetName = 'Объявления',
): void => {
  const exportData = convertAdsToExcelData(ads)

  // Создаем рабочую книгу и лист
  const ws = XLSX.utils.json_to_sheet(exportData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)

  // Экспортируем файл
  XLSX.writeFile(wb, filename)
}

/**
 * Export comparison ads to Excel with proper formatting
 */
export const exportComparisonToExcel = (
  ads: any[],
  flatAddress?: string,
): void => {
  const exportData = convertAdsToExcelData(ads)

  // Создаем рабочую книгу и лист
  const ws = XLSX.utils.json_to_sheet(exportData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Сравнение квартир')

  // Генерируем имя файла
  const date = new Date().toLocaleDateString('ru-RU')
  const fileName = `сравнение-квартир-${flatAddress || 'квартира'}-${date}.xlsx`

  // Экспортируем файл
  XLSX.writeFile(wb, fileName)
}

/**
 * Generate filename for export
 */
export const generateExportFilename = (
  type: string,
  flatAddress?: string,
  date?: Date,
): string => {
  const dateStr = (date || new Date()).toLocaleDateString('ru-RU')
  const addressPart = flatAddress ? `-${flatAddress}` : ''
  return `${type}${addressPart}-${dateStr}.xlsx`
}

/**
 * Export nearby ads to Excel
 */
export const exportNearbyAdsToExcel = (
  ads: any[],
  flatAddress?: string,
): void => {
  const filename = generateExportFilename('близлежащие-объявления', flatAddress)
  exportAdsToExcel(ads, filename, 'Близлежащие объявления')
}

/**
 * Export flat ads to Excel
 */
export const exportFlatAdsToExcel = (
  ads: any[],
  flatAddress?: string,
): void => {
  const filename = generateExportFilename('объявления-квартиры', flatAddress)
  exportAdsToExcel(ads, filename, 'Объявления по квартире')
}

/**
 * Export house ads to Excel
 */
export const exportHouseAdsToExcel = (
  ads: any[],
  flatAddress?: string,
): void => {
  const filename = generateExportFilename('объявления-дома', flatAddress)
  exportAdsToExcel(ads, filename, 'Объявления по дому')
}

/**
 * Prepare Excel data with custom columns
 */
export const prepareExcelDataWithColumns = (
  ads: any[],
  columns: string[],
): Record<string, any>[] => {
  return ads.map((ad) => {
    const row: Record<string, any> = {}

    columns.forEach((column) => {
      switch (column) {
        case 'url':
          row['URL'] = ad.url || ''
          break
        case 'price':
          row['Цена, млн'] = formatPriceForExcel(ad.price)
          break
        case 'rooms':
          row['Комнаты'] = ad.rooms || ''
          break
        case 'totalArea':
          row['Общая площадь'] = formatAreaForExcel(ad.totalArea)
          break
        case 'livingArea':
          row['Жилая площадь'] = formatAreaForExcel(ad.livingArea)
          break
        case 'kitchenArea':
          row['Площадь кухни'] = formatAreaForExcel(ad.kitchenArea)
          break
        case 'floor':
          row['Этаж'] = ad.floor?.toString() || ''
          break
        case 'viewsToday':
          row['Просмотры сегодня'] = formatViewsForExcel(ad.viewsToday)
          break
        case 'updatedAt':
          row['Обновлено'] = formatDateForExcel(getExcelDisplayDate(ad))
          break
        default:
          row[column] = cleanNullValue(ad[column])
      }
    })

    return row
  })
}
