'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { MousePointer2 } from 'lucide-react'
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'motion/react'
import { DownloadButton } from '@/components/shared/DownloadButton'
import { GhostButton } from '@/components/shared/GhostButton'
import { BrewCommand } from '@/components/shared/BrewCommand'
import { SITE } from '@/lib/site'
import type { AppPreviewDemoPhase, AppPreviewDemoStep } from './app-preview/data'
import { AppPreview } from './AppPreview'

type CursorPath = {
  from: [number, number]
  to: [number, number]
}

const DEMO_ZOOM = 1.72
const DEMO_CAMERA_X = 126
const DEMO_CAMERA_Y = 401
const CURSOR_MOVE_DURATION = 0.72
const CLICK_DELAY = 1.18
const NEW_WORKTREE_TARGET: [number, number] = [136, 138]
const FINAL_CURSOR_FADE_DURATION = 3.82

const SCENES: {
  id: string
  step?: AppPreviewDemoStep
  eyebrow: string
  title: string
  accent?: string
  body: ReactNode
  zoom: number
  cameraX: number
  cameraY: number
  cursor?: CursorPath
}[] = [
  {
    id: 'intro',
    eyebrow: 'macOS menu-bar app',
    title: 'Every branch gets its own workspace.',
    accent: 'workspace.',
    body: (
      <>
        Grove turns git worktrees into one-click workspaces. Spin up an isolated checkout for every
        feature, fix, or <b className="font-semibold text-ink">AI agent</b>, then switch between
        them from your menu bar, with setup scripts that just run.
      </>
    ),
    zoom: 1,
    cameraX: 0,
    cameraY: 0,
  },
  {
    id: 'add-project',
    step: 'add-project',
    eyebrow: '01 / Add the repo',
    title: 'Add the project once.',
    body: 'Grove groups the main checkout and every worktree under the same project, so the panel starts with your real repository structure.',
    zoom: DEMO_ZOOM,
    cameraX: DEMO_CAMERA_X,
    cameraY: DEMO_CAMERA_Y,
    cursor: { from: [-84, 220], to: [84, 55] },
  },
  {
    id: 'create-worktree',
    step: 'create-worktree',
    eyebrow: '02 / Create the workspace',
    title: 'Create and set up a worktree.',
    body: 'New Worktree creates an isolated checkout and immediately shows setup running, so dependencies and local environment are ready before you open it.',
    zoom: DEMO_ZOOM,
    cameraX: DEMO_CAMERA_X,
    cameraY: DEMO_CAMERA_Y,
    cursor: { from: [84, 55], to: NEW_WORKTREE_TARGET },
  },
  {
    id: 'open-archive',
    step: 'open-archive',
    eyebrow: '03 / Move between work',
    title: 'Open, switch, or archive.',
    body: 'Hover a branch to reveal editor and terminal targets, switch into the right checkout, then archive the workspace when the work is done.',
    zoom: DEMO_ZOOM,
    cameraX: DEMO_CAMERA_X,
    cameraY: DEMO_CAMERA_Y,
    cursor: { from: NEW_WORKTREE_TARGET, to: [250, 154] },
  },
]

const STEP_LOCK_MS = 2060
const STEP_WHEEL_THRESHOLD = 2
const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)'
const DEMO_HOVER_DELAY_MS = 940
const DEMO_PRESS_DELAY_MS = 1180
const DEMO_DONE_DELAY_MS = 1440

const clampSceneIndex = (index: number) => Math.max(0, Math.min(SCENES.length - 1, index))

const normalizeWheelDelta = (event: WheelEvent) => {
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * window.innerHeight
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * 16
  return event.deltaY
}

export function Hero() {
  const containerRef = useRef<HTMLElement>(null)
  const activeIndexRef = useRef(0)
  const wheelDeltaRef = useRef(0)
  const stepLockRef = useRef(false)
  const lockedRef = useRef(true)
  const stepLockTimerRef = useRef<number | null>(null)
  const prefersReducedMotion = useReducedMotion()
  const [activeIndex, setActiveIndex] = useState(0)
  const [demoPhaseState, setDemoPhaseState] = useState<{
    sceneId: string
    phase: AppPreviewDemoPhase
  }>({ sceneId: SCENES[0].id, phase: 'idle' })
  const activeScene = SCENES[activeIndex] ?? SCENES[0]
  const activeCursor = activeScene.cursor
  const hasActiveDemoCursor = !!activeCursor && !!activeScene.step
  const demoPhase = demoPhaseState.sceneId === activeScene.id ? demoPhaseState.phase : 'idle'
  const isFinalCursorScene = activeIndex === SCENES.length - 1
  // Layout zoom keeps the panel text/icons sharper than transform-scaling a composited layer.
  const panelZoom = useMotionValue(SCENES[0].zoom)
  const zoomOffsetX = useTransform(panelZoom, (value) => -((value - 1) * 330) / 2)
  const zoomOffsetY = useTransform(panelZoom, (value) => -((value - 1) * 600) / 2)
  const cursorScale = useTransform(panelZoom, (value) => 1 / value)

  const releaseStepLock = useCallback(() => {
    stepLockRef.current = false
    wheelDeltaRef.current = 0
    if (stepLockTimerRef.current !== null) {
      window.clearTimeout(stepLockTimerRef.current)
      stepLockTimerRef.current = null
    }
  }, [])

  const startStepLock = useCallback(() => {
    stepLockRef.current = true
    if (stepLockTimerRef.current !== null) window.clearTimeout(stepLockTimerRef.current)
    stepLockTimerRef.current = window.setTimeout(releaseStepLock, prefersReducedMotion ? 0 : STEP_LOCK_MS)
  }, [prefersReducedMotion, releaseStepLock])

  const advanceScene = useCallback(
    (direction: 1 | -1) => {
      const nextIndex = clampSceneIndex(activeIndexRef.current + direction)
      wheelDeltaRef.current = 0

      if (nextIndex === activeIndexRef.current) return

      activeIndexRef.current = nextIndex
      setActiveIndex(nextIndex)
      startStepLock()
    },
    [startStepLock],
  )

  useEffect(() => {
    const controls = animate(panelZoom, prefersReducedMotion ? 1 : activeScene.zoom, {
      duration: prefersReducedMotion ? 0 : 0.76,
      ease: [0.22, 1, 0.36, 1],
    })
    return () => controls.stop()
  }, [activeScene.zoom, panelZoom, prefersReducedMotion])

  useEffect(() => {
    const timers: number[] = []

    if (!hasActiveDemoCursor || prefersReducedMotion) {
      timers.push(window.setTimeout(() => setDemoPhaseState({ sceneId: activeScene.id, phase: 'done' }), 0))
      return () => timers.forEach((timer) => window.clearTimeout(timer))
    }

    timers.push(
      window.setTimeout(() => setDemoPhaseState({ sceneId: activeScene.id, phase: 'idle' }), 0),
      window.setTimeout(() => setDemoPhaseState({ sceneId: activeScene.id, phase: 'hover' }), DEMO_HOVER_DELAY_MS),
      window.setTimeout(() => setDemoPhaseState({ sceneId: activeScene.id, phase: 'press' }), DEMO_PRESS_DELAY_MS),
      window.setTimeout(() => setDemoPhaseState({ sceneId: activeScene.id, phase: 'done' }), DEMO_DONE_DELAY_MS),
    )

    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [activeScene.id, hasActiveDemoCursor, prefersReducedMotion])

  useEffect(() => {
    if (window.location.hash === '#how-it-works') {
      window.history.replaceState(null, '', window.location.pathname)
      window.scrollTo({ top: 0 })
    }
  }, [])

  useEffect(() => {
    activeIndexRef.current = activeIndex
  }, [activeIndex])

  // While the stage is "locked" the page can't scroll and the wheel steps through
  // scenes. Past the final scene we unlock, handing off to normal page scroll so the
  // sections below come into view instead of dead-ending.
  const applyScrollLock = useCallback((locked: boolean) => {
    const root = document.documentElement
    const body = document.body
    if (locked) {
      root.style.scrollBehavior = 'auto'
      window.scrollTo(0, 0)
      root.style.overflowY = 'hidden'
      body.style.overflowY = 'hidden'
      root.style.overscrollBehaviorY = 'none'
      body.style.overscrollBehaviorY = 'none'
    } else {
      root.style.overflowY = ''
      body.style.overflowY = ''
      root.style.overscrollBehaviorY = ''
      body.style.overscrollBehaviorY = ''
      root.style.scrollBehavior = ''
    }
    lockedRef.current = locked
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY)
    const syncPageScrollLock = () => applyScrollLock(mediaQuery.matches)

    syncPageScrollLock()
    mediaQuery.addEventListener('change', syncPageScrollLock)

    return () => {
      mediaQuery.removeEventListener('change', syncPageScrollLock)
      applyScrollLock(false)
    }
  }, [applyScrollLock])

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY)

    const onWheel = (event: WheelEvent) => {
      if (!mediaQuery.matches || event.ctrlKey) return

      const delta = normalizeWheelDelta(event)

      // Flow mode: the stage handed off to normal scroll. Re-engage the stepper only
      // when the user scrolls back up past the very top of the page.
      if (!lockedRef.current) {
        if (delta < 0 && window.scrollY <= 0) applyScrollLock(true)
        return
      }

      event.preventDefault()
      if (window.scrollY !== 0) window.scrollTo(0, 0)

      if (stepLockRef.current) {
        wheelDeltaRef.current = 0
        return
      }

      if (Math.abs(delta) < 0.2) return

      if (wheelDeltaRef.current !== 0 && Math.sign(wheelDeltaRef.current) !== Math.sign(delta)) {
        wheelDeltaRef.current = 0
      }

      wheelDeltaRef.current += delta
      if (Math.abs(wheelDeltaRef.current) < STEP_WHEEL_THRESHOLD) return

      const direction: 1 | -1 = wheelDeltaRef.current > 0 ? 1 : -1
      wheelDeltaRef.current = 0

      // Past the final scene, release the lock so the page scrolls into the sections
      // below. Reset the stage to the intro scene so the panel zooms back to its full
      // size/state instead of scrolling away mid-demo, cropped and zoomed in.
      if (direction === 1 && activeIndexRef.current === SCENES.length - 1) {
        applyScrollLock(false)
        activeIndexRef.current = 0
        setActiveIndex(0)
        return
      }

      advanceScene(direction)
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      window.removeEventListener('wheel', onWheel)
      releaseStepLock()
    }
  }, [advanceScene, releaseStepLock, applyScrollLock])

  return (
    <header ref={containerRef} className="relative">
      <div className="hidden h-[calc(100svh-62px)] lg:block">
        <div className="sticky top-[62px] min-h-[calc(100svh-62px)] overflow-visible">
          <div className="pointer-events-none absolute inset-0 z-0 h-[calc(100svh-62px)] min-h-[620px] overflow-visible">
            <div className="mx-auto grid h-full max-w-[1140px] grid-cols-[minmax(0,450px)_minmax(0,1fr)] px-8">
              <span />
              <div className="relative flex h-full min-w-0 items-center justify-end overflow-visible">
                <motion.div
                  className="relative h-[600px] w-[330px]"
                  animate={{
                    x: prefersReducedMotion ? 0 : activeScene.cameraX,
                    y: prefersReducedMotion ? 0 : activeScene.cameraY,
                  }}
                  transition={{
                    duration: prefersReducedMotion ? 0 : 0.76,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <motion.div
                    className={
                      'absolute left-0 top-0 origin-top-left ' +
                      (activeIndex === 0 ? 'pointer-events-auto' : 'pointer-events-none')
                    }
                    style={{
                      x: prefersReducedMotion ? 0 : zoomOffsetX,
                      y: prefersReducedMotion ? 0 : zoomOffsetY,
                      zoom: prefersReducedMotion ? 1 : panelZoom,
                    }}
                  >
                    <AppPreview
                      key={activeIndex === 0 ? 'interactive-preview' : `demo-preview-${activeScene.id}`}
                      demoMode={activeIndex === 0 ? 'interactive' : 'scroll'}
                      demoPhase={demoPhase}
                      demoStep={activeScene.step}
                    />
                    {activeCursor && (
                      <motion.div
                        aria-hidden="true"
                        className="pointer-events-none absolute left-0 top-0 z-10 text-[#101216] drop-shadow-[0_8px_18px_rgba(0,0,0,0.25)]"
                        initial={{
                          x: activeCursor.from[0],
                          y: activeCursor.from[1],
                          opacity: 0,
                        }}
                        animate={{
                          x: activeCursor.to[0],
                          y: activeCursor.to[1],
                          opacity: isFinalCursorScene ? [1, 1, 1, 0] : 1,
                        }}
                        transition={{
                          duration: prefersReducedMotion
                            ? 0
                            : isFinalCursorScene
                              ? FINAL_CURSOR_FADE_DURATION
                              : CURSOR_MOVE_DURATION,
                          ease: [0.22, 1, 0.36, 1],
                          times: isFinalCursorScene ? [0, 0.2, 0.92, 1] : undefined,
                        }}
                        style={{ scale: cursorScale }}
                      >
                        <motion.span
                          key={activeScene.id}
                          className="absolute left-[-10px] top-[-10px] h-7 w-7 rounded-full border-2 border-grn bg-grn/[0.12]"
                          initial={{ opacity: 0, scale: 0.4 }}
                          animate={{ opacity: [0, 0, 0.95, 0], scale: [0.4, 0.4, 1.8, 0.4] }}
                          transition={{
                            duration: prefersReducedMotion ? 0 : 0.58,
                            delay: prefersReducedMotion ? 0 : CLICK_DELAY,
                            times: [0, 0.24, 0.68, 1],
                          }}
                        />
                        <MousePointer2 size={29} fill="white" strokeWidth={2.15} />
                      </motion.div>
                    )}
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </div>

          <div className="pointer-events-none relative z-10 mx-auto grid min-h-[calc(100svh-62px)] max-w-[1140px] grid-cols-[minmax(0,450px)_minmax(0,1fr)] items-center gap-8 px-8">
            <div className="pointer-events-auto min-w-0 pr-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeScene.id}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? undefined : { opacity: 0, y: -18 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span className={activeIndex === 0 ? 'pill' : 'eyebrow'}>
                    {activeIndex === 0 && (
                      <span className="h-1.5 w-1.5 rounded-full bg-grn shadow-[0_0_7px_var(--grn)]" />
                    )}
                    {activeScene.eyebrow}
                  </span>
                  <h1 className="mt-[22px] max-w-[560px] text-[clamp(42px,5.8vw,64px)] font-[680] leading-[1.03] tracking-normal text-balance">
                    {activeScene.accent ? (
                      <>
                        Every branch gets its own <span className="text-grn-ink">{activeScene.accent}</span>
                      </>
                    ) : (
                      activeScene.title
                    )}
                  </h1>
                  <p className="mt-5 max-w-[500px] text-[18.5px] leading-[1.55] text-ink-2 text-pretty">
                    {activeScene.body}
                  </p>
                  {activeIndex === 0 && (
                    <>
                      <div className="mt-[30px] flex flex-wrap items-center gap-3">
                        <DownloadButton size="lg" />
                        <GhostButton href={SITE.githubUrl}>View on GitHub</GhostButton>
                      </div>
                      <BrewCommand className="mt-3.5" />
                      <div className="mt-[18px] flex items-center gap-3.5 font-mono text-[12.5px] text-ink-3">
                        <span>Apple silicon &amp; Intel</span>
                        <span>·</span>
                        <span>git worktree, made simple</span>
                      </div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="mt-9 flex items-center gap-3">
                {SCENES.map((scene, index) => (
                  <span
                    key={scene.id}
                    className={
                      'h-1.5 rounded-full transition-all duration-300 ' +
                      (activeIndex === index ? 'w-12 bg-grn' : 'w-5 bg-black/[0.13]')
                    }
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1140px] grid-cols-1 items-center gap-8 px-8 pb-10 pt-[86px] lg:hidden">
        <div>
          <span className="pill">
            <span className="h-1.5 w-1.5 rounded-full bg-grn shadow-[0_0_7px_var(--grn)]" /> macOS menu-bar app
          </span>
          <h1 className="mt-[22px] text-[clamp(38px,6vw,56px)] font-[680] leading-[1.04] tracking-normal text-balance">
            Every branch gets its own <span className="text-grn-ink">workspace.</span>
          </h1>
          <p className="mt-5 max-w-[480px] text-[18px] leading-[1.55] text-ink-2 text-pretty">
            Grove turns git worktrees into one-click workspaces. Spin up an isolated checkout for every
            feature, fix, or <b className="font-semibold text-ink">AI agent</b>, then switch between
            them from your menu bar, with setup scripts that just run.
          </p>
          <div className="mt-[30px] flex flex-wrap items-center gap-3">
            <DownloadButton size="lg" />
            <GhostButton href={SITE.githubUrl}>View on GitHub</GhostButton>
          </div>
          <BrewCommand className="mt-3.5" />
        </div>

        <div className="flex justify-center py-6">
          <AppPreview demoMode="static" demoStep="create-worktree" />
        </div>

        <div className="space-y-8 border-t-[0.5px] border-black/[0.1] pt-8">
          {SCENES.slice(1).map((scene) => (
            <section key={scene.id}>
              <div className="font-mono text-[12.5px] font-semibold uppercase tracking-[1.5px] text-ink-3">
                {scene.eyebrow}
              </div>
              <h2 className="mt-3 text-[32px] font-[670] leading-[1.08] tracking-normal text-balance">
                {scene.title}
              </h2>
              <p className="mt-3 text-[16.5px] leading-[1.58] text-ink-2 text-pretty">{scene.body}</p>
            </section>
          ))}
        </div>
      </div>
    </header>
  )
}
