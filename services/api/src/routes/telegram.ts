import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'

const sendToTelegramSchema = z.object({
  user_id: z.string(),
  caption: z.string(),
  filename: z.string(),
  excelData: z.array(z.record(z.any())), // Array of Excel row objects
})

export default async function telegramRoutes(fastify: FastifyInstance) {
  // Send Excel document to Telegram via Python bot
  fastify.post(
    '/send-to-telegram',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Parse and validate request body
        const body = sendToTelegramSchema.parse(request.body)

        // Get Python API URL from environment
        const pythonApiUrl =
          process.env.PYTHON_API_URL || 'http://localhost:8008'

        // Send JSON data to Python API
        const response = await fetch(
          `${pythonApiUrl}/api/send-excel-document`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: body.user_id,
              caption: body.caption,
              filename: body.filename,
              excel_data: body.excelData,
            }),
          },
        )

        if (!response.ok) {
          const errorText = await response.text()
          fastify.log.error(`Python API error: ${response.status} ${errorText}`)
          return reply.code(response.status).send({
            error: 'Failed to send to Telegram',
            details: errorText,
          })
        }

        const result = await response.json()
        return result
      } catch (error) {
        fastify.log.error('Error sending to Telegram:', error)
        return reply.code(500).send({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    },
  )
}
