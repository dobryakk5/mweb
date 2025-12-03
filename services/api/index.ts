console.log('=== INDEX.TS COMMONJS ===')

const serverModule = require('./src/server')
const startServer = serverModule.default ?? serverModule

startServer().catch((error: any) => {
  console.error('Failed to start the server:', error)
  process.exit(1)
})
