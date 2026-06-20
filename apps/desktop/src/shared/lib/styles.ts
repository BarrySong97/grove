/**
 * @purpose Defines shared React style typing for CSS variable maps.
 * @role    Type helper for components passing custom CSS variables inline.
 * @deps    React CSSProperties type
 * @gotcha  Use for CSS custom properties instead of broad any casts; docs/modules/lib/README.md
 */
import type { CSSProperties } from 'react'

export type CSSVars = CSSProperties & Record<string, string | number>
