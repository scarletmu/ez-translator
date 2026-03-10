import { MessageType } from '@/contracts';
import { MAX_TEXT_LENGTH } from '@/constants/limits';
import type {
  ConfigStatus,
  MessageEnvelope,
  MessageResponse,
  ProviderProfile,
  ProviderValidationResult,
  ScreenshotRegion,
  TranslateResult,
  TranslateTextRequest,
} from '@/contracts';
import { AppError, ErrorCode, normalizeError } from '@/errors';
import { screenshotRegionSchema } from '@/schemas';
import { captureVisibleTab, cropImage } from '@/services/capture';
import {
  assertProviderProfileReady,
  executeScreenshotPipeline,
  resolveProfileForStage,
  translateText,
  validateScreenshotDirect,
  validateScreenshotExtract,
  validateScreenshotTranslate,
  validateTextTranslate,
} from '@/services/llm';
import { validatePermissionBeforeRequest } from '@/services/permissions';
import {
  getConfigStatus,
  getDefaultTargetLang,
  getScreenshotTranslateConfig,
  getTextTranslateConfig,
} from '@/services/storage';
import { sendTabMessage } from './send-tab-message';

export interface BackgroundRouterDependencies {
  captureVisibleTab: typeof captureVisibleTab;
  cropImage: typeof cropImage;
  executeScreenshotPipeline: typeof executeScreenshotPipeline;
  getConfigStatus: typeof getConfigStatus;
  getDefaultTargetLang: typeof getDefaultTargetLang;
  getScreenshotTranslateConfig: typeof getScreenshotTranslateConfig;
  getTextTranslateConfig: typeof getTextTranslateConfig;
  resolveProfileForStage: typeof resolveProfileForStage;
  sendTabMessage: typeof sendTabMessage;
  translateText: typeof translateText;
  validatePermissionBeforeRequest: typeof validatePermissionBeforeRequest;
  validateScreenshotDirect: typeof validateScreenshotDirect;
  validateScreenshotExtract: typeof validateScreenshotExtract;
  validateScreenshotTranslate: typeof validateScreenshotTranslate;
  validateTextTranslate: typeof validateTextTranslate;
}

const defaultDependencies: BackgroundRouterDependencies = {
  captureVisibleTab,
  cropImage,
  executeScreenshotPipeline,
  getConfigStatus,
  getDefaultTargetLang,
  getScreenshotTranslateConfig,
  getTextTranslateConfig,
  resolveProfileForStage,
  sendTabMessage,
  translateText,
  validatePermissionBeforeRequest,
  validateScreenshotDirect,
  validateScreenshotExtract,
  validateScreenshotTranslate,
  validateTextTranslate,
};

function wrapResponse<T>(data: T): MessageResponse<T> {
  return { success: true, data };
}

export function wrapError(error: unknown): MessageResponse<never> {
  const appError = normalizeError(error);
  return {
    success: false,
    error: {
      code: appError.code,
      userMessage: appError.userMessage,
    },
  };
}

function ensureValidScreenshotRegion(region: ScreenshotRegion): void {
  const validation = screenshotRegionSchema.safeParse(region);
  if (!validation.success) {
    throw new AppError(ErrorCode.SCREENSHOT_REGION_INVALID);
  }
}

function ensureValidTextPayload(text: string): void {
  const normalizedText = text.trim();

  if (!normalizedText) {
    throw new AppError(ErrorCode.INVALID_INPUT);
  }

  if (normalizedText.length > MAX_TEXT_LENGTH) {
    throw new AppError(ErrorCode.TEXT_TOO_LONG);
  }
}

async function resolveTargetTab(sender: chrome.runtime.MessageSender): Promise<chrome.tabs.Tab & { id: number }> {
  if (sender.tab?.id != null) {
    return sender.tab as chrome.tabs.Tab & { id: number };
  }

  const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (activeTab?.id == null) {
    throw new AppError(ErrorCode.SCREENSHOT_CAPTURE_FAILED);
  }

  return activeTab as chrome.tabs.Tab & { id: number };
}

async function handleTranslateText(
  deps: BackgroundRouterDependencies,
  payload: { text: string; targetLang?: string; pageContext?: { title: string; url: string } },
  source: 'selection' | 'paste',
): Promise<MessageResponse<TranslateResult>> {
  ensureValidTextPayload(payload.text);

  const textConfig = await deps.getTextTranslateConfig();
  if (!textConfig) {
    throw new AppError(ErrorCode.TEXT_TRANSLATE_CONFIG_MISSING);
  }

  const profile = deps.resolveProfileForStage('text', textConfig, null);
  await deps.validatePermissionBeforeRequest(profile, ErrorCode.TEXT_TRANSLATE_PERMISSION_DENIED);

  const targetLang = payload.targetLang || await deps.getDefaultTargetLang();
  const request: TranslateTextRequest = {
    text: payload.text,
    source,
    targetLang,
    style: 'bilingual',
    pageContext: payload.pageContext,
  };

  const result = await deps.translateText(request, profile);
  return wrapResponse(result);
}

async function handleStartScreenshotTranslate(
  deps: BackgroundRouterDependencies,
  payload: { targetLang?: string },
  sender: chrome.runtime.MessageSender,
): Promise<MessageResponse<void>> {
  const textConfig = await deps.getTextTranslateConfig();
  const screenshotConfig = await deps.getScreenshotTranslateConfig();
  if (!screenshotConfig) {
    throw new AppError(ErrorCode.SCREENSHOT_DIRECT_CONFIG_MISSING);
  }

  if (screenshotConfig.mode === 'direct_multimodal') {
    const directProfile = deps.resolveProfileForStage('screenshot_direct', textConfig, screenshotConfig);
    assertProviderProfileReady(directProfile, 'screenshot_direct');
    await deps.validatePermissionBeforeRequest(
      directProfile,
      ErrorCode.SCREENSHOT_DIRECT_PERMISSION_DENIED,
    );
  } else {
    const extractProfile = deps.resolveProfileForStage('screenshot_extract', textConfig, screenshotConfig);
    assertProviderProfileReady(extractProfile, 'screenshot_extract');
    await deps.validatePermissionBeforeRequest(
      extractProfile,
      ErrorCode.SCREENSHOT_EXTRACT_PERMISSION_DENIED,
    );

    const translateProfile = deps.resolveProfileForStage('screenshot_translate', textConfig, screenshotConfig);
    assertProviderProfileReady(translateProfile, 'screenshot_translate');
    await deps.validatePermissionBeforeRequest(
      translateProfile,
      ErrorCode.SCREENSHOT_TRANSLATE_PERMISSION_DENIED,
    );
  }

  const targetTab = await resolveTargetTab(sender);

  await deps.sendTabMessage(targetTab.id, MessageType.ENTER_SCREENSHOT_MODE, {
    targetLang: payload.targetLang,
  });
  return wrapResponse(undefined);
}

async function handleSubmitScreenshotRegion(
  deps: BackgroundRouterDependencies,
  payload: { region: ScreenshotRegion; targetLang?: string; pageContext?: { title: string; url: string } },
  sender: chrome.runtime.MessageSender,
): Promise<MessageResponse<TranslateResult>> {
  ensureValidScreenshotRegion(payload.region);

  const textConfig = await deps.getTextTranslateConfig();
  const screenshotConfig = await deps.getScreenshotTranslateConfig();
  if (!screenshotConfig) {
    throw new AppError(ErrorCode.SCREENSHOT_DIRECT_CONFIG_MISSING);
  }

  if (screenshotConfig.mode === 'direct_multimodal') {
    const directProfile = deps.resolveProfileForStage('screenshot_direct', textConfig, screenshotConfig);
    assertProviderProfileReady(directProfile, 'screenshot_direct');
    await deps.validatePermissionBeforeRequest(
      directProfile,
      ErrorCode.SCREENSHOT_DIRECT_PERMISSION_DENIED,
    );
  } else {
    const extractProfile = deps.resolveProfileForStage('screenshot_extract', textConfig, screenshotConfig);
    assertProviderProfileReady(extractProfile, 'screenshot_extract');
    await deps.validatePermissionBeforeRequest(
      extractProfile,
      ErrorCode.SCREENSHOT_EXTRACT_PERMISSION_DENIED,
    );

    const translateProfile = deps.resolveProfileForStage('screenshot_translate', textConfig, screenshotConfig);
    assertProviderProfileReady(translateProfile, 'screenshot_translate');
    await deps.validatePermissionBeforeRequest(
      translateProfile,
      ErrorCode.SCREENSHOT_TRANSLATE_PERMISSION_DENIED,
    );
  }

  const targetTab = await resolveTargetTab(sender);
  const fullDataUrl = await deps.captureVisibleTab(targetTab.windowId);
  const { base64, mimeType } = await deps.cropImage(fullDataUrl, payload.region);
  const targetLang = payload.targetLang || await deps.getDefaultTargetLang();
  const result = await deps.executeScreenshotPipeline(
    base64,
    mimeType,
    targetLang,
    textConfig,
    screenshotConfig,
  );

  return wrapResponse(result);
}

async function handleValidation(
  deps: BackgroundRouterDependencies,
  stage: 'text' | 'screenshot_direct' | 'screenshot_extract' | 'screenshot_translate',
): Promise<MessageResponse<ProviderValidationResult>> {
  const textConfig = await deps.getTextTranslateConfig();
  const screenshotConfig = await deps.getScreenshotTranslateConfig();

  let profile: ProviderProfile;
  let result: ProviderValidationResult;

  switch (stage) {
    case 'text':
      profile = deps.resolveProfileForStage('text', textConfig, screenshotConfig);
      result = await deps.validateTextTranslate(profile);
      break;
    case 'screenshot_direct':
      profile = deps.resolveProfileForStage('screenshot_direct', textConfig, screenshotConfig);
      result = await deps.validateScreenshotDirect(profile);
      break;
    case 'screenshot_extract':
      profile = deps.resolveProfileForStage('screenshot_extract', textConfig, screenshotConfig);
      result = await deps.validateScreenshotExtract(profile);
      break;
    case 'screenshot_translate':
      profile = deps.resolveProfileForStage('screenshot_translate', textConfig, screenshotConfig);
      result = await deps.validateScreenshotTranslate(profile);
      break;
  }

  return wrapResponse(result);
}

export async function dispatchBackgroundMessage(
  message: MessageEnvelope,
  sender: chrome.runtime.MessageSender,
  deps: BackgroundRouterDependencies = defaultDependencies,
): Promise<MessageResponse<unknown>> {
  console.info('[background] Received runtime message', {
    type: message.type,
    tabId: sender.tab?.id ?? null,
  });

  try {
    switch (message.type) {
      case MessageType.TRANSLATE_SELECTION:
        return await handleTranslateText(
          deps,
          message.payload as { text: string; targetLang?: string; pageContext?: { title: string; url: string } },
          'selection',
        );
      case MessageType.TRANSLATE_PASTE:
        return await handleTranslateText(
          deps,
          message.payload as { text: string; targetLang?: string },
          'paste',
        );
      case MessageType.START_SCREENSHOT_TRANSLATE:
        return await handleStartScreenshotTranslate(
          deps,
          message.payload as { targetLang?: string },
          sender,
        );
      case MessageType.SUBMIT_SCREENSHOT_REGION:
        return await handleSubmitScreenshotRegion(
          deps,
          message.payload as { region: ScreenshotRegion; targetLang?: string; pageContext?: { title: string; url: string } },
          sender,
        );
      case MessageType.VALIDATE_TEXT_TRANSLATE:
        return await handleValidation(deps, 'text');
      case MessageType.VALIDATE_SCREENSHOT_DIRECT:
        return await handleValidation(deps, 'screenshot_direct');
      case MessageType.VALIDATE_SCREENSHOT_EXTRACT:
        return await handleValidation(deps, 'screenshot_extract');
      case MessageType.VALIDATE_SCREENSHOT_TRANSLATE:
        return await handleValidation(deps, 'screenshot_translate');
      case MessageType.GET_PROVIDER_CONFIG_STATUS:
        return wrapResponse<ConfigStatus>(await deps.getConfigStatus());
      default:
        throw new AppError(ErrorCode.INVALID_INPUT);
    }
  } catch (error) {
    const appError = normalizeError(error);
    console.warn('[background] Runtime message failed', {
      type: message.type,
      code: appError.code,
      userMessage: appError.userMessage,
    });
    return wrapError(appError);
  }
}

export function registerBackgroundMessageHandler(
  deps: BackgroundRouterDependencies = defaultDependencies,
): void {
  console.info('[background] Registering runtime message handler');

  chrome.runtime.onMessage.addListener((message: MessageEnvelope, sender, sendResponse) => {
    void dispatchBackgroundMessage(message, sender, deps).then(sendResponse);
    return true;
  });
}
