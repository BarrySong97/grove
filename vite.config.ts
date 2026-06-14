/**
 * @purpose Configures Vite for the Grove React frontend and Tauri dev server.
 * @role    Tooling entrypoint consumed by pnpm dev/build and Tauri dev.
 * @deps    @vitejs/plugin-react, @tailwindcss/vite, vite
 * @gotcha  Port 1420 is part of the Tauri dev contract; docs/modules/tooling/README.md
 */
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  clearScreen: false,
  server: {
    host: '127.0.0.1',
    port: 1420,
    strictPort: true
  }
})
