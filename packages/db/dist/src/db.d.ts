import * as schema from './schema';
declare const database: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof schema> & {
    $client: import("postgres").Sql<{}>;
};
export declare const db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof schema> & {
    $client: import("postgres").Sql<{}>;
};
export default database;
//# sourceMappingURL=db.d.ts.map