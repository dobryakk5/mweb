'use client'

import { useEffect, useMemo, useState, type JSX } from 'react'

import Page from '@acme/ui/components/page'
import Card from '@acme/ui/components/card'
import Skeleton from '@acme/ui/components/skeleton'
import Button from '@acme/ui/components/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@acme/ui/components/table'

import {
  useDistrictsQuery,
  useDistrictStatsQuery,
} from '@/domains/districts/hooks'
import type {
  DistrictStatsResponse,
  ListingStat,
  RoomStat,
} from '@/domains/districts/types'

const numberFormatter = new Intl.NumberFormat('ru-RU')

const formatPrice = (
  value: number | null | undefined,
  suffix = '₽',
): string => {
  if (!value || Number.isNaN(value)) {
    return '—'
  }

  return `${numberFormatter.format(Math.round(value))} ${suffix}`
}

const formatRooms = (rooms: number): string => {
  if (rooms <= 0) {
    return 'Студия'
  }

  return `${rooms}-комн.`
}

const formatDate = (value: string | null): string => {
  if (!value) {
    return 'Дата обновления неизвестна'
  }

  return new Date(value).toLocaleString('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

const EXCLUDED_ADMIN_OKRUGS = ['ТАО (Троицкий)', 'НАО', 'ЗелАО']

const ListingCard = ({ listing }: { listing: ListingStat }) => {
  return (
    <Card className='flex h-full flex-col justify-between'>
      <Card.Header>
        <Card.Title>{listing.address}</Card.Title>
        <Card.Description>
          {formatRooms(listing.rooms)} •{' '}
          {listing.area ? `${listing.area} м²` : 'Площадь не указана'}
        </Card.Description>
      </Card.Header>

      <Card.Content className='space-y-3'>
        <div>
          <div className='text-2xl font-semibold'>
            {formatPrice(listing.price)}
          </div>
          <div className='text-muted-foreground text-sm'>
            {formatPrice(listing.pricePerSqm, '₽/м²')}
          </div>
        </div>

        <div className='text-muted-foreground text-sm space-y-1'>
          <p>{listing.sourceName ?? 'Источник неизвестен'}</p>
          <p>{formatDate(listing.timeSourceUpdated)}</p>
        </div>
      </Card.Content>

      <Card.Footer>
        <Button asChild variant='outline' className='w-full'>
          <a href={listing.url} target='_blank' rel='noopener noreferrer'>
            Открыть объявление
          </a>
        </Button>
      </Card.Footer>
    </Card>
  )
}

const SummaryCards = ({
  summary,
}: {
  summary: DistrictStatsResponse['summary']
}) => {
  const cards = [
    {
      label: 'Активных объявлений',
      value: numberFormatter.format(summary.totalListings ?? 0),
    },
    {
      label: 'Средняя цена за м²',
      value: formatPrice(summary.avgPricePerSqm, '₽/м²'),
    },
    {
      label: 'Минимальная цена за м²',
      value: formatPrice(summary.minPricePerSqm, '₽/м²'),
    },
    {
      label: 'Максимальная цена за м²',
      value: formatPrice(summary.maxPricePerSqm, '₽/м²'),
    },
  ]

  return (
    <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
      {cards.map((card) => (
        <Card key={card.label}>
          <Card.Header>
            <Card.Description>{card.label}</Card.Description>
            <div className='text-2xl font-semibold'>{card.value}</div>
          </Card.Header>
        </Card>
      ))}
    </div>
  )
}

const RoomStatsTable = ({ stats }: { stats: RoomStat[] }) => {
  if (stats.length === 0) {
    return null
  }

  return (
    <Card>
      <Card.Header>
        <Card.Title>Разбивка по комнатам</Card.Title>
        <Card.Description>
          Сравнение стоимости квадратного метра по количеству комнат
        </Card.Description>
      </Card.Header>

      <Card.Content>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Комнат</TableHead>
              <TableHead>Объявлений</TableHead>
              <TableHead>Средняя цена за м²</TableHead>
              <TableHead>Мин. цена за м²</TableHead>
              <TableHead>Макс. цена за м²</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {stats.map((row) => (
              <TableRow key={row.rooms}>
                <TableCell className='font-semibold'>
                  {formatRooms(row.rooms)}
                </TableCell>
                <TableCell>{numberFormatter.format(row.listings)}</TableCell>
                <TableCell>{formatPrice(row.avgPricePerSqm, '₽/м²')}</TableCell>
                <TableCell>{formatPrice(row.minPricePerSqm, '₽/м²')}</TableCell>
                <TableCell>{formatPrice(row.maxPricePerSqm, '₽/м²')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card.Content>
    </Card>
  )
}

const ListingsSection = ({
  title,
  description,
  listings,
}: {
  title: string
  description: string
  listings: ListingStat[]
}) => {
  if (listings.length === 0) {
    return null
  }

  return (
    <section className='space-y-3'>
      <div>
        <h3 className='text-lg font-semibold'>{title}</h3>
        <p className='text-muted-foreground text-sm'>{description}</p>
      </div>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </section>
  )
}

const DistrictStatsContent = ({
  stats,
}: {
  stats: DistrictStatsResponse
}) => {
  const hasData = stats.summary.totalListings > 0

  if (!hasData) {
    return (
      <Card>
        <Card.Content className='py-10 text-center text-muted-foreground'>
          Для выбранного района нет активных объявлений с рассчитанной ценой за
          квадратный метр.
        </Card.Content>
      </Card>
    )
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-1'>
        <h2 className='text-2xl font-semibold'>{stats.district.name}</h2>
        <p className='text-muted-foreground'>
          {stats.district.adminOkrug ?? 'Округ не указан'} •{' '}
          {numberFormatter.format(stats.summary.totalListings)} объявлений
        </p>
      </div>

      <SummaryCards summary={stats.summary} />

      <RoomStatsTable stats={stats.roomStats} />

      <ListingsSection
        title='Минимальная цена за метр'
        description='Объявления с самой низкой стоимостью м²'
        listings={stats.cheapestListings}
      />

      <ListingsSection
        title='Ближе всего к средней цене'
        description='Объявления, у которых цена за м² ближе всего к средней по району'
        listings={stats.averageListings}
      />
    </div>
  )
}

export default function DistrictsPage(): JSX.Element {
  const [selectedAdminOkrug, setSelectedAdminOkrug] = useState<string | null>(
    null,
  )
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(
    null,
  )
  const {
    data: districts,
    isLoading: isDistrictsLoading,
    isError: isDistrictsError,
  } = useDistrictsQuery()

  const {
    data: stats,
    isLoading: isStatsLoading,
    isFetching: isStatsFetching,
    isError: isStatsError,
  } = useDistrictStatsQuery(selectedDistrictId ?? undefined)

  const adminOptions = useMemo(() => {
    if (!districts) {
      return []
    }

    const unique = Array.from(
      new Set(
        districts
          .map((district) => district.adminOkrug)
          .filter((okrug): okrug is string => {
            if (!okrug) {
              return false
            }

            return !EXCLUDED_ADMIN_OKRUGS.includes(okrug)
          }),
      ),
    )

    return unique.sort((a, b) => a.localeCompare(b, 'ru'))
  }, [districts])

  useEffect(() => {
    if (!selectedAdminOkrug && adminOptions.length > 0) {
      setSelectedAdminOkrug(adminOptions[0] ?? null)
    } else if (adminOptions.length === 0 && selectedAdminOkrug) {
      setSelectedAdminOkrug(null)
    }
  }, [adminOptions, selectedAdminOkrug])

  const districtOptions = useMemo(() => {
    if (!districts || !selectedAdminOkrug) {
      return []
    }

    return districts.filter(
      (district) => district.adminOkrug === selectedAdminOkrug,
    )
  }, [districts, selectedAdminOkrug])

  useEffect(() => {
    if (!selectedAdminOkrug) {
      setSelectedDistrictId(null)
      return
    }

    if (districtOptions.length === 0) {
      setSelectedDistrictId(null)
      return
    }

    const currentDistrictExists = districtOptions.some(
      (district) => district.id === selectedDistrictId,
    )

    if (!currentDistrictExists) {
      setSelectedDistrictId(districtOptions[0]?.id ?? null)
    }
  }, [districtOptions, selectedAdminOkrug, selectedDistrictId])

  return (
    <Page className='w-full'>
      <Page.Header className='flex-col items-start space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0'>
        <div>
          <Page.Title>Статистика по районам</Page.Title>
          <p className='text-muted-foreground text-sm'>
            Аналитика стоимости квадратного метра по административным округам
            Москвы
          </p>
        </div>

        {isStatsFetching && !isStatsLoading ? (
          <span className='text-muted-foreground text-xs uppercase tracking-wide'>
            Обновляем данные...
          </span>
        ) : null}
      </Page.Header>

      <Page.Content className='space-y-6'>
        <Card>
          <Card.Header>
            <Card.Title>Выбор района</Card.Title>
          </Card.Header>

          <Card.Content>
            {isDistrictsLoading ? (
              <div className='flex flex-col gap-4 md:flex-row'>
                <Skeleton className='h-10 w-full max-w-xs' />
                <Skeleton className='h-10 w-full max-w-xs' />
              </div>
            ) : isDistrictsError ? (
              <p className='text-destructive text-sm'>
                Не удалось загрузить список районов
              </p>
            ) : (
              <div className='flex flex-col gap-4 md:flex-row'>
                <div className='flex-1'>
                  <label className='mb-2 block text-sm font-medium text-foreground'>
                    Административный округ
                  </label>

                  {adminOptions.length === 0 ? (
                    <p className='text-muted-foreground text-sm'>
                      Подходящих округов не найдено
                    </p>
                  ) : (
                    <select
                      className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                      value={selectedAdminOkrug ?? ''}
                      onChange={(event) =>
                        setSelectedAdminOkrug(event.target.value || null)
                      }
                    >
                      {adminOptions.map((okrug) => (
                        <option key={okrug} value={okrug}>
                          {okrug}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className='flex-1'>
                  <label className='mb-2 block text-sm font-medium text-foreground'>
                    Район
                  </label>

                  {districtOptions.length === 0 ? (
                    <p className='text-muted-foreground text-sm'>
                      В выбранном округе нет районов для отображения
                    </p>
                  ) : (
                    <select
                      className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                      value={selectedDistrictId ?? ''}
                      onChange={(event) =>
                        setSelectedDistrictId(Number(event.target.value))
                      }
                    >
                      {districtOptions.map((district) => (
                        <option key={district.id} value={district.id}>
                          {district.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            )}
          </Card.Content>
        </Card>

        {isStatsLoading ? (
          <div className='space-y-4'>
            <Skeleton className='h-24 w-full' />
            <Skeleton className='h-60 w-full' />
            <Skeleton className='h-60 w-full' />
          </div>
        ) : isStatsError ? (
          <Card>
            <Card.Content className='py-10 text-center text-destructive'>
              Не удалось загрузить статистику по району
            </Card.Content>
          </Card>
        ) : stats ? (
          <DistrictStatsContent stats={stats} />
        ) : (
          <Card>
            <Card.Content className='py-10 text-center text-muted-foreground'>
              Выберите район, чтобы увидеть статистику
            </Card.Content>
          </Card>
        )}
      </Page.Content>
    </Page>
  )
}
