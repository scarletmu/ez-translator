# 开发与验证指南

本文档补充当前仓库的本地开发、类型检查与测试基线，默认面向本项目当前 MVP 阶段。

## 1. 环境要求

- Node.js >= 20
- pnpm >= 9
- 如本机未全局安装 pnpm，可统一通过 `npx pnpm@9` 调用

## 2. 安装依赖

```bash
npx pnpm@9 install
```

安装完成后会自动执行 `wxt prepare` 生成 WXT 所需的类型与中间产物。

## 3. 开发命令

### 3.1 启动 Edge/Chromium 开发模式

```bash
npx pnpm@9 dev
```

构建产物输出到 `output/chrome-mv3`。在 Edge 中打开 `edge://extensions/`，启用“开发者模式”后加载该目录即可。

### 3.2 启动 Firefox 开发模式

```bash
npx pnpm@9 dev:firefox
```

### 3.3 生产构建

```bash
npx pnpm@9 build
```

## 4. 类型检查

```bash
npx pnpm@9 typecheck
```

当前 `typecheck` 会覆盖：

- React / TSX 编译配置
- WXT 入口类型
- `chrome.*` API 调用签名
- 服务层与组件层 TypeScript 类型检查

## 5. 测试

```bash
npx pnpm@9 test
```

如需本地监听模式：

```bash
npx pnpm@9 test:watch
```

当前测试基线基于 Vitest + jsdom，已统一提供：

- `@` 路径别名解析
- `chrome.runtime` / `chrome.storage` / `chrome.permissions` / `chrome.tabs` mock
- `navigator.clipboard` mock
- `fetch` mock 基线

测试默认不依赖真实浏览器环境，也不访问真实模型供应商接口。

## 6. 推荐验证顺序

每次改动后，建议按以下顺序验证：

1. 先跑与改动最接近的单测。
2. 再跑完整测试：`npx pnpm@9 test`
3. 最后跑类型检查：`npx pnpm@9 typecheck`

若改动涉及 popup / options / content 交互，建议额外在本地浏览器中手工检查：

- Popup 顶部状态是否正确显示“加载中 / 已就绪 / 未配置”
- 文本粘贴翻译未配置态是否优先引导到设置页
- 截图模式是否仍支持 `Esc` 取消
- 选区翻译与截图翻译浮层是否保持统一结构
- 设置页权限状态、验证状态、保存反馈是否正常

## 7. 常见注意事项

- 本项目使用 `chrome.storage.local` 保存配置，不使用 `chrome.storage.sync` 保存 API Key。
- 所有供应商请求必须经由 `background` 与 `src/services/llm` 发起。
- `content script` 不直接访问 API Key。
- 截图翻译只上传框选裁剪区域，不上传整页截图。
