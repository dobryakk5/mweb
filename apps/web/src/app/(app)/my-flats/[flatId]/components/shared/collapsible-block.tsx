'use client'

import cn from '@acme/ui/utils/cn'
import { ChevronUpIcon, ChevronDownIcon } from '@acme/ui/components/icon'
import type { CollapsibleBlockProps } from '../types/ads-blocks.types'

/**
 * Reusable collapsible block component
 */
export default function CollapsibleBlock({
  title,
  isCollapsed,
  onToggle,
  children,
  headerActions,
  className,
}: CollapsibleBlockProps) {
  return (
    <div className={cn('py-4 px-4 bg-gray-50 rounded-lg mb-4', className)}>
      <div className='flex items-center justify-between mb-4'>
        <div
          className='flex items-center gap-2 cursor-pointer hover:text-blue-600'
          onClick={onToggle}
        >
          {typeof title === 'string' ? (
            <h3 className='text-lg font-medium'>{title}</h3>
          ) : (
            <div className='text-lg font-medium'>{title}</div>
          )}
          {isCollapsed ? (
            <ChevronDownIcon className='w-5 h-5' />
          ) : (
            <ChevronUpIcon className='w-5 h-5' />
          )}
        </div>
        {headerActions && (
          <div className='flex items-center gap-2'>{headerActions}</div>
        )}
      </div>

      {!isCollapsed && children}
    </div>
  )
}
