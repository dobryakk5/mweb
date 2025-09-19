import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'

export default async function telegramRoutes(fastify: FastifyInstance) {
  // Send document to Telegram via Python bot
  fastify.post(
    '/send-to-telegram',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Get Python API URL from environment
        const pythonApiUrl =
          process.env.PYTHON_API_URL || 'http://localhost:8008'

        // Read the raw request body as a buffer
        const chunks: Buffer[] = []
        for await (const chunk of request.raw) {
          chunks.push(chunk)
        }
        const bodyBuffer = Buffer.concat(chunks)

        // Forward the buffer to Python API
        const response = await fetch(`${pythonApiUrl}/api/send-document`, {
          method: 'POST',
          body: bodyBuffer,
          headers: {
            'content-type':
              request.headers['content-type'] || 'multipart/form-data',
            'content-length': bodyBuffer.length.toString(),
          },
        })

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
