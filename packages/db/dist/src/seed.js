"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const faker_1 = require("@faker-js/faker");
const schemas_1 = require("./schemas");
const db_1 = __importDefault(require("./db"));
const schema_1 = require("./schema");
const extendedUserSchema = schemas_1.upsertUserSchema.merge(zod_1.z.object({
    createdAt: zod_1.z.date().default(() => new Date()),
}));
async function seedUsers() {
    const values = [];
    for (let i = 0; i < 100; i++) {
        const firstName = faker_1.faker.person.firstName();
        const lastName = faker_1.faker.person.lastName();
        values.push({
            firstName,
            lastName,
            username: faker_1.faker.internet.username({ firstName, lastName }).toLowerCase(),
            email: faker_1.faker.internet.email({ firstName, lastName }).toLowerCase(),
            createdAt: faker_1.faker.date.between({
                from: new Date('2020-01-01'),
                to: new Date(),
            }),
        });
    }
    await db_1.default.insert(schema_1.users).values(values).returning();
}
async function main() {
    /**
     * Reset database
     */
    await db_1.default.delete(schema_1.users);
    console.log('✔ Database reset');
    /**
     * Create users
     */
    await seedUsers();
    console.log('✔ Created users');
    console.log('Database seeded successfully!');
}
main()
    .catch((err) => {
    console.error(err);
    process.exit(1);
})
    .finally(async () => {
    process.exit();
});
//# sourceMappingURL=seed.js.map