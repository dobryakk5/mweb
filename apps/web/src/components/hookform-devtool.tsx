import dynamic from 'next/dynamic'
import type { DevtoolUIProps } from '@hookform/devtools/dist/devToolUI'
import type { JSX } from 'react'

const DevTool = dynamic<DevtoolUIProps>(
  () => import('@hookform/devtools').then((mod) => mod.DevTool),
  {
    ssr: false,
  },
)

type HookFormDevtoolProps = {
  control: DevtoolUIProps['control']
}

export default function HookFormDevtool({
  control,
}: HookFormDevtoolProps): JSX.Element | null {
  // Временно отключено для избежания ошибки Maximum update depth
  return null

  // if (process.env.NODE_ENV === 'production') {
  //   return null
  // }

  // return <DevTool control={control} />
}
