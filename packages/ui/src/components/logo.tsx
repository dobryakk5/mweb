import type { HTMLAttributes } from 'react'

type LogoProps = HTMLAttributes<SVGElement>

const LogoMark = (props: LogoProps) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    viewBox='0 0 32 32'
    fill='currentColor'
    {...props}
  >
    <title>MRealty</title>
    <path d='M4 28V4h6l6 16 6-16h6v24h-4V10l-5 14h-2L11 10v18H4z' />
  </svg>
)

export { LogoMark }
