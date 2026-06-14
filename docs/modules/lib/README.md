# Lib 模块

## 职责
`src/shared/lib/` 放无业务状态的共享工具。

## 文件
- `color.ts`:颜色透明度等 token 派生工具。
- `sortable.ts`:dnd-kit 排序动画、transition 和 measuring 配置。
- `styles.ts`:React CSS variable 类型辅助。

## 约束
- lib 不能依赖 React 组件或业务模块。
- 排序动画改动要同时验证拖拽排序和按钮排序。
- 颜色工具要保持输入输出简单透明,避免把主题策略藏进 helper。
