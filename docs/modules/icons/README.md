# Icons 模块

## 职责
`src/shared/icons/` 集中维护项目图标,避免业务组件重复定义同语义图标。

## 文件
- `actions.tsx`:操作类图标,如 archive、copy、play、terminal、gear。
- `navigation.tsx`:方向和导航类图标。
- `status.tsx`:spinner 等状态图标。
- `brand.tsx`:Grove 品牌图标。
- `index.ts`:统一导出。

## 约束
- 新图标优先放到语义文件并从 `index.ts` 导出。
- 保持图标尺寸和 stroke 语气一致。
- 业务组件只 import 图标语义名,不要内联重复 svg。
