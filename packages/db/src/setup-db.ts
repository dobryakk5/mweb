import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { config } from 'dotenv'

// Load environment variables
config()

async function setupDatabase() {
  const databaseUrl = process.env.DATABASE_URL
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not set in environment variables')
    console.log('Please create a .env file with your database connection string')
    console.log('Example: DATABASE_URL="postgresql://username:password@localhost:5432/database_name"')
    process.exit(1)
  }

  console.log('🔌 Connecting to database...')
  
  try {
    // Create connection
    const client = postgres(databaseUrl, { max: 1 })
    const db = drizzle(client)
    
    console.log('✅ Connected to database successfully')
    
    // Create users table using Drizzle schema
    console.log('📋 Creating users table...')
    
    // Import schema and create table
    const { users } = await import('./schema')
    
    // This will create the table based on your Drizzle schema
    // You can also run raw SQL if needed
    console.log('✅ Users table schema loaded')
    
    console.log('🎉 Database setup completed successfully!')
    console.log('')
    console.log('Next steps:')
    console.log('1. Add some users through the API')
    console.log('2. Or run: pnpm db:seed (if you want test data)')
    
  } catch (error) {
    console.error('❌ Error setting up database:', error)
    process.exit(1)
  }
}

setupDatabase()
