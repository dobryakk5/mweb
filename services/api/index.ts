import startServer from './src/server'

startServer().catch((error) => {
  console.error('Failed to start the server:', error)

  process.exit(1)
})
