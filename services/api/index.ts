console.log('=== INDEX.TS DEBUG ===')
console.log('Current working directory:', process.cwd())
console.log('__filename:', import.meta.url)
console.log('Node.js version:', process.version)
console.log('Process argv:', process.argv)

// Проверяем существование файла
import { existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log('__dirname:', __dirname)

const serverPath = resolve(__dirname, './src/server.ts')
const serverJsPath = resolve(__dirname, './src/server.js')

console.log('Checking server.ts:', serverPath, 'exists:', existsSync(serverPath))
console.log('Checking server.js:', serverJsPath, 'exists:', existsSync(serverJsPath))

console.log('Attempting to import server...')

import startServer from './src/server'

console.log('Server module imported successfully')

startServer().catch((error) => {
  console.error('Failed to start the server:', error)
  console.error('Error stack:', error.stack)

  process.exit(1)
})
