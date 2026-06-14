# UI 模块

## 职责
`src/shared/ui/` 放跨业务模块复用的基础 UI 小组件。

## 文件
- `IconButton.tsx`:固定尺寸 icon-only button,支持 project/row 尺寸和 ghost/accent/danger tone。
- `MenuItem.tsx`:context menu item 和 separator。
- `ScrollArea.tsx`:隐藏原生滚动条的滚动容器。
- `Divider.tsx`:细分隔线。
- `Dot.tsx`:彩色状态点。
- `Toast.tsx`:浮层短反馈。

## 约束
- shared UI 不能依赖 `src/modules/*`。
- Icon-only button 必须有 `title`,后续补 a11y 时可统一加 aria-label。
- 组件尺寸要稳定,hover/disabled/loading 不应引发布局跳动。
- TSX UI 源码纳入根级 Oxlint/Oxfmt;纯格式化 diff 不改变组件契约。
