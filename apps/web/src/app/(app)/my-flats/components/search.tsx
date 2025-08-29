'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { useDebouncedCallback } from 'use-debounce'

import { inputVariants } from '@acme/ui/components/input'

interface SearchProps {
  className?: string
  placeholder?: string
}

export default function Search({ className, placeholder }: SearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(name, value)

      return params.toString()
    },
    [searchParams],
  )

  const debouncedSearch = useDebouncedCallback((term: string) => {
    startTransition(() => {
      router.push(`?${createQueryString('search', term)}`)
    })
  }, 300)

  return (
    <div className={`relative w-full shrink-0 ${className}`}>
      <div className='pointer-events-none absolute inset-y-0 left-3 flex'>
        <svg
          className='size-4 self-center text-muted-foreground'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
          />
        </svg>
      </div>
      <input
        className={inputVariants({ className: 'pl-10' })}
        defaultValue={searchParams?.get('search') ?? ''}
        onChange={(e) => debouncedSearch(e.target.value)}
        placeholder={placeholder}
        type='text'
      />
      {isPending && (
        <div className='pointer-events-none absolute inset-y-0 right-3 flex'>
          <svg
            className='size-4 self-center animate-spin text-muted-foreground'
            fill='none'
            viewBox='0 0 24 24'
          >
            <circle
              className='opacity-25'
              cx='12'
              cy='12'
              r='10'
              stroke='currentColor'
              strokeWidth='4'
            />
            <path
              className='opacity-75'
              d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
              fill='currentColor'
            />
          </svg>
        </div>
      )}
    </div>
  )
}
