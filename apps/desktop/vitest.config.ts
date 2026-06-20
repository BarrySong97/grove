/**
 * @purpose Configures Vitest for focused Grove frontend unit tests.
 * @role    Test tooling entrypoint consumed by pnpm test.
 * @deps    vitest/config, @vitejs/plugin-react
 * @gotcha  Keep browser-like tests in jsdom; Tauri runtime behavior remains covered by Rust/manual tests.
 */
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}']
  }
})
