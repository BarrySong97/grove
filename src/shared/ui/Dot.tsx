/**
 * @purpose Renders a small colored status or project dot.
 * @role    Reusable visual marker used by projects and command settings.
 * @deps    Inline style background color
 * @gotcha  Color is caller-provided and should match project/command semantics; docs/modules/ui/README.md
 */
interface DotProps {
  color?: string
  className?: string
}

export function Dot({ color, className = 'h-[7px] w-[7px]' }: DotProps) {
  return (
    <span
      className={`${className} shrink-0 rounded-full shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.12)]`}
      style={color ? { background: color } : undefined}
    />
  )
}
