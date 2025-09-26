'use client'

import { useState } from 'react'
import { buttonVariants } from '@acme/ui/components/button'
import { PlusIcon, XIcon } from '@acme/ui/components/icon'
import CollapsibleBlock from '../shared/collapsible-block'
import AdsTable from '../shared/ads-table'
import { MultiUpdateButtons } from '../shared/update-buttons'
import type { FlatAdsBlockProps, ColumnConfig } from '../types/ads-blocks.types'

/**
 * Block component for flat-specific ads (from = 1)
 */
export default function FlatAdsBlock({
  flat,
  ads,
  isCollapsed,
  onToggleCollapse,
  onUpdate,
  isUpdating,
  isLoading = false,
  onToggleComparison,
  onUpdateAd,
  updatingAdIds,
  onFindSimilar,
  isLoadingSimilar,
  onUpdateAllOld,
  isUpdatingAllOld,
  onAddMyFlatAd,
  isAddingMyFlat = false,
  onToggleMyFlat,
  onDeleteAd,
  updatedTodayAdIds = new Set(),
}: FlatAdsBlockProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [adUrl, setAdUrl] = useState('')

  const handleAddMyFlat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adUrl.trim() || !onAddMyFlatAd) return

    try {
      await onAddMyFlatAd(adUrl.trim())
      setAdUrl('')
      setShowAddForm(false)
    } catch (error) {
      console.error('Failed to add my flat ad:', error)
    }
  }

  const columns: ColumnConfig[] = [
    {
      key: 'url',
      label: 'URL',
      className: 'w-20 sm:w-32 lg:w-40',
      filterable: true,
      filterType: 'text',
    },
    {
      key: 'price',
      label: 'Цена, млн',
      className: 'w-16 sm:w-20',
      sortable: true,
      filterable: true,
      filterType: 'number',
    },
    {
      key: 'rooms',
      label: 'Комнат',
      className: 'w-12 sm:w-16',
      sortable: true,
      filterable: true,
      filterType: 'number',
    },
    {
      key: 'floor',
      label: 'Этаж',
      className: 'w-12 sm:w-16',
      sortable: true,
      filterable: true,
      filterType: 'number',
    },
    {
      key: 'totalArea',
      label: 'Площадь',
      className: 'w-16 sm:w-20',
      sortable: true,
      filterable: true,
      filterType: 'number',
    },
    {
      key: 'kitchenArea',
      label: 'Кухня',
      className: 'w-16 sm:w-20',
      sortable: true,
      filterable: true,
      filterType: 'number',
    },
    {
      key: 'status',
      label: 'Статус',
      className: 'w-16 sm:w-20',
      filterable: true,
      filterType: 'boolean',
    },
    {
      key: 'updatedAt',
      label: 'Обновлено',
      className: 'w-20 sm:w-24',
      sortable: true,
      filterable: true,
      filterType: 'date',
    },
  ]

  const headerActions = (
    <div className='flex gap-2'>
      <MultiUpdateButtons
        onUpdate={onFindSimilar}
        isUpdating={isLoadingSimilar}
        label='Искать объявления'
      />
      <MultiUpdateButtons
        onUpdate={onUpdateAllOld}
        isUpdating={isUpdatingAllOld}
        label='Обновить статусы'
      />
    </div>
  )

  // Если нет объявлений - показываем кнопку добавления
  const hasAds = ads && ads.length > 0

  const loadingContent = (
    <div className='flex justify-center items-center py-8'>
      <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
      <span className='ml-2 text-sm text-gray-600'>
        Загружаем объявления...
      </span>
    </div>
  )

  const emptyStateContent = (
    <div className='flex flex-col items-center justify-center py-8 px-4'>
      {!showAddForm ? (
        <>
          <div className='text-center mb-4'>
            <div className='text-sm text-gray-600 mb-2'>
              По вашей квартире объявлений не найдено
            </div>
            <div className='text-xs text-gray-500'>
              Добавьте ссылку на ваше объявление для отслеживания
            </div>
          </div>
          <button
            type='button'
            className={buttonVariants({
              variant: 'secondary',
              size: 'sm',
            })}
            onClick={() => setShowAddForm(true)}
          >
            <PlusIcon className='mr-2 h-4 w-4' />
            Добавить ссылку на объявление о продаже моей квартиры
          </button>
        </>
      ) : (
        <form onSubmit={handleAddMyFlat} className='w-full max-w-md'>
          <div className='space-y-4'>
            <div className='text-center mb-4'>
              <div className='text-sm font-medium text-gray-900 mb-2'>
                Добавить ссылку на объявление
              </div>
              <div className='text-xs text-gray-500'>
                Вставьте ссылку с Циан, Авито или Яндекс.Недвижимости
              </div>
            </div>
            <div>
              <input
                type='url'
                value={adUrl}
                onChange={(e) => setAdUrl(e.target.value)}
                placeholder='https://cian.ru/...'
                className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm'
                disabled={isAddingMyFlat}
                required
              />
            </div>
            <div className='flex gap-2'>
              <button
                type='submit'
                disabled={isAddingMyFlat || !adUrl.trim()}
                className={buttonVariants({
                  variant: 'default',
                  size: 'sm',
                  className: 'flex-1',
                })}
              >
                {isAddingMyFlat ? 'Добавление...' : 'Добавить'}
              </button>
              <button
                type='button'
                onClick={() => {
                  setShowAddForm(false)
                  setAdUrl('')
                }}
                disabled={isAddingMyFlat}
                className={buttonVariants({
                  variant: 'outline',
                  size: 'sm',
                })}
              >
                <XIcon className='h-4 w-4' />
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  )

  return (
    <CollapsibleBlock
      title='Объявления по этой квартире'
      isCollapsed={isCollapsed}
      onToggle={onToggleCollapse}
      headerActions={headerActions}
    >
      {isLoading ? (
        loadingContent
      ) : hasAds ? (
        <AdsTable
          ads={ads || []}
          columns={columns}
          onToggleComparison={onToggleComparison}
          onUpdateAd={onUpdateAd}
          onDeleteAd={onDeleteAd}
          updatingAdIds={updatingAdIds || new Set()}
          showActions={true}
          showComparison={true}
          showDelete={true}
          isBulkUpdating={isUpdatingAllOld}
          updatedTodayAdIds={updatedTodayAdIds}
          onToggleMyFlat={onToggleMyFlat}
          showMyFlat={true}
        />
      ) : (
        emptyStateContent
      )}
    </CollapsibleBlock>
  )
}
