'use client'

import type { JSX } from 'react'
import { notFound } from 'next/navigation'

import type { User } from '@acme/db/types'

import { useUser } from '@/domains/users/hooks/queries'

import EditUserForm from './edit-user-form'

type EditUserProps = Pick<User, 'id'>

export default function EditUser({ id }: EditUserProps): JSX.Element {
  const { data: user, isLoading } = useUser(id)

  if (!isLoading && !user) {
    return notFound()
  }

  return <EditUserForm user={user} isLoading={isLoading} />
}
