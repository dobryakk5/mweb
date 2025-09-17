'use client'

import { buttonVariants } from '@acme/ui/components/button'
import { TrashIcon, PlusIcon, MinusIcon, RefreshCwIcon } from '@acme/ui/components/icon'
import AdChangesHistory from '@/components/ad-changes-history'
import type { AdsTableProps, ColumnConfig } from '../types/ads-blocks.types'
import {
  formatPrice,
  formatDate,
  formatViews,
  formatStatus,
  formatUrlForDisplay,
  formatDistance,
  formatPersonType
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
  onUpdateAd,
  updatingAdIds = new Set(),
  showActions = true,
  showComparison = true
}: AdsTableProps) {
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
            <AdChangesHistory
              adId={ad.id}
              currentPrice={ad.price}
              trigger="click"
              chartType="price"
            />
          </div>
        )

      case 'rooms':
        return ad.rooms?.toString() || '—'

      case 'floor':
        return ad.floor?.toString() || '—'

      case 'totalFloors':
        return ad.totalFloors?.toString() || '—'

      case 'viewsToday':
        return (
          <div className='flex items-center gap-1'>
            <span>{formatViews(ad.viewsToday)}</span>
            <AdChangesHistory
              adId={ad.id}
              currentViewsToday={ad.viewsToday}
              trigger="hover"
              chartType="views"
            />
          </div>
        )

      case 'status':
        return (
          <div className='flex items-center justify-center'>
            {ad.status ? (
              <span className='text-green-600 font-semibold'>✓</span>
            ) : (
              <span className='text-red-600 font-bold text-lg'>−</span>
            )}
          </div>
        )

      case 'createdAt':
      case 'updatedAt':
        return formatDate(ad[key])

      case 'distance':
        return formatDistance(ad.distance_m || ad.distance)

      case 'personType':
        return formatPersonType(ad.person_type_id || ad.personType)

      case 'area':
      case 'totalArea':
      case 'livingArea':
      case 'kitchenArea':
        const area = ad[key]
        return area ? area.toString() : '—'

      case 'bathroom':
      case 'balcony':
      case 'renovation':
      case 'houseType':
      case 'metroStation':
      case 'metroTime':
      case 'tags':
      case 'description':
        return ad[key] || '—'

      case 'constructionYear':
        return ad.constructionYear?.toString() || '—'

      case 'ceilingHeight':
        return ad.ceilingHeight ? `${ad.ceilingHeight} м` : '—'

      case 'furniture':
        return ad.furniture ? 'Есть' : 'Нет'

      default:
        return ad[key]?.toString() || '—'
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
                    className={`h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 ${column.className || ''}`}
                  >
                    {column.label}
                  </th>
                ))}
                {showActions && (
                  <th className='h-12 px-4 text-center align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 w-32'>
                    Действия
                  </th>
                )}
              </tr>
            </thead>
            <tbody className='[&_tr:last-child]:border-0'>
              <tr className='border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted'>
                <td
                  className='p-4 align-middle [&:has([role=checkbox])]:pr-0'
                  colSpan={columns.length + (showActions ? 1 : 0)}
                >
                  <div className='text-sm text-center'>Нет объявлений</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className='rounded-lg border'>
      <div className='relative w-full overflow-auto'>
        <table className='w-full caption-bottom text-sm'>
          <thead className='[&_tr]:border-b'>
            <tr className='border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted'>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 ${column.className || ''}`}
                >
                  {column.label}
                </th>
              ))}
              {showComparison && (
                <th className='h-12 px-4 text-center align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 w-12'>
                  Сравнить
                </th>
              )}
              {showActions && (
                <th className='h-12 px-4 text-center align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 w-32'>
                  Действия
                </th>
              )}
            </tr>
          </thead>
          <tbody className='[&_tr:last-child]:border-0'>
            {ads.map((ad) => {
              const isUpdating = updatingAdIds.has(ad.id)

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
                      className='p-2 align-middle text-sm'
                    >
                      {renderCell(ad, column)}
                    </td>
                  ))}

                  {showComparison && (
                    <td className='p-2 align-middle text-sm'>
                      <div className='flex items-center justify-center'>
                        <button
                          type='button'
                          className={buttonVariants({
                            variant: ad.sma ? 'default' : 'outline',
                            size: 'sm',
                          })}
                          onClick={() => onToggleComparison?.(ad.id, !ad.sma)}
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
                    <td className='p-2 align-middle text-sm'>
                      <div className='flex gap-2'>
                        <button
                          type='button'
                          className={buttonVariants({
                            variant: 'outline',
                            size: 'sm',
                          })}
                          disabled={isUpdating}
                          onClick={() => onUpdateAd?.(ad.id)}
                        >
                          {isUpdating ? (
                            <div className='flex items-center gap-1'>
                              <svg className='w-3 h-3 animate-spin' fill='none' viewBox='0 0 24 24'>
                                <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                                <path className='opacity-75' fill='currentColor' d='m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                              </svg>
                            </div>
                          ) : (
                            <RefreshCwIcon className='h-4 w-4' />
                          )}
                        </button>

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
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}