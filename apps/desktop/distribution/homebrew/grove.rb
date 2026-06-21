# Homebrew Cask for Grove — TEMPLATE.
#
# This file is the source of truth you copy into your Homebrew tap repo at
#   github.com/BarrySong97/homebrew-tap  ->  Casks/grove.rb
# Users then install with:
#   brew install --cask BarrySong97/tap/grove
#
# `version` and `sha256` are bumped automatically by the release workflow
# (see apps/desktop/RELEASING.md).
cask "grove" do
  version "0.1.0"
  sha256 "0000000000000000000000000000000000000000000000000000000000000000"

  url "https://github.com/BarrySong97/grove/releases/download/v#{version}/Grove_#{version}_universal.dmg",
      verified: "github.com/BarrySong97/grove/"
  name "Grove"
  desc "Menu-bar git worktree manager"
  homepage "https://github.com/BarrySong97/grove"

  # Grove updates itself in-app via the Tauri updater, so Homebrew should not
  # try to manage upgrades for it.
  auto_updates true
  depends_on macos: :ventura

  app "Grove.app"

  zap trash: [
    "~/Library/Application Support/com.4real.grove",
    "~/Library/Caches/com.4real.grove",
    "~/Library/Preferences/com.4real.grove.plist",
    "~/Library/Saved Application State/com.4real.grove.savedState",
  ]
end
