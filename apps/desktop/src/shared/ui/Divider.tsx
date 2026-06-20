/**
 * @purpose Renders a subtle horizontal divider.
 * @role    Reusable visual separator for panel sections and menus.
 * @deps    Tailwind CSS classes only
 * @gotcha  Keep divider low contrast to preserve macOS tray panel feel; docs/modules/ui/README.md
 */
interface DividerProps {
  className?: string
}

export function Divider({ className = 'mx-2 my-1' }: DividerProps) {
  return <div className={`${className} h-px bg-black/[0.07]`} />
}
