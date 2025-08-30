import api from '@/lib/api'

export interface ParsePropertyResponse {
  success: boolean
  message?: string
  data: {
    price?: number
    address?: string
    rooms?: number
    floor?: number
    area?: number
    description?: string
    [key: string]: any
  }
}

export interface ParsePropertiesResponse {
  success: boolean
  data: Array<{
    url: string
    success: boolean
    data?: ParsePropertyResponse['data']
    error?: string
  }>
}

// Парсинг одного объявления по URL
export async function parseProperty(url: string): Promise<ParsePropertyResponse> {
  const response = await api.get(`/property-parser/parse?url=${encodeURIComponent(url)}`)
  return response.data
}

// Пакетный парсинг по URL
export async function parsePropertiesByUrls(urls: string[]): Promise<ParsePropertiesResponse> {
  const response = await api.post('/property-parser/parse-urls', { urls })
  return response.data
}

// Парсинг из текста
export async function parsePropertiesFromText(text: string): Promise<ParsePropertiesResponse> {
  const response = await api.post('/property-parser/parse-text', { text })
  return response.data
}

// Парсинг с retry логикой
export async function parseWithRetry(urls: string[], maxRetries: number = 3): Promise<ParsePropertiesResponse> {
  const response = await api.post('/property-parser/parse-with-retry', { urls, maxRetries })
  return response.data
}

// Проверка состояния API
export async function checkPropertyParserHealth(): Promise<{ success: boolean; data: any }> {
  const response = await api.get('/property-parser/health')
  return response.data
}
