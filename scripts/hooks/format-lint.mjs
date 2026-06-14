#!/usr/bin/env node
/**
 * @purpose PostToolUse 质量回灌:改完文件后跑 Oxfmt/Oxlint,把报错作为 additionalContext 喂回 agent 自纠。
 * @role    强制层 sensor(最快层,毫秒~秒);Claude / Codex 共用。
 * @deps    node 内置 child_process/fs/path + package.json 中的 oxlint/oxfmt
 * @gotcha  只处理单个已存在文件;成功静默,只在有问题时回灌。全量命令见 docs/modules/tooling/README.md。
 */
import { readFileSync, existsSync, statSync } from 'node:fs'
import { extname, relative, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

let payload = {}
try {
  payload = JSON.parse(readFileSync(0, 'utf8') || '{}')
} catch {}
const rawFile = payload?.tool_input?.file_path ?? payload?.tool_input?.path ?? ''
if (!rawFile) process.exit(0)

const ROOT = process.cwd()
const file = resolve(ROOT, rawFile)
const rel = relative(ROOT, file)
if (rel.startsWith('..') || rel === '' || !existsSync(file) || !statSync(file).isFile()) {
  process.exit(0)
}

const FORMAT_EXTS = new Set([
  '.cjs',
  '.css',
  '.html',
  '.js',
  '.json',
  '.jsonc',
  '.jsx',
  '.md',
  '.mjs',
  '.ts',
  '.tsx'
])
const LINT_EXTS = new Set(['.cjs', '.js', '.jsx', '.mjs', '.ts', '.tsx'])
const ext = extname(file)
const reports = []

function run(label, args) {
  const result = spawnSync('pnpm', ['exec', ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  })
  if (result.status === 0) return
  const out = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim()
  reports.push(`${label}(${rel}):\n${out || `exit ${result.status ?? 'unknown'}`}`)
}

if (FORMAT_EXTS.has(ext)) run('Oxfmt', ['oxfmt', '--write', rel, '--no-error-on-unmatched-pattern'])
if (LINT_EXTS.has(ext))
  run('Oxlint', ['oxlint', rel, '--deny-warnings', '--no-error-on-unmatched-pattern'])

if (reports.length) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: reports.join('\n\n')
      }
    })
  )
}
process.exit(0)
