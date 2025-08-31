import { type FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db, ads } from '@acme/db'
import { eq } from 'drizzle-orm'

// Схема для парсинга и сохранения
const parseAndSaveSchema = z.object({
  url: z.string().url(),
  flatId: z.number().optional(),
  autoSave: z.boolean().default(true)
})

// Схема для обновления существующего объявления
const updateExistingAdSchema = z.object({
  url: z.string().url(),
})

// Клиент для работы с Python API
class RealtyParserClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  async parseSingleProperty(url: string) {
    try {
      const response = await fetch(`${this.baseUrl}/api/parse/single?url=${encodeURIComponent(url)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const jsonData = await response.json()
      console.log('RealtyParserClient.parseSingleProperty response:', jsonData)
      return jsonData
    } catch (error) {
      throw new Error(`Failed to parse property: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async parsePropertiesByUrls(urls: string[]) {
    try {
      const response = await fetch(`${this.baseUrl}/api/parse/urls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ urls }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      throw new Error(`Failed to parse properties: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async parsePropertiesFromText(text: string) {
    try {
      const response = await fetch(`${this.baseUrl}/api/parse/text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      throw new Error(`Failed to parse properties from text: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async parseWithRetry(urls: string[], maxRetries: number = 3) {
    const results: Array<{ url: string; success: boolean; data?: any; error?: string }> = []
    
    for (const url of urls) {
      let lastError: string | undefined
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const data = await this.parseSingleProperty(url)
          results.push({ url, success: true, data })
          break
        } catch (error) {
          lastError = error instanceof Error ? error.message : 'Unknown error'
          
          if (attempt === maxRetries) {
            results.push({ url, success: false, error: lastError })
          } else {
            // Ждем перед повторной попыткой (экспоненциальная задержка)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
          }
        }
      }
    }
    
    return results
  }

  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      throw new Error(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

// Функция для сохранения/обновления спарсенных данных в БД
async function savePropertyToDb(fastify: FastifyInstance, propertyData: any, url: string, flatId?: number) {
  try {
    fastify.log.info('Saving/updating property to database:', propertyData)
    
    // Сначала проверяем, существует ли запись с таким URL
    const existingAd = await db
      .select()
      .from(ads)
      .where(eq(ads.url, url))
      .limit(1)

    if (existingAd.length > 0) {
      // Запись существует - обновляем только дополнительные поля
      fastify.log.info('Existing ad found, updating additional fields only:', existingAd[0])
      
      const updateData: any = {}

      // Обновляем только дополнительные поля (НЕ id, url, flat_id)
      if (propertyData.address !== undefined && propertyData.address !== null) {
        updateData.address = String(propertyData.address)
      }
      if (propertyData.price !== undefined && propertyData.price !== null) {
        updateData.price = Number(propertyData.price)
      }
      if (propertyData.rooms !== undefined && propertyData.rooms !== null) {
        updateData.rooms = Number(propertyData.rooms)
      }
      if (propertyData.total_area !== undefined && propertyData.total_area !== null) {
        updateData.totalArea = String(propertyData.total_area)
      }
      if (propertyData.living_area !== undefined && propertyData.living_area !== null) {
        updateData.livingArea = String(propertyData.living_area)
      }
      if (propertyData.kitchen_area !== undefined && propertyData.kitchen_area !== null) {
        updateData.kitchenArea = String(propertyData.kitchen_area)
      }
      if (propertyData.floor !== undefined && propertyData.floor !== null) {
        updateData.floor = Number(propertyData.floor)
      }
      if (propertyData.total_floors !== undefined && propertyData.total_floors !== null) {
        updateData.totalFloors = Number(propertyData.total_floors)
      }
      if (propertyData.bathroom !== undefined && propertyData.bathroom !== null) {
        updateData.bathroom = String(propertyData.bathroom)
      }
      if (propertyData.balcony !== undefined && propertyData.balcony !== null) {
        updateData.balcony = String(propertyData.balcony)
      }
      if (propertyData.renovation !== undefined && propertyData.renovation !== null) {
        updateData.renovation = String(propertyData.renovation)
      }
      if (propertyData.furniture !== undefined && propertyData.furniture !== null) {
        updateData.furniture = String(propertyData.furniture)
      }
      if (propertyData.construction_year !== undefined && propertyData.construction_year !== null) {
        updateData.constructionYear = Number(propertyData.construction_year)
      }
      if (propertyData.house_type !== undefined && propertyData.house_type !== null) {
        updateData.houseType = String(propertyData.house_type)
      }
      if (propertyData.ceiling_height !== undefined && propertyData.ceiling_height !== null) {
        updateData.ceilingHeight = String(propertyData.ceiling_height)
      }
      if (propertyData.metro_station !== undefined && propertyData.metro_station !== null) {
        updateData.metroStation = String(propertyData.metro_station)
      }
      if (propertyData.metro_time !== undefined && propertyData.metro_time !== null) {
        updateData.metroTime = String(propertyData.metro_time)
      }
      if (propertyData.tags !== undefined && propertyData.tags !== null) {
        updateData.tags = String(propertyData.tags)
      }
      if (propertyData.description !== undefined && propertyData.description !== null) {
        updateData.description = String(propertyData.description)
      }
      if (propertyData.photo_urls !== undefined && propertyData.photo_urls !== null) {
        if (Array.isArray(propertyData.photo_urls)) {
          updateData.photoUrls = propertyData.photo_urls.map(String)
        } else if (typeof propertyData.photo_urls === 'string') {
          updateData.photoUrls = propertyData.photo_urls.includes(',') 
            ? propertyData.photo_urls.split(',').map(s => s.trim())
            : [propertyData.photo_urls]
        }
      }
      if (propertyData.source !== undefined && propertyData.source !== null) {
        // Конвертируем строковое значение источника в число
        if (propertyData.source === 'cian') {
          updateData.source = 1
        } else if (propertyData.source === 'avito') {
          updateData.source = 2
        } else {
          updateData.source = Number(propertyData.source) || 1
        }
      }
      if (propertyData.status !== undefined && propertyData.status !== null) {
        updateData.status = String(propertyData.status)
      }
      if (propertyData.views_today !== undefined && propertyData.views_today !== null) {
        updateData.viewsToday = Number(propertyData.views_today)
      }
      if (propertyData.total_views !== undefined && propertyData.total_views !== null) {
        updateData.totalViews = Number(propertyData.total_views)
      }

      // Добавляем updated_at
      updateData.updatedAt = new Date()

      fastify.log.info('Updating existing ad with data:', updateData)

      // Обновляем запись
      const result = await db
        .update(ads)
        .set(updateData)
        .where(eq(ads.id, existingAd[0].id))
        .returning()

      fastify.log.info('Property updated in database:', result[0])
      return result[0]

    } else {
      // Записи нет - создаем новую
      fastify.log.info('No existing ad found, creating new one')
      
      const adData: any = {
        // Обязательные поля для новой записи
        url: url,
        address: propertyData.address || '',
        price: Number(propertyData.price) || 0,
        rooms: Number(propertyData.rooms) || 1,
        views: 0, // Начальное значение
        flatId: flatId || 1, // По умолчанию flatId = 1, если не передан
      }

      // Добавляем все дополнительные поля
      if (propertyData.totalArea !== undefined && propertyData.totalArea !== null) {
        adData.totalArea = String(propertyData.totalArea)
      }
      if (propertyData.livingArea !== undefined && propertyData.livingArea !== null) {
        adData.livingArea = String(propertyData.livingArea)
      }
      if (propertyData.kitchenArea !== undefined && propertyData.kitchenArea !== null) {
        adData.kitchenArea = String(propertyData.kitchenArea)
      }
      if (propertyData.floor !== undefined && propertyData.floor !== null) {
        adData.floor = Number(propertyData.floor)
      }
      if (propertyData.totalFloors !== undefined && propertyData.totalFloors !== null) {
        adData.totalFloors = Number(propertyData.totalFloors)
      }
      if (propertyData.bathroom !== undefined && propertyData.bathroom !== null) {
        adData.bathroom = String(propertyData.bathroom)
      }
      if (propertyData.balcony !== undefined && propertyData.balcony !== null) {
        adData.balcony = String(propertyData.balcony)
      }
      if (propertyData.renovation !== undefined && propertyData.renovation !== null) {
        adData.renovation = String(propertyData.renovation)
      }
      if (propertyData.furniture !== undefined && propertyData.furniture !== null) {
        adData.furniture = String(propertyData.furniture)
      }
      if (propertyData.constructionYear !== undefined && propertyData.constructionYear !== null) {
        adData.constructionYear = Number(propertyData.constructionYear)
      }
      if (propertyData.houseType !== undefined && propertyData.houseType !== null) {
        adData.houseType = String(propertyData.houseType)
      }
      if (propertyData.ceilingHeight !== undefined && propertyData.ceilingHeight !== null) {
        adData.ceilingHeight = String(propertyData.ceilingHeight)
      }
      if (propertyData.metroStation !== undefined && propertyData.metroStation !== null) {
        adData.metroStation = String(propertyData.metroStation)
      }
      if (propertyData.metroTime !== undefined && propertyData.metroTime !== null) {
        adData.metroTime = String(propertyData.metroTime)
      }
      if (propertyData.tags !== undefined && propertyData.tags !== null) {
        adData.tags = String(propertyData.tags)
      }
      if (propertyData.description !== undefined && propertyData.description !== null) {
        adData.description = String(propertyData.description)
      }
      if (propertyData.photoUrls !== undefined && propertyData.photoUrls !== null) {
        if (Array.isArray(propertyData.photoUrls)) {
          adData.photoUrls = propertyData.photoUrls.map(String)
        } else if (typeof propertyData.photoUrls === 'string') {
          adData.photoUrls = propertyData.photoUrls.includes(',') 
            ? propertyData.photoUrls.split(',').map(s => s.trim())
            : [propertyData.photoUrls]
        }
      }
      if (propertyData.source !== undefined && propertyData.source !== null) {
        // Конвертируем строковое значение источника в число
        if (propertyData.source === 'cian') {
          adData.source = 1
        } else if (propertyData.source === 'avito') {
          adData.source = 2
        } else {
          adData.source = Number(propertyData.source) || 1
        }
      }
      if (propertyData.status !== undefined && propertyData.status !== null) {
        adData.status = String(propertyData.status)
      }
      if (propertyData.viewsToday !== undefined && propertyData.viewsToday !== null) {
        adData.viewsToday = Number(propertyData.viewsToday)
      }
      if (propertyData.totalViews !== undefined && propertyData.totalViews !== null) {
        adData.totalViews = Number(propertyData.totalViews)
      }

      fastify.log.info('Creating new ad with data:', adData)

      // Создаем новую запись
      const result = await db.insert(ads).values(adData).returning()
      
      fastify.log.info('Property created in database:', result[0])
      return result[0]
    }
  } catch (error) {
    fastify.log.error('Error saving property to database:', error)
    throw error
  }
}

// Создаем клиент для работы с Python API
const realtyClient = new RealtyParserClient(process.env.PYTHON_API_URL || 'http://localhost:8008')

export default async function propertyParserRoutes(fastify: FastifyInstance) {
  // Парсинг одного объявления (обновленный с автосохранением)
  fastify.post('/property-parser/parse-and-save', {
    schema: {
      body: {
        type: 'object',
        properties: {
          url: { type: 'string', format: 'uri' },
          flatId: { type: 'number' },
          autoSave: { type: 'boolean', default: true }
        },
        required: ['url']
      }
    },
    handler: async (request, reply) => {
      const { url, flatId, autoSave = true } = parseAndSaveSchema.parse(request.body)
      
      try {
        fastify.log.info(`Parsing and saving property from URL: ${url}`)
        
        // Парсим данные
        const result = await realtyClient.parseSingleProperty(url)
        
        if (!result.success) {
          return reply.code(400).send({
            success: false,
            error: 'Failed to parse property',
            message: result.message
          })
        }

        let savedAd = null
        
        // Если автосохранение включено, сохраняем в БД
        if (autoSave) {
          try {
            savedAd = await savePropertyToDb(fastify, result.data, url, flatId)
          } catch (saveError) {
            fastify.log.error('Failed to save to database, but parsing was successful:', saveError)
            // Возвращаем данные парсинга, даже если не удалось сохранить
            return reply.send({
              success: true,
              data: result.data,
              message: result.message,
              warning: 'Property parsed but not saved to database',
              saveError: saveError instanceof Error ? saveError.message : 'Unknown save error'
            })
          }
        }

        return reply.send({
          success: true,
          data: result.data,
          savedAd, // Данные сохраненного объявления
          message: autoSave ? 'Property parsed and saved successfully' : 'Property parsed successfully (not saved)'
        })
      } catch (error) {
        fastify.log.error(`Property parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        return reply.code(500).send({ 
          error: 'Failed to parse property',
          details: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    },
  })

  // Пакетный парсинг с автосохранением
  fastify.post('/property-parser/parse-and-save-batch', {
    handler: async (request, reply) => {
      const { urls, flatId, autoSave = true } = request.body as { 
        urls: string[], 
        flatId?: number,
        autoSave?: boolean 
      }
      
      if (!urls || !Array.isArray(urls) || urls.length === 0) {
        return reply.code(400).send({ error: 'URLs array is required' })
      }
      
      try {
        const results = []
        
        for (const url of urls) {
          try {
            fastify.log.info(`Processing URL: ${url}`)
            
            // Парсим данные
            const parseResult = await realtyClient.parseSingleProperty(url)
            
            let savedAd = null
            let saveError = null
            
            if (parseResult.success && autoSave) {
              try {
                savedAd = await savePropertyToDb(fastify, parseResult.data, url, flatId)
              } catch (error) {
                saveError = error instanceof Error ? error.message : 'Unknown save error'
                fastify.log.error(`Failed to save property for URL ${url}:`, error)
              }
            }
            
            results.push({
              url,
              success: parseResult.success,
              data: parseResult.success ? parseResult.data : null,
              savedAd,
              saveError,
              message: parseResult.message
            })
            
          } catch (error) {
            results.push({
              url,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              data: null,
              savedAd: null
            })
          }
        }
        
        const successCount = results.filter(r => r.success).length
        const savedCount = results.filter(r => r.savedAd).length
        
        return reply.send({ 
          success: true, 
          data: results,
          summary: {
            total: urls.length,
            parsed: successCount,
            saved: savedCount,
            failed: urls.length - successCount
          }
        })
      } catch (error) {
        fastify.log.error(`Batch parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        return reply.code(500).send({ 
          error: 'Failed to parse properties',
          details: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    },
  })

  // Парсинг одного объявления (только парсинг, без сохранения)
  fastify.get('/property-parser/parse', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          url: { type: 'string', format: 'uri' }
        },
        required: ['url']
      }
    },
    handler: async (request, reply) => {
      const { url } = request.query as { url: string }
      
      try {
        fastify.log.info(`Parsing property from URL: ${url}`)
        const result = await realtyClient.parseSingleProperty(url)
        
        return reply.send({
          success: result.success,
          data: result.data,
          message: result.message
        })
      } catch (error) {
        fastify.log.error(`Property parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        return reply.code(500).send({ 
          error: 'Failed to parse property',
          details: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    },
  })

  // Пакетный парсинг по URL
  fastify.post('/property-parser/parse-urls', {
    handler: async (request, reply) => {
      const { urls } = request.body as { urls: string[] }
      
      if (!urls || !Array.isArray(urls) || urls.length === 0) {
        return reply.code(400).send({ error: 'URLs array is required' })
      }
      
      try {
        const result = await realtyClient.parsePropertiesByUrls(urls)
        return { success: true, data: result }
      } catch (error) {
        fastify.log.error(`Batch parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        return reply.code(500).send({ 
          error: 'Failed to parse properties',
          details: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    },
  })

  // Парсинг из текста
  fastify.post('/property-parser/parse-text', {
    handler: async (request, reply) => {
      const { text } = request.body as { text: string }
      
      if (!text || typeof text !== 'string') {
        return reply.code(400).send({ error: 'Text parameter is required' })
      }
      
      try {
        const result = await realtyClient.parsePropertiesFromText(text)
        return { success: true, data: result }
      } catch (error) {
        fastify.log.error(`Text parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        return reply.code(500).send({ 
          error: 'Failed to parse properties from text',
          details: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    },
  })

  // Парсинг с retry логикой
  fastify.post('/property-parser/parse-with-retry', {
    handler: async (request, reply) => {
      const { urls, maxRetries = 3 } = request.body as { urls: string[]; maxRetries?: number }
      
      if (!urls || !Array.isArray(urls) || urls.length === 0) {
        return reply.code(400).send({ error: 'URLs array is required' })
      }
      
      try {
        const result = await realtyClient.parseWithRetry(urls, maxRetries)
        return { success: true, data: result }
      } catch (error) {
        fastify.log.error(`Retry parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        return reply.code(500).send({ 
          error: 'Failed to parse properties after retries',
          details: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    },
  })

  // Проверка состояния Python API
  fastify.get('/property-parser/health', {
    handler: async (request, reply) => {
      try {
        const health = await realtyClient.healthCheck()
        return { success: true, data: health }
      } catch (error) {
        fastify.log.error(`Health check error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        return reply.code(503).send({ 
          error: 'Python API is not available',
          details: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    },
  })
}