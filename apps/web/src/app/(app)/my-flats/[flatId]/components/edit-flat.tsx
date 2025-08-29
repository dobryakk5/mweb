'use client'

import type { JSX } from 'react'
import { notFound } from 'next/navigation'

import type { UserFlat } from '@acme/db/types'

import { useFlat } from '@/domains/flats/hooks/queries'

import EditFlatForm from './edit-flat-form'

type EditFlatProps = Pick<UserFlat, 'id'>

export default function EditFlat({ id }: EditFlatProps): JSX.Element {
  const { data: flat, isLoading } = useFlat(id)

  if (!isLoading && !flat) {
    return notFound()
  }

  return <EditFlatForm flat={flat} isLoading={isLoading} />
}
