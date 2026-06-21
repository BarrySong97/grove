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

1. Bump the version in **both** files (keep them in sync):
   - `apps/desktop/src-tauri/tauri.conf.json` → `version`
   - `apps/desktop/package.json` → `version`
2. Commit, then tag and push:
   ```sh
   git tag v0.1.1
   git push origin v0.1.1
   ```
3. The `Release Grove (macOS)` workflow builds the universal app, signs + notarizes
   it, and publishes a **draft** GitHub Release containing:
   - `Grove_0.1.1_universal.dmg` (manual / Homebrew download)
   - `Grove_0.1.1_universal.app.tar.gz` + `.sig` (updater payload)
   - `latest.json` (updater feed)
4. Review the draft release, then **publish** it. In-app updater + the
   `releases/latest/download/latest.json` endpoint only resolve once published.
5. Update the Homebrew cask (`version` + `sha256`) — see below.

### Updating the Homebrew cask

Get the DMG sha256 from the release and bump `Casks/grove.rb` in the tap:

```sh
shasum -a 256 Grove_0.1.1_universal.dmg
```

Optional automation — add this job to `.github/workflows/release.yml` (needs a
`HOMEBREW_TAP_TOKEN` PAT with `contents:write` on the tap repo):

```yaml
bump-cask:
  needs: release
  runs-on: macos-latest
  steps:
    - uses: mislav/bump-homebrew-formula-action@v3
      with:
        formula-name: grove
        formula-path: Casks/grove.rb
        homebrew-tap: BarrySong97/homebrew-tap
        download-url: https://github.com/BarrySong97/grove/releases/download/${{ github.ref_name }}/Grove_${{ github.ref_name }}_universal.dmg
      env:
        COMMITTER_TOKEN: ${{ secrets.HOMEBREW_TAP_TOKEN }}
```

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
