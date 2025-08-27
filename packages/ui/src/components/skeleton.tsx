import type { HTMLAttributes, JSX } from 'react'

import cn from '../utils/cn'

export default function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>): JSX.Element {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-border', className)}
      {...props}
    />
  )
}
