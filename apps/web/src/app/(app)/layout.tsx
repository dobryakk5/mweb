import type { Metadata } from 'next'
import type { ReactNode, JSX } from 'react'

import BurgerMenu from '@acme/ui/components/burger-menu'

export const metadata: Metadata = {
  title: 'MRealty',
}

interface AppLayoutProps {
  children: ReactNode
}

export default function AppLayout({ children }: AppLayoutProps): JSX.Element {
  return (
    <div className='flex h-screen w-full'>
      <BurgerMenu />
      <main className='flex w-full'>{children}</main>
    </div>
  )
}
