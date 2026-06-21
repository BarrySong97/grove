# Grove Web

`apps/web` is the public Grove marketing site. It is a Next.js App Router package that presents the macOS menu-bar worktree manager, including the fixed scroll-controlled hero app demo and release notes.

## Key Files

- `app/page.tsx`: fixed home demo composition.
- `components/home/Hero.tsx`: first-viewport product pitch and Screen Studio-style scroll-controlled app demo.
- `components/home/AppPreview.tsx`: client-side display preview of the desktop panel using shared Grove UI primitives and fake data.
- `app/globals.css`: Tailwind v4 imports, Grove tokens, and shared marketing components.

## Development

From the repository root:

```sh
pnpm --filter web dev
pnpm --filter web lint
pnpm --filter web build
node scripts/check-docs.mjs
```

The dev server defaults to `http://localhost:3000`.

## Constraints

- The web app is presentation-only. Do not represent frontend demo data as real git, SQLite, or Tauri state.
- Keep the home page grounded in visible product behavior: real worktree directories, project grouping, live-ish status display, lifecycle commands, open targets, and parallel agent workflows.
- Keep the web accent palette aligned with the desktop Grove icon background: neutral blue-gray primary, darker hover, muted slate highlights.
- Keep page backgrounds on the plain canvas color; avoid ambient background gradients behind hero or page headers.
- Use `public/Grove.svg`, copied from the desktop Tauri icon asset, for the site wordmark and mock panel header.
- `AppPreview` may use fake data, but it should stay shaped like the desktop app's project/workspace model and keep a fixed panel height while project groups collapse or expand.
- The hero starts with a pointer-interactive mock app preview; once the user advances into the scroll demo, it remounts as a scripted non-interactive mock so demo state stays deterministic.
- In interactive preview mode, `Add Project` inserts a local empty project at the top of the panel and that project's `New Worktree...` control appends a local fake worktree; these are presentation-only state, not real git actions.
- The mock panel's scripted `Add Project` and `New Worktree...` button states are driven by an explicit hero-level demo phase, not by local keyframe timing or CSS hover.
- In the scripted scroll demo, the fake cursor moves while the target control stays transparent; after the hero phase changes to hover the target lights up, then the press phase scales it before item insertion or the final Ghostty open action.
- On the final Ghostty action, the fake cursor stays visible through the click feedback, waits briefly after the press completes, then fades out.
- Demo cursor landings should align with the intended mock control; the cursor moves first, the targeted mock button/icon then shows a short Hero UI-like press scale, and the cursor stays continuous between demo actions until the final click fades out.
- The homepage hero owns the fixed scroll demo: desktop locks document scrolling, treats wheel input as fixed-duration scene changes with a simulated cursor, zooms in once, then keeps the mock app at one fixed camera position while text, cursor, and panel state change; mobile keeps a static text-led version so scrolling stays straightforward.
- This package uses its own Next/ESLint flow and is not part of the desktop file-header sensor configured in `check-docs.config.json`.
