# AGENTS.md

本文件作用域覆盖整个仓库。

## 1. 项目当前状态

- MVP 业务代码已实现完成，涵盖三项核心能力：网页文本选区翻译、页面截图区域翻译、Popup 粘贴翻译。
- 技术栈：WXT 0.19 + React 19 + TypeScript 5.7 + Zod 3.24，构建目标为 Manifest V3。
- 包管理器使用 pnpm（本机可通过 `npx pnpm@9` 调用）。
- 在做后续开发前，建议先阅读：
  - `docs/architecture.md` — 系统架构与模块职责
  - `docs/ui-design.md` — 交互设计与状态矩阵
  - `docs/development-setup.md` — 工程约定与开发流程
- 若后续实现与这三份文档冲突，默认以文档为准；只有在用户明确要求调整架构或 UI 时，才允许偏离，并且必须在同一任务内同步更新文档。

## 2. 项目目标与 MVP 范围

本项目是一个 Edge 翻译插件，当前阶段的 MVP 包含三项能力：

1. 网页文本选区翻译。
2. 页面截图区域翻译。
3. 插件 popup 内的手动粘贴翻译。

关键约束：

- 运行时采用浏览器直连模型供应商，不依赖额外后端。
- 用户在浏览器扩展内配置文本翻译逻辑和截图翻译逻辑。
- 文本翻译始终有一套基础配置。
- 截图翻译既可以复用一个多模态模型统一完成，也可以拆成“截图提取 + 截图翻译”两阶段并分别配置。
- API Key 持久化在浏览器扩展本地环境中。
- 所有复用都必须是显式配置，不做自动回退、自动继承或自动镜像。
- 截图翻译不走 OCR，直接调用支持视觉输入的 LLM。
- 截图翻译只上传用户框选后的裁剪区域，不上传整页截图。
- MVP 不做多账号体系、不做历史记录、不做整页翻译、不做流式输出。

## 3. 全局开发原则

- 优先遵守 `docs/architecture.md` 中的职责边界、目录设计和依赖方向。
- 优先遵守 `docs/ui-design.md` 中的交互、状态、文案和组件层级设计。
- 优先遵守 `docs/development-setup.md` 中的工程初始化顺序、本地联调方式和基础脚手架约定。
- 修改范围必须尽量小，避免“顺手”重构无关模块。
- 修复问题时优先修根因，不做表面补丁。
- 任何会改变系统边界、配置结构、接口形状或目录职责的改动，都必须同步更新设计文档。

## 4. 仓库结构约定

代码目录遵守如下结构，不要自行发散：

```text
.
├─ AGENTS.md
├─ README.md
├─ docs/
│  ├─ architecture.md
│  ├─ ui-design.md
│  └─ development-setup.md
├─ public/
│  └─ icon/
├─ src/
│  ├─ entrypoints/          # 浏览器扩展真实入口
│  │  ├─ background.ts
│  │  ├─ content.tsx
│  │  ├─ popup/
│  │  └─ options/
│  ├─ features/             # 按功能拆分业务
│  │  ├─ selection-translate/
│  │  ├─ screenshot-translate/
│  │  ├─ paste-translate/
│  │  └─ settings/
│  ├─ components/           # 可复用 UI 组件
│  ├─ services/             # 按技术职责拆分基础服务
│  │  ├─ llm/
│  │  ├─ messaging/
│  │  ├─ storage/
│  │  ├─ permissions/
│  │  ├─ capture/
│  │  └─ dom/
│  ├─ contracts/            # 类型契约
│  ├─ schemas/              # Zod 运行时校验
│  ├─ constants/            # 常量
│  ├─ errors/               # 错误码与错误类
│  ├─ hooks/                # React hooks
│  └─ styles/               # CSS 样式
├─ package.json
├─ tsconfig.json
└─ wxt.config.ts
```

> **注意**：`entrypoints/` 位于 `src/` 内部，因为 `wxt.config.ts` 中设置了 `srcDir: 'src'`，WXT 的 `@` 路径别名映射到 `src/`。

目录职责：

- `src/entrypoints`：浏览器扩展真实入口（background、content script、popup、options）。
- `src/features`：按功能拆分业务。
- `src/services`：按技术职责拆分基础服务。
- `src/contracts`、`src/schemas`、`src/constants`、`src/errors`：扩展内部统一契约层。
- `docs`：架构、UI、开发流程等设计文档。

包管理器约定：

- 使用 `pnpm`（本机可通过 `npx pnpm@9` 调用）。
- 不要引入多个包管理器锁文件。

## 5. 插件端开发规范

### 5.1 架构边界

插件端采用 `feature-first + service 分层`：

- `entrypoints/` 只做扩展入口挂载，不承载复杂业务。
- `src/features/` 按业务能力组织：
  - `selection-translate/`
  - `screenshot-translate/`
  - `paste-translate/`
  - `settings/`
- `src/services/` 按技术职责组织：
  - `llm/`
  - `messaging/`
  - `storage/`
  - `dom/`
  - `capture/`
  - `permissions/`

### 5.2 入口职责不可混用

- `content script`：只负责页面选区检测、截图遮罩、DOM 挂载、页面内浮层展示。
- `background`：统一负责 API Key 读取、供应商请求、权限检查、配置读写、截图编排和错误标准化。
- `popup`：负责文本翻译和截图模式启动入口。
- `options`：负责文本翻译配置、截图 pipeline 配置、分项权限请求、分项验证和清除配置。

禁止事项：

- `content script` 禁止直接读取 API Key。
- UI 组件禁止直接请求模型供应商。
- `popup` 和 `options` 禁止各自复制一套供应商调用逻辑。
- 与 DOM、浏览器扩展 API 强绑定的逻辑禁止散落到通用展示组件里。

### 5.3 UI 与交互约定

- 文本选区翻译继续使用“选区旁小按钮 + 就地浮层”。
- 截图翻译通过 `popup` 显式启动，不与文本选区按钮混合。
- 截图模式必须支持 `Esc` 取消。
- 未配置时，各入口优先引导用户前往设置，而不是直接报网络错误。
- 结果展示默认使用“原文/识别原文 + 译文”双区块。

### 5.4 配置与权限约定

- 配置使用 `chrome.storage.local` 持久化。
- 不使用 `chrome.storage.sync` 保存 API Key。
- 文本翻译配置与截图 pipeline 配置必须分开保存和校验。
- 截图 pipeline 可以显式复用文本翻译配置，但不得隐式共享。
- 权限处理必须集中在 `src/services/permissions`。
- 对所有自定义 profile 地址，必须按实际启用阶段分别显式请求对应 origin 权限。

### 5.5 截图功能约定

- 截图流程必须是：用户启动 -> 页面框选 -> 背景页截图 -> 本地裁剪 -> 上传裁剪图。
- 禁止将整页截图直接上传供应商。
- 禁止在无用户显式动作时静默截图。
- 图片大小、区域大小、失败提示必须按统一错误码处理。

## 6. 内部契约与服务规范

### 6.1 统一契约层

以下内容必须集中在内部契约层，而不是散落在功能模块中：

- 文本翻译配置与截图 pipeline 配置结构
- 翻译请求/响应类型
- 连接验证结果
- 错误码
- 消息类型
- 常量

### 6.2 统一供应商调用层

所有模型请求都必须通过 `src/services/llm`：

- 文本翻译请求
- 截图翻译请求
- 连接验证请求
- 响应解析与错误映射

禁止在 `features`、`components`、`entrypoints` 里直接 `fetch` 到供应商接口。

## 7. 类型、命名与代码风格

### 7.1 TypeScript 约定

- 所有新增实现默认使用 TypeScript 严格模式思维编写。
- 优先写显式类型，尤其是：配置结构、消息、服务输入输出、翻译结果。
- `any` 只允许在不可避免的第三方兼容点短暂出现，并应尽快收敛。
- 运行时输入校验优先用 `zod`，不要只依赖静态类型。

### 7.2 命名约定

- React 组件：`PascalCase.tsx`
- hooks：`useXxx.ts`
- service：`kebab-case.ts` 或与目录现有风格一致
- schema：`*.schema.ts`
- parser：`*.parser.ts`
- builder：`*.builder.ts`

### 7.3 编码风格

- 保持函数短小，避免在单个函数中混合 UI、网络、状态、解析多种职责。
- 优先组合小函数，不写超长过程式逻辑。
- 不使用单字母变量名。
- 不添加无意义注释；只有当设计意图不明显时才写简短注释。
- 避免隐式共享状态，优先显式传参。

## 8. 错误处理与用户反馈规范

- 错误码优先使用统一定义。
- 用户可见错误文案必须可理解，不能直接显示底层异常堆栈。
- 未配置、未授权、文本翻译缺失、截图直译缺失、截图提取缺失、截图翻译缺失、文本模型缺失、视觉模型缺失、文本过长、图片过大、截图失败、网络失败、模型不支持视觉，都应有明确区分。
- 前端展示错误时，优先告诉用户下一步该做什么。

## 9. 安全与隐私规范

- 允许将 API Key 持久化在扩展本地环境，但只能使用 `chrome.storage.local`。
- 所有 profile 的 API Key 都必须保存在明确的配置字段中，并且只能由 `background` 读取。
- 不允许把 API Key 存到页面上下文、URL、日志或 `storage.sync`。
- 不允许将整页截图上传到供应商。
- 不允许无用户操作地自动截屏。
- 不要在日志中记录完整 API Key、完整 `imageBase64`、敏感原文或大段截图内容。
- 对外展示的错误信息不得泄露密钥或底层堆栈。

## 10. 文档同步规范

以下情况必须同步更新文档：

- 修改目录结构。
- 修改配置结构。
- 修改供应商调用策略。
- 修改 UI 交互方式或状态机。
- 修改截图翻译或视觉模型策略。

文档更新规则：

- 架构边界变更：更新 `docs/architecture.md`
- 交互、布局、状态变更：更新 `docs/ui-design.md`
- 开发流程或脚手架约定变更：更新 `docs/development-setup.md`
- 全局规则变更：更新本文件 `AGENTS.md`

## 11. 测试与验证规范

在仓库具备脚本后，遵循以下顺序：

- 先跑与改动最接近的检查。
- 再跑页面能力相关检查。
- 最后再跑全项目构建或测试。

测试重点：

- 配置存储与读取。
- 权限请求与权限拒绝分支。
- 文本翻译与截图翻译消息流。
- 截图裁剪和结果浮层状态。
- 未配置态与连接验证态。

如果本次任务只做设计文档：

- 不要额外生成实现代码。
- 不要补充与当前文档无关的脚手架。

## 12. 提交与变更边界

- 不要擅自创建新分支或提交 commit，除非用户明确要求。
- 不要引入与当前任务无关的依赖。
- 不要为了“顺手整理”而大规模改名或移动目录。
- 不要在没有明确需求的情况下扩展 MVP 范围。

## 13. 给后续代理/工程师的执行建议

MVP 已完成，后续迭代建议：

1. 补充单元测试与集成测试，重点覆盖 storage、permissions、llm 服务层。
2. 完善错误处理边界（网络超时重试、权限拒绝后的恢复引导）。
3. 优化 UI 细节（深色模式、动画过渡、响应式适配）。
4. 考虑添加流式输出支持。
5. 任一阶段若修改了边界或交互，先更新文档，再继续编码。
