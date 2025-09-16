console.log('=== INDEX.TS COMMONJS ===')

const startServer = require('./src/server.ts').default || require('./src/server.ts')

startServer().catch((error: any) => {
  console.error('Failed to start the server:', error)
  process.exit(1)
})
