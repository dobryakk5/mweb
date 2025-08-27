import type { SVGProps, JSX } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const SortIcon = (props: IconProps): JSX.Element => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeLinecap='round'
    strokeWidth='1.5'
    {...props}
  >
    <title>Sort</title>
    <path d='M15 18H3M21 6H3M17 12H3' />
  </svg>
)

const TickIcon = (props: IconProps): JSX.Element => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeLinecap='round'
    strokeWidth='1.5'
    {...props}
  >
    <title>Tick</title>
    <path d='M20 6L9 17l-5-5' />
  </svg>
)

export * from 'lucide-react'

export { SortIcon, TickIcon }

export * as default from './icon'
