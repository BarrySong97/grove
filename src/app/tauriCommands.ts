import { invoke } from '@tauri-apps/api/core'

export function invokeQuietly(command: string) {
  void invoke(command).catch(() => undefined)
}
