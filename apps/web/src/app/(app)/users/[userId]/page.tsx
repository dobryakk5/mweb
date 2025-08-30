import type { JSX } from 'react'

import EditUser from './components/edit-user'

type UserPageProps = {
  params: Promise<{
    userId: string
  }>
}

export default async function UserPage({ params }: UserPageProps): Promise<JSX.Element> {
  const { userId } = await params
  return <EditUser id={userId} />
}
