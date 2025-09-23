import { type FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '@acme/db'
import { sql } from 'drizzle-orm'

// Кеш для координат домов
const houseCoordinatesCache = new Map<number, { lat: number; lng: number }>()

// Функция для пакетной загрузки координат
async function getHouseCoordinates(houseIds: number[]) {
  const uncachedIds = houseIds.filter((id) => !houseCoordinatesCache.has(id))

  if (uncachedIds.length > 0) {
    const coordinates = await db.execute(sql`
      SELECT house_id,
             system.ST_Y(system.ST_Transform(centroid_utm, 4326)) as lat,
             system.ST_X(system.ST_Transform(centroid_utm, 4326)) as lng
      FROM system.moscow_geo
      WHERE house_id = ANY(${uncachedIds})
    `)

    const rows = Array.isArray(coordinates)
      ? coordinates
      : (coordinates as any).rows || []

    rows.forEach((coord: any) => {
      houseCoordinatesCache.set(coord.house_id, {
        lat: coord.lat,
        lng: coord.lng,
      })
    })
  }

  return houseIds
    .map((id) => ({
      house_id: id,
      ...houseCoordinatesCache.get(id),
    }))
    .filter((house) => house.lat && house.lng)
}

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

  // Get houses with coordinates by coordinates
  fastify.get('/map/houses', async (request, reply) => {
    try {
      const { lat, lng, radius } = getMapAdsSchema.parse(request.query)

      const result = await db.execute(
        sql`SELECT * FROM public.get_house_near_coordinates(${lat}, ${lng}, ${radius})`,
      )

      // Handle the result structure properly (same as ads endpoint)
      const houses = Array.isArray(result) ? result : (result as any).rows || []

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

      const poi = Array.isArray(result) ? result : (result as any).rows || []

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

  // Get ads with unified filtering - both for map areas and specific houses
  fastify.get('/map/ads', async (request, reply) => {
    try {
      const {
        north,
        south,
        east,
        west,
        houseId,
        rooms,
        maxPrice,
        minArea,
        minKitchenArea,
        limit = 100,
      } = z
        .object({
          north: z
            .string()
            .transform(Number)
            .pipe(z.number().min(-90).max(90))
            .optional(),
          south: z
            .string()
            .transform(Number)
            .pipe(z.number().min(-90).max(90))
            .optional(),
          east: z
            .string()
            .transform(Number)
            .pipe(z.number().min(-180).max(180))
            .optional(),
          west: z
            .string()
            .transform(Number)
            .pipe(z.number().min(-180).max(180))
            .optional(),
          houseId: z
            .string()
            .transform(Number)
            .pipe(z.number().int())
            .optional(),
          rooms: z
            .string()
            .transform(Number)
            .pipe(z.number().int().min(1))
            .optional(),
          maxPrice: z
            .string()
            .transform(Number)
            .pipe(z.number().min(0))
            .optional(),
          minArea: z
            .string()
            .transform(Number)
            .pipe(z.number().min(0))
            .optional(),
          minKitchenArea: z
            .string()
            .transform(Number)
            .pipe(z.number().min(0))
            .optional(),
          limit: z
            .string()
            .transform(Number)
            .pipe(z.number().int().min(1).max(500))
            .optional(),
        })
        .parse(request.query)

      // Validate input: either bounds OR houseId must be provided
      if (!houseId && (!north || !south || !east || !west)) {
        return reply.status(400).send({
          error:
            'Either houseId or bounds (north, south, east, west) must be provided',
        })
      }

      if (houseId) {
        fastify.log.info(
          `🏠 Searching house ads: houseId=${houseId}, maxPrice=${maxPrice}, rooms=${rooms}, minArea=${minArea}, minKitchenArea=${minKitchenArea}`,
        )
      } else {
        fastify.log.info(
          `🗺️ Searching ads in bounds: north=${north}, south=${south}, east=${east}, west=${west}, rooms=${rooms}, maxPrice=${maxPrice}`,
        )
      }

      let result
      if (houseId) {
        // Use same logic as ads-in-bounds but filter by house_id
        let baseQuery = sql`SELECT DISTINCT ON (fh.rooms, fh.floor, fh.price)
          fh.id,
          fh.avitoid,
          fh.price,
          fh.rooms,
          fh.floor,
          fh.description,
          fh.url,
          fh.time_source_created as created,
          fh.time_source_updated as updated,
          fh.is_actual as is_active,
          fh.person as person_type,
          fh.house_id,
          CONCAT(mg.street, ', ', mg.housenum) as address,
          f.total_floors,
          f.area,
          f.kitchen_area,
          system.ST_Y(system.ST_Transform(mg.centroid_utm, 4326)) as lat,
          system.ST_X(system.ST_Transform(mg.centroid_utm, 4326)) as lng,
          0 as distance_m
        FROM public.flats_history fh
        JOIN system.moscow_geo mg ON fh.house_id = mg.house_id
        LEFT JOIN public.flats f ON fh.house_id = f.house_id AND fh.floor = f.floor AND fh.rooms = f.rooms
        WHERE fh.house_id = ${houseId}`

        // Apply same filters as ads-in-bounds
        if (maxPrice !== undefined) {
          baseQuery = sql`${baseQuery} AND fh.price < ${maxPrice}`
        }

        if (rooms !== undefined) {
          baseQuery = sql`${baseQuery} AND fh.rooms >= ${rooms}`
        }

        if (minArea !== undefined) {
          baseQuery = sql`${baseQuery} AND (f.area IS NULL OR f.area >= ${minArea})`
        }

        if (minKitchenArea !== undefined) {
          baseQuery = sql`${baseQuery} AND (f.kitchen_area IS NULL OR f.kitchen_area >= ${minKitchenArea})`
        }

        const finalQuery = sql`${baseQuery}
          ORDER BY fh.rooms, fh.floor, fh.price,
                   CASE
                     WHEN fh.url LIKE '%cian.ru%' THEN 1
                     WHEN fh.url LIKE '%yandex.ru%' THEN 2
                     ELSE 3
                   END,
                   fh.is_actual DESC,
                   fh.time_source_updated DESC
          LIMIT ${limit}`

        result = await db.execute(finalQuery)
      } else {
        // Use get_ads_in_bounds function for bounds-based search
        result = await db.execute(
          sql`SELECT * FROM public.get_ads_in_bounds(
            ${north},
            ${south},
            ${east},
            ${west},
            ${rooms || 1},
            ${maxPrice || 999999999},
            ${minArea || null},
            ${minKitchenArea || null},
            ${limit}
          )`,
        )
      }

      const ads = Array.isArray(result) ? result : (result as any).rows || []

      if (houseId) {
        fastify.log.info(`🏠 Found ${ads.length} ads for house ${houseId}`)
      } else {
        fastify.log.info(`🗺️ Found ${ads.length} ads in bounds`)
      }

      return {
        ads,
        count: ads.length,
        houseId: houseId || null,
        bounds: houseId ? null : { north, south, east, west },
        filters: { rooms, maxPrice, minArea, minKitchenArea },
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({
        error: 'Failed to fetch ads',
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

      const flats = Array.isArray(result) ? result : (result as any).rows || []

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

      const coordinates = Array.isArray(result)
        ? result
        : (result as any).rows || []

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

      // Use cached coordinates for better performance
      const coordinatesData = await getHouseCoordinates(houseIdArray)

      // Get additional address data for houses that have coordinates
      const houseIdsWithCoords = coordinatesData.map((h) => h.house_id)

      let addressData: any[] = []
      if (houseIdsWithCoords.length > 0) {
        const addressResult = await db.execute(
          sql`SELECT
            g.house_id,
            CONCAT(g.street, ', ', g.housenum) as address
          FROM "system".moscow_geo g
          WHERE g.house_id = ANY(${houseIdsWithCoords})`,
        )
        addressData = Array.isArray(addressResult)
          ? addressResult
          : (addressResult as any).rows || []
      }

      // Combine coordinates with address data
      const housesData = coordinatesData.map((house) => {
        const addressInfo = addressData.find(
          (addr) => addr.house_id === house.house_id,
        )
        return {
          house_id: house.house_id,
          address: addressInfo?.address || `Дом ${house.house_id}`,
          lat: house.lat,
          lng: house.lng,
        }
      })

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

  // Get minimum prices for houses
  fastify.get('/map/house-prices', async (request, reply) => {
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

      // Limit the number of house IDs to prevent timeout
      if (houseIdArray.length > 100) {
        return reply.status(400).send({
          error: 'Too many house IDs provided. Maximum is 100.',
        })
      }

      fastify.log.info(`Getting prices for ${houseIdArray.length} houses`)

      // Process in batches of 20 to avoid overwhelming the database
      const batchSize = 20
      const allResults: any[] = []

      for (let i = 0; i < houseIdArray.length; i += batchSize) {
        const batch = houseIdArray.slice(i, i + batchSize)

        const batchPromises = batch.map(async (houseId) => {
          try {
            const result = await db.execute(
              sql`SELECT
                ${houseId} as house_id,
                MIN(price) as min_price
              FROM public.flats_history
              WHERE house_id = ${houseId} AND price > 0 AND is_actual = 1
              LIMIT 1`,
            )

            const rows = Array.isArray(result)
              ? result
              : (result as any).rows || []
            return rows[0] || { house_id: houseId, min_price: null }
          } catch (error) {
            fastify.log.error(
              `Error getting price for house ${houseId}:`,
              error,
            )
            return { house_id: houseId, min_price: null }
          }
        })

        const batchResults = await Promise.all(batchPromises)
        allResults.push(...batchResults)
      }

      fastify.log.info(
        `Successfully got prices for ${allResults.length} houses`,
      )

      return {
        prices: allResults,
        count: allResults.length,
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({
        error: 'Failed to fetch house prices',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })

  // Get house_id by address
  fastify.get('/map/address-to-house-id', async (request, reply) => {
    try {
      const { address } = z
        .object({
          address: z.string().min(1),
        })
        .parse(request.query)

      fastify.log.info(`Getting house_id for address: ${address}`)

      const result = await db.execute(
        sql`SELECT result_id as house_id FROM public.get_house_id_by_address(${address})`,
      )

      const houseData = Array.isArray(result)
        ? result
        : (result as any).rows || []

      if (houseData.length === 0 || !houseData[0]?.house_id) {
        fastify.log.warn(`House ID not found for address: ${address}`)
        return reply
          .status(404)
          .send({ error: 'House ID not found for address' })
      }

      fastify.log.info(
        `Found house_id ${houseData[0].house_id} for address: ${address}`,
      )

      return {
        house_id: houseData[0].house_id,
        address,
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({
        error: 'Failed to get house ID by address',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })

  // Get full flat data by ID (including areas from public.flats table)
  fastify.get('/map/flat-full-data/:flatId', async (request, reply) => {
    try {
      const { flatId } = z
        .object({
          flatId: z.string().transform(Number).pipe(z.number().int()),
        })
        .parse(request.params)

      fastify.log.info(`Getting full data for flat ${flatId}`)

      // Get basic flat data
      const flatResult = await db.execute(
        sql`SELECT id, address, rooms, floor FROM "users".user_flats WHERE id = ${flatId} LIMIT 1`,
      )
      const flatData = Array.isArray(flatResult)
        ? flatResult[0]
        : (flatResult as any).rows?.[0]

      if (!flatData) {
        return reply.status(404).send({ error: 'Flat not found' })
      }

      // Get house_id by address
      const houseResult = await db.execute(
        sql`SELECT result_id as house_id FROM public.get_house_id_by_address(${flatData.address})`,
      )
      const houseData = Array.isArray(houseResult)
        ? houseResult[0]
        : (houseResult as any).rows?.[0]

      if (!houseData?.house_id) {
        fastify.log.warn(`House ID not found for address: ${flatData.address}`)
        return reply.status(404).send({
          error: 'House ID not found for flat address',
          flatData: {
            ...flatData,
            house_id: null,
            area: null,
            kitchen_area: null,
            price: null,
          },
        })
      }

      // Get detailed data from public.flats table using (house_id, floor, rooms) link
      const detailsResult = await db.execute(
        sql`SELECT area, kitchen_area, total_floors FROM public.flats
            WHERE house_id = ${houseData.house_id}
              AND rooms = ${flatData.rooms}
              AND floor = ${flatData.floor}
            LIMIT 1`,
      )
      const detailsData = Array.isArray(detailsResult)
        ? detailsResult[0]
        : (detailsResult as any).rows?.[0]

      // Fallback to Python API if data not found in public.flats
      let finalDetailsData = detailsData

      if (!detailsData?.area || !detailsData?.kitchen_area) {
        fastify.log.info(
          `Missing area/kitchen data for flat ${flatId}, trying Python API fallback`,
        )

        try {
          // Find cian URL for this exact flat (house_id, floor, rooms)
          const cianUrlResult = await db.execute(
            sql`SELECT url FROM public.flats_history
                WHERE house_id = ${houseData.house_id}
                  AND rooms = ${flatData.rooms}
                  AND floor = ${flatData.floor}
                  AND url LIKE '%cian%'
                LIMIT 1`,
          )
          const cianUrlData = Array.isArray(cianUrlResult)
            ? cianUrlResult[0]
            : (cianUrlResult as any).rows?.[0]

          if (cianUrlData?.url) {
            fastify.log.info(`Found cian URL for fallback: ${cianUrlData.url}`)

            // Call Python API to parse flat details
            const pythonApiUrl =
              process.env.PYTHON_API_URL || 'http://localhost:8008'
            const response = await fetch(
              `${pythonApiUrl}/api/parse/single?url=${encodeURIComponent(cianUrlData.url)}`,
              {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
              },
            )

            if (response.ok) {
              const pythonData = await response.json()
              fastify.log.info(`Python API response:`, pythonData)

              // Extract area and kitchen_area from Python API response
              if (pythonData?.area || pythonData?.kitchen_area) {
                finalDetailsData = {
                  area: pythonData.area || detailsData?.area || null,
                  kitchen_area:
                    pythonData.kitchen_area ||
                    detailsData?.kitchen_area ||
                    null,
                  total_floors:
                    pythonData.total_floors ||
                    detailsData?.total_floors ||
                    null,
                }

                // Optionally save to public.flats for future use
                try {
                  await db.execute(
                    sql`INSERT INTO public.flats (house_id, rooms, floor, area, kitchen_area, total_floors)
                        VALUES (${houseData.house_id}, ${flatData.rooms}, ${flatData.floor},
                                ${finalDetailsData.area}, ${finalDetailsData.kitchen_area}, ${finalDetailsData.total_floors})
                        ON CONFLICT (house_id, rooms, floor)
                        DO UPDATE SET
                          area = COALESCE(EXCLUDED.area, public.flats.area),
                          kitchen_area = COALESCE(EXCLUDED.kitchen_area, public.flats.kitchen_area),
                          total_floors = COALESCE(EXCLUDED.total_floors, public.flats.total_floors)`,
                  )
                  fastify.log.info(
                    `Saved Python API data to public.flats for future use`,
                  )
                } catch (saveError) {
                  fastify.log.warn(
                    `Failed to save Python API data to DB:`,
                    saveError,
                  )
                }
              }
            } else {
              fastify.log.warn(`Python API request failed: ${response.status}`)
            }
          } else {
            fastify.log.info(`No cian URL found for fallback parsing`)
          }
        } catch (pythonError) {
          fastify.log.warn(`Python API fallback failed:`, pythonError)
        }
      }

      // Get minimum price from active ads for this flat (house_id, floor, rooms)
      let minPrice = null
      try {
        const priceResult = await db.execute(
          sql`SELECT MIN(price) as min_price
              FROM public.flats_history
              WHERE house_id = ${houseData.house_id}
                AND rooms = ${flatData.rooms}
                AND floor = ${flatData.floor}
                AND is_actual = 1
                AND price > 0`,
        )
        const priceData = Array.isArray(priceResult)
          ? priceResult[0]
          : (priceResult as any).rows?.[0]
        minPrice = priceData?.min_price || null
        fastify.log.info(`Min price for flat ${flatId}: ${minPrice}`)
      } catch (priceError) {
        fastify.log.warn(
          `Failed to get min price for flat ${flatId}:`,
          priceError,
        )
      }

      const fullFlatData = {
        ...flatData,
        house_id: houseData.house_id,
        area: finalDetailsData?.area || null,
        kitchen_area: finalDetailsData?.kitchen_area || null,
        total_floors: finalDetailsData?.total_floors || null,
        price: minPrice,
      }

      fastify.log.info(`Full flat data:`, fullFlatData)

      return { flat: fullFlatData }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({
        error: 'Failed to get flat full data',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })

  // Get all houses within map bounds with filtered ads (for displaying on map)
  fastify.get('/map/houses-in-bounds', async (request, reply) => {
    try {
      const {
        north,
        south,
        east,
        west,
        rooms,
        maxPrice,
        minArea,
        minKitchenArea,
      } = z
        .object({
          north: z.string().transform(Number).pipe(z.number().min(-90).max(90)),
          south: z.string().transform(Number).pipe(z.number().min(-90).max(90)),
          east: z
            .string()
            .transform(Number)
            .pipe(z.number().min(-180).max(180)),
          west: z
            .string()
            .transform(Number)
            .pipe(z.number().min(-180).max(180)),
          rooms: z
            .string()
            .transform(Number)
            .pipe(z.number().int().min(1))
            .optional(),
          maxPrice: z
            .string()
            .transform(Number)
            .pipe(z.number().min(0))
            .optional(),
          minArea: z
            .string()
            .transform(Number)
            .pipe(z.number().min(0))
            .optional(),
          minKitchenArea: z
            .string()
            .transform(Number)
            .pipe(z.number().min(0))
            .optional(),
        })
        .parse(request.query)

      fastify.log.info(
        `Getting houses in bounds: north=${north}, south=${south}, east=${east}, west=${west}, rooms=${rooms}, maxPrice=${maxPrice}, minArea=${minArea}, minKitchenArea=${minKitchenArea}`,
      )

      const result = await db.execute(
        sql`SELECT * FROM public.get_houses_in_bounds(
          ${north},
          ${south},
          ${east},
          ${west},
          ${rooms || null},
          ${maxPrice || null},
          ${minArea || null},
          ${minKitchenArea || null}
        )`,
      )

      const houses = Array.isArray(result) ? result : (result as any).rows || []

      fastify.log.info(`Found ${houses.length} houses in bounds with filters`)

      return {
        houses,
        count: houses.length,
        bounds: { north, south, east, west },
        filters: { rooms, maxPrice, minArea, minKitchenArea },
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({
        error: 'Failed to fetch houses in bounds',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })

  // Update ads statuses via Python API for cian ads within bounds
  fastify.post('/map/update-ads-statuses', async (request, reply) => {
    try {
      const {
        north,
        south,
        east,
        west,
        rooms,
        maxPrice,
        minArea,
        minKitchenArea,
      } = z
        .object({
          north: z.number().min(-90).max(90),
          south: z.number().min(-90).max(90),
          east: z.number().min(-180).max(180),
          west: z.number().min(-180).max(180),
          rooms: z.number().int().min(1).optional(),
          maxPrice: z.number().min(0).optional(),
          minArea: z.number().min(0).optional(),
          minKitchenArea: z.number().min(0).optional(),
        })
        .parse(request.body)

      fastify.log.info(`Updating ad statuses for bounds`, {
        north,
        south,
        east,
        west,
        rooms,
        maxPrice,
      })

      // Get all ads within bounds that match filters using the new unified ads endpoint
      const adsResult = await db.execute(
        sql`SELECT * FROM public.get_ads_in_bounds(
          ${north},
          ${south},
          ${east},
          ${west},
          ${rooms || 1},
          ${maxPrice || 999999999},
          ${minArea || null},
          ${minKitchenArea || null},
          500
        )`,
      )
      const allAds = Array.isArray(adsResult)
        ? adsResult
        : (adsResult as any).rows || []

      // Separate ads by source for different update strategies
      const cianAds = allAds.filter(
        (ad) => ad.url && ad.url.includes('cian.ru'),
      )
      const yandexAds = allAds.filter(
        (ad) => ad.url && ad.url.includes('yandex.ru'),
      )
      const otherAds = allAds.filter(
        (ad) =>
          ad.url &&
          !ad.url.includes('cian.ru') &&
          !ad.url.includes('yandex.ru'),
      )

      fastify.log.info(
        `Found ${allAds.length} total ads: ${cianAds.length} CIAN, ${yandexAds.length} Yandex, ${otherAds.length} other`,
      )

      if (allAds.length === 0) {
        return {
          updated: 0,
          total: 0,
          message: 'No ads found in the specified area and filters',
        }
      }

      // Update statuses via Python API (only for CIAN ads)
      const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8008'
      let updatedCount = 0
      const errors: string[] = []

      // Process only CIAN ads with Python API
      for (const ad of cianAds) {
        try {
          fastify.log.info(`Checking status for ad: ${ad.url}`)

          const response = await fetch(
            `${pythonApiUrl}/api/parse/single?url=${encodeURIComponent(ad.url)}`,
            {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            },
          )

          if (response.ok) {
            const parsedData = await response.json()
            fastify.log.info(`Python API response for ${ad.url}:`, parsedData)

            // Update database if status or price changed
            const newIsActual = parsedData.is_active ? 1 : 0
            const newPrice = parsedData.price || ad.price

            if (newIsActual !== ad.is_actual || newPrice !== ad.price) {
              await db.execute(
                sql`UPDATE public.flats_history
                    SET is_actual = ${newIsActual},
                        price = ${newPrice},
                        time_source_updated = NOW()
                    WHERE id = ${ad.id}`,
              )

              fastify.log.info(
                `Updated ad ${ad.id}: is_actual ${ad.is_actual} -> ${newIsActual}, price ${ad.price} -> ${newPrice}`,
              )
              updatedCount++
            }
          } else {
            const errorMsg = `Python API error for ${ad.url}: ${response.status}`
            fastify.log.warn(errorMsg)
            errors.push(errorMsg)
          }
        } catch (adError) {
          const errorMsg = `Error updating ad ${ad.url}: ${adError instanceof Error ? adError.message : 'Unknown error'}`
          fastify.log.error(errorMsg)
          errors.push(errorMsg)
        }

        // Small delay to avoid overwhelming the Python API
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      return {
        updated: updatedCount,
        total: allAds.length,
        cianProcessed: cianAds.length,
        yandexFound: yandexAds.length,
        otherFound: otherAds.length,
        errors: errors.length > 0 ? errors : undefined,
        message: `Processed ${allAds.length} ads total (${cianAds.length} CIAN, ${yandexAds.length} Yandex, ${otherAds.length} other). Updated ${updatedCount} CIAN ads.`,
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({
        error: 'Failed to update ads statuses',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })

  // Get house address and type by house_id
  fastify.get('/map/house-info/:houseId', async (request, reply) => {
    try {
      const { houseId } = z
        .object({
          houseId: z.string().transform(Number).pipe(z.number().int()),
        })
        .parse(request.params)

      fastify.log.info(`Getting house info for house_id: ${houseId}`)

      // First, get the house address from moscow_geo
      const addressResult = await db.execute(
        sql`SELECT CONCAT(street, ', ', housenum) as address
            FROM "system".moscow_geo
            WHERE house_id = ${houseId}
            LIMIT 1`,
      )

      const addressData = Array.isArray(addressResult)
        ? addressResult[0]
        : (addressResult as any).rows?.[0]

      if (!addressData?.address) {
        return reply.status(404).send({
          error: 'House address not found',
          house_id: houseId,
        })
      }

      // Get house_type_id from flats table
      const houseTypeResult = await db.execute(
        sql`SELECT house_type_id
            FROM public.flats
            WHERE house_id = ${houseId}
            LIMIT 1`,
      )

      const houseTypeData = Array.isArray(houseTypeResult)
        ? houseTypeResult[0]
        : (houseTypeResult as any).rows?.[0]

      let houseTypeName = 'Неизвестно'

      if (houseTypeData?.house_type_id) {
        // Get house type name from lookup_types
        const typeNameResult = await db.execute(
          sql`SELECT name
              FROM "users".lookup_types
              WHERE category = 'house_type' AND id = ${houseTypeData.house_type_id}
              LIMIT 1`,
        )

        const typeNameData = Array.isArray(typeNameResult)
          ? typeNameResult[0]
          : (typeNameResult as any).rows?.[0]

        if (typeNameData?.name) {
          houseTypeName = typeNameData.name
        }
      }

      fastify.log.info(
        `House info for ${houseId}: address="${addressData.address}", type="${houseTypeName}"`,
      )

      return {
        house_id: houseId,
        address: addressData.address,
        house_type: houseTypeName,
        house_type_id: houseTypeData?.house_type_id || null,
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({
        error: 'Failed to get house info',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })

  // Batch endpoint for house coordinates
  fastify.post('/map/houses-coordinates', async (request, reply) => {
    try {
      const { houseIds } = z
        .object({
          houseIds: z.array(z.number().int()).max(1000), // Максимум 1000 домов за раз
        })
        .parse(request.body)

      if (houseIds.length === 0) {
        return { houses: [], count: 0 }
      }

      fastify.log.info(`Getting coordinates for ${houseIds.length} houses`)

      const houses = await getHouseCoordinates(houseIds)

      fastify.log.info(
        `Returned ${houses.length} houses with coordinates (${houseCoordinatesCache.size} in cache)`,
      )

      return {
        houses,
        count: houses.length,
        cached: houseCoordinatesCache.size,
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({
        error: 'Failed to get house coordinates',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })
}
