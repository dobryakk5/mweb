import type { z } from 'zod'

import type { getUsersQuerySchema } from './schemas'
import db from './db'
import { and, ilike, sql, eq } from './orm'
import { users } from './schema'

export async function getUsers({
  search,
  sortBy = 'createdAt',
  page,
}: z.infer<typeof getUsersQuerySchema>) {
  return await db.query.users.findMany({
    columns: {
      id: true,
      firstName: true,
      lastName: true,
      username: true,
      createdAt: true,
    },
    where: and(
      search ? ilike(users.firstName, `%${decodeURI(search)}%`) : undefined,
    ),
    orderBy: (user, { asc, desc }) => [
      ...(sortBy === 'createdAt' ? [desc(user.createdAt)] : []),
      ...(sortBy === 'firstName' ? [asc(user.firstName)] : []),
    ],
    limit: 15,
    ...(page && {
      offset: (page - 1) * 15,
    }),
  })
}

export async function getUsersCount({ search }: { search?: string }) {
  return await db
    .select({ total: sql<number>`count(*)` })
    .from(users)
    .where(
      and(
        search ? ilike(users.firstName, `%${decodeURI(search)}%`) : undefined,
      ),
    )
    .then(([res]) => res?.total)
}

export async function getUserById(id: string) {
  return await db.query.users.findFirst({
    columns: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      email: true,
    },
    where: eq(users.id, id),
  })
}
