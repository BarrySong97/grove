/**
 * @purpose Provides mock projects and worktrees for the Grove prototype.
 * @role    Seed data for WorktreePanel state before real project discovery exists.
 * @deps    ./types
 * @gotcha  Mock data is not persisted and must not be treated as live git state; docs/modules/worktrees/README.md
 */
import type { Project } from './types'

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'acme-web',
    name: 'acme-web',
    path: '~/Code/acme-web',
    accent: '#3aa856',
    commands: { run: 'npm run dev', setup: 'npm install', archive: '' },
    worktrees: [
      {
        id: 'aw0',
        branch: 'main',
        base: null,
        current: true,
        ahead: 0,
        behind: 0,
        dirty: 0,
        status: 'ready',
        time: 'now',
        message: 'chore: bump deps to latest',
        path: 'acme-web'
      },
      {
        id: 'aw1',
        branch: 'feat/checkout-redesign',
        base: 'main',
        current: false,
        ahead: 3,
        behind: 1,
        dirty: 4,
        status: 'ready',
        time: '12m',
        message: 'wip: new payment step layout',
        path: 'acme-web/.worktrees/checkout-redesign'
      },
      {
        id: 'aw2',
        branch: 'fix/payment-webhook',
        base: 'main',
        current: false,
        ahead: 0,
        behind: 2,
        dirty: 0,
        status: 'ready',
        time: '1h',
        message: 'fix: retry stripe webhook on 5xx',
        path: 'acme-web/.worktrees/payment-webhook'
      },
      {
        id: 'aw3',
        branch: 'feat/search-filters',
        base: 'main',
        current: false,
        ahead: 2,
        behind: 0,
        dirty: 1,
        status: 'ready',
        time: '2h',
        message: 'feat: faceted search sidebar',
        path: 'acme-web/.worktrees/search-filters'
      },
      {
        id: 'aw4',
        branch: 'fix/cart-rounding',
        base: 'main',
        current: false,
        ahead: 1,
        behind: 3,
        dirty: 0,
        status: 'ready',
        time: '4h',
        message: 'fix: cart total rounding error',
        path: 'acme-web/.worktrees/cart-rounding'
      },
      {
        id: 'aw5',
        branch: 'chore/upgrade-vite',
        base: 'main',
        current: false,
        ahead: 6,
        behind: 0,
        dirty: 2,
        status: 'ready',
        time: '6h',
        message: 'chore: migrate to vite 6',
        path: 'acme-web/.worktrees/upgrade-vite'
      },
      {
        id: 'aw6',
        branch: 'feat/wishlist',
        base: 'main',
        current: false,
        ahead: 4,
        behind: 1,
        dirty: 7,
        status: 'ready',
        time: '8h',
        message: 'feat: persist wishlist to account',
        path: 'acme-web/.worktrees/wishlist'
      },
      {
        id: 'aw7',
        branch: 'fix/a11y-contrast',
        base: 'main',
        current: false,
        ahead: 0,
        behind: 0,
        dirty: 3,
        status: 'ready',
        time: '1d',
        message: 'fix: bump button contrast to AA',
        path: 'acme-web/.worktrees/a11y-contrast'
      },
      {
        id: 'aw8',
        branch: 'chore/flaky-tests',
        base: 'main',
        current: false,
        ahead: 1,
        behind: 5,
        dirty: 0,
        status: 'ready',
        time: '2d',
        message: 'chore: quarantine flaky e2e specs',
        path: 'acme-web/.worktrees/flaky-tests'
      },
      {
        id: 'aw9',
        branch: 'feat/promo-banner',
        base: 'main',
        current: false,
        ahead: 2,
        behind: 0,
        dirty: 0,
        status: 'ready',
        time: '3d',
        message: 'feat: dismissible seasonal banner',
        path: 'acme-web/.worktrees/promo-banner'
      }
    ]
  },
  {
    id: 'design-system',
    name: 'design-system',
    path: '~/Code/design-system',
    accent: '#9a6ad8',
    commands: { run: 'pnpm storybook', setup: 'pnpm install', archive: '' },
    worktrees: [
      {
        id: 'ds0',
        branch: 'main',
        base: null,
        current: true,
        ahead: 0,
        behind: 0,
        dirty: 0,
        status: 'ready',
        time: '3h',
        message: 'docs: usage notes for Button',
        path: 'design-system'
      },
      {
        id: 'ds1',
        branch: 'feat/color-tokens',
        base: 'main',
        current: false,
        ahead: 5,
        behind: 0,
        dirty: 12,
        status: 'ready',
        time: '1d',
        message: 'feat: dark-mode token ramp',
        path: 'design-system/.worktrees/color-tokens'
      }
    ]
  },
  {
    id: 'mobile-app',
    name: 'mobile-app',
    path: '~/Code/mobile-app',
    accent: '#d98a2b',
    commands: { run: 'npm run ios', setup: 'npm install && pod install', archive: '' },
    worktrees: [
      {
        id: 'ma0',
        branch: 'main',
        base: null,
        current: true,
        ahead: 0,
        behind: 0,
        dirty: 0,
        status: 'ready',
        time: '2d',
        message: 'release: 2.3.1',
        path: 'mobile-app'
      },
      {
        id: 'ma1',
        branch: 'release/2.4',
        base: 'main',
        current: false,
        ahead: 1,
        behind: 0,
        dirty: 0,
        status: 'ready',
        time: '5h',
        message: 'bump version to 2.4.0-rc1',
        path: 'mobile-app/.worktrees/release-2.4'
      }
    ]
  }
]
