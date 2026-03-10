# Edge 翻译插件

一个运行在 Edge（Chromium）浏览器中的 AI 翻译扩展，支持网页选区翻译、截图区域翻译和粘贴翻译。插件直连 OpenAI 兼容的 LLM 供应商，无需额外后端服务。

## 功能概览

- **网页选区翻译** — 选中网页文本后，点击浮动按钮即可翻译，结果在选区旁浮层中展示。
- **截图区域翻译** — 通过 Popup 启动截图模式，在页面上框选区域，调用视觉 LLM 识别并翻译图中文字。
- **粘贴翻译** — 在 Popup 中粘贴任意文本，选择目标语言后一键翻译。
- **灵活配置** — 支持 OpenAI、OpenRouter、DeepSeek 等预置供应商，也支持任意 OpenAI 兼容接口。截图翻译支持单模型直译或"提取+翻译"两阶段 pipeline。

## 技术栈

- [WXT](https://wxt.dev/) 0.19 — 浏览器扩展开发框架
- React 19 + TypeScript 5.7
- Zod — 运行时数据校验
- Manifest V3

## Quick Start

### 环境要求

- Node.js >= 20
- pnpm >= 9（或通过 `npx pnpm@9` 调用）

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

启动后 WXT 会在 `.output/chrome-mv3` 输出扩展产物。打开 Edge，进入 `edge://extensions/`，开启"开发者模式"，点击"加载解压缩的扩展"，选择 `.output/chrome-mv3` 目录即可加载插件。

### 构建生产版本

```bash
pnpm build
```

产物同样输出到 `.output/chrome-mv3`。

### 类型检查

```bash
pnpm typecheck
```

### 运行测试

```bash
pnpm test
```

## 使用指南

### 1. 配置供应商

安装插件后，点击插件图标打开 Popup，点击右上角齿轮图标进入设置页。

**文本翻译配置**（必填）：
- 选择供应商类型（OpenAI / OpenRouter / DeepSeek / 自定义兼容接口）
- 填写 API Base URL、API Key、模型名称
- 点击"验证连接"确认配置可用

**截图翻译配置**（可选）：
- 选择模式：直接多模态翻译 或 提取+翻译两阶段
- 各阶段可复用文本翻译配置，也可单独配置
- 即使选择“复用文本翻译配置”，也需要在设置页保存一次截图翻译配置，截图入口才会进入可用态

### 2. 选区翻译

在任意网页中选中文本，选区旁会出现"翻译"按钮，点击即可查看翻译结果。

### 3. 截图翻译

点击插件图标打开 Popup，在标题右侧选择本次会话的目标语言，切换到"截图翻译"标签，点击"开始截图翻译"。页面会进入截图模式，拖拽框选目标区域后松开鼠标，等待识别与翻译结果。按 `Esc` 可随时取消。

### 4. 粘贴翻译

在 Popup 的标题右侧选择目标语言后，切换到"文本翻译"标签，粘贴或输入文本，点击"翻译"或按 `Ctrl+Enter`。

## 项目结构

```
src/
├─ entrypoints/          # 浏览器扩展入口
│  ├─ background.ts      # 消息路由中枢，唯一的 API Key 访问点
│  ├─ content.tsx         # Shadow DOM 挂载选区翻译与截图模式
│  ├─ popup/             # Popup 页面（粘贴翻译 + 截图启动）
│  └─ options/           # 设置页面（供应商配置 + 验证）
├─ features/             # 业务功能模块
│  ├─ selection-translate/  # 网页选区翻译
│  ├─ screenshot-translate/ # 截图区域翻译
│  ├─ paste-translate/      # 粘贴翻译
│  └─ settings/             # 设置页各配置区
├─ components/           # 可复用 UI 组件
├─ services/             # 基础服务层
│  ├─ llm/               # LLM 供应商调用、Prompt 构建、响应解析
│  ├─ storage/           # chrome.storage.local 封装
│  ├─ permissions/       # Host 权限管理
│  ├─ messaging/         # 消息通信封装
│  ├─ capture/           # 截图捕获与裁剪
│  └─ dom/               # DOM 工具（Shadow DOM、选区定位）
├─ contracts/            # TypeScript 类型契约
├─ schemas/              # Zod 运行时校验 Schema
├─ constants/            # 常量（供应商预置、语言列表、限制值）
├─ errors/               # 错误码、错误类、用户友好提示
├─ hooks/                # React Hooks
└─ styles/               # CSS 样式
```

## 架构要点

- **Background 作为安全边界** — 所有 API Key 读取和供应商请求都由 background service worker 统一处理，content script 和 UI 页面不直接接触敏感配置。
- **Shadow DOM 隔离** — Content script 的 UI 在 Shadow DOM 内渲染，避免宿主页面样式污染。
- **截图本地裁剪** — 截图翻译只上传用户框选的裁剪区域，不上传整页截图。
- **显式配置复用** — 截图 pipeline 各阶段可显式复用文本翻译配置，但不做任何隐式共享或自动回退。

## 安全与隐私

- API Key 仅存储在 `chrome.storage.local`，不使用 `storage.sync`。
- API Key 只由 background 读取，不暴露到页面上下文。
- 截图只上传框选区域裁剪图，不上传整页内容。
- 不在日志中记录完整 API Key 或截图内容。

## License

Private — 仅供个人使用。
