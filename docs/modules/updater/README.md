# Updater 模块

## 职责
`src/modules/updater/` 负责 Grove 的**应用内更新**交互:检测 GitHub Releases 上的新版本,并在面板右下角弹出一个可点击的更新角标,点击后下载、安装并重启应用。

不做静默自动更新——是否升级由用户点击决定。底层依赖 Tauri `updater` 插件(读取 `latest.json`)与 `process` 插件(`relaunch`),配置见 [Tauri Runtime 模块](../tauri-runtime/) 的 `tauri.conf.json > plugins.updater` 与 `bundle.createUpdaterArtifacts`。

## 文件
- `useUpdater.ts`:更新生命周期 hook。生产构建下(`import.meta.env.PROD`)启动时及每 6 小时调用 `check()`;暴露 `status` / `version` / `progress` 与 `installAndRestart()`。任何失败(无 release、离线、非 Tauri 环境)都静默回到 `idle`,不向 UI 抛错。
- `UpdateBadge.tsx`:右下角浮动角标。`idle` 时不渲染;`available`/`error` 可点击触发下载安装;`downloading`/`installing` 显示进度与 spinner。文案走 i18n `updater.*`。
- `index.ts`:统一导出 `UpdateBadge`。

## 约束
- 角标只在有可用更新时出现,挂载于 `src/app/App.tsx` 的面板 shell 内,定位 `absolute bottom-[52px] right-3.5`,避免遮挡 footer 的语言/退出控件。
- 更新签名公钥(`tauri.conf.json > plugins.updater.pubkey`)与 CI 的 `TAURI_SIGNING_PRIVATE_KEY` 必须成对;换私钥必须同步换公钥,否则旧版本无法验证更新包。
- 发布与签名/公证流程见 `apps/desktop/RELEASING.md`。
- 新增 i18n 文案需同时更新 `en-US` 与 `zh-CN` 的 `updater` 段。
