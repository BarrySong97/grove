# Releasing Grove

Grove ships like CodexBar: a **signed + notarized** universal macOS DMG on GitHub
Releases, installable via **Homebrew cask**, with **in-app updates** (click the
bottom-right badge → download, install, relaunch).

Distribution channels:

1. **GitHub Releases** — direct DMG download (双击即开,无需 `xattr` 命令)。
2. **Homebrew** — `brew install --cask BarrySong97/tap/grove`。
3. **In-app updater** — Tauri updater reads `latest.json` from the latest release.

> This repo is already wired to the `BarrySong97/grove` GitHub repo — the owner
> appears in `src-tauri/tauri.conf.json` → `plugins.updater.endpoints` and in
> `distribution/homebrew/grove.rb`. The workflow uses `github.ref_name`, no edit needed.

---

## One-time setup

### 1. Apple Developer ID certificate (signing)

You do **not** need the App Store. You need a **Developer ID Application**
certificate + **notarization** — together these remove the "无法打开 / unidentified
developer" Gatekeeper warning.

1. Apple Developer → Certificates → **Developer ID Application** → create + download.
2. Open it in Keychain Access, expand to show the private key, select **both** the
   cert and key → right-click → **Export 2 items…** → save as `grove-developer-id.p12`
   with a password.
3. Base64-encode for the GitHub secret:
   ```sh
   base64 -i grove-developer-id.p12 | pbcopy   # → APPLE_CERTIFICATE
   ```
4. Find the signing identity string:
   ```sh
   security find-identity -v -p codesigning
   # "Developer ID Application: Your Name (TEAMID)"  → APPLE_SIGNING_IDENTITY
   ```

### 2. App Store Connect API key (notarization auth)

This authenticates the notary API call only — **not** an App Store upload.

1. App Store Connect → Users and Access → **Integrations / Keys** → generate an
   **App Store Connect API key** (Access: Developer is enough for notarization).
2. Download `AuthKey_XXXXXXXXXX.p8` (downloadable **once**).
3. Note the **Key ID** (`XXXXXXXXXX`) and the **Issuer ID** (UUID at the top).

> Alternative (simpler, less CI-friendly): use `APPLE_ID` + an app-specific password
> (`APPLE_PASSWORD`) + `APPLE_TEAM_ID` instead of the API key. If you go this route,
> swap the corresponding env block in `.github/workflows/release.yml`.

### 3. Tauri updater signing key

Already generated for this repo:

- Public key — committed in `src-tauri/tauri.conf.json` → `plugins.updater.pubkey`.
- Private key — `~/.tauri/grove_updater.key` (**not** in git), generated with an
  **empty** password.

> Keep `~/.tauri/grove_updater.key` safe — losing it means existing installs can no
> longer verify updates. To regenerate (e.g. to set a password):
>
> ```sh
> pnpm --filter tauri-tray exec tauri signer generate -p "<password>" -w ~/.tauri/grove_updater.key -f
> ```
>
> Then paste the new `.pub` contents into `plugins.updater.pubkey`.

### 4. GitHub repository secrets

Repo → Settings → Secrets and variables → Actions → **New repository secret**:

| Secret                               | Value                                          |
| ------------------------------------ | ---------------------------------------------- |
| `APPLE_CERTIFICATE`                  | base64 of the `.p12` (step 1.3)                |
| `APPLE_CERTIFICATE_PASSWORD`         | the `.p12` password                            |
| `APPLE_SIGNING_IDENTITY`             | `Developer ID Application: Your Name (TEAMID)` |
| `APPLE_API_ISSUER`                   | Issuer ID (UUID)                               |
| `APPLE_API_KEY`                      | Key ID (`XXXXXXXXXX`)                          |
| `APPLE_API_KEY_P8`                   | full contents of `AuthKey_XXXXXXXXXX.p8`       |
| `TAURI_SIGNING_PRIVATE_KEY`          | contents of `~/.tauri/grove_updater.key`       |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | the key password (empty string if none)        |

### 5. Homebrew tap

1. Create a public repo `github.com/BarrySong97/homebrew-tap`.
2. Copy `apps/desktop/distribution/homebrew/grove.rb` → `Casks/grove.rb` in that repo
   (replace `BarrySong97`). Commit.
3. Users install with `brew install --cask BarrySong97/tap/grove`.

---

## Cutting a release

Two steps: AI writes the (dynamic) release notes, then one command does the rest.

### 1. Write the release notes (AI / manual)

Add a new entry at the **top** of the `RELEASES` array in
`apps/web/components/releases/ReleaseTimeline.tsx`:

- `ver` = the new version, `date` = today, a one-line `head`, and `groups` (new/imp/fix).
- Set `badge: 'latest'` on the new entry and **remove it from the previous one** (exactly one
  `badge: 'latest'` must exist).

### 2. Run the release script

```sh
pnpm release <version>          # e.g. pnpm release 0.2.2
```

That's it. `scripts/release.mjs` then does everything deterministically:

1. Validates that the newest release-notes entry == `<version>` (enforces step 1).
2. Bumps the version in `apps/desktop/src-tauri/tauri.conf.json`, `apps/desktop/package.json`,
   `apps/desktop/src-tauri/Cargo.toml`, and syncs `Cargo.lock` (`cargo build`).
3. Commits (which runs the pre-commit gate: check-docs / format:check / lint / build).
4. Pushes `main` → Cloudflare web auto-deploy.
5. Pushes tag `v<version>` → the `Release Grove (macOS)` workflow builds + signs + notarizes a
   **draft** release (`Grove_<v>_universal.dmg`, `*.app.tar.gz` + `.sig`, `latest.json`).
6. Waits for that build to finish (`gh run watch`).
7. **Publishes** the draft as `latest` — temporarily `gh auth switch` to the owner account
   (`BarrySong97`, override with `GROVE_RELEASE_GH_USER`) and switches back when done.
8. **Bumps the Homebrew cask** in the tap (`BarrySong97/homebrew-tap` → `Casks/grove.rb`):
   `version` + `sha256` (taken straight from the GitHub DMG **asset digest** — no download).
9. Verifies `releases/latest`, the updater `latest.json`, and the cask all read `<version>`.

**Flags** (after `--`): `--dry-run` (print the whole plan, change nothing),
`--no-publish`, `--no-cask`, `--no-wait` (stop after pushing the tag). Stages are idempotent —
a failed run can simply be re-run (`pnpm release <version>` resumes publish/cask).

Prereqs: on `main`; `gh` logged in to both your working account and the owner account
(`gh auth login`); `cargo` + `pnpm` on PATH.

> The in-repo cask **template** `distribution/homebrew/grove.rb` stays a zero-sha placeholder
> (documentation only) — the script updates the live cask in the tap repo, not the template.

---

## Verifying a build

On the produced `Grove.app` / DMG:

```sh
# Signature + hardened runtime
codesign -dvvv --entitlements - /Applications/Grove.app

# Notarization accepted (the important one — no Gatekeeper prompt)
spctl -a -vvv -t install /Applications/Grove.app
# expect: source=Notarized Developer ID

# Updater feed reachable after publishing
curl -sI https://github.com/BarrySong97/grove/releases/latest/download/latest.json | head -1
```

Then test the full loop: install `vN`, publish `vN+1`, open the old build, confirm the
bottom-right update badge appears, click it, and verify it relaunches into `vN+1`.
