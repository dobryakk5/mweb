import startServer from './src/server.ts'

startServer().catch((error) => {
  console.error('Failed to start the server:', error)

  process.exit(1)
})
