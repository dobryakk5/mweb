'use client'

import { useState } from 'react'
import { buttonVariants } from '@acme/ui/components/button'
import { DownloadIcon, SendIcon } from '@acme/ui/components/icon'
import CollapsibleBlock from '../shared/collapsible-block'
import AdsTable from '../shared/ads-table'
import { MultiUpdateButtons } from '../shared/update-buttons'
import AddAdForm from '../add-ad-form'
import AdChangesHistory from '@/components/ad-changes-history'
import type {
  ComparisonAdsBlockProps,
  ColumnConfig,
} from '../types/ads-blocks.types'
import {
  formatPrice,
  formatDate,
  formatViews,
  formatArea,
  formatBoolean,
} from '../utils/ad-formatters'

/**
 * Block component for comparison ads (sma = 1)
 */
export default function ComparisonAdsBlock({
  flat,
  ads,
  expandedView,
  onToggleExpandedView,
  isCollapsed,
  onToggleCollapse,
  onUpdate,
  isUpdating,
  onDeleteAd,
  onUpdateAd,
  updatingAdIds,
  onExportToExcel,
  onSendToTelegram,
  showAddAdForm,
  onToggleAddAdForm,
}: ComparisonAdsBlockProps) {
  const getColumns = (): ColumnConfig[] => {
    if (expandedView) {
      return [
        { key: 'url', label: 'URL', className: 'w-40' },
        { key: 'price', label: 'Цена' },
        { key: 'rooms', label: 'Комнаты' },
        { key: 'totalArea', label: 'Общая пл.' },
        { key: 'livingArea', label: 'Жилая пл.' },
        { key: 'kitchenArea', label: 'Кухня пл.' },
        { key: 'floor', label: 'Этаж' },
        { key: 'totalFloors', label: 'Всего этажей' },
        { key: 'bathroom', label: 'Санузел' },
        { key: 'balcony', label: 'Балкон' },
        { key: 'renovation', label: 'Ремонт' },
        { key: 'furniture', label: 'Мебель' },
        { key: 'constructionYear', label: 'Год' },
        { key: 'houseType', label: 'Тип дома' },
        { key: 'ceilingHeight', label: 'Высота потолков' },
        { key: 'metroStation', label: 'Метро' },
        { key: 'metroTime', label: 'Время до метро' },
        { key: 'tags', label: 'Теги' },
        { key: 'description', label: 'Описание' },
        { key: 'status', label: 'Статус' },
        { key: 'viewsToday', label: 'Просмотры на дату' },
      ]
    } else {
      return [
        { key: 'url', label: 'URL', className: 'max-w-96' },
        { key: 'price', label: 'Цена' },
        { key: 'viewsToday', label: 'Просмотры сегодня' },
        { key: 'status', label: 'Статус' },
        { key: 'updatedAt', label: 'Обновлено' },
      ]
    }
  }

  const headerActions = (
    <>
      <button
        type='button'
        className={buttonVariants({
          variant: expandedView ? 'default' : 'outline',
          size: 'sm',
        })}
        onClick={onToggleExpandedView}
      >
        {expandedView ? 'Компактный вид' : 'Расширенный вид'}
      </button>
      <div className='flex gap-1'>
        <button
          type='button'
          className={buttonVariants({
            variant: 'outline',
            size: 'sm',
          })}
          onClick={onExportToExcel}
          disabled={ads.length === 0}
        >
          <DownloadIcon className='h-4 w-4 mr-2' />
          Экспорт Excel
        </button>
        {onSendToTelegram && (
          <button
            type='button'
            className={buttonVariants({
              variant: 'outline',
              size: 'sm',
            })}
            onClick={onSendToTelegram}
            disabled={ads.length === 0}
            title='Отправить в Telegram'
          >
            <SendIcon className='h-4 w-4' />
          </button>
        )}
      </div>
      <MultiUpdateButtons
        onUpdate={onUpdate}
        isUpdating={isUpdating}
        label='Обновить'
      />
      <button
        type='button'
        className={buttonVariants({
          variant: 'secondary',
          size: 'sm',
        })}
        onClick={onToggleAddAdForm}
      >
        {showAddAdForm ? 'Скрыть форму' : 'Добавить в сравнение'}
      </button>
    </>
  )

  return (
    <CollapsibleBlock
      title='Сравнение квартир'
      isCollapsed={isCollapsed}
      onToggle={onToggleCollapse}
      headerActions={headerActions}
    >
      {/* Форма добавления объявления */}
      {showAddAdForm && flat && (
        <div className='mb-6 p-4 border rounded-lg bg-muted/50'>
          <h4 className='text-md font-medium mb-4'>Новое объявление</h4>
          <AddAdForm
            flatId={flat.id}
            flatAddress={flat.address}
            flatRooms={flat.rooms}
            onSuccess={onToggleAddAdForm}
          />
        </div>
      )}

      {/* Таблица объявлений сравнения */}
      <AdsTable
        ads={ads}
        columns={getColumns()}
        expandedView={expandedView}
        onDeleteAd={onDeleteAd}
        onUpdateAd={onUpdateAd}
        updatingAdIds={updatingAdIds}
        showActions={true}
        showComparison={false} // No comparison toggle in comparison block
      />
    </CollapsibleBlock>
  )
}
