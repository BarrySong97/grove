# 测试与验证策略

## 当前状态
仓库目前没有单元测试或 E2E 测试。可用的确定性验证是 Oxlint、TypeScript 构建和 harness 文档检查;Oxfmt 可用于显式格式化/格式检查。

## 必跑命令
```bash
pnpm format:check
pnpm lint
pnpm build
node scripts/check-docs.mjs
```

涉及 Rust DTO、Tauri command 或 bindings 时,还必须运行:

```bash
cd src-tauri && cargo test export_bindings
```

涉及格式化工具、hook 或大范围前端文本改动时,也可以先跑 `pnpm format` 写回格式,再跑以上命令确认。

## 什么时候跑 Tauri
涉及以下区域时,必须启动完整桌面壳:

```bash
pnpm tauri:dev
```

- `src-tauri/src/` 任意窗口、托盘、定位、命令改动。
- `src/app/App.tsx`、`src/app/tauriCommands.ts` 的 invoke 或全局键盘行为。
- `src/index.css`、`PanelShell`、透明/blur/圆角/滚动相关 UI。

## 手动验证路径
- 菜单栏图标左键点击可以显示和隐藏面板。
- Escape 会隐藏面板。
- 窗口失焦自动隐藏。
- 右下 Quit 按钮会退出应用。
- Worktree 面板可展开/折叠项目、拖拽排序、按钮上移/下移、打开右键菜单。
- New worktree 会进入 setting-up,延迟后回到 ready。
- Archive 非当前 worktree 会进入 archiving,延迟后从列表移除。

## 后续测试补强
- `src/modules/worktrees/domain/worktree-rules.ts`、`src/modules/worktrees/use-cases/worktree-panel-actions.ts` 和 `useWorktreePanelState` 适合先补单元测试。
- Tauri 命令增加真实 git 操作前,应补 Rust 单元测试或集成测试。
- Rust DTO 或 command 改动需要确认 `src/shared/bindings/commands.ts` 已重新生成。
- UI 关键路径可用 Playwright 访问 Vite 页面做无障碍树/DOM 断言。
