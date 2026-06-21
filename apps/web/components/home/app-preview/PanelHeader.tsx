/* Faithful header port — logo + counts + settings (opens sheet) + Add Project. */
import Image from 'next/image'
import { motion } from 'motion/react'
import { Gear, Import, IconButton, Divider } from '@grove/ui'
import type { AppPreviewDemoPhase, AppPreviewDemoStep } from './data'

const pressTransition = { duration: 0.3, delay: 1.02, ease: [0.22, 1, 0.36, 1] as const }
const demoPressTransition = { duration: 0.16, ease: [0.22, 1, 0.36, 1] as const }

const demoButtonAnimation = (active: boolean, phase: AppPreviewDemoPhase) => {
  if (!active || phase === 'idle') return { scale: 1, backgroundColor: 'rgba(0,0,0,0)' }
  if (phase === 'press') return { scale: 0.965, backgroundColor: 'rgba(0,0,0,0.07)' }
  return { scale: 1, backgroundColor: 'rgba(0,0,0,0.038)' }
}

export function PanelHeader({
  total,
  projectCount,
  onOpenSettings,
  onAddProject,
  demoPhase = 'idle',
  demoStep,
}: {
  total: number
  projectCount: number
  onOpenSettings: () => void
  onAddProject?: () => void
  demoPhase?: AppPreviewDemoPhase
  demoStep?: AppPreviewDemoStep
}) {
  const addProjectPressed = demoStep === 'add-project'
  const addProjectClasses =
    'grove-icon-scale flex h-auto w-full cursor-pointer items-center justify-start gap-[7px] rounded-lg px-2.5 py-[7px] text-[12.5px] text-black/50 ' +
    (addProjectPressed ? '' : 'transition-colors hover:bg-black/[0.038] hover:text-black/90')

  return (
    <>
      <div className="flex items-center gap-2.5 px-2.5 pb-2 pt-1.5">
        <Image
          src="/Grove.svg"
          alt=""
          width={22}
          height={22}
          className="block shrink-0 rounded-md"
        />
        <span className="flex-1 text-[14px] font-semibold tracking-[-0.2px]">Grove</span>
        <span className="text-[11.5px] tabular-nums text-black/[0.34]">
          {total} worktrees · {projectCount} projects
        </span>
        <IconButton title="Settings" size="project" onClick={onOpenSettings}>
          <Gear />
        </IconButton>
      </div>
      <div className="px-1 pb-1">
        <motion.button
          type="button"
          onClick={onAddProject}
          className={addProjectClasses}
          animate={demoButtonAnimation(addProjectPressed, demoPhase)}
          transition={addProjectPressed ? demoPressTransition : pressTransition}
        >
          <Import /> Add Project
        </motion.button>
      </div>
      <Divider />
    </>
  )
}
