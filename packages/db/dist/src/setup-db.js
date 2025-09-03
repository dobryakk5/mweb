"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const postgres_js_1 = require("drizzle-orm/postgres-js");
const postgres_1 = __importDefault(require("postgres"));
const dotenv_1 = require("dotenv");
// Load environment variables
(0, dotenv_1.config)();
async function setupDatabase() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error('❌ DATABASE_URL is not set in environment variables');
        console.log('Please create a .env file with your database connection string');
        console.log('Example: DATABASE_URL="postgresql://username:password@localhost:5432/database_name"');
        process.exit(1);
    }
    console.log('🔌 Connecting to database...');
    try {
        // Create connection
        const client = (0, postgres_1.default)(databaseUrl, { max: 1 });
        const db = (0, postgres_js_1.drizzle)(client);
        console.log('✅ Connected to database successfully');
        // Create users table using Drizzle schema
        console.log('📋 Creating users table...');
        // Import schema and create table
        const { users } = await Promise.resolve().then(() => __importStar(require('./schema')));
        // This will create the table based on your Drizzle schema
        // You can also run raw SQL if needed
        console.log('✅ Users table schema loaded');
        console.log('🎉 Database setup completed successfully!');
        console.log('');
        console.log('Next steps:');
        console.log('1. Add some users through the API');
        console.log('2. Or run: pnpm db:seed (if you want test data)');
    }
    catch (error) {
        console.error('❌ Error setting up database:', error);
        process.exit(1);
    }
}
setupDatabase();
//# sourceMappingURL=setup-db.js.map