import type { JSX } from 'react'
import Link from 'next/link'

import Page from '@acme/ui/components/page'
import { buttonVariants } from '@acme/ui/components/button'

import ViewUsers from './components/view-users'

export default function HomePage(): JSX.Element {
  return (
    <Page>
      <Page.Header>
        <Page.Title>Users</Page.Title>

        <Link
          className={buttonVariants({
            className: 'ml-auto',
            variant: 'secondary',
          })}
          href='/users/add'
        >
          Add user
        </Link>
      </Page.Header>

      <ViewUsers />
    </Page>
  )
}
