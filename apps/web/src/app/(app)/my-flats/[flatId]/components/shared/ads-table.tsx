'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { buttonVariants } from '@acme/ui/components/button'
import {
  TrashIcon,
  PlusIcon,
  MinusIcon,
  RefreshCwIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  FilterIcon,
  XIcon,
} from '@acme/ui/components/icon'
// import AdChangesHistory from '@/components/ad-changes-history' // Временно отключено
import type {
  AdsTableProps,
  ColumnConfig,
  SortConfig,
  FilterConfig,
} from '../types/ads-blocks.types'
import {
  formatPrice,
  formatDate,
  formatDateShort,
  formatViews,
  formatStatus,
  formatUrlForDisplay,
  formatDistance,
  formatPersonType,
  isStatusOld,
} from '../utils/ad-formatters'

/**
 * Universal ads table component
 */
export default function AdsTable({
  ads,
  columns,
  expandedView = false,
  onDeleteAd,
  onToggleComparison,
  onAddToComparison,
  onUpdateAd,
  updatingAdIds = new Set(),
  showActions = true,
  showComparison = true,
  showDelete = false,
  isBulkUpdating = false,
  updatedTodayAdIds = new Set(),
}: AdsTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>(null)
  const [filters, setFilters] = useState<FilterConfig>({})
  const [openFilterKey, setOpenFilterKey] = useState<string | null>(null)
  const tableRef = useRef<HTMLDivElement>(null)

  // Закрытие фильтра при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tableRef.current &&
        !tableRef.current.contains(event.target as Node)
      ) {
        setOpenFilterKey(null)
      }
    }

    if (openFilterKey) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openFilterKey])

  // Функция для фильтрации данных
  const filteredAds = useMemo(() => {
    return ads.filter((ad) => {
      return Object.entries(filters).every(([key, filterValue]) => {
        if (!filterValue && filterValue !== false) return true

        const adValue = ad[key]

        // Для boolean полей
        if (typeof filterValue === 'boolean') {
          return !!adValue === filterValue
        }

        // Для числовых полей
        if (typeof filterValue === 'number') {
          const numValue = parseFloat(
            String(adValue || '').replace(/[^\d.]/g, ''),
          )
          return numValue >= filterValue
        }

        // Для строковых полей
        if (typeof filterValue === 'string') {
          const searchTerm = filterValue.toLowerCase()
          return String(adValue || '')
            .toLowerCase()
            .includes(searchTerm)
        }

        return true
      })
    })
  }, [ads, filters])

  // Функция для сортировки данных
  const sortedAds = useMemo(() => {
    const dataToSort = filteredAds

    if (!sortConfig || !sortConfig.key) {
      return dataToSort
    }

    return [...dataToSort].sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]

      // Обработка числовых значений
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc'
          ? aValue - bValue
          : bValue - aValue
      }

      // Обработка строковых значений цены (например, "5.5 млн")
      if (sortConfig.key === 'price') {
        const aPrice = parseFloat(String(aValue).replace(/[^\d.]/g, '')) || 0
        const bPrice = parseFloat(String(bValue).replace(/[^\d.]/g, '')) || 0
        return sortConfig.direction === 'asc'
          ? aPrice - bPrice
          : bPrice - aPrice
      }

      // Обработка площадей (numeric sorting)
      if (
        sortConfig.key === 'area' ||
        sortConfig.key === 'totalArea' ||
        sortConfig.key === 'livingArea' ||
        sortConfig.key === 'kitchenArea'
      ) {
        const aArea = parseFloat(String(aValue).replace(/[^\d.]/g, '')) || 0
        const bArea = parseFloat(String(bValue).replace(/[^\d.]/g, '')) || 0
        return sortConfig.direction === 'asc' ? aArea - bArea : bArea - aArea
      }

      // Обработка дат
      if (
        sortConfig.key.includes('At') ||
        sortConfig.key === 'created' ||
        sortConfig.key === 'updated'
      ) {
        const aDate = new Date(aValue || 0).getTime()
        const bDate = new Date(bValue || 0).getTime()
        return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate
      }

      // Обработка строковых значений
      const aStr = String(aValue || '').toLowerCase()
      const bStr = String(bValue || '').toLowerCase()

      if (aStr < bStr) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }
      if (aStr > bStr) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }
      return 0
    })
  }, [filteredAds, sortConfig])

  // Обработчик клика по заголовку столбца
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'

    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === 'asc'
    ) {
      direction = 'desc'
    }

    setSortConfig({ key, direction })
  }

  // Обработчики фильтрации
  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const clearFilter = (key: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev }
      delete newFilters[key]
      return newFilters
    })
  }

  const clearAllFilters = () => {
    setFilters({})
  }

  // Закрытие открытого фильтра при клике вне его
  const handleFilterToggle = (key: string) => {
    setOpenFilterKey(openFilterKey === key ? null : key)
  }

  // Компонент выпадающего фильтра
  const renderFilterDropdown = (column: ColumnConfig) => {
    const isOpen = openFilterKey === column.key
    const currentFilter = filters[column.key]

    if (!isOpen) return null

    const renderFilterInput = () => {
      switch (column.filterType) {
        case 'boolean':
          return (
            <div className='space-y-2'>
              <label className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  checked={currentFilter === true}
                  onChange={(e) =>
                    handleFilterChange(
                      column.key,
                      e.target.checked || undefined,
                    )
                  }
                  className='rounded border-gray-300'
                />
                <span className='text-xs'>Да</span>
              </label>
              <label className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  checked={currentFilter === false}
                  onChange={(e) =>
                    handleFilterChange(
                      column.key,
                      e.target.checked ? false : undefined,
                    )
                  }
                  className='rounded border-gray-300'
                />
                <span className='text-xs'>Нет</span>
              </label>
            </div>
          )

        case 'number':
          return (
            <input
              type='number'
              placeholder='Мин. значение'
              value={currentFilter || ''}
              onChange={(e) =>
                handleFilterChange(
                  column.key,
                  e.target.value ? parseFloat(e.target.value) : undefined,
                )
              }
              className='w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
            />
          )

        case 'select':
          return (
            <select
              value={currentFilter || ''}
              onChange={(e) =>
                handleFilterChange(column.key, e.target.value || undefined)
              }
              className='w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
            >
              <option value=''>Все</option>
              {column.filterOptions?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )

        default: // text
          return (
            <input
              type='text'
              placeholder='Поиск...'
              value={currentFilter || ''}
              onChange={(e) =>
                handleFilterChange(column.key, e.target.value || undefined)
              }
              className='w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
            />
          )
      }
    }

    return (
      <div className='absolute top-full left-0 mt-1 bg-white border rounded shadow-lg p-3 min-w-[200px] z-50'>
        <div className='space-y-2'>
          {renderFilterInput()}
          {currentFilter !== undefined && (
            <button
              onClick={() => clearFilter(column.key)}
              className='flex items-center gap-1 text-xs text-red-600 hover:text-red-800'
            >
              <XIcon className='h-3 w-3' />
              Очистить
            </button>
          )}
        </div>
      </div>
    )
  }
  const renderCell = (ad: any, column: ColumnConfig) => {
    const { key } = column

    switch (key) {
      case 'url':
        const { domain, url } = formatUrlForDisplay(ad.url)
        return (
          <a
            href={url}
            target='_blank'
            rel='noopener noreferrer'
            className='text-blue-600 hover:underline'
          >
            {domain}
          </a>
        )

      case 'price':
        return (
          <div className='flex items-center gap-1'>
            <span>{formatPrice(ad.price)}</span>
            {/* <AdChangesHistory
              adId={ad.id}
              currentPrice={ad.price}
              trigger='click'
              chartType='price'
            /> */}
          </div>
        )

      case 'rooms':
        return ad.rooms && ad.rooms > 0 ? ad.rooms.toString() : '\u00A0'

      case 'floor':
        return ad.floor && ad.floor > 0 ? ad.floor.toString() : '\u00A0'

      case 'totalFloors':
        return ad.totalFloors && ad.totalFloors > 0
          ? ad.totalFloors.toString()
          : '\u00A0'

      case 'viewsToday':
        return (
          <div className='flex items-center gap-1'>
            <span>{formatViews(ad.viewsToday)}</span>
            {/* <AdChangesHistory
              adId={ad.id}
              currentViewsToday={ad.viewsToday}
              trigger='hover'
              chartType='views'
            /> */}
          </div>
        )

      case 'status':
        const statusIsOld = isStatusOld(ad.updatedAt)
        const status = ad.status ?? ad.is_active
        const statusUpdateDate = formatDateShort(ad.updatedAt || ad.updated_at)
        return (
          <div className='flex items-center justify-center gap-1'>
            {status ? (
              <span
                className={`text-green-600 font-semibold ${statusIsOld ? 'opacity-30' : ''}`}
              >
                ✓
              </span>
            ) : (
              <span
                className={`text-red-600 font-bold text-lg ${statusIsOld ? 'opacity-30' : ''}`}
              >
                −
              </span>
            )}
            {statusUpdateDate && (
              <span className='text-xs text-muted-foreground'>
                {statusUpdateDate}
              </span>
            )}
          </div>
        )

      case 'createdAt':
        return formatDate(ad.createdAt || ad.created)
      case 'updatedAt':
        // Показываем только дату обновления от источника, исключаем updated_at из пользовательской таблицы
        const sourceUpdatedValue = ad.updated || ad.time_source_updated
        console.log('updatedAt debug (source only):', {
          adId: ad.id,
          updated: ad.updated,
          time_source_updated: ad.time_source_updated,
          finalValue: sourceUpdatedValue,
        })
        return formatDate(sourceUpdatedValue)

      case 'distance':
        return formatDistance(ad.distance_m || ad.distance)

      case 'personType':
        return (
          ad.person_type || formatPersonType(ad.person_type_id || ad.personType)
        )

      case 'area':
      case 'totalArea':
      case 'livingArea':
        const area = ad.area || ad.totalArea || ad.livingArea || ad[key]
        return area ? Number(area).toFixed(1) : '\u00A0'

      case 'kitchenArea':
        const kitchenArea = ad.kitchenArea || ad.kitchen_area
        return kitchenArea ? Number(kitchenArea).toFixed(1) : '\u00A0'

      case 'bathroom':
      case 'balcony':
      case 'renovation':
      case 'houseType':
      case 'metroStation':
      case 'metroTime':
      case 'tags':
      case 'description':
        const value = ad[key]
        return value && value !== 'null' ? value : '\u00A0'

      case 'constructionYear':
        return ad.constructionYear && ad.constructionYear > 0
          ? ad.constructionYear.toString()
          : '\u00A0'

      case 'ceilingHeight':
        return ad.ceilingHeight ? `${ad.ceilingHeight} м` : '\u00A0'

      case 'furniture':
        if (
          ad.furniture === null ||
          ad.furniture === undefined ||
          ad.furniture === 'null'
        )
          return '\u00A0'
        return ad.furniture ? 'Есть' : 'Нет'

      default:
        const defaultValue = ad[key]
        return defaultValue && defaultValue !== 'null'
          ? defaultValue.toString()
          : '\u00A0'
    }
  }

  if (ads.length === 0) {
    return (
      <div className='rounded-lg border'>
        <div className='relative w-full overflow-auto'>
          <table className='w-full caption-bottom text-sm'>
            <thead className='[&_tr]:border-b'>
              <tr className='border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted'>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`h-10 sm:h-12 px-1 sm:px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 ${column.className || ''}`}
                  >
                    {column.label}
                  </th>
                ))}
                {showActions && (
                  <th className='h-10 sm:h-12 px-2 sm:px-4 text-center align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 w-20 sm:w-32'>
                    Действия
                  </th>
                )}
              </tr>
            </thead>
            <tbody className='[&_tr:last-child]:border-0'>
              <tr
                key='empty-row'
                className='border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted'
              >
                <td
                  className='p-2 sm:p-4 align-middle [&:has([role=checkbox])]:pr-0'
                  colSpan={
                    columns.length +
                    (showComparison ? 1 : 0) +
                    (showActions ? 1 : 0)
                  }
                >
                  <div className='text-xs sm:text-sm text-center'>
                    Нет объявлений
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div ref={tableRef} className='rounded-lg border'>
      <div className='relative w-full overflow-auto'>
        <table className='w-full caption-bottom text-sm'>
          <thead className='[&_tr]:border-b'>
            <tr className='border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted'>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`h-10 sm:h-12 px-1 sm:px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 ${column.className || ''} relative`}
                >
                  <div className='flex items-center gap-1'>
                    <div
                      className={`flex items-center gap-1 text-xs sm:text-sm ${column.sortable ? 'cursor-pointer hover:text-foreground select-none' : ''}`}
                      onClick={() => column.sortable && handleSort(column.key)}
                    >
                      {column.label}
                      {column.sortable && (
                        <div className='flex flex-col'>
                          {sortConfig?.key === column.key ? (
                            sortConfig.direction === 'asc' ? (
                              <ChevronUpIcon className='h-3 w-3' />
                            ) : (
                              <ChevronDownIcon className='h-3 w-3' />
                            )
                          ) : (
                            <div className='flex flex-col opacity-50'>
                              <ChevronUpIcon className='h-3 w-3 -mb-1' />
                              <ChevronDownIcon className='h-3 w-3' />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {column.filterable && (
                      <button
                        onClick={() => handleFilterToggle(column.key)}
                        className={`p-1 rounded hover:bg-gray-100 ${
                          filters[column.key] !== undefined
                            ? 'text-blue-600'
                            : 'text-gray-400'
                        }`}
                      >
                        <FilterIcon className='h-3 w-3' />
                      </button>
                    )}
                  </div>
                  {column.filterable && renderFilterDropdown(column)}
                </th>
              ))}
              {showComparison && (
                <th className='h-12 px-2 sm:px-4 text-center align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 w-8 sm:w-12'>
                  <span className='hidden sm:inline'>Сравнить</span>
                  <span className='sm:hidden'>Сравн.</span>
                </th>
              )}
              {showActions && (
                <th className='h-12 px-2 sm:px-4 text-center align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 w-20 sm:w-32'>
                  Действия
                </th>
              )}
            </tr>
          </thead>
          <tbody className='[&_tr:last-child]:border-0'>
            {sortedAds.map((ad) => {
              const isUpdating = updatingAdIds.has(ad.id)
              const isUpdatedToday = updatedTodayAdIds.has(ad.id)

              return (
                <tr
                  key={ad.id}
                  className={`border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted ${
                    !ad.status ? 'opacity-50' : ''
                  }`}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className='p-1 sm:p-2 align-middle text-xs sm:text-sm'
                    >
                      {renderCell(ad, column)}
                    </td>
                  ))}

                  {showComparison && (
                    <td className='p-1 sm:p-2 align-middle text-xs sm:text-sm'>
                      <div className='flex items-center justify-center'>
                        <button
                          type='button'
                          className={buttonVariants({
                            variant: 'outline',
                            size: 'sm',
                          })}
                          onClick={() => {
                            // If ad has an ID, it's saved in database - use toggle comparison
                            if (ad.id && typeof ad.id === 'number') {
                              onToggleComparison?.(ad.id, !ad.sma)
                            } else {
                              // If ad has no ID, it's external data - use add to comparison
                              onAddToComparison?.(ad)
                            }
                          }}
                        >
                          {ad.sma ? (
                            <MinusIcon className='h-4 w-4' />
                          ) : (
                            <PlusIcon className='h-4 w-4' />
                          )}
                        </button>
                      </div>
                    </td>
                  )}

                  {showActions && (
                    <td className='p-1 sm:p-2 align-middle text-xs sm:text-sm'>
                      <div className='flex gap-2'>
                        {/* Update button - hide during bulk update or show checkmark if updated today */}
                        {!isBulkUpdating && (
                          <>
                            {isUpdatedToday ? (
                              <div className='flex items-center justify-center w-8 h-8'>
                                <span className='text-green-600 font-semibold text-lg opacity-50'>
                                  ✓
                                </span>
                              </div>
                            ) : (
                              <button
                                type='button'
                                className={buttonVariants({
                                  variant: 'outline',
                                  size: 'sm',
                                })}
                                disabled={isUpdating}
                                onClick={() => {
                                  console.log('Update button clicked for ad:', {
                                    id: ad.id,
                                    typeof_id: typeof ad.id,
                                    ad: ad,
                                  })
                                  onUpdateAd?.(ad.id)
                                }}
                              >
                                {isUpdating ? (
                                  <div className='flex items-center gap-1'>
                                    <svg
                                      className='w-3 h-3 animate-spin'
                                      fill='none'
                                      viewBox='0 0 24 24'
                                    >
                                      <circle
                                        className='opacity-25'
                                        cx='12'
                                        cy='12'
                                        r='10'
                                        stroke='currentColor'
                                        strokeWidth='4'
                                      ></circle>
                                      <path
                                        className='opacity-75'
                                        fill='currentColor'
                                        d='m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                                      ></path>
                                    </svg>
                                  </div>
                                ) : (
                                  <RefreshCwIcon className='h-4 w-4' />
                                )}
                              </button>
                            )}
                          </>
                        )}

                        {/* Show spinner during bulk update for currently updating ad */}
                        {isBulkUpdating && isUpdating && (
                          <div className='flex items-center justify-center w-8 h-8'>
                            <svg
                              className='w-4 h-4 animate-spin'
                              fill='none'
                              viewBox='0 0 24 24'
                            >
                              <circle
                                className='opacity-25'
                                cx='12'
                                cy='12'
                                r='10'
                                stroke='currentColor'
                                strokeWidth='4'
                              ></circle>
                              <path
                                className='opacity-75'
                                fill='currentColor'
                                d='m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                              ></path>
                            </svg>
                          </div>
                        )}

                        {/* Show checkmark during bulk update for completed ad */}
                        {isBulkUpdating && !isUpdating && isUpdatedToday && (
                          <div className='flex items-center justify-center w-8 h-8'>
                            <span className='text-green-600 font-semibold text-lg opacity-50'>
                              ✓
                            </span>
                          </div>
                        )}

                        {showDelete && (
                          <button
                            type='button'
                            className={buttonVariants({
                              variant: 'outline',
                              size: 'sm',
                            })}
                            onClick={() => onDeleteAd?.(ad.id)}
                          >
                            <TrashIcon className='h-4 w-4' />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {Object.keys(filters).length > 0 && (
        <div className='p-3 border-t bg-gray-50'>
          <button
            onClick={clearAllFilters}
            className='text-xs text-red-600 hover:text-red-800 flex items-center gap-1'
          >
            <XIcon className='h-3 w-3' />
            Очистить все фильтры ({Object.keys(filters).length})
          </button>
        </div>
      )}
    </div>
  )
}
