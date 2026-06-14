import type { ReactNode } from 'react'

interface MenuItemProps {
  icon: ReactNode
  label: ReactNode
  kbd?: string
  danger?: boolean
  disabled?: boolean
  onClick?: () => void
  onHover?: () => void
}

export function MenuItem({ icon, label, kbd, danger, disabled, onClick, onHover }: MenuItemProps) {
  const hoverClass = danger ? 'hover:bg-red-500' : 'hover:bg-accent'
  const disabledClass = disabled ? 'pointer-events-none opacity-40' : `${hoverClass} hover:text-white`

  return (
    <div
      onMouseEnter={onHover}
      onClick={onClick}
      className={`group/menu-item relative flex h-[30px] items-center gap-2.5 rounded-[7px] px-2.5 ${disabledClass}`}
    >
      <span className="flex w-4 shrink-0 items-center justify-center text-black/50 group-hover/menu-item:text-white">
        {icon}
      </span>
      <span className="flex flex-1 flex-col">{label}</span>
      {kbd && <span className="text-[12px] text-black/[0.34] group-hover/menu-item:text-white">{kbd}</span>}
    </div>
  )
}

export function MenuSeparator() {
  return <div className="mx-1.5 my-1 h-px bg-black/[0.07]" />
}
