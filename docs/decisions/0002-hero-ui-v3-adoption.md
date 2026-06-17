# 0002 采用 Hero UI v3 作为前端组件底座

## 背景
Grove 的面板已经形成稳定的 Tauri tray 透明窗口、紧凑密度和 glass token。后续表单、按钮、select、invalid state 和键盘可访问性会继续增加,继续手写基础控件会放大维护成本。

Hero UI v3 适配 React 19 和 Tailwind CSS v4,与当前技术栈匹配。

## 决策
采用 Hero UI v3 作为基础交互组件底座,但不采用 Hero UI 默认产品视觉。

- `@heroui/react` 提供 `Button`、`Input`、`Select`、`Form` 等 React 组件。
- `@heroui/styles` 在 `src/index.css` 中按需导入。
- Grove 通过 `:root` 覆盖 Hero UI theme variables,确保 `--background` 保持 `transparent`。
- 共享组件优先在 `src/shared/ui/` 封装 Hero UI,业务组件只在局部复杂表单里直接使用 Hero UI。
- 表单状态和校验使用 React Hook Form;Hero UI 负责控件底座和 invalid state 呈现。
- 所有 Hero UI 组件只要支持 `size`,都必须显式使用 `size="sm"`。

## 约束
- 不要按 Hero UI v2 或 NextUI 经验添加 `HeroUIProvider`;当前 v3 包主要通过 CSS variables 和 React Aria primitive 工作。
- 不要直接导入完整 `@heroui/styles` 后忽略主题覆盖;Hero UI 默认 `--background`、`--surface`、`--accent` 等变量会和 Grove 透明窗口、项目 accent 冲突。
- 不要让 Hero UI 默认尺寸直接进入 tray panel;所有 Hero UI 组件都必须收敛到 `design.md` 的固定高度、padding、radius 和透明 glass token。
- `Select` 使用 React Aria 风格的 `selectedKey`、`onSelectionChange`、`ListBox.Item`;不要使用旧版 `SelectItem` API。
- `Button` 类型不暴露所有原生 button props;icon-only 按钮需要通过 wrapper 同时提供 `title` 和 `aria-label`。
- `Form` 不接受所有原生 form props;不要假设 `noValidate` 等属性可直接传入。
- `Select`/`Popover` 动画依赖 `tw-animate-css`;缺失时 Tailwind build 会报 `unknown utility class fade-in-0`。

## 后果
- 基础按钮、输入框、select 和设置表单可以复用 Hero UI 的可访问交互行为。
- `pnpm build` 的前端 bundle 会变大;当前 Vite 会提示 chunk size warning,后续如继续扩大组件库使用范围,需要考虑按路由/视图拆分或 Rollup `manualChunks`。
- 修改 `src/index.css`、Hero UI theme variables 或表单组件时,必须同步 `design.md` 和对应模块文档。
