import { config } from 'dotenv'
import Fastify from 'fastify'
import autoLoad from '@fastify/autoload'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

// ESM эквивалент __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

config({ path: join(__dirname, '../.env'), override: true })

export default async function startServer() {
  console.log('=== SERVER.TS STARTING ===')

  // Выводим версию API для отслеживания деплоев
  try {
    const packageJson = await import('../package.json', {
      assert: { type: 'json' },
    })
    console.log(`=== API VERSION: ${packageJson.default.version} ===`)
  } catch (error) {
    console.log('=== API VERSION: unknown ===')
  }

  const fastify = Fastify({ logger: true })

  console.log('=== REGISTERING CORS ===')
  // Регистрируем CORS middleware
  await fastify.register(cors, {
    origin: true, // Разрешить все origins временно
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })

  console.log('=== REGISTERING MULTIPART ===')
  // Регистрируем multipart support для файлов
  await fastify.register(multipart, {
    // Настройки для файлов
    attachFieldsToBody: false, // Не прикрепляем поля к body, получим через req.body
    sharedSchemaId: 'MultipartFileSchema',
  })

  console.log('=== REGISTERING PLUGINS ===')
  fastify.register(autoLoad, {
    dir: join(__dirname, 'plugins'),
  })

  console.log('=== REGISTERING ROUTES ===')
  console.log('Routes dir path:', join(__dirname, 'routes'))
  fastify.register(autoLoad, {
    dir: join(__dirname, 'routes'),
  })

  try {
    const address = await fastify.listen({
      port: Number(process.env.PORT) || 13001,
      host: '0.0.0.0',
    })

    console.log(`Server listening at ${address}`)

    // Выводим все зарегистрированные маршруты для диагностики
    console.log('\n=== Зарегистрированные маршруты ===')
    fastify.printRoutes()
    console.log('=== Конец списка маршрутов ===\n')
  } catch (error) {
    fastify.log.error(
      `Failed to start server: ${error instanceof Error ? error.message : String(error)}`,
    )

    process.exit(1)
  }
}
