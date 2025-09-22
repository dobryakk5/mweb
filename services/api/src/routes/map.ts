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

const getFilteredHousesSchema = z.object({
  north: z.string().transform(Number).pipe(z.number().min(-90).max(90)),
  south: z.string().transform(Number).pipe(z.number().min(-90).max(90)),
  east: z.string().transform(Number).pipe(z.number().min(-180).max(180)),
  west: z.string().transform(Number).pipe(z.number().min(-180).max(180)),
  flatId: z.string().transform(Number).pipe(z.number().int()),
  maxPrice: z.string().transform(Number).pipe(z.number().min(0)).optional(),
  rooms: z.string().transform(Number).pipe(z.number().int().min(1)).optional(),
  minArea: z.string().transform(Number).pipe(z.number().min(0)).optional(),
  minKitchenArea: z
    .string()
    .transform(Number)
    .pipe(z.number().min(0))
    .optional(),
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
      const ads = Array.isArray(result) ? result : (result as any).rows || []

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

  // Get ads by house_id for map house click
  fastify.get('/map/house-ads', async (request, reply) => {
    try {
      const { houseId, maxPrice, rooms, minArea, minKitchenArea } = z
        .object({
          houseId: z.string().transform(Number).pipe(z.number().int()),
          maxPrice: z
            .string()
            .transform(Number)
            .pipe(z.number().min(0))
            .optional(),
          rooms: z
            .string()
            .transform(Number)
            .pipe(z.number().int().min(1))
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

      // Build dynamic query with filters
      let baseQuery = sql`SELECT
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
        f.kitchen_area
      FROM public.flats_history fh
      JOIN system.moscow_geo mg ON fh.house_id = mg.house_id
      LEFT JOIN public.flats f ON fh.house_id = f.house_id AND fh.floor = f.floor AND fh.rooms = f.rooms
      WHERE fh.house_id = ${houseId}`

      // Add filter conditions dynamically
      if (maxPrice !== undefined) {
        baseQuery = sql`${baseQuery} AND fh.price <= ${maxPrice}`
      }

      if (rooms !== undefined) {
        baseQuery = sql`${baseQuery} AND fh.rooms >= ${rooms}`
      }

      if (minArea !== undefined) {
        baseQuery = sql`${baseQuery} AND f.area IS NOT NULL AND f.area >= ${minArea}`
      }

      if (minKitchenArea !== undefined) {
        baseQuery = sql`${baseQuery} AND f.kitchen_area IS NOT NULL AND f.kitchen_area >= ${minKitchenArea}`
      }

      const finalQuery = sql`${baseQuery} ORDER BY fh.is_actual DESC, fh.price ASC LIMIT 50`

      const result = await db.execute(finalQuery)

      const ads = Array.isArray(result) ? result : (result as any).rows || []

      return {
        ads,
        count: ads.length,
        houseId,
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

        const rows = Array.isArray(result) ? result : (result as any).rows || []
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

  // Get houses with ads within map bounds (bounding box)
  fastify.get('/map/houses-in-bounds', async (request, reply) => {
    try {
      const { north, south, east, west, flatId } = z
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
          flatId: z.string().transform(Number).pipe(z.number().int()),
        })
        .parse(request.query)

      // Get current flat address to exclude houses at the same address
      const flatResult = await db.execute(
        sql`SELECT address FROM "users".user_flats WHERE id = ${flatId} LIMIT 1`,
      )
      const currentFlatAddress = Array.isArray(flatResult)
        ? flatResult[0]?.address
        : (flatResult as any).rows?.[0]?.address

      console.log('Current flat address:', currentFlatAddress)

      // Parse current flat address to extract street and house number for comparison
      let currentFlatStreet = null
      let currentFlatHousenum = null
      if (currentFlatAddress) {
        const addressParts = currentFlatAddress.split(',').map((s) => s.trim())
        if (addressParts.length >= 2) {
          currentFlatStreet = addressParts[0]
          currentFlatHousenum = addressParts[1]
          console.log('Parsed current flat:', {
            street: currentFlatStreet,
            housenum: currentFlatHousenum,
          })
        }
      }

      // Calculate center point and radius from bounds
      const centerLat = (north + south) / 2
      const centerLng = (east + west) / 2

      // Calculate rough radius from bounds (distance from center to corner)
      const latDiff = north - south
      const lngDiff = east - west
      const radius = (Math.max(latDiff, lngDiff) * 111000) / 2 // Convert degrees to meters roughly

      // Get houses with ads within a large radius around the center
      const radiusInt = Math.round(Math.min(radius * 2, 5000))
      const result = await db.execute(
        sql`SELECT * FROM public.get_houses_with_ads_by_coordinates(${centerLat}, ${centerLng}, ${radiusInt})`,
      )

      const allHouses = Array.isArray(result)
        ? result
        : (result as any).rows || []
      console.log(`Found ${allHouses.length} houses before filtering`)

      // Filter houses that are within the exact bounds and exclude current flat address
      const housesData = await Promise.all(
        allHouses
          .filter((house: any) => {
            const lat = Number(house.lat)
            const lng = Number(house.lng)
            const isInBounds =
              lat >= south && lat <= north && lng >= west && lng <= east

            // Exclude houses that match the current flat address (compare by street and house number)
            let isCurrentFlatAddress = false
            if (currentFlatStreet && currentFlatHousenum && house.address) {
              // Parse house address from API
              const houseAddressParts = house.address
                .split(',')
                .map((s) => s.trim())
              if (houseAddressParts.length >= 2) {
                const houseStreet = houseAddressParts[0]
                const houseHousenum = houseAddressParts[1]

                // Compare street and house number (normalize house numbers for comparison)
                const normalizeHousenum = (num) =>
                  num.replace(/\s+/g, '').toLowerCase()
                isCurrentFlatAddress =
                  houseStreet === currentFlatStreet &&
                  normalizeHousenum(houseHousenum) ===
                    normalizeHousenum(currentFlatHousenum)

                // Log only when address matches (for monitoring)
                if (isCurrentFlatAddress) {
                  console.log(
                    `Found matching address - will exclude: ${house.address}`,
                  )
                }
              }
            }

            if (isCurrentFlatAddress) {
              console.log(
                `Excluding house at same address: ${house.address} (matches ${currentFlatAddress})`,
              )
            }

            return isInBounds && !isCurrentFlatAddress
          })
          .map(async (house: any) => {
            // Get count of active ads for this house
            const activeAdsResult = await db.execute(
              sql`SELECT COUNT(*) as active_count FROM public.flats_history WHERE house_id = ${house.house_id} AND is_actual = 1`,
            )

            const activeAdsData = Array.isArray(activeAdsResult)
              ? activeAdsResult
              : (activeAdsResult as any).rows || []
            const activeCount =
              activeAdsData.length > 0
                ? Number(activeAdsData[0].active_count)
                : 0

            return {
              ...house,
              active_ads_count: activeCount,
              has_active_ads: activeCount > 0,
            }
          }),
      )

      // Sort houses: inactive first (so active houses render on top)
      const sortedHouses = housesData.sort((a, b) => {
        // Inactive houses first (false < true), so active houses render on top in map
        return Number(a.has_active_ads) - Number(b.has_active_ads)
      })

      return {
        houses: sortedHouses,
        count: sortedHouses.length,
        bounds: { north, south, east, west },
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({
        error: 'Failed to fetch houses in bounds',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })

  // Get filtered houses with ads within map bounds with filtering criteria
  fastify.get('/map/houses-filtered', async (request, reply) => {
    try {
      const {
        north,
        south,
        east,
        west,
        flatId,
        maxPrice,
        rooms,
        minArea,
        minKitchenArea,
      } = getFilteredHousesSchema.parse(request.query)

      // Get current flat address to exclude houses at the same address
      const flatResult = await db.execute(
        sql`SELECT address FROM "users".user_flats WHERE id = ${flatId} LIMIT 1`,
      )
      const currentFlatAddress = Array.isArray(flatResult)
        ? flatResult[0]?.address
        : (flatResult as any).rows?.[0]?.address

      // Parse current flat address to extract street and house number for comparison
      let currentFlatStreet = null
      let currentFlatHousenum = null
      if (currentFlatAddress) {
        const addressParts = currentFlatAddress.split(',').map((s) => s.trim())
        if (addressParts.length >= 2) {
          currentFlatStreet = addressParts[0]
          currentFlatHousenum = addressParts[1]
        }
      }

      // Calculate center point and radius from bounds
      const centerLat = (north + south) / 2
      const centerLng = (east + west) / 2
      const latDiff = north - south
      const lngDiff = east - west
      const radius = (Math.max(latDiff, lngDiff) * 111000) / 2

      // Get houses with ads that match the filtering criteria (including inactive ads)
      const radiusInt = Math.round(Math.min(radius * 2, 5000))

      // Build the SQL query using Drizzle sql template
      const baseQuery = sql`
        SELECT DISTINCT
          mg.house_id,
          CONCAT(mg.street, ', ', mg.housenum) as address,
          system.ST_Y(system.ST_Transform(mg.centroid_utm, 4326)) as lat,
          system.ST_X(system.ST_Transform(mg.centroid_utm, 4326)) as lng,
          COUNT(fh.id) as ads_count,
          COUNT(CASE WHEN fh.is_actual = 1 THEN 1 END) as active_ads_count
        FROM system.moscow_geo mg
        JOIN public.flats_history fh ON mg.house_id = fh.house_id
        LEFT JOIN public.flats f ON fh.house_id = f.house_id AND fh.floor = f.floor AND fh.rooms = f.rooms
        WHERE system.ST_DWithin(
          system.ST_Transform(system.ST_GeomFromText(${`POINT(${centerLng} ${centerLat})`}, 4326), 32637),
          mg.centroid_utm,
          ${radiusInt}
        )
      `

      // Add filter conditions dynamically
      let finalQuery = baseQuery

      if (maxPrice !== undefined) {
        finalQuery = sql`${finalQuery} AND fh.price <= ${maxPrice}`
      }

      if (rooms !== undefined) {
        finalQuery = sql`${finalQuery} AND fh.rooms >= ${rooms}`
      }

      if (minArea !== undefined) {
        finalQuery = sql`${finalQuery} AND f.area IS NOT NULL AND f.area >= ${minArea}`
      }

      if (minKitchenArea !== undefined) {
        finalQuery = sql`${finalQuery} AND f.kitchen_area IS NOT NULL AND f.kitchen_area >= ${minKitchenArea}`
      }

      finalQuery = sql`${finalQuery}
        GROUP BY mg.house_id, mg.street, mg.housenum, mg.centroid_utm
        HAVING COUNT(fh.id) > 0
      `

      const result = await db.execute(finalQuery)
      const allHouses = Array.isArray(result)
        ? result
        : (result as any).rows || []

      // Filter houses that are within the exact bounds and exclude current flat address
      const housesData = allHouses
        .filter((house: any) => {
          const lat = Number(house.lat)
          const lng = Number(house.lng)
          const isInBounds =
            lat >= south && lat <= north && lng >= west && lng <= east

          // Exclude houses that match the current flat address
          let isCurrentFlatAddress = false
          if (currentFlatStreet && currentFlatHousenum && house.address) {
            const houseAddressParts = house.address
              .split(',')
              .map((s) => s.trim())
            if (houseAddressParts.length >= 2) {
              const houseStreet = houseAddressParts[0]
              const houseHousenum = houseAddressParts[1]
              const normalizeHousenum = (num) =>
                num.replace(/\s+/g, '').toLowerCase()
              isCurrentFlatAddress =
                houseStreet === currentFlatStreet &&
                normalizeHousenum(houseHousenum) ===
                  normalizeHousenum(currentFlatHousenum)
            }
          }

          return isInBounds && !isCurrentFlatAddress
        })
        .map((house: any) => ({
          ...house,
          has_active_ads: Number(house.active_ads_count) > 0,
        }))

      // Sort houses: inactive first (so active houses render on top)
      const sortedHouses = housesData.sort((a, b) => {
        return Number(a.has_active_ads) - Number(b.has_active_ads)
      })

      return {
        houses: sortedHouses,
        count: sortedHouses.length,
        bounds: { north, south, east, west },
        filters: { maxPrice, rooms, minArea, minKitchenArea },
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({
        error: 'Failed to fetch filtered houses',
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

      // Get minimum price for each house
      const pricePromises = houseIdArray.map(async (houseId) => {
        const result = await db.execute(
          sql`SELECT
            ${houseId} as house_id,
            MIN(price) as min_price
          FROM public.flats_history
          WHERE house_id = ${houseId} AND price > 0 AND is_actual = 1
          LIMIT 1`,
        )

        const rows = Array.isArray(result) ? result : (result as any).rows || []
        return rows[0] || { house_id: houseId, min_price: null }
      })

      const housePrices = await Promise.all(pricePromises)

      return {
        prices: housePrices,
        count: housePrices.length,
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({
        error: 'Failed to fetch house prices',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })
}
