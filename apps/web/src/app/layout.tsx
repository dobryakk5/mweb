import type { Metadata } from 'next'
import type { ReactNode, JSX } from 'react'

import ScreenSizeIndicator from '@acme/ui/components/screen-size-indicator'

import { fontSans } from '@/lib/fonts'
import '@/styles/globals.css'

import Providers from './providers'

export const metadata: Metadata = {
  title: 'ACME',
  description: 'Базовый шаблон для Next.js.',
}

interface RootLayoutProps {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps): JSX.Element {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={fontSans.className}>
        <Providers>{children}</Providers>

        <ScreenSizeIndicator enabled={process.env.USE_SCREEN_SIZE_INDICATOR} />
      </body>
    </html>
  )
}
