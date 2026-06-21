import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>

export const Download = (p: P) => (
  <svg width="17" height="17" viewBox="0 0 16 16" fill="none" {...p}>
    <path
      d="M8 1.6v8.4M4.6 7l3.4 3.2L11.4 7M2.8 11.4v1.6c0 .7.5 1.2 1.2 1.2h8c.7 0 1.2-.5 1.2-1.2v-1.6"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
  </svg>
)
