'use client'

import { type ReactNode, type JSX, useState } from 'react'
import { QueryClient } from '@tanstack/query-core'
import {
  QueryCache,
  MutationCache,
  QueryClientProvider,
} from '@tanstack/react-query'
import { ReactQueryStreamedHydration } from '@tanstack/react-query-next-experimental'
import dynamic from 'next/dynamic'

import toast from '@acme/ui/lib/toast'

// Динамически загружаем DevTools только в development
const ReactQueryDevtools = dynamic(
  () =>
    import('@tanstack/react-query-devtools').then((d) => ({
      default: d.ReactQueryDevtools,
    })),
  {
    ssr: false,
  },
)

type ReactQueryProviderProps = {
  children: ReactNode
}

export default function ReactQueryProvider({
  children,
}: ReactQueryProviderProps): JSX.Element {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            staleTime: 60 * 1000 * 30, // 30 minutes
            refetchOnWindowFocus: false,
          },
        },
        queryCache: new QueryCache({
          onError: (err, query) => {
            if (query.state.data !== undefined) {
              console.error(err)

              toast.error('Something went wrong')
            }
          },
        }),
        mutationCache: new MutationCache({
          onError: (err, _variables, _context, mutation) => {
            if (mutation.options.onError) {
              return
            }

            console.error(err)

            toast.error('Something went wrong')
          },
        }),
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryStreamedHydration>{children}</ReactQueryStreamedHydration>

      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
