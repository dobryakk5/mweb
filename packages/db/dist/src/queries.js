"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = getUsers;
exports.getUsersCount = getUsersCount;
exports.getUserById = getUserById;
const db_1 = __importDefault(require("./db"));
const orm_1 = require("./orm");
const schema_1 = require("./schema");
async function getUsers({ search, sortBy = 'createdAt', page, }) {
    return await db_1.default.query.users.findMany({
        columns: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            createdAt: true,
        },
        where: (0, orm_1.and)(search ? (0, orm_1.ilike)(schema_1.users.firstName, `%${decodeURI(search)}%`) : undefined),
        orderBy: (user, { asc, desc }) => [
            ...(sortBy === 'createdAt' ? [desc(user.createdAt)] : []),
            ...(sortBy === 'firstName' ? [asc(user.firstName)] : []),
        ],
        limit: 15,
        ...(page && {
            offset: (page - 1) * 15,
        }),
    });
}
async function getUsersCount({ search }) {
    return await db_1.default
        .select({ total: (0, orm_1.sql) `count(*)` })
        .from(schema_1.users)
        .where((0, orm_1.and)(search ? (0, orm_1.ilike)(schema_1.users.firstName, `%${decodeURI(search)}%`) : undefined))
        .then(([res]) => res?.total);
}
async function getUserById(id) {
    return await db_1.default.query.users.findFirst({
        columns: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
        },
        where: (0, orm_1.eq)(schema_1.users.id, id),
    });
}
//# sourceMappingURL=queries.js.map