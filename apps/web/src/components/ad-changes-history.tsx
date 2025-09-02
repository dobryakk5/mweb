'use client'

import { useState } from 'react'
import Popover from '@acme/ui/components/popover'
import Tooltip from '@acme/ui/components/tooltip'
import Button from '@acme/ui/components/button'
import Skeleton from '@acme/ui/components/skeleton'
import { TrendingUp } from '@acme/ui/components/icon'
import { useAdHistory, type AdHistoryItem } from '@/domains/ads/hooks/use-ad-history'

interface AdChangesHistoryProps {
  adId: number
  currentPrice?: number
  currentViewsToday?: number
  currentTotalViews?: number
  trigger?: 'hover' | 'click'
  children?: React.ReactNode
}

function HistoryContent({ 
  history, 
  isLoading, 
  currentPrice, 
  currentViewsToday, 
  currentTotalViews 
}: {
  history: AdHistoryItem[]
  isLoading: boolean
  currentPrice?: number
  currentViewsToday?: number
  currentTotalViews?: number
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
      <div className="text-sm text-muted-foreground p-2 w-80">
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

  const getTrackingTypeLabel = (type: string) => {
    switch (type) {
      case 'manual_update': return 'Ручное обновление'
      case 'parsing_update': return 'Автообновление'
      case 'daily_tracking': return 'Ежедневное отслеживание'
      default: return type
    }
  }

  // Группируем изменения по дням
  const groupedHistory = history.reduce((groups, item) => {
    const date = new Date(item.createdAt).toLocaleDateString('ru-RU')
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(item)
    return groups
  }, {} as Record<string, AdHistoryItem[]>)

  return (
    <div className="w-80 max-h-96 overflow-y-auto">
      <div className="space-y-3">
        {Object.entries(groupedHistory).map(([date, items]) => (
          <div key={date} className="space-y-2">
            <h4 className="text-sm font-medium text-foreground border-b pb-1">
              {date}
            </h4>
            {items.map((item, index) => (
              <div key={item.id} className="text-xs space-y-1 p-2 rounded bg-muted/50">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    {formatDate(item.createdAt)}
                  </span>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                    {getTrackingTypeLabel(item.trackingType)}
                  </span>
                </div>
                
                <div className="space-y-1">
                  {item.price !== undefined && (
                    <div className="flex justify-between">
                      <span>Цена:</span>
                      <span className="font-medium">{formatPrice(item.price)}</span>
                    </div>
                  )}
                  {item.viewsToday !== undefined && (
                    <div className="flex justify-between">
                      <span>Просмотры сегодня:</span>
                      <span className="font-medium">{item.viewsToday}</span>
                    </div>
                  )}
                  {item.totalViews !== undefined && (
                    <div className="flex justify-between">
                      <span>Всего просмотров:</span>
                      <span className="font-medium">{item.totalViews}</span>
                    </div>
                  )}
                  {item.status && (
                    <div className="flex justify-between">
                      <span>Статус:</span>
                      <span className="font-medium">{item.status}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      
      {/* Показываем текущие значения */}
      {(currentPrice || currentViewsToday || currentTotalViews) && (
        <div className="mt-3 pt-3 border-t">
          <h4 className="text-sm font-medium mb-2">Текущие значения</h4>
          <div className="text-xs space-y-1 p-2 rounded bg-primary/5">
            {currentPrice && (
              <div className="flex justify-between">
                <span>Цена:</span>
                <span className="font-medium">{formatPrice(currentPrice)}</span>
              </div>
            )}
            {currentViewsToday !== undefined && (
              <div className="flex justify-between">
                <span>Просмотры сегодня:</span>
                <span className="font-medium">{currentViewsToday}</span>
              </div>
            )}
            {currentTotalViews !== undefined && (
              <div className="flex justify-between">
                <span>Всего просмотров:</span>
                <span className="font-medium">{currentTotalViews}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdChangesHistory({
  adId,
  currentPrice,
  currentViewsToday,
  currentTotalViews,
  trigger = 'hover',
  children
}: AdChangesHistoryProps) {
  const { data: history = [], isLoading } = useAdHistory(adId)
  const [isOpen, setIsOpen] = useState(false)

  const defaultTrigger = children || (
    <Button 
      variant="outline" 
      size="sm"
      className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
    >
      <TrendingUp className="h-4 w-4" />
    </Button>
  )

  const historyContent = (
    <div className="space-y-2 p-3">
      <h3 className="font-semibold text-sm">История изменений</h3>
      <HistoryContent 
        history={history}
        isLoading={isLoading}
        currentPrice={currentPrice}
        currentViewsToday={currentViewsToday}
        currentTotalViews={currentTotalViews}
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