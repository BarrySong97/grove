# UI 模块

## 职责
`src/shared/ui/` 放跨业务模块复用的基础 UI 小组件。

## 文件
- `IconButton.tsx`:基于 Hero UI `Button`/`Tooltip` 的固定尺寸 icon-only button,支持 project/row 尺寸和 ghost/accent/danger tone。
- `BottomSheet.tsx`:基于 `motion/react` 的共享底部 sheet shell,负责 overlay、Escape 关闭和 slide-up 动效;`elevated` 让确认 sheet 浮到其它 sheet 之上,`maxHeightClassName` 可调 sheet 最大高度(内容多的 sheet 如 Global Settings 用更高的 cap 完整显示所有选项)。
- `MenuItem.tsx`:context menu item 和 separator。
- `ScrollArea.tsx`:隐藏原生滚动条的滚动容器。
- `Divider.tsx`:细分隔线。
- `Dot.tsx`:彩色状态点。
- `Toast.tsx`:浮层短反馈,支持 notice/progress/error tone、close icon 和 panel 内换行;progress 可带 spinner,error 占用 panel 内部宽度并允许长文案换行。

## 约束
- shared UI 不能依赖 `src/modules/*`。
- 需要底部弹出的工作流优先复用 `BottomSheet`;消费者提供内部 surface 样式和内容,且 sheet 面板应使用不透明 `bottom-sheet-surface`。
- Hero UI 组件必须通过本模块或业务局部 wrapper 收敛到 Grove 的紧凑尺寸和透明窗口 token。
- Hero UI 组件只要支持 `size`,都必须显式设置为 `sm`。
- 带 SVG/lucide icon 的 Hero UI `Button` 必须加 `grove-icon-scale`,避免 Hero UI 默认 icon 尺寸覆盖共享 icon 自带尺寸。
- `MenuItem` 可点击项使用 `cursor-pointer`;disabled 项保持 `pointer-events-none`。
- Icon-only button 必须有 `title`;`IconButton` 会用同一文案生成 `aria-label`、原生 title 和 tooltip。
- 组件尺寸要稳定,hover/disabled/loading 不应引发布局跳动。
- TSX UI 源码纳入根级 Oxlint/Oxfmt;纯格式化 diff 不改变组件契约。
