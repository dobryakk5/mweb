"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'test', 'production']).optional(),
    DATABASE_URL: zod_1.z.string().url().min(1),
});
exports.env = envSchema.parse(process.env);
//# sourceMappingURL=env.js.map