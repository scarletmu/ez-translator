# Edge 翻译插件架构设计

## 1. 项目目标

### 1.1 背景

本项目目标是设计一个运行在 Edge 浏览器中的翻译插件，覆盖三个核心使用场景：

1. 用户在网页中选中文本后，能够快速触发翻译并在当前页面附近查看结果。
2. 用户在网页中遇到不可复制、不可选中的内容时，能够通过截图框选区域并直接调用视觉 LLM 完成翻译。
3. 用户将任意文本复制后，可以在插件弹窗中粘贴文本并获得翻译结果。

本次架构调整后的核心前提是：插件不再依赖额外自建后端，模型配置直接在浏览器扩展内完成，调用链路由扩展内部直接连接到模型供应商。配置方式不再按“文本一套、截图一套”硬拆，而是按逻辑能力聚合：文本翻译有一套基础配置；截图翻译则是一条可配置 pipeline，可以选择由一个多模态模型直接完成，也可以拆成“视觉提取 + 文本翻译”两阶段，并允许显式复用文本翻译配置或单独指定各阶段模型。

### 1.2 MVP 成功标准

MVP 交付完成时，应满足以下标准：

- 在 Edge 中加载插件后，用户可以对普通网页文本执行选区翻译。
- 用户可以通过截图框选当前可见页面区域并完成视觉翻译。
- 用户可以在插件弹窗中粘贴文本并执行翻译。
- 用户可以在插件设置页中配置文本翻译逻辑与截图翻译逻辑：既支持一个多模态模型统一完成，也支持截图提取与截图翻译分阶段分别指定模型。
- 模型配置持久化在浏览器扩展本地存储中，而不是依赖外部后端。
- 前后端分层架构调整为“单扩展应用 + 供应商客户端抽象”，不再要求单独部署 API 服务。
- 设计文档足够完整，另一位工程师可以直接基于本文档创建脚手架并开始编码。

## 2. MVP 范围与边界

### 2.1 本阶段包含

- 网页选区翻译。
- 当前可见页面区域的截图翻译。
- 插件弹窗中的粘贴翻译。
- 插件设置页，用于配置文本翻译逻辑、截图翻译逻辑与默认目标语言。
- 供应商连接验证。
- 浏览器扩展本地持久化配置。
- 全 TypeScript 单应用架构与目录规划。

### 2.2 本阶段不包含

- 自动监听复制后弹出翻译。
- 整页翻译。
- OCR 独立识别链路。
- PDF 专项适配。
- 历史记录、收藏、术语库。
- 流式输出。
- 多账号体系。
- 云端同步密钥管理。
- 独立后端中转服务。

### 2.3 设计原则

- 易用优先：用户只安装插件即可使用，不要求额外部署服务。
- 本地优先：配置保存在扩展本地存储中，默认不依赖云端同步。
- 权限最小化：仅请求必要的扩展权限和供应商域名访问权限。
- 上传最小化：截图翻译只上传用户框选后的裁剪区域，不上传整张页面截图。
- 边界清晰：即使没有后端，也要保留清晰的模块边界，避免 UI、存储、供应商调用混杂。

## 3. 系统架构总览

### 3.1 逻辑分层

系统调整为两层：

```text
+----------------------------------+
| Edge Extension                   |
| - Content Script                 |
| - Background / Service Worker    |
| - Popup                          |
| - Options                        |
| - Capture / Crop Service         |
| - Provider Client                |
| - Storage Service                |
+----------------+-----------------+
                 |
                 | HTTPS with host permission
                 v
+----------------------------------+
| LLM Provider                     |
| - OpenAI-compatible endpoint     |
| - OpenAI / OpenRouter / Custom   |
+----------------------------------+
```

### 3.2 职责边界

#### 插件层

- 负责用户交互。
- 负责页面选区检测与浮层展示。
- 负责截图模式的遮罩、框选与结果展示。
- 负责本地裁剪截图区域。
- 负责配置管理和本地持久化。
- 负责直接调用 LLM 供应商接口。
- 不依赖额外后端。

#### Background 层

- 作为插件内部中枢。
- 是唯一允许读取 API Key 和直接请求供应商接口的模块。
- 统一负责翻译请求、连接验证、错误标准化、配置读取和截图编排。

#### Content / Popup / Options 层

- 只负责 UI、用户输入、状态展示和向 `background` 发送消息。
- 不直接读取敏感配置。
- 不直接与供应商接口通信。

## 4. 插件架构设计

### 4.1 插件入口划分

插件由四个入口组成：

1. `content script`
2. `background`
3. `popup`
4. `options`

### 4.2 Content Script 职责

`content script` 只处理与页面 DOM 强相关的逻辑：

- 监听选区变化。
- 判断当前页面是否存在有效选区。
- 在选区附近显示可点击的“翻译”触发按钮。
- 进入截图框选模式时挂载全屏遮罩层。
- 采集截图框选矩形坐标并发送给 `background`。
- 接收 `background` 返回的翻译结果。
- 在页面中挂载和卸载翻译浮层。
- 管理浮层位置更新、关闭、重试等 UI 行为。

禁止事项：

- 禁止直接请求供应商接口。
- 禁止直接读取 API Key。
- 禁止把模型配置暴露到页面上下文。

### 4.3 Background 职责

`background` 是插件内部中枢，负责把多个入口统一接到同一套业务服务上：

- 接收来自 `content script`、`popup`、`options` 的消息。
- 统一读取 `chrome.storage.local` 中的供应商配置。
- 统一调用文本翻译、视觉翻译、连接验证逻辑。
- 统一处理网络异常与错误码映射。
- 统一处理截图模式启动、页面捕获与本地裁剪。
- 统一请求和管理供应商域名权限。
- 负责把供应商响应转成 UI 可消费的数据结构。

### 4.4 Popup 职责

`popup` 用于承载两个轻量能力入口：

- 手动粘贴文本翻译。
- 启动截图翻译模式。

其职责包括：

- 提供文本输入或粘贴区域。
- 提供翻译按钮。
- 提供“开始截图翻译”入口。
- 展示原文与译文对照。
- 展示加载状态、错误状态和重试动作。
- 在配置缺失时，引导用户前往设置页完成对应能力的供应商配置。

### 4.5 Options 职责

`options` 用于承载配置管理：

- 配置文本翻译逻辑：供应商类型、服务地址、API Key、文本模型。
- 配置截图翻译逻辑：选择截图翻译模式。
- 当截图模式为 `direct_multimodal` 时，可选择：
  - 复用文本翻译配置；
  - 单独配置截图直译模型。
- 当截图模式为 `extract_then_translate` 时，可配置：
  - 截图文字提取模型；
  - 截图翻译阶段复用文本翻译配置，或单独配置截图翻译模型。
- 设置默认目标语言。
- 对所有实际启用的 profile 分别请求 host 权限。
- 对所有实际启用的逻辑阶段分别执行连接验证。
- 展示各逻辑阶段的配置状态、权限状态和验证结果。
- 展示 API Key 存储与隐私提示。

### 4.6 供应商调用策略

供应商调用由插件内的 `provider client` 统一处理，MVP 采用 OpenAI-compatible 接口思路：

- 用户可使用预置供应商，也可为不同逻辑阶段手动填写不同的兼容地址。
- 文本翻译逻辑始终对应一套 `textTranslate` 配置。
- 截图翻译逻辑不是简单的“固定视觉供应商”，而是一条可配置 pipeline：
  - `direct_multimodal`：由一个支持视觉输入的模型直接完成截图理解与翻译。
  - `extract_then_translate`：先由视觉模型提取截图文字，再由文本模型完成翻译。
- 在 `direct_multimodal` 模式下，可选择：
  - `reuse_text_translate`：复用文本翻译配置；
  - `custom_direct_profile`：单独配置截图直译模型。
- 在 `extract_then_translate` 模式下：
  - `extract` 阶段必须配置独立视觉 profile；
  - `translate` 阶段可选择 `reuse_text_translate` 或 `custom_translate_profile`。
- 允许一个多模态模型承担全部工作，也允许针对截图提取与截图翻译分别选择更优模型。
- 不做任何隐式共享；所有复用都必须由用户显式选择。
- 连接验证必须按实际启用的逻辑阶段分别执行并分别展示结果。

### 4.7 截图翻译流程归属

截图翻译采用“内容脚本采集区域 + 背景页捕获与裁剪 + 供应商视觉翻译”的职责拆分：

- `content script`：负责框选区域交互。
- `background`：负责调用浏览器截图能力并执行本地裁剪。
- `services/capture`：负责把可见页面截图转换为裁剪后的图片数据。
- `services/llm`：负责把裁剪图发送给视觉模型并返回结构化结果。

### 4.8 前端组织方式

前端采用 `feature-first + service 分层` 设计：

- `features/` 按业务能力组织。
- `services/` 按技术职责组织。
- `components/` 存放可复用展示组件。
- `contracts/`、`schemas/`、`constants/`、`errors/` 存放扩展内部统一契约。

## 5. 内部模块设计

### 5.1 核心模块

MVP 主要模块：

- `selection-translate`
- `screenshot-translate`
- `paste-translate`
- `settings`
- `llm`
- `capture`
- `storage`
- `permissions`

### 5.2 Provider Client

`provider client` 负责：

- 读取 `textTranslate` 与 `screenshotTranslate` pipeline 配置。
- 按当前 pipeline 选择对应 profile 发起请求。
- 发送文本翻译请求。
- 在截图直译模式下发送截图直译请求。
- 在截图两阶段模式下先执行截图文字提取，再执行截图翻译。
- 分别执行文本翻译验证、截图直译验证、截图提取验证、截图翻译验证。
- 处理供应商层面的基础响应错误。

`provider client` 不负责：

- UI 状态控制。
- DOM 操作。
- 配置页面表单管理。

### 5.3 Storage Service

配置使用扩展本地存储持久化，建议统一走 `chrome.storage.local`：

- `textTranslate` 配置单独保存。
- `screenshotTranslate` pipeline 配置单独保存。
- 不使用 `storage.sync` 保存 API Key，避免意外同步到浏览器账户。
- API Key 只允许在 `background` 中读取。
- UI 展示时默认掩码显示，只有用户主动 reveal 才可见。

### 5.4 Permissions Service

由于插件需要直连用户配置的供应商域名，必须明确处理主机权限：

- 权限按“实际启用的逻辑阶段”处理，而不是按页面统一处理。
- 若截图直译复用文本翻译配置，则无需额外请求截图直译域名权限。
- 若截图直译使用自定义 profile，则需单独请求其 origin 权限。
- 若截图采用两阶段模式，则提取阶段与翻译阶段分别依据各自 profile 请求权限。
- 若某一阶段权限被拒绝，只阻止对应能力，不应阻断其他能力。

### 5.5 视觉翻译策略

截图翻译不引入独立 OCR 服务，而是直接调用视觉 LLM，并通过 prompt 明确要求模型返回两个部分：

- 识别出的原始文本。
- 对应的目标语言翻译结果。

这样做的目的有两点：

- 保持前端展示结构与文本翻译一致，仍然可以展示“原文 + 译文”。
- 避免引入额外基础设施，保持单插件可用性。

## 6. 内部契约设计

### 6.1 契约目标

由于不再有单独后端和共享包，所有跨模块契约统一放在扩展内部：

- `contracts/`：请求与响应类型。
- `schemas/`：运行时校验。
- `errors/`：错误码与错误映射。
- `constants/`：默认语言、消息类型、pipeline 模式常量。

### 6.2 契约项清单

#### 配置契约

- `ProviderProfile`
- `TextTranslateConfig`
- `ScreenshotTranslateMode`
- `ScreenshotTranslateConfig`
- `ProviderPreset`
- `ModelCapability`

#### 翻译契约

- `TranslateTextRequest`
- `TranslateImageRequest`
- `TranslateResult`
- `ProviderValidationResult`

#### 消息契约

- `TRANSLATE_SELECTION`
- `TRANSLATE_PASTE`
- `START_SCREENSHOT_TRANSLATE`
- `SUBMIT_SCREENSHOT_REGION`
- `VALIDATE_TEXT_TRANSLATE`
- `VALIDATE_SCREENSHOT_DIRECT`
- `VALIDATE_SCREENSHOT_EXTRACT`
- `VALIDATE_SCREENSHOT_TRANSLATE`
- `GET_PROVIDER_CONFIG_STATUS`

## 7. 关键数据流
## 7. 关键数据流

### 7.1 选区翻译链路

```text
用户选中文本
  -> content script 监听到有效选区
  -> 页面出现“翻译”触发按钮
  -> 用户点击按钮
  -> content script 发送消息给 background
  -> background 读取本地供应商配置
  -> background 通过 provider client 请求文本模型
  -> background 返回标准化翻译结果
  -> content script 在选区附近展示浮层
```

### 7.2 截图翻译链路

```text
用户在 popup 中点击“开始截图翻译”
  -> background 通知当前页面进入截图模式
  -> content script 挂载全屏遮罩并等待用户拖拽框选
  -> 用户完成框选
  -> content script 把矩形坐标发送给 background
  -> background 调用浏览器截图能力捕获当前可见页面
  -> background 在本地裁剪出选中区域
  -> background 读取本地供应商配置
  -> background 通过 provider client 请求视觉模型
  -> background 返回识别原文与译文
  -> content script 在框选区域附近展示结果浮层
```

### 7.3 粘贴翻译链路

```text
用户打开 popup
  -> 粘贴文本
  -> 点击翻译
  -> popup 发送消息给 background
  -> background 读取本地供应商配置
  -> background 请求文本模型
  -> background 返回标准化结果
  -> popup 展示原文与译文对照
```

### 7.4 配置与验证链路

```text
用户打开 options
  -> 填写 `textTranslate` 配置与 `screenshotTranslate` pipeline 配置，以及 `defaultTargetLang`
  -> options 对所有实际启用的阶段分别请求对应域名权限
  -> 保存到 chrome.storage.local
  -> 用户可分别点击“验证文本翻译”“验证截图直译”“验证截图提取”“验证截图翻译”中的可用项
  -> background 使用对应 profile 发起轻量验证请求
  -> 返回分项验证成功或失败结果
```

### 7.5 错误流转原则

- UI 层只消费标准错误码和用户友好文案。
- `background` 负责把供应商错误映射成扩展内部错误。
- 未知异常统一收敛为内部友好兜底，不直接透出底层 message。
- 不直接把 API Key、供应商原始异常或原始响应透传到 UI。

## 8. 配置与安全

### 8.1 浏览器侧配置

插件侧持久化以下信息：

- `textTranslate.profile`
- `screenshotTranslate.mode`
- `screenshotTranslate.direct.source`
- `screenshotTranslate.direct.profile`
- `screenshotTranslate.extract.profile`
- `screenshotTranslate.translate.source`
- `screenshotTranslate.translate.profile`
- `defaultTargetLang`

### 8.2 存储策略

- 所有配置统一保存在 `chrome.storage.local`。
- 文本翻译与截图 pipeline 各阶段的验证结果不作为长期配置字段持久化，避免状态过时。
- API Key 默认不显示明文。
- 不使用 `chrome.storage.sync` 同步 API Key。
- 不在日志中打印完整 API Key、整段原文或完整截图内容。

### 8.3 安全要求

- 只有 `background` 允许读取 API Key。
- `content script` 与页面环境之间不得共享敏感配置。
- 不允许将整页截图上传到供应商。
- 不允许在无用户动作时静默截图或静默联网。
- 保存自定义 profile 时，必须对该 profile 对应的 origin 单独请求权限。

### 8.4 用户体验要求

- 首次使用未配置文本翻译配置时，文本翻译入口必须明确提示“先完成文本翻译配置”。
- 首次使用未完成截图 pipeline 配置时，截图翻译入口必须明确提示“先完成截图翻译配置”。
- 配置页必须说明：API Key 存储在当前浏览器扩展本地环境，仅供当前浏览器配置使用。
- 提供“一键清除配置”入口。

## 9. 目录设计

### 9.1 根目录

`wxt.config.ts` 设置 `srcDir: 'src'`，`entrypoints/` 位于 `src/` 内部，WXT 的 `@` 路径别名映射到 `src/`。

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
│  ├─ entrypoints/
│  │  ├─ background.ts
│  │  ├─ content.tsx
│  │  ├─ popup/
│  │  └─ options/
│  ├─ features/
│  │  ├─ selection-translate/
│  │  ├─ screenshot-translate/
│  │  ├─ paste-translate/
│  │  └─ settings/
│  ├─ components/
│  ├─ services/
│  │  ├─ llm/
│  │  ├─ messaging/
│  │  ├─ storage/
│  │  ├─ dom/
│  │  ├─ capture/
│  │  └─ permissions/
│  ├─ contracts/
│  ├─ schemas/
│  ├─ constants/
│  ├─ errors/
│  ├─ hooks/
│  └─ styles/
├─ package.json
├─ tsconfig.json
├─ wxt.config.ts
└─ .gitignore
```

### 9.2 目录职责

- `src/entrypoints/`：扩展真实入口，只做挂载和入口级桥接。
- `src/features/`：按功能组织业务。
- `src/services/llm/`：供应商抽象和模型调用。
- `src/services/storage/`：本地配置读写。
- `src/services/permissions/`：host 权限请求与状态判断。
- `src/contracts/`、`src/schemas/`、`src/errors/`：扩展内部统一契约。

## 10. 架构决策

### 10.1 单应用优先

由于用户明确要求插件直接可用，因此仓库以单扩展应用为主，不再默认设计为前后端双工程。

### 10.2 Background 作为敏感边界

即使取消后端，也不能让 UI 页面直接处理 API Key 和供应商调用。`background` 必须继续承担统一请求和配置访问边界。

### 10.3 本地持久化优先

配置保存在扩展本地存储中，而不是远端服务或浏览器同步存储中，以降低泄露面和用户理解成本。

### 10.4 权限显式请求

对所有自定义 profile 地址均采用按 origin 请求权限的方式，避免在 manifest 中放过宽的 host 权限。

### 10.5 视觉 LLM 替代 OCR

截图翻译不引入独立 OCR 服务，而是要求视觉 LLM 直接完成区域内容理解与翻译。

## 11. 依赖规则

### 11.1 插件内部依赖方向

- `entrypoints` 可以依赖 `features`、`services`、`components`。
- `features` 可以依赖 `services`、`components`、`hooks`、`lib`、`contracts`、`schemas`、`errors`、`constants`。
- `components` 可以依赖 `hooks`、`lib`、`constants`，但不能直接依赖 `services/llm`。
- `services` 可以依赖 `contracts`、`schemas`、`errors`、`constants`、`lib`。
- `content script` 相关 DOM 逻辑不得依赖敏感配置读取。

## 12. 内部接口边界

### 12.1 配置结构

```json
{
  "textTranslate": {
    "profile": {
      "providerPreset": "custom-openai-compatible",
      "baseUrl": "https://api.openai.com/v1",
      "apiKey": "sk-text-***",
      "model": "gpt-4.1-mini"
    }
  },
  "screenshotTranslate": {
    "mode": "extract_then_translate",
    "direct": {
      "source": "reuse_text_translate"
    },
    "extract": {
      "profile": {
        "providerPreset": "custom-openai-compatible",
        "baseUrl": "https://openrouter.ai/api/v1",
        "apiKey": "sk-extract-***",
        "model": "google/gemini-2.5-flash"
      }
    },
    "translate": {
      "source": "custom_translate_profile",
      "profile": {
        "providerPreset": "custom-openai-compatible",
        "baseUrl": "https://api.deepseek.com/v1",
        "apiKey": "sk-translate-***",
        "model": "deepseek-chat"
      }
    }
  },
  "defaultTargetLang": "zh-CN"
}
```

### 12.2 文本翻译请求结构

```json
{
  "text": "需要翻译的文本",
  "source": "selection",
  "targetLang": "zh-CN",
  "style": "bilingual",
  "pageContext": {
    "title": "页面标题",
    "url": "https://example.com"
  }
}
```

### 12.3 截图翻译请求结构

```json
{
  "imageBase64": "base64-encoded-image",
  "mimeType": "image/png",
  "source": "screenshot",
  "targetLang": "zh-CN",
  "style": "bilingual",
  "pageContext": {
    "title": "页面标题",
    "url": "https://example.com"
  },
  "region": {
    "x": 120,
    "y": 240,
    "width": 420,
    "height": 180,
    "viewportWidth": 1440,
    "viewportHeight": 900,
    "devicePixelRatio": 2
  }
}
```

### 12.4 翻译响应结构

```json
{
  "originalText": "Hello world",
  "translatedText": "你好，世界",
  "detectedSourceLang": "en",
  "targetLang": "zh-CN",
  "model": "gpt-4.1-mini",
  "provider": "custom-openai-compatible",
  "requestId": "local_req_xxx"
}
```

### 12.5 连接验证结果结构

```json
{
  "textTranslate": {
    "ok": true,
    "provider": "custom-openai-compatible",
    "baseUrl": "https://api.openai.com/v1",
    "model": "gpt-4.1-mini",
    "permissionGranted": true
  },
  "screenshotTranslate": {
    "mode": "extract_then_translate",
    "extract": {
      "ok": true,
      "provider": "custom-openai-compatible",
      "baseUrl": "https://openrouter.ai/api/v1",
      "model": "google/gemini-2.5-flash",
      "permissionGranted": true
    },
    "translate": {
      "ok": true,
      "provider": "custom-openai-compatible",
      "baseUrl": "https://api.deepseek.com/v1",
      "model": "deepseek-chat",
      "permissionGranted": true
    }
  }
}
```

## 13. 错误设计

### 13.1 标准错误码

建议统一以下错误码：

- `TEXT_TRANSLATE_CONFIG_MISSING`
- `SCREENSHOT_DIRECT_CONFIG_MISSING`
- `SCREENSHOT_EXTRACT_CONFIG_MISSING`
- `SCREENSHOT_TRANSLATE_CONFIG_MISSING`
- `TEXT_TRANSLATE_PERMISSION_DENIED`
- `SCREENSHOT_DIRECT_PERMISSION_DENIED`
- `SCREENSHOT_EXTRACT_PERMISSION_DENIED`
- `SCREENSHOT_TRANSLATE_PERMISSION_DENIED`
- `TEXT_API_KEY_MISSING`
- `SCREENSHOT_DIRECT_API_KEY_MISSING`
- `SCREENSHOT_EXTRACT_API_KEY_MISSING`
- `SCREENSHOT_TRANSLATE_API_KEY_MISSING`
- `TEXT_MODEL_MISSING`
- `VISION_MODEL_MISSING`
- `INVALID_INPUT`
- `TEXT_TOO_LONG`
- `IMAGE_TOO_LARGE`
- `SCREENSHOT_CAPTURE_FAILED`
- `SCREENSHOT_REGION_INVALID`
- `VISION_MODEL_UNSUPPORTED`
- `UPSTREAM_TIMEOUT`
- `UPSTREAM_BAD_RESPONSE`
- `NETWORK_ERROR`
- `INTERNAL_ERROR`

### 13.2 错误处理原则

- UI 展示用户可理解文案，不展示原始堆栈。
- 若未配置文本翻译或截图 pipeline 的对应阶段，优先引导用户去设置页完成对应配置。
- 若权限未授予，优先引导用户授权对应逻辑阶段使用的供应商域名。
- 供应商返回 401/403 时提示用户检查对应阶段的 API Key、模型或账号权限。

## 14. 设计验收标准

以下条件满足时，说明本文档已经达到“可直接开工”的要求：

- 另一位工程师能按本文档直接创建扩展工程目录，无需额外决定模块归属。
- 能明确判断某段逻辑应该归属 `content script`、`background`、`popup`、`options`、`services` 或内部契约层。
- 能明确知道 API Key 只存在扩展本地存储，并且仅由 `background` 读取。
- 能明确知道截图链路在扩展侧本地裁剪后直连视觉模型。
- 能明确知道文本翻译配置与截图 pipeline 配置是逻辑聚合的，并且截图 pipeline 可选择复用或拆分不同模型。

## 15. 后续扩展位

以下能力被视为后续迭代方向，不进入 MVP 实现：

- 历史记录与最近翻译。
- 术语库与自定义翻译风格。
- 多账户与多配置切换。
- 深色模式与更丰富主题。
- 流式输出。
- 可选的“后端代理模式”作为高级配置。

## 16. 关联设计文档

- `docs/architecture.md`：系统架构、目录设计、依赖方向、内部接口边界。
- `docs/ui-design.md`：文本选区浮层、截图模式、popup、options 的 UI 结构、交互状态与组件拆分建议。
- `docs/development-setup.md`：单应用工程初始化、配置存储、权限处理、本地开发流程建议。

## 17. Assumptions

- MVP 业务代码已完成实现，涵盖三项核心功能。
- 插件运行在 Edge 浏览器扩展环境中。
- 用户愿意在浏览器扩展中本地保存 API Key。
- 默认采用 OpenAI-compatible 供应商接口设计。
