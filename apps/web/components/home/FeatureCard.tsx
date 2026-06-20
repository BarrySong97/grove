import type { ReactNode } from 'react'

export function FeatureCard({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="card group p-7 transition duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="tint flex h-[42px] w-[42px] items-center justify-center rounded-[11px] text-grn-ink [&>svg]:h-[21px] [&>svg]:w-[21px]">
        {icon}
      </div>
      <h3 className="mt-[18px] text-[17px] font-[620] -tracking-[0.3px]">{title}</h3>
      <p className="mt-2 text-sm leading-[1.55] text-ink-2">{body}</p>
    </div>
  )
}
