# Lib 模块

## 职责
`src/shared/lib/` 放无业务状态的共享工具。

## 文件
- `color.ts`:颜色透明度等 token 派生工具。
- `sortable.ts`:dnd-kit 排序动画、transition 和 measuring 配置。
- `styles.ts`:React CSS variable 类型辅助。

## 约束
- lib 不能依赖 React 组件或业务模块。
- lib 不放前后端共享业务契约;共享类型放在 [Contracts 模块](../contracts/)。
- 排序动画改动要同时验证拖拽排序和按钮排序。
- 颜色工具要保持输入输出简单透明,避免把主题策略藏进 helper。
- TypeScript 工具源码纳入根级 Oxlint/Oxfmt;纯格式化 diff 不改变 helper 行为。
