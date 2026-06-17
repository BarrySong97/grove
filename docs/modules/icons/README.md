# Icons 模块

## 职责
`src/shared/icons/` 集中维护项目图标 wrapper,避免业务组件重复定义同语义图标。

macOS app icon 和 menu bar template icon 属于 Tauri 运行壳资源,放在 `src-tauri/icons/`,由 [Tauri Runtime 模块](../tauri-runtime/) 维护。
workspace open target 的软件识别图标是产品 UI 资产,放在 `src/shared/assets/open-targets/`,由 Worktrees 的 `OpenTargetIcon` 渲染。

## 文件
- `actions.tsx`:操作类图标,如 archive、copy、play、terminal、gear;通用图标来自 `lucide-react`。
- `navigation.tsx`:方向和导航类图标;通用图标来自 `lucide-react`。
- `status.tsx`:spinner 等状态图标;通用图标来自 `lucide-react`。
- `brand.tsx`:Grove 品牌图标;`GroveIcon` 作为产品标识保留本地 SVG,branch 等通用图标使用 `lucide-react`。
- `index.ts`:统一导出。
- `../assets/open-targets/`:Finder、Zed、Cursor、VS Code、Ghostty 和 Terminal 的本地 app icon 资产。

## 约束
- 新通用图标优先使用 `lucide-react`,放到语义文件中包装后从 `index.ts` 导出。
- 软件/产品识别图标优先使用真实 app icon 资产,不要用 lucide 通用图标代替。
- 保持图标尺寸和 stroke 语气一致。
- 设置入口统一使用 `Gear` wrapper 的 lucide settings/cog 图标;不要把 theme/sun/toggle 类图标用于 Settings、Project settings 或 Edit Commands。
- 业务组件只 import 图标语义名,不要内联重复 svg。
- TSX 图标源码纳入根级 Oxlint/Oxfmt;纯格式化 diff 不改变图标语义或导出边界。
