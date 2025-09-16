'use client'

import { buttonVariants } from '@acme/ui/components/button'
import { PlusIcon } from '@acme/ui/components/icon'
import CollapsibleBlock from '../shared/collapsible-block'
import { RefreshNearbyButton } from '../shared/update-buttons'
import type { NearbyAdsBlockProps, ColumnConfig } from '../types/ads-blocks.types'
import { formatPrice, formatDate, formatDistance, formatPersonType } from '../utils/ad-formatters'

/**
 * Block component for nearby ads within 500m radius
 */
export default function NearbyAdsBlock({
  flat,
  nearbyAds,
  isCollapsed,
  onToggleCollapse,
  onRefetch,
  isLoading,
  onAddToComparison
}: NearbyAdsBlockProps) {
  const headerActions = (
    <RefreshNearbyButton
      onRefresh={onRefetch}
      isLoading={isLoading}
    />
  )

  return (
    <CollapsibleBlock
      title="Объявления в радиусе 500м и дешевле"
      isCollapsed={isCollapsed}
      onToggle={onToggleCollapse}
      headerActions={headerActions}
    >
      <div className='overflow-hidden rounded-md border border-gray-200'>
        <div className='relative w-full overflow-auto'>
          <table className='w-full caption-bottom text-sm'>
            <thead className='[&_tr]:border-b'>
              <tr className='border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted'>
                <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                  Сайт
                </th>
                <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                  Цена, млн
                </th>
                <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                  Комнат
                </th>
                <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                  Этаж
                </th>
                <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                  Расстояние, м
                </th>
                <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                  Создано
                </th>
                <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                  Обновлено
                </th>
                <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                  Автор
                </th>
                <th className='h-12 px-4 text-center align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 w-12'>
                  Сравнить
                </th>
              </tr>
            </thead>
            <tbody className='[&_tr:last-child]:border-0'>
              {nearbyAds.length === 0 ? (
                <tr className='border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted'>
                  <td className='p-4 align-middle [&:has([role=checkbox])]:pr-0' colSpan={9}>
                    <div className='text-sm text-center'>Нет близлежащих объявлений</div>
                  </td>
                </tr>
              ) : (
                nearbyAds.map((findAdsItem, index) => {
                  const getDomainFromUrl = (url: string) => {
                    try {
                      const domain = new URL(url).hostname.toLowerCase()
                      if (domain.includes('cian.ru')) return 'cian'
                      if (domain.includes('avito.ru')) return 'avito'
                      if (domain.includes('yandex.ru') || domain.includes('realty.yandex.ru')) return 'yandex'
                      return domain.replace('www.', '')
                    } catch {
                      return url
                    }
                  }

                  return (
                    <tr
                      key={index}
                      className={`border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted ${
                        !findAdsItem.is_active ? 'opacity-50' : ''
                      }`}
                    >
                      <td className='p-2 align-middle text-sm'>
                        <a
                          href={findAdsItem.url}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-blue-600 hover:underline'
                        >
                          {getDomainFromUrl(findAdsItem.url)}
                        </a>
                      </td>
                      <td className='p-2 align-middle text-sm'>{formatPrice(findAdsItem.price)}</td>
                      <td className='p-2 align-middle text-sm'>{findAdsItem.rooms || '—'}</td>
                      <td className='p-2 align-middle text-sm'>{findAdsItem.floor || '—'}</td>
                      <td className='p-2 align-middle text-sm'>{formatDistance(findAdsItem.distance_m)}</td>
                      <td className='p-2 align-middle text-sm'>{formatDate(findAdsItem.created)}</td>
                      <td className='p-2 align-middle text-sm'>{formatDate(findAdsItem.updated)}</td>
                      <td className='p-2 align-middle text-sm'>{formatPersonType(findAdsItem.person_type)}</td>
                      <td className='p-2 align-middle text-sm'>
                        <div className='flex items-center justify-center'>
                          <button
                            type='button'
                            className={buttonVariants({
                              variant: 'outline',
                              size: 'sm',
                            })}
                            onClick={() => onAddToComparison(findAdsItem)}
                          >
                            <PlusIcon className='h-4 w-4' />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </CollapsibleBlock>
  )
}