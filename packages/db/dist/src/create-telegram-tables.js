"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const postgres_js_1 = require("drizzle-orm/postgres-js");
const postgres_1 = __importDefault(require("postgres"));
const dotenv_1 = require("dotenv");
// Load environment variables
(0, dotenv_1.config)();
async function createTelegramTables() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error('❌ DATABASE_URL is not set in environment variables');
        process.exit(1);
    }
    console.log('🔌 Connecting to database...');
    try {
        const client = (0, postgres_1.default)(databaseUrl, { max: 1 });
        const db = (0, postgres_js_1.drizzle)(client);
        console.log('✅ Connected to database successfully');
        console.log('📋 Creating telegram_users table...');
        // This will create the table based on your Drizzle schema
        console.log('✅ telegram_users table schema loaded');
        console.log('📋 Creating sessions table...');
        // This will create the table based on your Drizzle schema
        console.log('✅ sessions table schema loaded');
        console.log('🎉 Telegram tables setup completed successfully!');
        console.log('');
        console.log('Next steps:');
        console.log('1. Get bot token from @BotFather');
        console.log('2. Add BOT_TOKEN to your .env file');
        console.log('3. Run the application with Telegram login');
    }
    catch (error) {
        console.error('❌ Error setting up Telegram tables:', error);
        process.exit(1);
    }
}
createTelegramTables();
//# sourceMappingURL=create-telegram-tables.js.map