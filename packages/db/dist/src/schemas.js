"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.users = exports.userFlats = exports.ads = exports.insertAdSchema = exports.selectAdSchema = exports.insertUserFlatSchema = exports.selectUserFlatSchema = exports.getUsersCountQuerySchema = exports.getUsersQuerySchema = exports.upsertUserSchema = exports.selectUserSchema = void 0;
const drizzle_zod_1 = require("drizzle-zod");
const zod_1 = require("zod");
const schema_1 = require("./schema");
Object.defineProperty(exports, "users", { enumerable: true, get: function () { return schema_1.users; } });
Object.defineProperty(exports, "userFlats", { enumerable: true, get: function () { return schema_1.userFlats; } });
Object.defineProperty(exports, "ads", { enumerable: true, get: function () { return schema_1.ads; } });
exports.selectUserSchema = (0, drizzle_zod_1.createSelectSchema)(schema_1.users);
exports.upsertUserSchema = (0, drizzle_zod_1.createInsertSchema)(schema_1.users, {
    firstName: zod_1.z.string().min(2).max(20),
    lastName: zod_1.z.string().min(2).max(20),
    username: zod_1.z.string().min(2).max(20),
    email: zod_1.z.string().email(),
});
const UsersQuerySchema = zod_1.z.object({
    search: zod_1.z.string().optional(),
});
exports.getUsersQuerySchema = UsersQuerySchema.merge(zod_1.z.object({
    sortBy: zod_1.z.enum(['createdAt', 'firstName']).optional().default('createdAt'),
    page: zod_1.z.coerce.number().optional(),
}));
exports.getUsersCountQuerySchema = UsersQuerySchema;
// User flats schemas
exports.selectUserFlatSchema = (0, drizzle_zod_1.createSelectSchema)(schema_1.userFlats);
exports.insertUserFlatSchema = (0, drizzle_zod_1.createInsertSchema)(schema_1.userFlats);
exports.selectAdSchema = (0, drizzle_zod_1.createSelectSchema)(schema_1.ads);
exports.insertAdSchema = (0, drizzle_zod_1.createInsertSchema)(schema_1.ads);
//# sourceMappingURL=schemas.js.map