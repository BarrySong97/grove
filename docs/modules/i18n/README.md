# I18n 模块

## 职责
`src/shared/i18n/` 放 Grove 前端国际化初始化、语言偏好映射和内置翻译资源。

## 文件
- `i18n.ts`:初始化 `i18next` 和 `react-i18next`,注册内置 `en-US`、`zh-CN` 资源,并提供系统语言解析。
- `language.ts`:把 Rust `AppLanguageDto` 的 `system | zh_cn | en_us` 映射到 i18next runtime language,并导出语言选项。
- `locales/en-US.ts`:英文 UI 文案资源。
- `locales/zh-CN.ts`:简体中文 UI 文案资源。

## 约束
- 语言偏好由 Rust app settings 持久化;本模块只负责前端应用和资源映射。
- `system` 不写死语言,必须根据当前 webview/browser language 解析。
- 翻译 key 要稳定且按 feature 分组(如 `settings.newProjectPosition.*`),组件测试可能依赖可访问 label。
- Toast 文案也放在 locale 资源中;涉及文件选择、成功/取消/失败诊断的提示要同步中英文,避免排查时只在某个语言下可见。
- 新增语言时同步 Rust `AppLanguageDto`、settings repository、migration、bindings、语言选项和本模块资源。
