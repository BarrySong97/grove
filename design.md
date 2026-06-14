# Grove 设计系统

## 产品气质
Grove 是 macOS menu bar 工具,第一屏就是可操作面板,不是营销页。界面应安静、紧凑、可快速扫读,接近原生工具而非网页 dashboard。

## 视觉 Token
- 字体:sans 使用 Apple system font stack;mono 使用 SF Mono 优先。
- 窗口圆角:`--window-radius: 18px`。
- 主色:运行时通过 `--accent` 注入,默认 `#2f6fe0`。
- 柔和主色:`--accent-soft`,由 `hexA(accent, 0.1)` 派生。
- 玻璃表面:`--glass-surface`、`--glass-surface-strong`。
- 阴影:`--shadow-panel`、`--shadow-ctx`、`--shadow-editor`。

## 布局
- Panel 填满 Tauri webview,由 `PanelShell` 负责 header、scroll body、footer 三段。
- 内容密度偏紧凑,常用行高约 30-40px。
- 工具按钮使用固定尺寸,避免 hover 时改变布局。
- 滚动条视觉隐藏,但区域仍可滚动。

## 组件约定
- 图标按钮复用 `src/shared/ui/IconButton.tsx`,必须提供 `title`。
- 菜单项复用 `src/shared/ui/MenuItem.tsx`。
- 分隔线复用 `Divider`,状态点复用 `Dot`,滚动容器复用 `ScrollArea`。
- worktree 行级动作默认 hover 展示,忙碌状态隐藏破坏性动作。

## 交互状态
- busy 状态使用 spinner + accent 文案。
- 短反馈使用 toast,不要用页面级说明文字。
- 项目和 worktree 都支持拖拽排序;按钮排序也要有同样的动画反馈。
- Context menu 必须 clamp 到窗口内,不能溢出不可点击区域。

## 无障碍
- Icon-only button 必须有 `title` 或后续补充 aria-label。
- 输入框保持键盘可达;新建 worktree 时自动 focus。
- Escape 行为:输入框内取消编辑,全局面板隐藏由 `App` 管理。
