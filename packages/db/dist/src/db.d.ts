import * as schema from './schema';
declare const db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof schema> & {
    $client: import("postgres").Sql<{}>;
};
export default db;
//# sourceMappingURL=db.d.ts.map