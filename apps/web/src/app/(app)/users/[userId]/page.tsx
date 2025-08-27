import type { JSX } from 'react'

import EditUser from './components/edit-user'

type UserPageProps = {
  params: {
    userId: string
  }
}

export default function UserPage({ params }: UserPageProps): JSX.Element {
  return <EditUser id={params.userId} />
}
