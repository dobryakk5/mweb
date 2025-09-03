"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timestamps = exports.id = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const id_1 = require("@acme/id");
exports.id = {
    id: (0, pg_core_1.varchar)('id').primaryKey().$defaultFn(id_1.generateId),
};
exports.timestamps = {
    createdAt: (0, pg_core_1.timestamp)('created_at', {
        mode: 'date',
    })
        .notNull()
        .defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', {
        mode: 'date',
    })
        .notNull()
        .defaultNow(),
};
//# sourceMappingURL=utils.js.map