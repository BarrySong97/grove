interface DividerProps {
  className?: string
}

export function Divider({ className = 'mx-2 my-1' }: DividerProps) {
  return <div className={`${className} h-px bg-black/[0.07]`} />
}
