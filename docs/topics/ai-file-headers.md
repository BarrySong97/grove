# AI 文件头规范

## 目的
文件头给 agent 提供就近上下文:这个文件做什么、处在什么层、依赖什么、有哪些坑。它补的是导航信息,不是 API 文档。

## 格式
TypeScript/TSX/CSS:

```ts
/**
 * @purpose 一句话说明文件职责
 * @role    它在模块或系统里的位置
 * @deps    关键依赖,只列会影响修改判断的依赖
 * @gotcha  约束、坑或对应文档链接
 */
```

Rust:

```rust
// @purpose 一句话说明文件职责
// @role    它在模块或系统里的位置
// @deps    关键依赖,只列会影响修改判断的依赖
// @gotcha  约束、坑或对应文档链接
```

## 写法规则
- `@purpose` 写稳定职责,不要写“当前实现有几个函数”。
- `@role` 写调用关系或层级归属。
- `@deps` 只列修改时必须留意的库、模块或外部系统。
- `@gotcha` 写最容易被 agent 误改的约束,并尽量链接到 `docs/`。
- 不写函数签名、props 列表、完整流程,这些最容易过期。

## 覆盖范围
由 `check-docs.config.json` 控制。当前覆盖:

- `src/app`
- `src/modules`
- `src/shared`
- `src-tauri/src`
- `src/main.tsx`
- `src/vite-env.d.ts`
- `vite.config.ts`
- `src-tauri/build.rs`

新增源码入口时,必须同时更新 `check-docs.config.json` 或放进已覆盖目录。

## 维护流程
1. 改文件职责、依赖、跨模块边界或重要约束时,先更新文件头。
2. 改模块行为时,同步对应 `docs/modules/<module>/README.md`。
3. 收尾跑 `node scripts/check-docs.mjs --strict`。
