import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>

/* ---- Pine squircle brand mark (the Grove app icon) ---- */
function squircle(size: number, n: number) {
  const a = size / 2,
    c = size / 2,
    N = 200
  let d = ''
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * Math.PI * 2,
      ct = Math.cos(t),
      st = Math.sin(t)
    const x = c + a * Math.sign(ct) * Math.pow(Math.abs(ct), 2 / n)
    const y = c + a * Math.sign(st) * Math.pow(Math.abs(st), 2 / n)
    d += (i === 0 ? 'M' : 'L') + x.toFixed(2) + ' ' + y.toFixed(2) + ' '
  }
  return d + 'Z'
}

function pine(cx: number, topY: number, H: number) {
  const W1 = 0.2, W2 = 0.32, W3 = 0.46, Y1 = 0.26, Y2 = 0.52, Y3 = 0.8, inset = 0.56, tw = 0.075
  type Pt = { x: number; y: number; type: string }
  const P = (x: number, y: number, type: string): Pt => ({ x: cx + x * H, y: topY + y * H, type })
  const pts: Pt[] = [
    P(0, 0, 'apex'), P(W1, Y1, 'tip'), P(W1 * inset, Y1, 'notch'), P(W2, Y2, 'tip'),
    P(W2 * inset, Y2, 'notch'), P(W3, Y3, 'tip'), P(tw, Y3, 'meet'), P(tw, 1, 'trunk'),
    P(-tw, 1, 'trunk'), P(-tw, Y3, 'meet'), P(-W3, Y3, 'tip'), P(-W2 * inset, Y2, 'notch'),
    P(-W2, Y2, 'tip'), P(-W1 * inset, Y1, 'notch'), P(-W1, Y1, 'tip'),
  ]
  const rad: Record<string, number> = { apex: 0.05, tip: 0.052, notch: 0.04, meet: 0.022, trunk: 0.04 }
  const n = pts.length, rS = 1.2
  const sub = (a: Pt, b: Pt) => ({ x: a.x - b.x, y: a.y - b.y })
  const len = (v: { x: number; y: number }) => Math.hypot(v.x, v.y)
  const unit = (v: { x: number; y: number }) => { const l = len(v) || 1; return { x: v.x / l, y: v.y / l } }
  const A: { x: number; y: number }[] = [], B: { x: number; y: number }[] = []
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n], cur = pts[i], next = pts[(i + 1) % n]
    let r = (rad[cur.type] || 0.04) * rS * H
    r = Math.min(r, 0.46 * len(sub(prev, cur)), 0.46 * len(sub(next, cur)))
    const up = unit(sub(prev, cur)), un = unit(sub(next, cur))
    A[i] = { x: cur.x + up.x * r, y: cur.y + up.y * r }
    B[i] = { x: cur.x + un.x * r, y: cur.y + un.y * r }
  }
  let d = `M ${A[0].x.toFixed(1)} ${A[0].y.toFixed(1)} Q ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)} ${B[0].x.toFixed(1)} ${B[0].y.toFixed(1)} `
  for (let i = 1; i <= n; i++) {
    const idx = i % n
    d += `L ${A[idx].x.toFixed(1)} ${A[idx].y.toFixed(1)} `
    if (idx !== 0) d += `Q ${pts[idx].x.toFixed(1)} ${pts[idx].y.toFixed(1)} ${B[idx].x.toFixed(1)} ${B[idx].y.toFixed(1)} `
  }
  return d + 'Z'
}

export function GroveMark({ size = 30 }: { size?: number }) {
  const S = 1024
  const u = 'gm' + size
  const path = squircle(S, 5)
  return (
    <svg width={size} height={size} viewBox={`0 0 ${S} ${S}`} className="block rounded-[22%]">
      <defs>
        <linearGradient id={`${u}bg`} x1="200" y1="80" x2="820" y2="950" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3b4357" /><stop offset="0.6" stopColor="#272c3a" /><stop offset="1" stopColor="#1a1e28" />
        </linearGradient>
        <linearGradient id={`${u}f`} x1="0" y1="150" x2="0" y2="850" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#93f0b0" /><stop offset="1" stopColor="#2db167" />
        </linearGradient>
        <linearGradient id={`${u}b`} x1="0" y1="250" x2="0" y2="850" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4ec081" /><stop offset="1" stopColor="#188046" />
        </linearGradient>
        <radialGradient id={`${u}hl`} cx="0.5" cy="0" r="0.9">
          <stop offset="0" stopColor="#fff" stopOpacity="0.18" /><stop offset="0.5" stopColor="#fff" stopOpacity="0.04" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${u}c`}><path d={path} /></clipPath>
      </defs>
      <g clipPath={`url(#${u}c)`}>
        <path d={path} fill={`url(#${u}bg)`} />
        <rect width={S} height={S} fill={`url(#${u}hl)`} />
        <path d={pine(668, 275, 565)} fill={`url(#${u}b)`} />
        <path d={pine(400, 168, 678)} fill={`url(#${u}f)`} />
      </g>
      <path d={path} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
    </svg>
  )
}

/* ---- Small UI glyphs ---- */
export const Download = (p: P) => (
  <svg width="17" height="17" viewBox="0 0 16 16" fill="none" {...p}>
    <path d="M8 1.6v8.4M4.6 7l3.4 3.2L11.4 7M2.8 11.4v1.6c0 .7.5 1.2 1.2 1.2h8c.7 0 1.2-.5 1.2-1.2v-1.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
export const Branch = (p: P) => (
  <svg viewBox="0 0 16 16" fill="none" {...p}>
    <circle cx="4" cy="3.3" r="1.9" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="4" cy="12.7" r="1.9" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="3.3" r="1.9" stroke="currentColor" strokeWidth="1.5" />
    <path d="M4 5.2v5.6M4 8h4.3c2 0 3.7-1.7 3.7-3.7V5.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)
export const Script = (p: P) => (
  <svg viewBox="0 0 16 16" fill="none" {...p}>
    <path d="M4.5 2.5h5.2L13 5.8v6.7c0 .6-.5 1-1 1H4.5c-.6 0-1-.4-1-1v-9c0-.6.4-1 1-1Z" stroke="currentColor" strokeWidth="1.3" />
    <path d="M9.4 2.6V6h3.4M6 8.6l1.4 1.3L6 11.2M9 11.2h1.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
export const Pulse = (p: P) => (
  <svg viewBox="0 0 16 16" fill="none" {...p}>
    <path d="M2.5 11.5 6 8l2.4 2.2L13.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10.2 5h3.3v3.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
export const Agents = (p: P) => (
  <svg viewBox="0 0 16 16" fill="none" {...p}>
    <rect x="2" y="2.6" width="12" height="9" rx="1.6" stroke="currentColor" strokeWidth="1.3" />
    <path d="M4.4 6 6 7.4 4.4 8.8M7.6 9h3.2M5.4 13.4h5.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
export const Folder = (p: P) => (
  <svg viewBox="0 0 16 16" fill="none" {...p}>
    <path d="M1.5 4.4c0-.7.5-1.2 1.2-1.2h3c.4 0 .8.2 1 .5l.6.8c.2.3.6.5 1 .5h5c.6 0 1.1.5 1.1 1.2v5.4c0 .7-.5 1.2-1.2 1.2H2.7c-.7 0-1.2-.5-1.2-1.2V4.4Z" stroke="currentColor" strokeWidth="1.3" />
  </svg>
)
export const Archive = (p: P) => (
  <svg viewBox="0 0 16 16" fill="none" {...p}>
    <rect x="2" y="3" width="12" height="3.2" rx="0.9" stroke="currentColor" strokeWidth="1.3" />
    <path d="M3.2 6.2v6c0 .6.5 1 1 1h7.6c.6 0 1-.4 1-1v-6M6.4 9h3.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
)
