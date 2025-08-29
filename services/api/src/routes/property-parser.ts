import { type FastifyInstance } from 'fastify'

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

// Создаем клиент для работы с Python API
const realtyClient = new RealtyParserClient(process.env.PYTHON_API_URL || 'http://localhost:8008')

export default async function propertyParserRoutes(fastify: FastifyInstance) {
  // Парсинг одного объявления
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
        fastify.log.info(`Python API result type: ${typeof result}`)
        fastify.log.info(`Python API result: ${JSON.stringify(result)}`)
        fastify.log.info(`Python API result.data: ${JSON.stringify(result.data)}`)
        fastify.log.info(`Python API result.success: ${result.success}`)
        fastify.log.info(`Python API result.message: ${result.message}`)
        
        // Проверим все свойства result
        fastify.log.info(`All result keys: ${Object.keys(result)}`)
        
        // Создаем новый объект вручную
        const response = {
          success: result.success,
          data: result.data,
          message: result.message
        }
        
        fastify.log.info(`Final response: ${JSON.stringify(response)}`)
        fastify.log.info(`Response.data type: ${typeof response.data}`)
        fastify.log.info(`Response.data keys: ${response.data ? Object.keys(response.data) : 'null'}`)
        
        // Возвращаем реальные данные от Python API без форматирования цены
        let formattedData = { ...result.data }
        
        // Логируем все поля для отладки
        fastify.log.info(`All data fields from Python API:`)
        Object.keys(formattedData).forEach(key => {
          fastify.log.info(`  ${key}: ${formattedData[key]} (type: ${typeof formattedData[key]})`)
        })
        
        // Цена остается как пришла из API (без деления на миллионы)
        fastify.log.info(`Price from API: ${formattedData.price}`)
        
        const finalResponse = {
          success: result.success,
          data: formattedData,
          message: result.message
        }
        
        fastify.log.info(`Final response before return: ${JSON.stringify(finalResponse)}`)
        return reply.send(finalResponse)
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
