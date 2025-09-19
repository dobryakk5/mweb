import * as XLSX from 'xlsx'
import type { ExcelExportData } from '../types/ads-blocks.types'
import { formatDate } from './ad-formatters'

// Excel-специфичные функции форматирования (возвращают пустую строку вместо null)
const formatPriceForExcel = (price: number | null | undefined): string => {
  if (price === null || price === undefined) return ''
  return (price / 1_000_000).toFixed(2)
}

const formatViewsForExcel = (views: number | null | undefined): string => {
  if (views === null || views === undefined) return ''
  return views.toString()
}

const formatAreaForExcel = (area: number | null | undefined): string => {
  if (area === null || area === undefined) return ''
  return `${area} м²`
}

const formatBooleanForExcel = (
  value: boolean | null | undefined,
  trueText = 'Да',
  falseText = 'Нет',
): string => {
  if (value === null || value === undefined) return ''
  return value ? trueText : falseText
}

const formatDateForExcel = (
  dateStr: string | Date | null | undefined,
): string => {
  if (!dateStr) return ''
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  return date.toLocaleDateString('ru-RU')
}

/**
 * Convert ads data to Excel export format
 */
export const convertAdsToExcelData = (ads: any[]): ExcelExportData[] => {
  return ads.map((ad) => ({
    URL: ad.url || '',
    'Цена, млн': formatPriceForExcel(ad.price),
    Комнаты: ad.rooms || '',
    'Общая площадь': formatAreaForExcel(ad.totalArea),
    'Жилая площадь': formatAreaForExcel(ad.livingArea),
    'Площадь кухни': formatAreaForExcel(ad.kitchenArea),
    Этаж: ad.floor?.toString() || '',
    'Всего этажей': ad.totalFloors?.toString() || '',
    Санузел: ad.bathroom || '',
    Балкон: ad.balcony || '',
    Ремонт: ad.renovation || '',
    Мебель: formatBooleanForExcel(ad.furniture, 'Есть', 'Нет'),
    'Год постройки': ad.constructionYear?.toString() || '',
    'Тип дома': ad.houseType || '',
    'Высота потолков': ad.ceilingHeight ? `${ad.ceilingHeight} м` : '',
    Метро: ad.metroStation || '',
    'Время до метро': ad.metroTime || '',
    Теги: ad.tags || '',
    Описание: ad.description || '',
    'Просмотры сегодня': formatViewsForExcel(ad.viewsToday),
    Обновлено: formatDateForExcel(ad.updatedAt),
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
          row['Обновлено'] = formatDateForExcel(ad.updatedAt)
          break
        default:
          row[column] = ad[column] || ''
      }
    })

    return row
  })
}
