import { MeasuringStrategy, type MeasuringConfiguration } from '@dnd-kit/core'
import { defaultAnimateLayoutChanges, type AnimateLayoutChanges } from '@dnd-kit/sortable'

/**
 * By default dnd-kit only animates layout shifts that follow an active drag
 * (`defaultAnimateLayoutChanges` returns false when `!wasDragging`). Forcing
 * `wasDragging: true` makes items FLIP-animate to their new position for
 * programmatic reorders too — e.g. the "move up / down / to top" buttons.
 */
export const animateLayoutChanges: AnimateLayoutChanges = (args) =>
  defaultAnimateLayoutChanges({ ...args, wasDragging: true })

/** Shared slide transition for sortable items (drag + programmatic reorder). */
export const sortableTransition = { duration: 140, easing: 'cubic-bezier(0.25, 1, 0.5, 1)' }

/**
 * Measure droppable rects continuously (default only measures while dragging).
 * Programmatic reorders (move buttons) have no active drag, so without this the
 * FLIP origin rect is stale and items appear to fly in from the wrong position.
 */
export const sortableMeasuring: MeasuringConfiguration = {
  droppable: { strategy: MeasuringStrategy.Always },
}
