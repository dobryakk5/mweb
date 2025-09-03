"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const postgres_1 = __importDefault(require("postgres"));
const env_1 = require("./env");
const globalForDb = globalThis;
const client = globalForDb.client ??
    (0, postgres_1.default)(env_1.env.DATABASE_URL, {
        max: 100,
        idle_timeout: 20,
    });
if (env_1.env.NODE_ENV !== 'production') {
    globalForDb.client = client;
}
exports.default = client;
//# sourceMappingURL=client.js.map