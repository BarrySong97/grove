import { BrandLink } from '@/components/shared/BrandLink'
import { NavLink } from '@/components/shared/NavLink'

export function Footer() {
  return (
    <footer className="mt-10 border-t-[0.5px] border-black/[0.09] py-10">
      <div className="mx-auto flex max-w-[1140px] flex-wrap items-center gap-4 px-8">
        <BrandLink markSize={26} className="text-[15px] font-[650]" />
        <span className="flex-1" />
        <div className="flex gap-[22px]">
          <NavLink size="xs" route="releases">
            Release notes
          </NavLink>
          <NavLink size="xs" href="#">
            GitHub
          </NavLink>
        </div>
        <span className="ml-[22px] text-[13px] text-ink-3">© 2026 Grove</span>
      </div>
    </footer>
  )
}
