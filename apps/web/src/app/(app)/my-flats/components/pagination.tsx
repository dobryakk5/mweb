'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

import { buttonVariants } from '@acme/ui/components/button'
import { useUserFlatsCount } from '@/domains/flats/hooks/queries'

interface PaginationProps {
  className?: string
  tgUserId: number
}

export default function Pagination({ className, tgUserId }: PaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const search = searchParams?.get('search') || ''
  const page = Number.parseInt(searchParams?.get('page') || '1')

  const { data: countData } = useUserFlatsCount(tgUserId, { search })

  const total = countData?.total || 0
  const totalPages = Math.ceil(total / 15)

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(name, value)

      return params.toString()
    },
    [searchParams],
  )

  if (totalPages <= 1) return null

  return (
    <div className={`flex items-center justify-between px-4 py-3 lg:px-5 ${className}`}>
      <div className='flex w-[100px] items-center justify-start text-sm font-medium'>
        Показано {Math.min((page - 1) * 15 + 1, total)} - {Math.min(page * 15, total)} из {total}
      </div>

      <div className='flex items-center space-x-2'>
        <button
          className={buttonVariants({
            variant: 'outline',
            size: 'sm',
            className: 'h-8 w-8 p-0',
          })}
          disabled={page === 1}
          onClick={() => router.push(`?${createQueryString('page', String(page - 1))}`)}
        >
          <svg className='size-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
          </svg>
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1))
          .map((p, index, array) => (
            <div key={p} className='flex items-center'>
              {index > 0 && array[index - 1] !== p - 1 && (
                <span className='px-2 text-sm text-muted-foreground'>...</span>
              )}
              <button
                className={buttonVariants({
                  variant: p === page ? 'default' : 'outline',
                  size: 'sm',
                  className: 'h-8 w-8 p-0',
                })}
                onClick={() => router.push(`?${createQueryString('page', String(p))}`)}
              >
                {p}
              </button>
            </div>
          ))}

        <button
          className={buttonVariants({
            variant: 'outline',
            size: 'sm',
            className: 'h-8 w-8 p-0',
          })}
          disabled={page === totalPages}
          onClick={() => router.push(`?${createQueryString('page', String(page + 1))}`)}
        >
          <svg className='size-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
          </svg>
        </button>
      </div>
    </div>
  )
}
