export function Dot({ color, className = 'h-[7px] w-[7px]' }: { color?: string; className?: string }) {
  return (
    <span
      className={`${className} shrink-0 rounded-full shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.12)]`}
      style={color ? { background: color } : undefined}
    />
  )
}
