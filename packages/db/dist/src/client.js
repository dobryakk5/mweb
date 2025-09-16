"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.client = void 0;
const postgres_1 = __importDefault(require("postgres"));
const env_1 = require("./env");
const globalForDb = globalThis;
const clientInstance = globalForDb.client ??
    (0, postgres_1.default)(env_1.env.DATABASE_URL, {
        max: 100,
        idle_timeout: 20,
    });
if (env_1.env.NODE_ENV !== 'production') {
    globalForDb.client = clientInstance;
}
exports.client = clientInstance;
exports.default = clientInstance;
//# sourceMappingURL=client.js.map