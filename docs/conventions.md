# 编码规范

## 命名
- React 组件文件用 PascalCase,例如 `WorktreePanel.tsx`。
- hooks 用 `useXxx.ts`,例如 `useWorktreePanelState.ts`。
- 契约、领域规则、用例和 infrastructure 文件用小写短横线或点后缀,例如 `worktree.contract.ts`、`worktree-rules.ts`、`worktree-panel-actions.ts`。
- Rust 模块用 snake_case 文件名,通过 `src-tauri/src/lib.rs` 显式注册。

## 目录边界
- `src/app/` 只放应用装配、Tauri invoke 封装和全局入口逻辑。
- `src/shared/contracts/` 放 browser-safe 共享契约,不能依赖 React、Tauri、mock 数据或业务用例。
- `src/modules/worktrees/` 拥有 worktree presentation、前端 API wrapper、domain 和局部 UI use-cases;共享类型从 `src/shared/contracts/worktrees/` 或 generated bindings 导入。
- `src/shared/ui/` 放可复用基础组件,不能依赖业务模块。
- `src/shared/icons/` 放图标导出,不要在业务组件里重复手写同语义图标。
- `src/shared/lib/` 放无 React 业务状态的工具函数和共享配置。
- `src-tauri/src/` 放窗口、托盘、定位、命令和平台适配。前端新增命令必须在 Rust handler 和权限侧同步。

## 文件头
每个源码文件顶部保留轻量 AI 文件头:

```ts
/**
 * @purpose 一句话说明文件做什么
 * @role    它在模块里的位置,由谁调用或调用谁
 * @deps    关键依赖
 * @gotcha  约束、坑或对应模块文档
 */
```

文件头不写函数签名和易过期实现细节。改职责、依赖或约束时同步更新。
详细规则见 [AI 文件头规范](topics/ai-file-headers.md)。

## React 与状态
- 状态变更保持不可变更新,沿用当前 `setProjects(current => ...)` 风格。
- Worktree 的 create/archive/setup 仍是模拟状态机;接入真实后端前不要引入持久化假设。
- 拖拽排序统一使用 `@dnd-kit`,程序化排序动画复用 `src/shared/lib/sortable.ts`。
- 交互按钮优先复用 `IconButton`,菜单项复用 `MenuItem`。

## 样式
- Tailwind class 与 `src/index.css` token 并用;新增全局 token 先写入 [design.md](../design.md)。
- Panel 透明、圆角裁切、blur 和隐藏滚动条是核心视觉约束。
- 字号和布局以固定阶梯为主,避免根据 viewport 连续缩放字体。

## 错误处理
- 前端调用 Tauri 的“可忽略命令”走 `invokeQuietly`,避免隐藏/退出失败打断 UI。
- 用户可见的失败路径后续接入真实后端时要有 toast 或明确状态,不能只 `catch` 静默。
- Rust tray/window 操作当前多为 best-effort,如果未来承载数据写入或破坏性动作,必须返回明确错误。

## 提交规范
- 使用 Conventional Commit: `feat(scope): subject`、`fix(scope): subject`、`docs(scope): subject` 等。
- 一次提交只做一类变化。涉及代码和文档同步时可以同一提交完成。

## 收尾自查
- 改动范围小而内聚,没有夹带无关重构。
- 模块文档、文件头、设计文档与代码一致。
- `node scripts/check-docs.mjs` 无错误。
- 受影响命令已真跑,结果写在最终回复里。
