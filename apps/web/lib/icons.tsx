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

export const GitHub = (p: P) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" {...p}>
    <path d="M8 .2a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38v-1.34c-2.23.49-2.7-1.07-2.7-1.07-.36-.93-.89-1.18-.89-1.18-.73-.5.05-.49.05-.49.81.06 1.23.83 1.23.83.72 1.23 1.88.87 2.34.67.07-.52.28-.87.5-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.83-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.22 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.52.56.83 1.28.83 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.19c0 .21.15.46.55.38A8 8 0 0 0 8 .2Z" />
  </svg>
)

export const Copy = (p: P) => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" {...p}>
    <rect x="5.4" y="5.4" width="8.2" height="8.2" rx="1.6" stroke="currentColor" strokeWidth="1.4" />
    <path d="M10.6 5.4V3.8c0-.88-.72-1.6-1.6-1.6H3.8c-.88 0-1.6.72-1.6 1.6v5.2c0 .88.72 1.6 1.6 1.6h1.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
)

export const Check = (p: P) => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" {...p}>
    <path d="m3 8.4 3.2 3.2L13 4.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
