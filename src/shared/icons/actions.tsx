/**
 * @purpose Defines action-oriented SVG icon components.
 * @role    Shared icon set for menus, buttons, and worktree row actions.
 * @deps    React SVG props pattern
 * @gotcha  Keep stroke width and viewBox consistent with existing icons; docs/modules/icons/README.md
 */
import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

export const Play = (props: IconProps) => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="none" {...props}>
    <path d="M5 3.5v9l7-4.5-7-4.5Z" fill="currentColor" />
  </svg>
)

export const Editor = (props: IconProps) => (
  <svg viewBox="0 0 16 16" width="15" height="15" fill="none" {...props}>
    <rect x="1.6" y="2.6" width="12.8" height="10.8" rx="1.7" stroke="currentColor" strokeWidth="1.3" />
    <path d="M1.6 5.4h12.8" stroke="currentColor" strokeWidth="1.3" />
    <path
      d="M5 8.4 6.6 10 5 11.6M8.4 11.6h2.4"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const Terminal = (props: IconProps) => (
  <svg viewBox="0 0 16 16" width="15" height="15" fill="none" {...props}>
    <rect x="1.6" y="2.6" width="12.8" height="10.8" rx="1.7" stroke="currentColor" strokeWidth="1.3" />
    <path
      d="M4 6.3 6.2 8 4 9.7M8 10.2h3.4"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const More = (props: IconProps) => (
  <svg viewBox="0 0 16 16" width="15" height="15" fill="currentColor" {...props}>
    <circle cx="3.5" cy="8" r="1.3" />
    <circle cx="8" cy="8" r="1.3" />
    <circle cx="12.5" cy="8" r="1.3" />
  </svg>
)

export const Finder = (props: IconProps) => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="none" {...props}>
    <rect x="2" y="2" width="12" height="12" rx="2.4" stroke="currentColor" strokeWidth="1.3" />
    <path
      d="M5 5.6v1.6M9.2 5.6v1.6M5.2 10.4c.8.7 1.8 1 2.8 1s2-.3 2.8-1"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  </svg>
)

export const Archive = (props: IconProps) => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="none" {...props}>
    <rect x="2" y="3" width="12" height="3.2" rx="0.9" stroke="currentColor" strokeWidth="1.3" />
    <path d="M3.2 6.2v6c0 .6.5 1 1 1h7.6c.6 0 1-.4 1-1v-6" stroke="currentColor" strokeWidth="1.3" />
    <path d="M6.4 9h3.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
)

export const Gear = (props: IconProps) => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="none" {...props}>
    <circle cx="8" cy="8" r="2.1" stroke="currentColor" strokeWidth="1.3" />
    <path
      d="M8 1.8v1.6M8 12.6v1.6M14.2 8h-1.6M3.4 8H1.8M12.4 3.6l-1.1 1.1M4.7 11.3l-1.1 1.1M12.4 12.4l-1.1-1.1M4.7 4.7 3.6 3.6"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  </svg>
)

export const Copy = (props: IconProps) => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="none" {...props}>
    <rect x="5.2" y="5.2" width="8.2" height="8.2" rx="1.4" stroke="currentColor" strokeWidth="1.3" />
    <path
      d="M10.6 5.2V3.6c0-.6-.5-1-1-1H3.6c-.6 0-1 .4-1 1v6c0 .5.4 1 1 1h1.6"
      stroke="currentColor"
      strokeWidth="1.3"
    />
  </svg>
)

export const Import = (props: IconProps) => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="none" {...props}>
    <path
      d="M8 2v7.4M5 6.6 8 9.6l3-3M3 11.4v1.2c0 .6.4 1 1 1h8c.6 0 1-.4 1-1v-1.2"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const Quit = (props: IconProps) => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="none" {...props}>
    <path
      d="M6 2.6H3.6c-.6 0-1 .4-1 1v8.8c0 .6.4 1 1 1H6M10 5l3 3-3 3M13 8H6.2"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
