# Grove 设计系统

## 产品气质
Grove 是 macOS menu bar 工具,第一屏就是可操作面板,不是营销页。它服务于频繁切换项目和 worktree 的开发者,视觉应接近原生小工具:安静、紧凑、可扫读、操作反馈明确。

设计目标:

- 第一眼能看清项目、branch、最新状态和可操作入口。
- 鼠标经过时显示高级操作,默认状态保持低噪音。
- 使用玻璃质感承接 macOS menu bar 场景,但内容密度优先于装饰。
- 所有固定格式 UI 都保持稳定尺寸,hover、busy、drag 不应造成布局跳动。

## 视觉 Token

### 字体
- Sans:`--font-sans`,Apple system font stack。
- Mono:`--font-mono`,SF Mono 优先,用于 branch、path、command 和计数信息。
- 正文默认约 `13.5px`,紧凑辅助信息使用 `10.5px` 到 `12px`。
- 不使用随 viewport 连续缩放的字号。

### 颜色
- 文本主色:`#1c1c1e`。
- 次级文本:`black/[0.34]`。
- 弱文本:`black/[0.22]`。
- 透明窗口 metadata:`black/55`,用于项目路径等必须跨玻璃背景保持可读的辅助信息;不要用浅灰或 `black/[0.22]` 承载长路径。
- hover 底色:`black/[0.038]`。
- active 底色:`black/[0.07]`。
- 危险 hover:`red-500` 或 `red-500/10` + `red-600`。
- 主色:`--accent`,默认 `#2f6fe0`,由 `WorktreePanel` 注入。
- 柔和主色:`--accent-soft`,由 `hexA(accent, 0.1)` 派生。
- 命令色:
  - Run:`#3aa856`
  - Setup:`#2f6fe0`
  - Archive:`#d98a2b`

### Surface
- 窗口圆角:`--window-radius: 18px`。
- 基础玻璃:`--glass-surface: rgba(244, 244, 241, 0.34)`。
- 强玻璃:`--glass-surface-strong: rgba(242, 242, 239, 0.46)`。
- 菜单玻璃:`--menu-surface: rgba(242, 242, 239, 0.74)`,用于降低浮层透明度。
- 边框:`--glass-border: rgba(255, 255, 255, 0.72)`。
- 模糊:`backdrop-filter: blur(54px) saturate(1.8)`。
- 不支持 backdrop-filter 时回退到更实的浅色背景。

### Shadow
- Panel:`--shadow-panel`,用于主窗口外阴影和内高光。
- Context menu:`--shadow-ctx`,用于浮层菜单。
- Editor:`--shadow-editor`,用于 inline create editor 的 1px outer accent ring。

### Hero UI
- Grove 使用 Hero UI v3 作为 button、input、select 和 form 的可访问底座。
- 所有 Hero UI 组件只要支持 `size`,都必须显式设置 `size="sm"`。
- 所有 select 控件统一使用原生 `<select>`,不要再引入 Hero UI `Select`;原生 select 仍用 Grove token 收敛尺寸和 focus 样式。
- Hero UI CSS 在 `src/index.css` 中按需导入,并通过 `:root` 覆盖 `--background`、`--surface`、`--field-*`、`--accent`、`--danger` 等变量。
- `--background` 必须保持 `transparent`;不要直接使用 Hero UI 默认实色 background 覆盖 tray webview。
- Hero UI 默认尺寸偏网页应用;Grove 组件必须继续用本文件定义的 fixed height、radius、padding 和透明玻璃 token 收敛到 menu bar 面板尺寸。

### Settings Density
- Project Settings 和 Global Settings 共用 `--settings-*` token,不要在组件里重新硬编码字号、label 宽度、field padding 或 radius。
- Settings 标题使用 `--settings-title-size`,主 label 使用 `--settings-label-size`,辅助/section/desc 使用 `--settings-meta-size`;这些值必须小于普通 panel row 标题。
- Settings 表单 field 使用 `--settings-control-size`、`--settings-control-px`、`--settings-control-py` 和 `--settings-control-radius`;整体密度需要和 Global Settings 保持一致,不要退回 12px+ 大字段。

## 布局

### Window Shell
- `html`、`body`、`#root`、`.app-shell` 必须保持透明背景和同一窗口圆角。
- `.app-shell` 使用 `clip-path: inset(0 round var(--window-radius))` 裁切 webview 内容。
- `PanelShell` 填满 Tauri webview,分为固定 header、滚动 body、固定 footer。
- 主 panel 使用 `p-1.5` 和 `border-[0.5px]`,保持 menu bar 浮窗的轻量感。

### Content Density
- Project header:`px-2.5 py-2`,字号 `12px`,项目路径 `10.5px` mono + `black/55`。
- Worktree row:
  - comfortable:`py-[9px]`,gap `11px`
  - compact:`py-1.5`,gap `8px`
  - row radius:`9px`
- Context menu width:`230px`,item height:`30px`,radius `11px` outer / `7px` item。
- New worktree editor radius `9px`,保持透明背景;可见外框由 `--shadow-editor` 提供,不要叠加白色 glass border。

### Overflow
- 滚动区域必须可滚动但隐藏原生滚动条。
- branch、path、commit message 和 command input 都必须 `truncate` 或 `min-w-0`,不能撑开 panel。
- Context menu 必须 clamp 到 viewport 内,子菜单不得产生不可点击区域。

## 组件规范

### IconButton
位置:`src/shared/ui/IconButton.tsx`

- 必须提供 `title`。
- 底层使用 Hero UI `Button`,但保留 Grove 自己的 fixed-size project/row 尺寸。
- `project` 尺寸:`22px x 22px`,radius `md`。
- `row` 尺寸:`27px x 27px`,radius `7px`。
- Hero UI `Button` 会给内部 SVG 注入默认尺寸;带 SVG 的 Grove 按钮必须使用 `grove-icon-scale`,保留图标组件自己的 `width`/`height`。
- `ghost`:默认 hover,用于普通工具。
- `accent`:用于正向操作,例如 new worktree。
- `danger`:用于破坏性动作。
- 不要用文字按钮替代明确的工具图标;找不到合适图标时先补 `src/shared/icons/`。

### MenuItem
位置:`src/shared/ui/MenuItem.tsx`

- 固定高度 `30px`,icon slot `16px`。
- 普通 hover 使用 `bg-accent text-white`。
- danger hover 使用 `bg-red-500 text-white`。
- disabled 使用 `pointer-events-none opacity-40`。
- 菜单分组用 `MenuSeparator`,不要手写分割线。

### Dot
位置:`src/shared/ui/Dot.tsx`

- 默认尺寸 `7px x 7px`。
- 项目 dot 使用项目 accent。
- 命令 dot 使用命令色。
- row 内当前的小黑点表示 worktree item marker,不是状态灯;真实状态灯接入前不要混用语义。

### Toast
位置:`src/shared/ui/Toast.tsx`

- 用于短暂反馈,例如 setup、archive、run command。
- 位置固定在 panel 左上附近:`left-3.5 top-10`。
- 深色玻璃背景,字号 `12px`,不要放长句或多行内容。
- 持久错误、确认和日志输出不应使用 toast 承载。

### PanelHeader / PanelFooter
- Header 显示品牌、总 worktree 数和项目数。
- Add project 目前是轻量占位入口,不要用说明文字解释功能。
- Footer 只放低频全局动作,当前是 Quit。

### ProjectSection
- 默认显示前 3 个 worktree,溢出时提供 Show all / Show less。
- hover 项目路径时,右侧显示 move/settings/new actions。
- 折叠动效使用 `0.22s` 和 `[0.4, 0, 0.2, 1]`。
- 项目拖拽和按钮排序都必须保留动画一致性。

### WorktreeRow
- 默认显示 branch + subtitle。
- hover 后显示 row actions;对应 context menu 打开时,row actions 保持可见直到菜单关闭。
- busy 状态隐藏行级操作,显示 spinner + accent 文案。
- commit subtitle 使用弱文本;时间戳进一步降噪。

### ContextMenu
- Worktree 菜单使用 `menu-surface` 的低透明度磨砂玻璃浮层,不要用过透明的基础 glass surface。
- Worktree 菜单保持单层结构;命令类操作用小号标题分组 + 一级菜单项展示,不要恢复 hover 二级 submenu。
- 菜单打开期间,来源 worktree row 应保持 hover-like 操作状态,减少浮层和行操作之间的视觉跳动。

### NewWorktreeEditor
- 出现后自动 focus branch input。
- Enter 提交,Escape 取消。
- 布局为两行:第一行先放 from base branch,再放 feature/workspace name;第二行右侧放 `确认`/`取消` 两个文字按钮。
- base branch select 使用原生 macOS select,宽度受限,长 branch name 不得撑开控件。
- name/base form state 使用 React Hook Form 管理。
- input 和 action button 使用 Hero UI 底座,base branch 使用原生 select;input 不使用 `secondary` variant,字段背景使用白色;inline add workspace 的 input/select 要用更小 padding 和 `10.5px` mono 字体适配窄面板。
- submit/cancel 使用文字按钮,文案固定为 `确认` 和 `取消`;submit 用 primary/accent,cancel 使用正常主文本色,不要降成灰色。
- 外层 Add Workspace accent ring 保持 1px 级别,不要额外叠白色 border;内部 input/select focus ring 才使用更细的 0.5px。
- Create button disabled 时只降 opacity,不改变尺寸。

### ProjectSettings
- 设置页复用 glass panel surface,不是 modal card。
- 设置表单使用 React Hook Form 管理状态,Hero UI `Form`/`Input`/`Button` 承载基础交互和 invalid state;archive policy 使用原生 select 保持 macOS 紧凑外观。
- Hero UI 表单控件使用 `secondary` 视觉;支持 `size` 的 Hero UI 控件显式使用 `size="sm"`,并用 `--settings-*` token 控制紧凑尺寸。
- input/select 的 active/focus accent ring 使用 `grove-field-thin-focus` 覆盖 Hero UI 默认 `ring-2`,最终显示 0.5px,避免透明 panel 中显得过重。
- command field 外层已经绘制 focus ring,内部输入框必须透明且 `outline-none`,避免出现内外双 outline。
- command input 使用 mono 字体和 `$` prompt。
- 命令描述为低对比辅助文本,不要抢主操作。

### GlobalSettings
- 全局设置页复用 glass panel surface,不是 modal card。
- Header 齿轮入口使用 `IconButton` 和共享 `Gear` 图标。
- 二元偏好使用 Hero UI `Switch` 底座,control/thumb 尺寸必须固定,切换时不应改变行高或挤压文本。
- 全局设置的返回按钮和 switch 使用 `size="sm"`,返回按钮使用 Hero UI `secondary` 视觉,标题/描述和 Project Settings 共用 `--settings-*` token。

## 动效与状态
- Panel 入场:`panel-in 0.14s cubic-bezier(0.2, 0.9, 0.3, 1)`。
- Drag reorder transition:`140ms cubic-bezier(0.25, 1, 0.5, 1)`。
- Collapse transition:`0.22s`。
- Spinner 只由消费者添加 `animate-spin`。
- Busy 状态必须锁住会冲突的操作。
- Dragging 状态使用轻微 opacity 和浅黑背景,不要加大型阴影或缩放。

## 文案
- UI 文案短、命令式、工具化。
- 不在界面内解释功能、快捷键或设计意图。
- 操作名使用 Title Case:例如 `New worktree`、`Project settings`、`Open in Terminal`。
- Toast 格式偏向 `Action · project/branch`。
- 空/错误/失败状态接入真实后端时再补,不要用静态说明段落填充 panel。

## 图标
- 通用图标使用 `lucide-react`,由 `src/shared/icons/` 提供语义 wrapper;业务组件不要直接从 `lucide-react` 或内联 SVG 导入。
- 产品品牌图标如 `GroveIcon` 可以保留本地 SVG,因为它不属于通用 icon 库语义。
- 新增图标按语义放入:
  - `actions.tsx`
  - `navigation.tsx`
  - `status.tsx`
  - `brand.tsx`
- 图标必须在 `16px` 和当前按钮尺寸内清晰。
- Settings/Project settings/Edit Commands 等设置入口必须使用 lucide 的 settings/cog 语义图标,不要使用看起来像 theme/sun/toggle 的图标。
- 图标 stroke、viewBox 和端点风格要与现有集合一致。

## 无障碍
- Icon-only button 必须有 `title`;后续统一补 `aria-label` 时以同一文案为基础。
- 表单控件必须键盘可达。
- 新建 worktree input 自动 focus,Escape 只取消本地编辑。
- 全局 Escape 隐藏 panel,但不能破坏输入控件自己的 Escape 语义。
- 禁用态要同时阻止 pointer 和视觉降噪。
- 文本对比优先满足可读性;弱文本只用于辅助信息。

## 响应与平台
- 当前目标是固定尺寸 Tauri tray panel,不是响应式网页布局。
- 不做 hero、marketing section 或卡片套卡片。
- 主 3 段布局必须在窄 panel 内保持可扫读。
- macOS 透明窗口是一级约束;改全局背景、圆角、overflow、clip-path 后必须运行 Tauri 验证。

## 变更流程
改 UI 时按这个顺序:

1. 先复用 `src/shared/ui/`、`src/shared/icons/`、`src/shared/lib/`。
2. 新增 token 前先确认是否可以用现有 `--accent`、glass、shadow 或文字透明度。
3. 改全局 CSS 时同步本文件的 token 和约束。
4. 改组件尺寸、状态、动效时同步对应模块文档。
5. 收尾跑 `node scripts/check-docs.mjs --strict`。
6. 涉及布局或视觉变化时跑 `pnpm build`;涉及透明窗口或 tray 行为时跑 `pnpm tauri:dev` 真机看一遍。
