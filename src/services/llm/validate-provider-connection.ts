import type { ProviderProfile, ProviderValidationResult } from '@/contracts';
import { ERROR_MESSAGES, ErrorCode, normalizeError } from '@/errors';
import { hasProfilePermission } from '@/services/permissions';
import type { ChatMessage } from './fetch-chat-completion';
import { fetchChatCompletion } from './fetch-chat-completion';
import { assertProviderProfileReady } from './assert-provider-profile';
import type { PipelineStage } from './resolve-profile-for-stage';

interface ValidateProviderConnectionOptions {
  stage: PipelineStage;
  permissionErrorCode: ErrorCode;
  messages: ChatMessage[];
}

function buildResult(
  profile: ProviderProfile,
  permissionGranted: boolean,
  ok: boolean,
  error?: string,
): ProviderValidationResult {
  return {
    ok,
    provider: profile.providerPreset,
    baseUrl: profile.baseUrl,
    model: profile.model,
    permissionGranted,
    error,
  };
}

export async function validateProviderConnection(
  profile: ProviderProfile,
  options: ValidateProviderConnectionOptions,
): Promise<ProviderValidationResult> {
  try {
    assertProviderProfileReady(profile, options.stage);

    const permissionGranted = await hasProfilePermission(profile);
    if (!permissionGranted) {
      return buildResult(
        profile,
        false,
        false,
        ERROR_MESSAGES[options.permissionErrorCode],
      );
    }

    await fetchChatCompletion(profile, options.messages);
    return buildResult(profile, true, true);
  } catch (error) {
    const appError = normalizeError(error);
    return buildResult(profile, true, false, appError.userMessage);
  }
}
