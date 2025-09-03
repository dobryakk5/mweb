import { config } from 'dotenv'
import Fastify from 'fastify'
import autoLoad from '@fastify/autoload'
import cors from '@fastify/cors'
import { join } from 'node:path'

config({ path: join(__dirname, '../.env'), override: true })

export default async function startServer() {
  const fastify = Fastify({ logger: true })

  // Регистрируем CORS middleware
  await fastify.register(cors, {
    origin: [
      'http://localhost:13000', 
      'http://127.0.0.1:13000',
      'https://mrealty.netlify.app',
      'http://217.114.15.233:13000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })

  fastify.register(autoLoad, {
    dir: join(__dirname, 'plugins'),
  })

  fastify.register(autoLoad, {
    dir: join(__dirname, 'routes'),
  })

  try {
    const address = await fastify.listen({
      port: Number(process.env.PORT) || 13001,
      host: '0.0.0.0',
    })

    console.log(`Server listening at ${address}`)
  } catch (error) {
    fastify.log.error(`Failed to start server: ${error instanceof Error ? error.message : String(error)}`)

    process.exit(1)
  }
}
