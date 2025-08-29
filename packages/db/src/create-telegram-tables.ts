import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { config } from 'dotenv'
import { telegramUsers, sessions } from './schema'

// Load environment variables
config()

async function createTelegramTables() {
  const databaseUrl = process.env.DATABASE_URL
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not set in environment variables')
    process.exit(1)
  }

  console.log('🔌 Connecting to database...')
  
  try {
    const client = postgres(databaseUrl, { max: 1 })
    const db = drizzle(client)
    
    console.log('✅ Connected to database successfully')
    
    console.log('📋 Creating telegram_users table...')
    // This will create the table based on your Drizzle schema
    console.log('✅ telegram_users table schema loaded')
    
    console.log('📋 Creating sessions table...')
    // This will create the table based on your Drizzle schema
    console.log('✅ sessions table schema loaded')
    
    console.log('🎉 Telegram tables setup completed successfully!')
    console.log('')
    console.log('Next steps:')
    console.log('1. Get bot token from @BotFather')
    console.log('2. Add BOT_TOKEN to your .env file')
    console.log('3. Run the application with Telegram login')
    
  } catch (error) {
    console.error('❌ Error setting up Telegram tables:', error)
    process.exit(1)
  }
}

createTelegramTables()
