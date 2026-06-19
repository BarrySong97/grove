# Worktrees 模块

## 职责
`src/modules/worktrees/` 拥有 Grove 的核心面板:项目列表、worktree 行、排序、新建、归档、失败恢复、空状态导入、语言切换、项目/全局设置和 remove project 入口。

## 目录
- `components/`:面板、项目组、worktree 行、右键菜单、打开目标图标、footer 语言快捷入口、项目/全局设置页和局部编辑器;`components/settings/` 是统一的设置样式组件库(SettingsSheet/Header/Section/Row/Select/SwitchRow/Button/Footer)以及 archive/remove/log 确认 bottom sheet。
- `api/`:前端到 Rust 业务 command 的薄 wrapper 和 TanStack Query key catalog,包含项目创建/删除、项目列表、Conductor 导入、创建/retry/archive/open workspace、operation log、项目设置和全局设置 API。
- `hooks/useWorktreePanelState.ts`:前端 presentation hook,用 TanStack Query 编排 Rust-backed 读写,用 Jotai atoms 持久化纯 UI 偏好,并持有 toast/sheet 等瞬态 React state。
- `state/`:Worktree panel 的前端状态 atoms;当前只存排序和折叠这类 UI preference。
- `domain/`:纯 Worktree 规则、派生标签、打开目标和 setup/archive 命令 catalog。
- `use-cases/`:项目/worktree 排序和当前选择等纯状态变换;真实 git/shell/persistence workflow 在 Rust 后端。
- `index.ts`:模块对外导出。

## 状态模型
- `Project` 包含项目路径、默认分支、accent、命令配置和 worktrees。
- `WorktreeStatus` 是前端展示状态,当前有 `ready | setting-up | archiving | failed`,由 Rust workspace operation status 映射而来。
- 项目/workspace 列表通过 `api/` 调用 Rust generated command,来自 SQLite、手动添加项目、Conductor import 和 git refresh;后端按最新登记优先返回项目,所以新添加项目会显示在第一个。
- 项目/workspace 列表和 app settings 的前端读取由 TanStack Query 承载,query cache 配置为立即 stale 且不跨刷新持久化;Rust/SQLite/git 仍是唯一权威来源。
- repo root 会作为每个项目的默认 worktree 展示,前端映射为 `Worktree.isDefault`;它可打开但不能归档或删除。
- `createWorktree` 调用 Rust `create_workspace`,执行真实 `git worktree add`、files-to-copy 和 setup command。
- create/setup 失败后前端会重新加载项目列表并显示 error toast;后端 failed operation status 不映射成忙碌行,避免 spinner 停不下来。
- `archiveWorktree` 调用 Rust `archive_workspace`,执行 archive command 并按项目 override 或全局默认策略 hide 或 `git worktree remove`;`ask` 使用 Grove bottom sheet,不使用 `window.confirm`。外部已删除或损坏的 workspace 会由后端隐藏 Grove 记录并尝试 prune,不会因为缺失路径阻塞移除。
- `retryWorktree` 调用 Rust `retry_workspace_operation`;setup 失败只重跑 setup,archive 失败重跑 archive workflow。
- `removeProject` 调用 Rust `remove_project`;Project Settings 触发动作,Global Settings 只配置默认 remove 行为。主 repo 目录永远不会删除。
- `openWorktree` 调用 Rust `open_workspace`,按 workspace path 打开 Finder、Zed、Cursor、VS Code、Ghostty 或 macOS Terminal;编辑器和终端的启动目录由 Rust native opener 显式传入。
- 全局设置通过 Rust `get_app_settings`/`update_app_settings` 读写 SQLite,当前控制语言、默认打开方式、Ghostty window/tab、默认 archive 策略和 remove project 行为。
- Grove 不再暴露 Run Command 入口;项目命令只保留 setup/archive,分别由 create/archive/remove workflow 调用。
- Worktree/Project 等共享类型来自 `src/shared/contracts/worktrees/`,模块内部不得重新定义一份业务类型。
- 项目设置表单用 React Hook Form 管理前端 form state,`workspaceRoot` 必填校验通过 Hero UI invalid state 展示;命令字段允许为空。
- 项目展开/收起、project 排序和 worktree 排序是前端 UI 偏好,通过 Jotai `atomWithStorage` 存在 `localStorage` 的 `grove.worktrees.collapsedProjectIds`、`grove.worktrees.projectOrder` 和 `grove.worktrees.worktreeOrderByProject`;它们不属于 SQLite/git 状态。

## 分层
- 组件和 hook 属于前端 presentation,只编排 UI 事件、TanStack Query mutations、Jotai UI atoms、React transient state 和浮层反馈。
- `use-cases/` 表达一次用户操作造成的项目列表变化,保持纯函数,方便后续补单元测试。
- `domain/` 只放无副作用规则,例如 busy 状态判断、当前 worktree 选择和 draft worktree 构造。
- `api/` 只能调用 [Bindings 模块](../bindings/) 暴露的 generated command,不要直接拼 Tauri command 字符串。
- 前端 use-case 中的排序和当前选择只是 UI 状态变换,不能当成真实 git/worktree 操作;持久化排序也只代表面板显示偏好。

## 交互
- 项目和 worktree 都用 `@dnd-kit` 支持拖拽排序。
- 项目组默认展开;用户收起后,重新打开面板或刷新前端仍保持收起。
- Header 的 `Add project…` 会打开系统文件夹选择器;选择 git repo 根目录后,Grove 注册该项目并从 repo/config 推断默认设置,失败时展示后端返回的 UI-safe 错误。
- 空项目列表显示 `Import from Conductor or Add Project` 和 `How it works`;import 调用 Conductor 导入,add 调用同一个系统文件夹选择动作。
- Header 的齿轮按钮打开全局设置 bottom sheet;主 project/workspace 列表保持在底层可见。
- Footer 左侧提供语言快捷切换,和 Global Settings 的语言 select 使用同一个 Rust app setting;`system` 会在前端解析当前浏览器/系统语言后应用到 `i18next`。
- 空项目列表会在面板 body 中央显示一句添加项目提示,其中带 underline 的 `Add a project` 文本可点击并触发同一个文件夹选择动作。
- 手动添加、导入和刷新都会显示受保护的 repo root 默认 worktree;`NewWorktreeEditor` 使用项目默认分支作为新 worktree 的 base branch。
- `NewWorktreeEditor` 是两行表单:第一行先选 from base branch,再编辑 feature/workspace name;第二行右侧提供 `确认`/`取消` 文字按钮。
- `NewWorktreeEditor` 的 base branch 使用原生 select,用于保留 macOS 紧凑原生外观并适配窄宽度。
- `NewWorktreeEditor` 外层保持透明,可见外框由 1px accent ring 提供且不要额外叠白色 border;字段背景使用白色,input 不使用 Hero UI `secondary` variant;取消按钮使用正常主文本色,避免 inline editor 叠出灰蒙蒙的块面。
- 项目路径显示在项目名下方,占用项目 header 容器宽度并保持单行 truncate;路径使用高对比 metadata 色,避免透明面板叠到底层内容时看不清。
- 项目和 worktree 都提供按钮式 move up/down/top,动画配置来自 `src/shared/lib/sortable.ts`。
- Worktree row hover actions 渲染一组可在 Global Settings「悬停快捷打开」里配置的快捷打开按钮(可多选 Finder/Zed/Cursor/VS Code/Ghostty/Terminal),每个按钮按对应 target 调用 `open_workspace`,tooltip 和图标随 target 变化;未勾选的 target 仍可从 More 菜单打开。
- 右键或 More 打开 worktree action sheet,支持 open/copy/archive;默认 root worktree 的 Archive 禁用,failed workspace 额外显示 View Log 和 Retry。
- Worktree action sheet 从底部弹出,使用 `motion/react` 动效,并复用原 context menu 的分组和 item 样式;sheet 面板使用不透明 `bottom-sheet-surface`。
- open target 图标由 `OpenTargetIcon` 读取 `src/shared/assets/open-targets/` 的本地 app icon 资产,不要退回 lucide 的通用 editor/terminal/folder 图标。
- Global Settings 和 Project/Workspace Settings 也统一由 `src/shared/ui/BottomSheet.tsx` 承载,内部内容继续复用 settings density token,外层 sheet surface 不透底。
- worktree 行的 hover actions 在对应右键/More 菜单打开期间保持可见,避免菜单浮层出现后触发行级操作消失。
- Worktree action sheet 不展示 Run Command;setup/archive 命令在 Project Settings 中编辑。
- Toast 区分 progress/error:error 不显示 spinner,并在 panel 宽度内换行展示,避免长错误文案被透明窗口截断。notice/error 会在 5 秒后自动消失,所有 toast 都提供 close icon 立即关闭。
- Grove 不建模用户“当前” worktree;`current` 仅兼容旧前端状态,后端不会依赖它做 archive 判断。
- `ProjectSettings` 的 input/button 使用 Hero UI v3 底座和 `secondary` 视觉,archive policy 使用原生 select,所有支持 size 的 Hero UI 控件显式使用 `size="sm"`;`NewWorktreeEditor` 的 input/button 使用 Hero UI、base branch 使用原生 select;form state 由 React Hook Form 管理,但布局、透明背景和尺寸仍遵循 `design.md` 的 Grove 规则。
- Grove 内所有 select 控件统一使用原生 `<select>`,不要再引入 Hero UI `Select`;原生 select 仍通过 Grove token/class 控制紧凑尺寸和 focus ring。
- `ProjectSettings` 和 `GlobalSettings` 共用 `src/index.css` 的 `--settings-*` density token,确保项目设置表单密度和全局设置页一致。
- 设置 UI 由 `components/settings/` 的统一组件拼装:布局/排版用 Tailwind 工具类(读 `--settings-*` token),field 的 hover/focus 状态仍由 `src/index.css` 的 `grove-settings-field`/`grove-field-thin-focus` CSS 提供。
- `SettingsRow` 提供两种布局:`inline`(标签在左、定宽列,GlobalSettings 用,help/error 左缘对齐控件列——标准 label 85px、command 63px)和 `stacked`(标签在控件正上方、控件占满整行,ProjectSettings 用,help/error 对齐控件左缘)。ProjectSettings 危险操作行省略标签,直接放红色 `移除项目…` 按钮。
- Settings sheet 顶部不放返回 Projects 按钮;`ProjectSettings` 底部 action row 使用 secondary `关闭` + primary `确认`,Global Settings 底部提供 secondary `关闭`。
- `GlobalSettings` 的语言、archive 策略和 remove 行为使用原生 `<select>`(`SettingsSelect`);「悬停快捷打开」用一组可多选 chip,选项来自 `domain/open-targets.ts`;Ghostty 开关使用 Hero UI `Switch` 底座和 `size="sm"`,control/thumb 尺寸和颜色收敛到 Grove 紧凑面板。

## 约束
- 改真实 git/worktree/operation workflow 前,先更新 [Worktree Operation Workflow Boundary](../../topics/worktree-command-simulation.md) 或新增 spec/plan。
- 不要在组件里直接构造跨模块共享样式工具;先看 `src/shared/ui/` 和 `src/shared/lib/`。
- `ProjectSettings` 保存 Grove override:workspace root、archive policy、setup/archive 命令;它不会回写 Conductor 配置文件。Project Settings 也提供 `Remove Project…`,执行前会显示确认。
- TypeScript/TSX 源码纳入根级 Oxlint/Oxfmt;纯格式化 diff 不改变后端 operation workflow 边界。
