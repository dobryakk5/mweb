'use client'

import { type JSX, Suspense } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@acme/ui/components/table'
import Skeleton from '@acme/ui/components/skeleton'
import EmptyState from '@acme/ui/components/empty-state'

import useRouterStuff from '@/hooks/use-router-stuff'
import { useUserFlats, useUserFlatsCount } from '@/domains/flats/hooks/queries'

import Search from './search'
import Pagination from './pagination'

interface ViewFlatsProps {
  tgUserId: number
}

export default function ViewFlats({ tgUserId }: ViewFlatsProps): JSX.Element {
  const { searchParams, queryParams } = useRouterStuff()
  const search = searchParams?.get('search') || ''
  const sortBy = searchParams?.get('sortBy') || undefined
  const page = Number.parseInt(searchParams?.get('page') || '1')
  const pathname = usePathname()

  const returnTo = encodeURIComponent(`${pathname}?${searchParams.toString()}`)

  const { data: flats, isLoading, error } = useUserFlats(tgUserId, { search, sortBy, page })
  
  // Добавляем логирование для отладки
  console.log('ViewFlats debug:', { tgUserId, flats, isLoading, error })

  const handleSort = (field: string) => {
    let newSortBy: string
    if (sortBy === field) {
      // Если уже сортируем по этому полю, меняем порядок на убывание
      newSortBy = `${field}_desc`
    } else if (sortBy === `${field}_desc`) {
      // Если сортируем по убыванию, переключаем на возрастание
      newSortBy = field
    } else {
      // Иначе сортируем по возрастанию
      newSortBy = field
    }
    
    queryParams({
      set: {
        sortBy: newSortBy,
        page: '1', // Сбрасываем страницу при изменении сортировки
      },
    })
  }

  // Простые SVG иконки для сортировки
  const ChevronUp = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  )

  const ChevronDown = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )

  return (
    <>
      <div className='flex gap-4 p-4 lg:px-5'>
        <Search className='max-w-sm' placeholder='Поиск квартир...' />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className='w-80 cursor-pointer hover:underline hover:decoration-2 hover:underline-offset-4'
              onClick={() => handleSort('address')}
            >
              <div className='flex items-center gap-2'>
                Адрес
                <div className='w-4 flex flex-col items-center'>
                  <ChevronUp />
                  <ChevronDown />
                </div>
              </div>
            </TableHead>
            <TableHead 
              className='text-right cursor-pointer hover:underline hover:decoration-2 hover:underline-offset-4'
              onClick={() => handleSort('rooms')}
            >
              <div className='flex items-center justify-end gap-2'>
                Комнат
                <div className='w-4 flex flex-col items-center'>
                  <ChevronUp />
                  <ChevronDown />
                </div>
              </div>
            </TableHead>
            <TableHead 
              className='text-right cursor-pointer hover:underline hover:decoration-2 hover:underline-offset-4'
              onClick={() => handleSort('floor')}
            >
              <div className='flex items-center justify-end gap-2'>
                Этаж
                <div className='w-4 flex flex-col items-center'>
                  <ChevronUp />
                  <ChevronDown />
                </div>
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {error ? (
            <TableRow>
              <TableCell colSpan={3}>
                <div className='text-red-600 text-center py-4'>
                  Ошибка загрузки данных: {error.message}
                </div>
              </TableCell>
            </TableRow>
          ) : flats && !isLoading ? (
            flats.length > 0 ? (
              flats.map(({ id, address, rooms, floor }) => (
                <Suspense key={id}>
                  <TableRow>
                    <TableCell>
                      <Link
                        className='underline-offset-4 hover:underline'
                        href={`/my-flats/${id}?returnTo=${returnTo}`}
                      >
                        {address}
                      </Link>
                    </TableCell>
                    <TableCell className='text-right'>
                      {rooms}
                    </TableCell>
                    <TableCell className='text-right'>
                      {floor}
                    </TableCell>
                  </TableRow>
                </Suspense>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3}>
                  <EmptyState
                    emoji='🏠'
                    title='Список квартир пуст'
                    description="Используйте кнопку 'Добавить квартиру'"
                  />
                </TableCell>
              </TableRow>
            )
          ) : isLoading ? (
            Array.from({ length: 15 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: This is a skeleton loader
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className='h-3 w-80 rounded-full' />
                </TableCell>
                <TableCell className='text-right'>
                  <Skeleton className='inline-flex h-3 w-12 rounded-full' />
                </TableCell>
                <TableCell className='text-right'>
                  <Skeleton className='inline-flex h-3 w-12 rounded-full' />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3}>
                <div className='text-gray-500 text-center py-4'>
                  Нет данных для отображения
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Pagination tgUserId={tgUserId} />
    </>
  )
}
