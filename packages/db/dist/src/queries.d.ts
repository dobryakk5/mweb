import type { z } from 'zod';
import type { getUsersQuerySchema } from './schemas';
export declare function getUsers({ search, sortBy, page, }: z.infer<typeof getUsersQuerySchema>): Promise<{
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    createdAt: Date;
}[]>;
export declare function getUsersCount({ search }: {
    search?: string;
}): Promise<number | undefined>;
export declare function getUserById(id: string): Promise<{
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
} | undefined>;
//# sourceMappingURL=queries.d.ts.map