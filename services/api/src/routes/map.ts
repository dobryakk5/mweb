import { type FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '@acme/db'
import { sql } from 'drizzle-orm'

const getMapAdsSchema = z.object({
  lat: z.string().transform(Number).pipe(z.number().min(-90).max(90)),
  lng: z.string().transform(Number).pipe(z.number().min(-180).max(180)),
  radius: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(100).max(5000))
    .default('1000'),
})

const getMapPOISchema = z.object({
  lat: z.string().transform(Number).pipe(z.number().min(-90).max(90)),
  lng: z.string().transform(Number).pipe(z.number().min(-180).max(180)),
  radius: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(100).max(10000))
    .default('2000'),
  types: z.string().optional().default('school,kindergarten'),
})

const getUserFlatsSchema = z.object({
  tgUserId: z.string().transform(Number).pipe(z.number().int()),
})

export default async (fastify: FastifyInstance) => {
  console.log('[map.ts] Регистрация маршрутов начата')

  // Get ads by coordinates for map display
  fastify.get('/map/ads', async (request, reply) => {
    try {
      const { lat, lng, radius } = getMapAdsSchema.parse(request.query)

      const result = await db.execute(
        sql`SELECT * FROM public.get_ads_by_coordinates_fast(${lat}, ${lng}, ${radius})`,
      )

      // Handle the result structure properly
      const ads = Array.isArray(result) ? result : result.rows || []

      return {
        ads,
        count: ads.length,
        center: { lat, lng },
        radius,
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({
        error: 'Failed to fetch map ads',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })

  // Get houses with coordinates by coordinates
  fastify.get('/map/houses', async (request, reply) => {
    try {
      const { lat, lng, radius } = getMapAdsSchema.parse(request.query)

      const result = await db.execute(
        sql`SELECT * FROM public.get_house_near_coordinates(${lat}, ${lng}, ${radius})`,
      )

      // Handle the result structure properly (same as ads endpoint)
      const houses = Array.isArray(result) ? result : result.rows || []

      return {
        houses,
        count: houses.length,
        center: { lat, lng },
        radius,
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({
        error: 'Failed to fetch map houses',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })

  // Get POI (schools, kindergartens) by coordinates
  fastify.get('/map/poi', async (request, reply) => {
    try {
      const { lat, lng, radius, types } = getMapPOISchema.parse(request.query)

      // Convert types string to array for SQL IN clause
      const typeArray = types
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)

      if (typeArray.length === 0) {
        return { poi: [], count: 0, center: { lat, lng }, radius }
      }

      // Create SQL query using centroid_utm directly for better performance
      const typesFilter = typeArray.map((t) => `'${t}'`).join(',')

      // Convert input coordinates to UTM zone 37N (EPSG:3857) once for comparison with centroid_utm
      const inputPointUTM = `system.ST_Transform(system.ST_GeomFromText('POINT(${lng} ${lat})', 4326), 32637)`

      const result = await db.execute(
        sql`
          SELECT
            building as type,
            COALESCE(name, '') as name,
            system.ST_Y(system.ST_Transform(g.centroid_utm, 4326)) as lat,
            system.ST_X(system.ST_Transform(g.centroid_utm, 4326)) as lng,
            ROUND(
              system.ST_Distance(
                ${sql.raw(inputPointUTM)},
                g.centroid_utm
              )
            )::integer as distance_m
          FROM "system".moscow_geo g
          WHERE building IN (${sql.raw(typesFilter)})
            AND system.ST_DWithin(
              ${sql.raw(inputPointUTM)},
              g.centroid_utm,
              ${radius}
            )
          ORDER BY distance_m ASC
          LIMIT 500
        `,
      )

      const poi = Array.isArray(result) ? result : result.rows || []

      return {
        poi,
        count: poi.length,
        center: { lat, lng },
        radius,
        types: typeArray,
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({
        error: 'Failed to fetch POI',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })

  // Get ads by house address for map house click
  fastify.get('/map/house-ads', async (request, reply) => {
    try {
      const { address } = z
        .object({
          address: z.string(),
        })
        .parse(request.query)

      // Get ads by house address - использую тот же метод что и в nearby-by-flat
      const result = await db.execute(
        sql`SELECT * FROM ads WHERE address = ${address} ORDER BY price ASC LIMIT 50`,
      )

      const ads = Array.isArray(result) ? result : result.rows || []

      return {
        ads,
        count: ads.length,
        address,
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({
        error: 'Failed to fetch house ads',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })

  // Get user flats with coordinates for map display
  fastify.get('/map/user-flats', async (request, reply) => {
    try {
      const { tgUserId } = getUserFlatsSchema.parse(request.query)

      // Use the optimized function that directly returns flats with coordinates
      const result = await db.execute(
        sql`SELECT * FROM public.get_user_flats_with_coordinates(${tgUserId})`,
      )

      const flats = Array.isArray(result) ? result : result.rows || []

      return {
        flats,
        count: flats.length,
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({
        error: 'Failed to fetch user flats',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })

  // Get coordinates by address from system.moscow_geo
  fastify.get('/map/address-coordinates', async (request, reply) => {
    try {
      const { address } = z
        .object({
          address: z.string(),
        })
        .parse(request.query)

      // Parse address to extract street and house number
      const addressParts = address.split(',').map((s) => s.trim())
      if (addressParts.length < 2) {
        return reply.status(400).send({ error: 'Invalid address format' })
      }

      const street = addressParts[0]
      const housenum = addressParts[1]

      const result = await db.execute(
        sql`SELECT
          system.ST_Y(system.ST_Transform(centroid_utm, 4326)) as lat,
          system.ST_X(system.ST_Transform(centroid_utm, 4326)) as lng,
          street,
          housenum
        FROM "system".moscow_geo
        WHERE street = ${street} AND (housenum = ${housenum} OR housenum = ${housenum.replace(/с/g, ' с')})
        LIMIT 1`,
      )

      const coordinates = Array.isArray(result) ? result : result.rows || []

      if (coordinates.length === 0) {
        return reply.status(404).send({ error: 'Address not found' })
      }

      return {
        coordinates: coordinates[0],
        address,
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({
        error: 'Failed to fetch address coordinates',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })

  // Get coordinates for specific house IDs from find_nearby_apartments
  fastify.get('/map/houses-by-ids', async (request, reply) => {
    try {
      const { houseIds } = z
        .object({
          houseIds: z.string(), // comma-separated house IDs
        })
        .parse(request.query)

      const houseIdArray = houseIds
        .split(',')
        .map((id) => parseInt(id.trim()))
        .filter((id) => !isNaN(id))

      if (houseIdArray.length === 0) {
        return reply.status(400).send({ error: 'No valid house IDs provided' })
      }

      // Get house data by IDs from the same source as find_nearby_apartments
      // Используем столбец house_id напрямую из system.moscow_geo
      const houseDataPromises = houseIdArray.map(async (houseId) => {
        const result = await db.execute(
          sql`SELECT
            g.house_id,
            CONCAT(g.street, ', ', g.housenum) as address,
            system.ST_Y(system.ST_Transform(g.centroid_utm, 4326)) as lat,
            system.ST_X(system.ST_Transform(g.centroid_utm, 4326)) as lng
          FROM "system".moscow_geo g
          WHERE g.house_id = ${houseId}
          LIMIT 1`,
        )

        const rows = Array.isArray(result) ? result : result.rows || []
        return rows[0] || null
      })

      const housesData = (await Promise.all(houseDataPromises)).filter(Boolean)

      return {
        houses: housesData,
        count: housesData.length,
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({
        error: 'Failed to fetch houses by IDs',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })
}
