/**
 * @purpose Wraps Tauri invoke calls used by the React app.
 * @role    Tiny boundary helper for frontend-to-Rust commands that may fail without user impact.
 * @deps    @tauri-apps/api/core
 * @gotcha  Only use invokeQuietly for non-critical commands; docs/modules/app/README.md
 */
import { invoke } from '@tauri-apps/api/core'

export function invokeQuietly(command: string) {
  void invoke(command).catch(() => undefined)
}
