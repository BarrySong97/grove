#!/usr/bin/env node
/**
 * @purpose 一条龙发布 Grove:改版本号→同步 lock→提交(触发 pre-commit 闸门)→推 main→打 tag→等构建→发布草稿→更新 Homebrew cask→校验。
 * @role    发布自动化脚本;动态的 release notes 由 AI 先写进 ReleaseTimeline.tsx,其余全自动。运行:`pnpm release <version>`。
 * @deps    node 内置 fs/child_process、全局 fetch;外部 CLI git/gh/cargo/pnpm;依赖 .github/workflows/release.yml(tag v* 触发)。
 * @gotcha  发布草稿/写 tap 需 owner 账号——脚本临时 `gh auth switch` 到 OWNER 再切回;各阶段幂等,失败可重跑。apps/desktop/RELEASING.md
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const ROOT = process.cwd()
const args = process.argv.slice(2)
const flags = new Set(args.filter((a) => a.startsWith('--')))
const version = args.find((a) => !a.startsWith('--'))

const DRY = flags.has('--dry-run')
const NO_PUBLISH = flags.has('--no-publish')
const NO_CASK = flags.has('--no-cask')
const NO_WAIT = flags.has('--no-wait')

const REPO = process.env.GROVE_REPO || 'BarrySong97/grove'
const TAP_REPO = process.env.GROVE_TAP_REPO || 'BarrySong97/homebrew-tap'
const CASK_PATH = process.env.GROVE_CASK_PATH || 'Casks/grove.rb'
const OWNER = process.env.GROVE_RELEASE_GH_USER || 'BarrySong97'

const FILES = {
  tauriConf: 'apps/desktop/src-tauri/tauri.conf.json',
  cargoToml: 'apps/desktop/src-tauri/Cargo.toml',
  pkg: 'apps/desktop/package.json',
  notes: 'apps/web/components/releases/ReleaseTimeline.tsx',
}

const log = (m) => console.log(m)
const die = (m) => {
  console.error(`\n✗ ${m}\n`)
  process.exit(1)
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const shq = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`

// Read-only / always executes (even in --dry-run), returns trimmed stdout.
// stderr is captured (not inherited) so expected failures in try/catch probes
// (e.g. `git rev-parse <missing-tag>`) don't leak noise to the console.
function sh(cmd, opts = {}) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], ...opts }).trim()
}
// Mutating command: printed-and-skipped in --dry-run.
function mut(cmd, { inherit = false } = {}) {
  if (DRY) {
    log(`  [dry-run] ${cmd}`)
    return ''
  }
  if (inherit) {
    execSync(cmd, { cwd: ROOT, stdio: 'inherit' })
    return ''
  }
  return execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim()
}
function bumpFile(path, oldStr, newStr) {
  const content = readFileSync(path, 'utf8')
  if (!content.includes(oldStr)) {
    die(`Version pattern not found in ${path}:\n  ${oldStr.replace(/\n/g, ' ⏎ ')}`)
  }
  if (DRY) {
    log(`  [dry-run] bump ${path}`)
    return
  }
  writeFileSync(path, content.replace(oldStr, newStr))
  log(`  bumped ${path}`)
}
function cmpVer(a, b) {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] < pb[i] ? -1 : 1
  return 0
}

async function waitForRun(headSha) {
  for (let i = 0; i < 45; i++) {
    const runs = JSON.parse(
      sh('gh run list --workflow=release.yml --json databaseId,headSha,event,status --limit 20')
    )
    const r = runs.find((x) => x.headSha === headSha && x.event === 'push')
    if (r) return r.databaseId
    await sleep(4000)
  }
  die('Timed out waiting for the release workflow run to appear (check the Actions tab).')
}

function publishRelease(tag) {
  log(`\n▶ Publish ${tag} as latest`)
  const found = sh(
    `gh api repos/${REPO}/releases?per_page=100 --jq '.[]|select(.tag_name=="${tag}")|"\\(.id) \\(.draft)"'`
  ).split('\n')[0]
  if (!found) die(`No release found for ${tag} — did the build create it?`)
  const [id, draft] = found.split(' ')
  if (draft === 'false') {
    log('  already published')
    return
  }
  sh(`gh api -X PATCH repos/${REPO}/releases/${id} -F draft=false -f make_latest=true`)
  log('  ✓ published')
}

function updateCask(version) {
  log(`\n▶ Update Homebrew cask (${TAP_REPO}/${CASK_PATH})`)
  const digest = sh(
    `gh api repos/${REPO}/releases/tags/v${version} --jq '.assets[]|select(.name|endswith(".dmg"))|.digest'`
  )
  if (!digest.startsWith('sha256:')) die(`Unexpected DMG digest: ${digest || '(none)'}`)
  const sha = digest.slice('sha256:'.length)
  const meta = JSON.parse(sh(`gh api repos/${TAP_REPO}/contents/${CASK_PATH}`))
  const content = Buffer.from(meta.content, 'base64').toString('utf8')
  if (content.match(/version "([^"]+)"/)?.[1] === version) {
    log(`  cask already at ${version}`)
    return
  }
  const updated = content
    .replace(/version "[^"]+"/, `version "${version}"`)
    .replace(/sha256 "[^"]+"/, `sha256 "${sha}"`)
  const body = JSON.stringify({
    message: `grove ${version}`,
    content: Buffer.from(updated).toString('base64'),
    sha: meta.sha,
  })
  execSync(`gh api -X PUT repos/${TAP_REPO}/contents/${CASK_PATH} --input -`, {
    cwd: ROOT,
    input: body,
    encoding: 'utf8',
  })
  log(`  ✓ cask → ${version} (sha256 ${sha.slice(0, 12)}…)`)
}

async function verify(version, tag) {
  log('\n▶ Verify')
  let latest = '?'
  try {
    latest = sh(`gh api repos/${REPO}/releases/latest --jq .tag_name`)
  } catch {}
  let feedV = '?'
  try {
    const res = await fetch(`https://github.com/${REPO}/releases/latest/download/latest.json`)
    feedV = (await res.json()).version
  } catch {}
  let caskV = '?'
  try {
    const meta = JSON.parse(sh(`gh api repos/${TAP_REPO}/contents/${CASK_PATH}`))
    caskV =
      Buffer.from(meta.content, 'base64').toString('utf8').match(/version "([^"]+)"/)?.[1] || '?'
  } catch {}
  const mark = (ok) => (ok ? '✓' : '✗')
  log(`  GitHub release latest : ${latest} ${mark(latest === tag)}`)
  log(`  updater latest.json   : ${feedV} ${mark(feedV === version)}`)
  log(`  Homebrew cask         : ${caskV} ${mark(caskV === version)}`)
  log(`\n✓ Grove ${version} released.`)
  log(
    '  note: the /releases/latest HTML redirect may lag a few minutes (GitHub CDN); the API,\n' +
      '  updater feed, and latest/download/* links above are already correct.'
  )
}

async function main() {
  if (!version) {
    die('Usage: pnpm release <version> [-- --dry-run --no-publish --no-cask --no-wait]')
  }
  if (!/^\d+\.\d+\.\d+$/.test(version)) die(`Invalid version "${version}" — expected x.y.z`)
  for (const tool of ['git', 'gh', 'cargo', 'pnpm']) {
    try {
      sh(`command -v ${tool}`)
    } catch {
      die(`Required tool not found on PATH: ${tool}`)
    }
  }
  const tag = `v${version}`
  log(`\n▶ Releasing Grove ${version}${DRY ? '  (dry-run)' : ''}`)

  const branch = sh('git rev-parse --abbrev-ref HEAD')
  if (branch !== 'main') die(`Must be on 'main' (currently '${branch}')`)
  try {
    sh('gh auth status')
  } catch {
    die('gh is not authenticated — run `gh auth login`')
  }

  // Release notes must already name this version as the newest 'latest' entry.
  const notes = readFileSync(FILES.notes, 'utf8')
  const topVer = notes.match(/ver:\s*'([^']+)'/)?.[1]
  if (!topVer) die(`No release entries found in ${FILES.notes}`)
  if (topVer !== version) {
    die(
      `Newest release-notes entry is ${topVer}, not ${version}.\n  Write the ${version} entry in ${FILES.notes} first (and move badge: 'latest').`
    )
  }
  const latestCount = (notes.match(/badge:\s*'latest'/g) || []).length
  if (latestCount !== 1) {
    die(`Expected exactly one badge: 'latest' in ${FILES.notes}, found ${latestCount}.`)
  }
  const head = notes.match(/head:\s*'([^']*)'/)?.[1] || `Release ${version}`
  const msg = `feat: Grove ${version} — ${head}`
  log(`✓ release notes OK — latest = ${version}: "${head}"`)

  const current = JSON.parse(readFileSync(FILES.pkg, 'utf8')).version
  const cmp = cmpVer(version, current)
  if (cmp < 0) die(`${version} < current ${current} — refusing to downgrade`)
  const resume = cmp === 0

  if (resume) {
    log(`↻ version already ${version} — resuming (skip bump + commit)`)
  } else {
    log(`\n▶ Bump ${current} → ${version}`)
    bumpFile(FILES.tauriConf, `"version": "${current}"`, `"version": "${version}"`)
    bumpFile(FILES.pkg, `"version": "${current}"`, `"version": "${version}"`)
    bumpFile(
      FILES.cargoToml,
      `name = "tauri-tray"\nversion = "${current}"`,
      `name = "tauri-tray"\nversion = "${version}"`
    )
    log('\n▶ Sync Cargo.lock (cargo build)')
    mut('cargo build --manifest-path apps/desktop/src-tauri/Cargo.toml', { inherit: true })
    log('\n▶ Format (oxfmt --write — fixes generated-binding drift before the commit gate)')
    mut('pnpm format', { inherit: true })
    log('\n▶ Commit (runs pre-commit gate: check-docs / format:check / lint / test / build)')
    mut('git add -A')
    mut(`git commit -m ${shq(msg)}`, { inherit: true })
  }

  log('\n▶ Push main (triggers web auto-deploy)')
  mut('git push origin main', { inherit: true })

  log(`\n▶ Tag ${tag} (triggers macOS release build)`)
  const tagExists = (() => {
    try {
      sh(`git rev-parse ${tag}`)
      return true
    } catch {
      return false
    }
  })()
  if (!tagExists) mut(`git tag -a ${tag} -m ${shq(msg)}`)
  else log(`  tag ${tag} already exists`)
  mut(`git push origin ${tag}`, { inherit: true })

  if (DRY) {
    log('\n[dry-run] would now: wait for build → publish draft as latest → bump cask → verify\n')
    return
  }
  if (NO_WAIT) {
    log(`\n--no-wait: build triggered. Re-run \`pnpm release ${version}\` later to publish + cask.\n`)
    return
  }

  const headSha = sh('git rev-parse HEAD')
  log(`\n▶ Wait for release build (${tag})…`)
  const runId = await waitForRun(headSha)
  log(`  watching run ${runId} (≈10 min)…`)
  try {
    execSync(`gh run watch ${runId} --exit-status`, { cwd: ROOT, stdio: 'inherit' })
  } catch {
    die(`Release build failed (run ${runId}). Inspect: gh run view ${runId} --log-failed`)
  }

  const savedUser = sh('gh api user --jq .login')
  try {
    if (savedUser !== OWNER) {
      log(`\n▶ Switch gh account → ${OWNER}`)
      mut(`gh auth switch --user ${OWNER}`)
    }
    if (!NO_PUBLISH) publishRelease(tag)
    if (!NO_CASK) updateCask(version)
  } finally {
    if (savedUser !== OWNER) {
      try {
        execSync(`gh auth switch --user ${savedUser}`, { cwd: ROOT, stdio: 'pipe' })
        log(`  ✓ gh account restored → ${savedUser}`)
      } catch {}
    }
  }

  await verify(version, tag)
}

main().catch((err) => die(err?.message || String(err)))
