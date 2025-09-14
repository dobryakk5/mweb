'use client'

import { useState } from 'react'
import Popover from '@acme/ui/components/popover'
import Tooltip from '@acme/ui/components/tooltip'
import Button from '@acme/ui/components/button'
import Skeleton from '@acme/ui/components/skeleton'
import { TrendingUp } from '@acme/ui/components/icon'
import { useAdHistory, useMultipleAdHistory, usePriceChanges, useMultiplePriceChanges, type AdHistoryItem, type PriceChangeItem } from '@/domains/ads/hooks/use-ad-history'
import TrendChart from './trend-chart'

interface AdChangesHistoryProps {
  adId: number | number[] // Может быть одно объявление или массив для агрегации
  currentPrice?: number
  currentViewsToday?: number
  trigger?: 'hover' | 'click'
  children?: React.ReactNode
  chartType?: 'price' | 'views' // Тип графика для отображения
}

function HistoryContent({ 
  history, 
  priceChanges,
  isLoading, 
  currentPrice, 
  currentViewsToday,
  chartType
}: {
  history: AdHistoryItem[]
  priceChanges: PriceChangeItem[]
  isLoading: boolean
  currentPrice?: number
  currentViewsToday?: number
  chartType?: 'price' | 'views'
}) {
  if (isLoading) {
    return (
      <div className="space-y-2 w-80">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    )
  }

  if (!history?.length) {
    return (
      <div className="text-sm text-muted-foreground p-2 w-96 text-center py-8">
        История изменений пуста
      </div>
    )
  }

  const formatPrice = (price?: number) => {
    if (!price) return '—'
    return price.toLocaleString('ru-RU') + ' ₽'
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Группируем изменения по дням
  const groupedHistory = history.reduce((groups, item) => {
    const date = new Date(item.recordedAt).toLocaleDateString('ru-RU')
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(item)
    return groups
  }, {} as Record<string, AdHistoryItem[]>)

  // Подготавливаем данные для графика в зависимости от типа
  const getChartData = () => {
    if (chartType === 'price') {
      // График цен - используем данные из flats_changes если есть, иначе из history
      const priceData = priceChanges && priceChanges.length > 0 
        ? priceChanges
            .filter(item => item.price !== undefined && item.price !== null)
            .map(item => ({
              date: item.date,
              value: item.price
            }))
        : history
            .filter(item => item.price !== undefined && item.price !== null)
            .map(item => ({
              date: item.recordedAt,
              value: item.price!
            }))
      
      // Добавляем текущую цену если есть
      if (currentPrice) {
        priceData.push({
          date: new Date().toISOString(),
          value: currentPrice
        })
      }
      
      return priceData
    } else {
      // График просмотров - используем данные из history  
      const viewsData = history
        .filter(item => item.viewsToday !== undefined && item.viewsToday !== null)
        .map(item => ({
          date: item.recordedAt,
          value: item.viewsToday!
        }))
      
      // Добавляем текущие просмотры если есть
      if (currentViewsToday !== undefined && currentViewsToday !== null) {
        viewsData.push({
          date: new Date().toISOString(),
          value: currentViewsToday
        })
      }
      
      return viewsData
    }
  }

  const chartData = getChartData()
  const title = chartType === 'price' ? 'Динамика цены' : 'Динамика просмотров'

  return (
    <div className="w-96">
      {chartData.length > 1 ? (
        <TrendChart
          data={chartData}
          title={title}
          type={chartType || 'price'}
          width={350}
          height={250}
        />
      ) : (
        <div className="text-center text-muted-foreground text-sm py-8">
          {chartData.length === 1 
            ? 'Недостаточно данных для графика (нужно минимум 2 точки)'
            : 'Нет данных для отображения графика'
          }
        </div>
      )}
    </div>
  )
}

export default function AdChangesHistory({
  adId,
  currentPrice,
  currentViewsToday,
  trigger = 'hover',
  children,
  chartType = 'price'
}: AdChangesHistoryProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Определяем, какой хук использовать в зависимости от типа adId
  const singleAdQuery = useAdHistory(typeof adId === 'number' ? adId : 0)
  const multipleAdQuery = useMultipleAdHistory(Array.isArray(adId) ? adId : [])
  
  // Загружаем данные об изменениях цены из flats_changes
  const singlePriceQuery = usePriceChanges(typeof adId === 'number' ? adId : 0)
  const multiplePriceQuery = useMultiplePriceChanges(Array.isArray(adId) ? adId : [])
  
  const { data: history = [], isLoading } = Array.isArray(adId) ? multipleAdQuery : singleAdQuery
  const { data: priceChanges = [], isLoading: isPriceLoading } = Array.isArray(adId) ? multiplePriceQuery : singlePriceQuery
  
  const isDataLoading = isLoading || isPriceLoading

  const defaultTrigger = children || (
    <button 
      className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 12L6 8L10 10L14 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="2" cy="12" r="1.5" fill="currentColor"/>
        <circle cx="6" cy="8" r="1.5" fill="currentColor"/>
        <circle cx="10" cy="10" r="1.5" fill="currentColor"/>
        <circle cx="14" cy="6" r="1.5" fill="currentColor"/>
      </svg>
    </button>
  )

  const historyContent = (
    <div className="space-y-2 p-3">
      <h3 className="font-semibold text-sm">История изменений</h3>
      <HistoryContent 
        history={history}
        priceChanges={priceChanges}
        isLoading={isDataLoading}
        currentPrice={currentPrice}
        currentViewsToday={currentViewsToday}
        chartType={chartType}
      />
    </div>
  )

  if (trigger === 'hover') {
    return (
      <Tooltip content={historyContent} side="top">
        {defaultTrigger}
      </Tooltip>
    )
  }

  return (
    <Popover
      content={historyContent}
      openPopover={isOpen}
      setOpenPopover={setIsOpen}
    >
      {defaultTrigger}
    </Popover>
  )
}