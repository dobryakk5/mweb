"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    out: './src/migrations',
    schema: './src/schema.ts',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL,
    },
    schemaFilter: ['users'],
};
//# sourceMappingURL=drizzle.config.js.map