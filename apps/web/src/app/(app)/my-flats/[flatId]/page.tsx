import type { JSX } from 'react'

import EditFlat from './components/edit-flat'

type FlatPageProps = {
  params: Promise<{
    flatId: string
  }>
}

export default async function FlatPage({ params }: FlatPageProps): Promise<JSX.Element> {
  const { flatId } = await params
  return <EditFlat id={parseInt(flatId)} />
}
