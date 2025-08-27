import db from './db'
import { users } from './schema'
import { eq } from './orm'
import type { UpsertUser } from './types'

export async function addUser(
  values: Pick<UpsertUser, 'username' | 'firstName' | 'lastName' | 'email'>,
) {
  return await db.insert(users).values(values).returning({ id: users.id })
}

export async function updateUserById(id: string, values: Partial<UpsertUser>) {
  return await db
    .update(users)
    .set({
      ...values,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning({
      id: users.id,
      username: users.username,
      firstName: users.firstName,
      lastName: users.lastName,
    })
}

export async function deleteUserById(id: string) {
  return await db.delete(users).where(eq(users.id, id))
}
