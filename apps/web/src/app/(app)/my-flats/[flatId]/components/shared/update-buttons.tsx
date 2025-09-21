'use client'

import { buttonVariants } from '@acme/ui/components/button'
import { RefreshCwIcon } from '@acme/ui/components/icon'
import type { UpdateButtonProps } from '../types/ads-blocks.types'

/**
 * Single update button component
 */
export function UpdateButton({
  isLoading,
  onClick,
  children,
  variant = 'outline',
  size = 'sm',
  disabled = false,
}: UpdateButtonProps) {
  return (
    <button
      type='button'
      className={buttonVariants({ variant, size })}
      disabled={isLoading || disabled}
      onClick={isLoading ? undefined : onClick}
      key={isLoading ? 'loading' : 'idle'}
    >
      {isLoading ? 'Обновление...' : children}
    </button>
  )
}

/**
 * Multiple update buttons for different sources
 */
type MultiUpdateButtonsProps = {
  onUpdate: () => Promise<void>
  isUpdating: boolean
  disabled?: boolean
  showRefreshIcon?: boolean
  label?: string
}

export function MultiUpdateButtons({
  onUpdate,
  isUpdating,
  disabled = false,
  showRefreshIcon = true,
  label = 'Обновить',
}: MultiUpdateButtonsProps) {
  return (
    <UpdateButton
      isLoading={isUpdating}
      onClick={onUpdate}
      disabled={disabled}
      variant='default'
    >
      {showRefreshIcon && !isUpdating && (
        <RefreshCwIcon className='w-4 h-4 mr-2' />
      )}
      {label}
    </UpdateButton>
  )
}

/**
 * Update all sources button
 */
type UpdateAllSourcesButtonProps = {
  onUpdateAll: () => Promise<void>
  isUpdating: boolean
  disabled?: boolean
}

export function UpdateAllSourcesButton({
  onUpdateAll,
  isUpdating,
  disabled = false,
}: UpdateAllSourcesButtonProps) {
  return (
    <UpdateButton
      isLoading={isUpdating}
      onClick={onUpdateAll}
      disabled={disabled}
      variant='default'
    >
      {!isUpdating && <RefreshCwIcon className='w-4 h-4 mr-2' />}
      Обновить все источники
    </UpdateButton>
  )
}

/**
 * Find similar ads button
 */
type FindSimilarButtonProps = {
  onFind: () => Promise<void>
  isLoading: boolean
  disabled?: boolean
  label?: string
}

export function FindSimilarButton({
  onFind,
  isLoading,
  disabled = false,
  label = 'Автопоиск',
}: FindSimilarButtonProps) {
  return (
    <UpdateButton
      isLoading={isLoading}
      onClick={onFind}
      disabled={disabled}
      variant='outline'
    >
      {isLoading ? 'Поиск...' : label}
    </UpdateButton>
  )
}

/**
 * Find by address button
 */
type FindByAddressButtonProps = {
  onFind: () => Promise<void>
  isLoading: boolean
  disabled?: boolean
}

export function FindByAddressButton({
  onFind,
  isLoading,
  disabled = false,
}: FindByAddressButtonProps) {
  return (
    <UpdateButton
      isLoading={isLoading}
      onClick={onFind}
      disabled={disabled}
      variant='outline'
    >
      {isLoading ? 'Поиск...' : 'Найти по адресу'}
    </UpdateButton>
  )
}

/**
 * Refresh nearby ads button
 */
type RefreshNearbyButtonProps = {
  onRefresh: () => Promise<void>
  isLoading: boolean
  disabled?: boolean
}

export function RefreshNearbyButton({
  onRefresh,
  isLoading,
  disabled = false,
}: RefreshNearbyButtonProps) {
  return (
    <UpdateButton
      isLoading={isLoading}
      onClick={onRefresh}
      disabled={disabled}
      variant='outline'
    >
      {isLoading ? 'Поиск...' : 'Искать еще'}
    </UpdateButton>
  )
}

/**
 * Update all old ads button
 */
type UpdateAllOldAdsButtonProps = {
  onUpdateAllOld: () => Promise<void>
  isUpdating: boolean
  disabled?: boolean
}

export function UpdateAllOldAdsButton({
  onUpdateAllOld,
  isUpdating,
  disabled = false,
}: UpdateAllOldAdsButtonProps) {
  return (
    <UpdateButton
      isLoading={isUpdating}
      onClick={onUpdateAllOld}
      disabled={disabled}
      variant='secondary'
    >
      {!isUpdating && <RefreshCwIcon className='w-4 h-4 mr-2' />}
      Обновить старые
    </UpdateButton>
  )
}
