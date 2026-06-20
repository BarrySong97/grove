/**
 * @purpose Provides color utility helpers for runtime design tokens.
 * @role    Shared pure helper used to derive accent transparency.
 * @deps    TypeScript string manipulation
 * @gotcha  hexA expects hex-like input and keeps theme derivation simple; docs/modules/lib/README.md
 */
export function hexA(hex: string, a: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}
