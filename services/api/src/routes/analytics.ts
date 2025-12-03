import { type FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '@acme/db'
import { sql } from 'drizzle-orm'

const districtStatsSchema = z.object({
  aoId: z
    .string()
    .transform((value) => Number(value))
    .pipe(z.number().int().positive()),
})

const extractRows = <T>(result: unknown): T[] => {
  if (Array.isArray(result)) {
    return result as T[]
  }

  if (result && typeof result === 'object' && 'rows' in result) {
    return ((result as { rows?: T[] }).rows ?? []) as T[]
  }

  return []
}

export default async function analyticsRoutes(fastify: FastifyInstance) {
  fastify.get('/analytics/districts', async (_, reply) => {
    try {
      const rawDistricts = await db.execute(
        sql`
          SELECT id, admin_okrug AS "adminOkrug", name
          FROM public.districts
          ORDER BY admin_okrug, name
        `,
      )

      return extractRows(rawDistricts)
    } catch (error) {
      fastify.log.error({ error }, 'Failed to fetch districts list')

      return reply.status(500).send({
        error: 'Не удалось получить список районов',
      })
    }
  })

  fastify.get('/analytics/district-stats', async (request, reply) => {
    try {
      const { aoId } = districtStatsSchema.parse(request.query)

      const rawDistrict = await db.execute(
        sql`
          SELECT id, admin_okrug AS "adminOkrug", name
          FROM public.districts
          WHERE id = ${aoId}
          LIMIT 1
        `,
      )

      const district = extractRows<{
        id: number
        adminOkrug: string | null
        name: string
      }>(rawDistrict)[0]

      if (!district) {
        return reply.status(404).send({
          error: 'Район не найден',
        })
      }

      const rawStats = await db.execute(
        sql`
          WITH base AS (
            SELECT
              fh.id,
              fh.url,
              fh.price,
              fh.rooms,
              fh.floor,
              fh.time_source_updated,
              fh.source_id,
              COALESCE(lt.name, 'Неизвестный источник') AS source_name,
              ROUND(f.area::numeric, 2) AS area,
              ROUND(f.kitchen_area::numeric, 2) AS kitchen_area,
              (fh.price / NULLIF(f.area, 0))::numeric AS price_per_sqm,
              COALESCE(f.street, 'Адрес не указан') AS street,
              COALESCE(f.house, '') AS house,
              CASE
                WHEN f.street IS NULL AND f.house IS NULL THEN 'Адрес не указан'
                WHEN f.house IS NULL THEN f.street
                WHEN f.street IS NULL THEN f.house
                ELSE f.street || ', ' || f.house
              END AS address
            FROM public.flats_history fh
            INNER JOIN public.flats f
              ON f.house_id = fh.house_id
             AND f.floor = fh.floor
             AND f.rooms = fh.rooms
            LEFT JOIN public.lookup_types lt
              ON lt.id = fh.source_id
             AND lt.category = 'source_id'
            WHERE f.ao_id = ${aoId}
              AND fh.price IS NOT NULL
              AND fh.price > 0
              AND f.area IS NOT NULL
              AND f.area > 0
              AND fh.is_actual = 1
          ),
          summary AS (
            SELECT
              COUNT(*)::integer AS total_listings,
              ROUND(AVG(price_per_sqm))::integer AS avg_price_per_sqm,
              ROUND(MIN(price_per_sqm))::integer AS min_price_per_sqm,
              ROUND(MAX(price_per_sqm))::integer AS max_price_per_sqm
            FROM base
          ),
          room_stats AS (
            SELECT
              rooms,
              COUNT(*)::integer AS listings,
              ROUND(AVG(price_per_sqm))::integer AS avg_price_per_sqm,
              ROUND(MIN(price_per_sqm))::integer AS min_price_per_sqm,
              ROUND(MAX(price_per_sqm))::integer AS max_price_per_sqm
            FROM base
            GROUP BY rooms
            ORDER BY rooms
          ),
          cheapest AS (
            SELECT
              id,
              url,
              price,
              rooms,
              floor,
              ROUND(price_per_sqm)::integer AS price_per_sqm,
              area,
              kitchen_area,
              address,
              street,
              house,
              time_source_updated,
              source_id,
              source_name
            FROM base
            ORDER BY price_per_sqm ASC, price ASC
            LIMIT 5
          ),
          avg_target AS (
            SELECT AVG(price_per_sqm) AS avg_price_per_sqm FROM base
          ),
          closest AS (
            SELECT
              b.id,
              b.url,
              b.price,
              b.rooms,
              b.floor,
              ROUND(b.price_per_sqm)::integer AS price_per_sqm,
              b.area,
              b.kitchen_area,
              b.address,
              b.street,
              b.house,
              b.time_source_updated,
              b.source_id,
              b.source_name
            FROM base b
            CROSS JOIN avg_target
            ORDER BY ABS(b.price_per_sqm - avg_target.avg_price_per_sqm) ASC, b.price_per_sqm
            LIMIT 5
          )
          SELECT
            (SELECT row_to_json(summary) FROM summary) AS summary,
            (SELECT COALESCE(json_agg(room_stats), '[]'::json) FROM room_stats) AS room_stats,
            (SELECT COALESCE(json_agg(cheapest), '[]'::json) FROM cheapest) AS cheapest_listings,
            (SELECT COALESCE(json_agg(closest), '[]'::json) FROM closest) AS average_listings
        `,
      )

      type SummaryRow = {
        total_listings: number
        avg_price_per_sqm: number | null
        min_price_per_sqm: number | null
        max_price_per_sqm: number | null
      } | null
      type RoomStatRow = {
        rooms: number
        listings: number
        avg_price_per_sqm: number | null
        min_price_per_sqm: number | null
        max_price_per_sqm: number | null
      }
      type ListingRow = {
        id: number
        url: string
        price: number
        rooms: number
        floor: number
        price_per_sqm: number
        area: number | null
        kitchen_area: number | null
        address: string
        street: string
        house: string
        time_source_updated: string | null
        source_id: number | null
        source_name: string | null
      }

      const stats = extractRows<{
        summary: SummaryRow
        room_stats: RoomStatRow[]
        cheapest_listings: ListingRow[]
        average_listings: ListingRow[]
      }>(rawStats)[0]

      const summary = stats?.summary ?? {
        total_listings: 0,
        avg_price_per_sqm: null,
        min_price_per_sqm: null,
        max_price_per_sqm: null,
      }

      return {
        district: {
          id: district.id,
          name: district.name,
          adminOkrug: district.adminOkrug,
        },
        summary: {
          totalListings: summary.total_listings,
          avgPricePerSqm: summary.avg_price_per_sqm,
          minPricePerSqm: summary.min_price_per_sqm,
          maxPricePerSqm: summary.max_price_per_sqm,
        },
        roomStats:
          stats?.room_stats?.map((room) => ({
            rooms: room.rooms,
            listings: room.listings,
            avgPricePerSqm: room.avg_price_per_sqm,
            minPricePerSqm: room.min_price_per_sqm,
            maxPricePerSqm: room.max_price_per_sqm,
          })) ?? [],
        cheapestListings:
          stats?.cheapest_listings?.map((listing) => ({
            id: listing.id,
            url: listing.url,
            price: listing.price,
            rooms: listing.rooms,
            floor: listing.floor,
            pricePerSqm: listing.price_per_sqm,
            area: listing.area,
            kitchenArea: listing.kitchen_area,
            address: listing.address,
            street: listing.street,
            house: listing.house,
            timeSourceUpdated: listing.time_source_updated,
            sourceId: listing.source_id,
            sourceName: listing.source_name,
          })) ?? [],
        averageListings:
          stats?.average_listings?.map((listing) => ({
            id: listing.id,
            url: listing.url,
            price: listing.price,
            rooms: listing.rooms,
            floor: listing.floor,
            pricePerSqm: listing.price_per_sqm,
            area: listing.area,
            kitchenArea: listing.kitchen_area,
            address: listing.address,
            street: listing.street,
            house: listing.house,
            timeSourceUpdated: listing.time_source_updated,
            sourceId: listing.source_id,
            sourceName: listing.source_name,
          })) ?? [],
      }
    } catch (error) {
      fastify.log.error({ error }, 'Failed to fetch district stats')

      return reply.status(500).send({
        error: 'Не удалось получить статистику по району',
      })
    }
  })
}
