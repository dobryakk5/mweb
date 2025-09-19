'use client'

import { useMemo } from 'react'
import Tooltip from '@acme/ui/components/tooltip'

interface AdChangesHistoryProps {
  adId: number | number[]
  currentPrice?: number
  currentViewsToday?: number
  trigger?: 'hover' | 'click'
  children?: React.ReactNode
  chartType?: 'price' | 'views'
}

export default function AdChangesHistory({
  adId,
  currentPrice,
  currentViewsToday,
  trigger = 'hover',
  children,
  chartType = 'price',
}: AdChangesHistoryProps) {
  // Простая иконка без функционала, чтобы избежать бесконечных циклов
  const defaultTrigger = useMemo(
    () =>
      children || (
        <button
          className='h-6 w-6 p-0 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center'
          title={`История изменений ${chartType === 'price' ? 'цены' : 'просмотров'}`}
          onClick={() => {
            console.log('История изменений временно отключена для стабильности')
          }}
        >
          <svg
            width='16'
            height='16'
            viewBox='0 0 16 16'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              d='M2 12L6 8L10 10L14 6'
              stroke='currentColor'
              strokeWidth='1.5'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
            <circle cx='2' cy='12' r='1.5' fill='currentColor' />
            <circle cx='6' cy='8' r='1.5' fill='currentColor' />
            <circle cx='10' cy='10' r='1.5' fill='currentColor' />
            <circle cx='14' cy='6' r='1.5' fill='currentColor' />
          </svg>
        </button>
      ),
    [children, chartType],
  )

  const tooltipContent = useMemo(
    () => (
      <div className='p-2 text-xs'>История изменений временно недоступна</div>
    ),
    [],
  )

  if (trigger === 'hover') {
    return (
      <Tooltip content={tooltipContent} side='top'>
        {defaultTrigger}
      </Tooltip>
    )
  }

  return defaultTrigger
}
