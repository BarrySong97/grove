# Worktrees 模块

## 职责
`src/modules/worktrees/` 拥有 Grove 的核心面板原型:项目列表、worktree 行、排序、新建、归档、命令菜单和项目命令设置。

## 目录
- `components/`:面板、项目组、worktree 行、右键菜单、项目/全局设置页和局部编辑器。
- `api/`:前端到 Rust 业务 command 的薄 wrapper,包含项目创建、项目列表、Conductor 导入、创建 workspace、归档、打开、项目设置和全局设置 API。
- `hooks/useWorktreePanelState.ts`:前端 presentation hook,持有 React state、toast,并调用 Rust API 与少量纯前端用例。
- `domain/`:纯 Worktree 规则、派生标签和命令 catalog。
- `use-cases/`:项目/worktree 排序、当前选择和 run command UI 状态的纯状态变换;真实 git/shell/persistence workflow 在 Rust 后端。
- `index.ts`:模块对外导出。

## 状态模型
- `Project` 包含项目路径、默认分支、accent、命令配置和 worktrees。
- `WorktreeStatus` 当前只有 `ready | setting-up | archiving`。
- 项目/workspace 列表通过 `api/` 调用 Rust generated command,来自 SQLite、手动添加项目、Conductor import 和 git refresh;后端按最新登记优先返回项目,所以新添加项目会显示在第一个。
- `createWorktree` 调用 Rust `create_workspace`,执行真实 `git worktree add`、files-to-copy 和 setup command。
- create/setup 失败后前端会重新加载项目列表并显示 error toast;后端 failed operation status 不映射成忙碌行,避免 spinner 停不下来。
- `archiveWorktree` 调用 Rust `archive_workspace`,执行 archive command 并按项目策略 hide 或 `git worktree remove`。
- `openWorktree` 调用 Rust `open_workspace`,按 workspace path 打开 Finder、Zed、Cursor、VS Code、Ghostty 或 macOS Terminal;编辑器和终端的启动目录由 Rust native opener 显式传入。
- 全局设置通过 Rust `get_app_settings`/`update_app_settings` 读写 SQLite,当前只控制 Ghostty 用新 window 还是当前实例 tab 打开 workspace。
- `runCommand` 仍是前端占位反馈;当前第一轮只解析/展示 run command,不做长期进程管理。
- Worktree/Project 等共享类型来自 `src/shared/contracts/worktrees/`,模块内部不得重新定义一份业务类型。
- 项目设置表单用 React Hook Form 管理前端 form state,`workspaceRoot` 必填校验通过 Hero UI invalid state 展示;命令字段允许为空。
- 项目展开/收起是前端 UI 偏好,按 project id 存在 `localStorage` 的 `grove.worktrees.collapsedProjectIds`;它不属于 SQLite/git 状态。

## 分层
- 组件和 hook 属于前端 presentation,只编排 UI 事件、React state 和浮层反馈。
- `use-cases/` 表达一次用户操作造成的项目列表变化,保持纯函数,方便后续补单元测试。
- `domain/` 只放无副作用规则,例如 busy 状态判断、当前 worktree 选择和 draft worktree 构造。
- `api/` 只能调用 [Bindings 模块](../bindings/) 暴露的 generated command,不要直接拼 Tauri command 字符串。
- 前端 use-case 中的排序、当前选择和 run command 只是临时 UI 状态变换,不能当成真实 git/worktree 操作。

## 交互
- 项目和 worktree 都用 `@dnd-kit` 支持拖拽排序。
- 项目组默认展开;用户收起后,重新打开面板或刷新前端仍保持收起。
- Header 的 `Add project…` 会打开系统文件夹选择器;选择 git repo 根目录后,Grove 注册该项目并从 repo/config 推断默认设置,失败时展示后端返回的 UI-safe 错误。
- Header 的齿轮按钮进入全局设置子视图;设置页复用 panel glass surface,不是 modal。
- 空项目列表会在面板 body 中央显示一句添加项目提示,其中带 underline 的 `Add a project` 文本可点击并触发同一个文件夹选择动作。
- 手动添加的项目可以先没有 workspace 行;`NewWorktreeEditor` 使用项目默认分支作为第一个 worktree 的 base branch。
- `NewWorktreeEditor` 是两行表单:第一行先选 from base branch,再编辑 feature/workspace name;第二行右侧提供 `确认`/`取消` 文字按钮。
- `NewWorktreeEditor` 的 base branch 使用原生 select,用于保留 macOS 紧凑原生外观并适配窄宽度。
- `NewWorktreeEditor` 外层保持透明,可见外框由 1px accent ring 提供且不要额外叠白色 border;字段背景使用白色,input 不使用 Hero UI `secondary` variant;取消按钮使用正常主文本色,避免 inline editor 叠出灰蒙蒙的块面。
- 项目路径显示在项目名下方,占用项目 header 容器宽度并保持单行 truncate;路径使用高对比 metadata 色,避免透明面板叠到底层内容时看不清。
- 项目和 worktree 都提供按钮式 move up/down/top,动画配置来自 `src/shared/lib/sortable.ts`。
- 右键菜单支持 open/reveal/copy/run/archive 等入口;open/archive 已接 Rust command,run 仍是占位反馈。
- 右键菜单使用 `menu-surface` 低透明度磨砂玻璃,避免浮层读起来过透明。
- worktree 行的 hover actions 在对应右键/More 菜单打开期间保持可见,避免菜单浮层出现后触发行级操作消失。
- Run Command 操作在同一个菜单内以分组标题 + 命令项展示,不再使用二级 submenu。
- Toast 区分 progress/error:error 不显示 spinner,并在 panel 宽度内换行展示,避免长错误文案被透明窗口截断。
- Grove 不建模用户“当前” worktree;`current` 仅兼容旧前端状态,后端不会依赖它做 archive 判断。
- `ProjectSettings` 的 input/button 使用 Hero UI v3 底座和 `secondary` 视觉,archive policy 使用原生 select,所有支持 size 的 Hero UI 控件显式使用 `size="sm"`;`NewWorktreeEditor` 的 input/button 使用 Hero UI、base branch 使用原生 select;form state 由 React Hook Form 管理,但布局、透明背景和尺寸仍遵循 `design.md` 的 Grove 规则。
- Grove 内所有 select 控件统一使用原生 `<select>`,不要再引入 Hero UI `Select`;原生 select 仍通过 Grove token/class 控制紧凑尺寸和 focus ring。
- `ProjectSettings` 和 `GlobalSettings` 共用 `src/index.css` 的 `--settings-*` density token,确保项目设置表单密度和全局设置页一致。
- `GlobalSettings` 的开关使用 Hero UI `Switch` 底座和 `size="sm"`,但 control/thumb 尺寸和颜色收敛到 Grove 紧凑面板。

## 约束
- 接入真实 git/worktree 前,先更新 [Worktree 命令模拟边界](../../topics/worktree-command-simulation.md) 或新增 spec/plan。
- 不要在组件里直接构造跨模块共享样式工具;先看 `src/shared/ui/` 和 `src/shared/lib/`。
- `ProjectSettings` 保存 Grove override:workspace root、archive policy、setup/archive/run 命令;它不会回写 Conductor 配置文件。
- TypeScript/TSX 源码纳入根级 Oxlint/Oxfmt;纯格式化 diff 不改变临时模拟操作边界。
