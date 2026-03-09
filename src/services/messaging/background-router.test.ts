import { describe, expect, it, vi } from 'vitest';
import { MessageType } from '@/contracts';
import type { MessageEnvelope, ProviderValidationResult, ScreenshotRegion, TranslateResult } from '@/contracts';
import { ErrorCode } from '@/errors';
import type { BackgroundRouterDependencies } from '@/services/messaging/background-router';
import { dispatchBackgroundMessage } from '@/services/messaging/background-router';
import { createDirectScreenshotConfig, createProviderProfile, createTextConfig, createTranslateResult } from '@/test/factories';

function createDependencies(overrides: Partial<BackgroundRouterDependencies> = {}): BackgroundRouterDependencies {
  return {
    captureVisibleTab: vi.fn(async () => 'data:image/png;base64,Zm9v'),
    cropImage: vi.fn(async () => ({ base64: 'Zm9v', mimeType: 'image/png' })),
    executeScreenshotPipeline: vi.fn(async () => createTranslateResult()),
    getConfigStatus: vi.fn(async () => ({ textTranslateReady: true, screenshotTranslateReady: true, screenshotMode: 'direct_multimodal' as const })),
    getDefaultTargetLang: vi.fn(async () => 'zh-CN'),
    getScreenshotTranslateConfig: vi.fn(async () => createDirectScreenshotConfig()),
    getTextTranslateConfig: vi.fn(async () => createTextConfig()),
    resolveProfileForStage: vi.fn(() => createProviderProfile()),
    sendTabMessage: vi.fn(async () => undefined),
    translateText: vi.fn(async () => createTranslateResult()),
    validatePermissionBeforeRequest: vi.fn(async () => undefined),
    validateScreenshotDirect: vi.fn(async (): Promise<ProviderValidationResult> => ({
      ok: true,
      provider: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4.1',
      permissionGranted: true,
    })),
    validateScreenshotExtract: vi.fn(async () => ({
      ok: true,
      provider: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4.1',
      permissionGranted: true,
    })),
    validateScreenshotTranslate: vi.fn(async () => ({
      ok: true,
      provider: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4.1-mini',
      permissionGranted: true,
    })),
    validateTextTranslate: vi.fn(async () => ({
      ok: true,
      provider: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4.1-mini',
      permissionGranted: true,
    })),
    ...overrides,
  };
}

const sender: chrome.runtime.MessageSender = { tab: { id: 12 } as chrome.tabs.Tab };
const region: ScreenshotRegion = {
  x: 0,
  y: 0,
  width: 100,
  height: 80,
  viewportWidth: 1200,
  viewportHeight: 900,
  devicePixelRatio: 1,
};

describe('dispatchBackgroundMessage', () => {
  it('returns translate text success response', async () => {
    const dependencies = createDependencies();
    const message: MessageEnvelope<{ text: string }> = {
      type: MessageType.TRANSLATE_SELECTION,
      payload: { text: 'hello' },
    };

    const response = await dispatchBackgroundMessage(message, sender, dependencies);

    expect(response).toEqual({ success: true, data: createTranslateResult() });
    expect(dependencies.translateText).toHaveBeenCalled();
  });

  it('maps text validation failure to standardized error', async () => {
    const dependencies = createDependencies();
    const message: MessageEnvelope<{ text: string }> = {
      type: MessageType.TRANSLATE_PASTE,
      payload: { text: ' '.repeat(4) },
    };

    const response = await dispatchBackgroundMessage(message, sender, dependencies);

    expect(response).toEqual({
      success: false,
      error: {
        code: ErrorCode.INVALID_INPUT,
        userMessage: '输入内容无效',
      },
    });
  });

  it('returns screenshot submit success response', async () => {
    const dependencies = createDependencies();
    const message: MessageEnvelope<{ region: ScreenshotRegion }> = {
      type: MessageType.SUBMIT_SCREENSHOT_REGION,
      payload: { region },
    };

    const response = await dispatchBackgroundMessage(message, sender, dependencies);

    expect(response.success).toBe(true);
    expect(dependencies.captureVisibleTab).toHaveBeenCalled();
    expect(dependencies.executeScreenshotPipeline).toHaveBeenCalled();
  });

  it('maps invalid screenshot region to standardized error', async () => {
    const dependencies = createDependencies();
    const message: MessageEnvelope<{ region: ScreenshotRegion }> = {
      type: MessageType.SUBMIT_SCREENSHOT_REGION,
      payload: { region: { ...region, width: 10 } },
    };

    const response = await dispatchBackgroundMessage(message, sender, dependencies);

    expect(response).toEqual({
      success: false,
      error: {
        code: ErrorCode.SCREENSHOT_REGION_INVALID,
        userMessage: '选择区域过小，请重新框选',
      },
    });
  });

  it('returns validation success response', async () => {
    const dependencies = createDependencies();
    const message: MessageEnvelope = {
      type: MessageType.VALIDATE_TEXT_TRANSLATE,
      payload: {},
    };

    const response = await dispatchBackgroundMessage(message, sender, dependencies);

    expect(response.success).toBe(true);
    expect(response.data).toEqual(expect.objectContaining({ ok: true }));
  });

  it('maps validation failure without leaking raw errors', async () => {
    const dependencies = createDependencies({
      validateTextTranslate: vi.fn(async () => {
        throw new Error('vendor stack trace');
      }),
    });
    const message: MessageEnvelope = {
      type: MessageType.VALIDATE_TEXT_TRANSLATE,
      payload: {},
    };

    const response = await dispatchBackgroundMessage(message, sender, dependencies);

    expect(response).toEqual({
      success: false,
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        userMessage: '服务暂时不可用，请稍后重试',
      },
    });
  });

  it('maps unknown message types to invalid input', async () => {
    const dependencies = createDependencies();
    const message = {
      type: 'UNKNOWN_MESSAGE',
      payload: {},
    } as unknown as MessageEnvelope;

    const response = await dispatchBackgroundMessage(message, sender, dependencies);

    expect(response).toEqual({
      success: false,
      error: {
        code: ErrorCode.INVALID_INPUT,
        userMessage: '输入内容无效',
      },
    });
  });
});
