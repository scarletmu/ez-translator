import { useEffect, useState } from 'react';
import type {
  ProviderProfile,
  ProviderValidationResult,
  ScreenshotTranslateConfig,
  ScreenshotTranslateMode,
} from '@/contracts';
import type { DirectSource, TranslateSource } from '@/contracts/screenshot-translate-config';
import { MessageType } from '@/contracts';
import { sendMessage } from '@/services/messaging';
import { hasProfilePermission, requestProfilePermission } from '@/services/permissions';
import ProviderConfigSection from '@/components/ProviderConfigSection';
import StatusMessage from '@/components/StatusMessage';

const DEFAULT_PROFILE: ProviderProfile = {
  providerPreset: 'custom-openai-compatible',
  baseUrl: '',
  apiKey: '',
  model: '',
};

const DEFAULT_CONFIG: ScreenshotTranslateConfig = {
  mode: 'direct_multimodal',
  direct: { source: 'reuse_text_translate' },
  extract: {},
  translate: { source: 'reuse_text_translate' },
};

interface ScreenshotTranslateSectionProps {
  initialConfig: ScreenshotTranslateConfig | null;
  onChange: (config: ScreenshotTranslateConfig) => void;
}

function buildValidationFallback(
  profile: ProviderProfile,
  permissionGranted: boolean,
  error?: string,
): ProviderValidationResult {
  return {
    ok: false,
    provider: profile.providerPreset,
    baseUrl: profile.baseUrl,
    model: profile.model,
    permissionGranted,
    error: error || '验证失败，请稍后重试',
  };
}

export default function ScreenshotTranslateSection({
  initialConfig,
  onChange,
}: ScreenshotTranslateSectionProps) {
  const [config, setConfig] = useState<ScreenshotTranslateConfig>(initialConfig || DEFAULT_CONFIG);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    }
  }, [initialConfig]);

  const update = (partial: Partial<ScreenshotTranslateConfig>) => {
    const updated = { ...config, ...partial };
    setConfig(updated);
    onChange(updated);
  };

  const checkPermission = async (profile: ProviderProfile | undefined, key: string) => {
    if (!profile?.baseUrl) {
      setPermissions((prev) => ({ ...prev, [key]: false }));
      return;
    }

    const granted = await hasProfilePermission(profile).catch(() => false);
    setPermissions((prev) => ({ ...prev, [key]: granted }));
  };

  useEffect(() => {
    void checkPermission(config.direct.profile, 'direct');
    void checkPermission(config.extract.profile, 'extract');
    void checkPermission(config.translate.profile, 'translate');
  }, [config.direct.profile, config.extract.profile, config.translate.profile]);

  const requestPermissionFor = async (profile: ProviderProfile, key: string) => {
    const granted = await requestProfilePermission(profile).catch(() => false);
    setPermissions((prev) => ({ ...prev, [key]: granted }));
  };

  return (
    <div className="settings-section">
      <h2>截图翻译配置</h2>

      <div className="form-group">
        <label>截图翻译模式</label>
        <select
          value={config.mode}
          onChange={(event) => update({ mode: event.target.value as ScreenshotTranslateMode })}
        >
          <option value="direct_multimodal">直接多模态翻译</option>
          <option value="extract_then_translate">提取后翻译</option>
        </select>
      </div>

      {config.mode === 'direct_multimodal' ? (
        <>
          <div className="form-group">
            <label>配置来源</label>
            <select
              value={config.direct.source}
              onChange={(event) =>
                update({
                  direct: {
                    ...config.direct,
                    source: event.target.value as DirectSource,
                    profile: event.target.value === 'custom_direct_profile'
                      ? config.direct.profile || DEFAULT_PROFILE
                      : undefined,
                  },
                })
              }
            >
              <option value="reuse_text_translate">复用文本翻译配置</option>
              <option value="custom_direct_profile">单独配置</option>
            </select>
          </div>

          {config.direct.source === 'reuse_text_translate' ? (
            <StatusMessage type="info" message="当前截图直译复用文本翻译配置，权限状态与验证状态请参考上方文本翻译配置。" />
          ) : null}

          {config.direct.source === 'custom_direct_profile' && config.direct.profile ? (
            <ProviderConfigSection
              label="截图直译模型"
              profile={config.direct.profile}
              onChange={(profile) => update({ direct: { ...config.direct, profile } })}
              permissionGranted={permissions.direct || false}
              onRequestPermission={() => requestPermissionFor(config.direct.profile!, 'direct')}
              onValidate={async (): Promise<ProviderValidationResult> => {
                const response = await sendMessage<unknown, ProviderValidationResult>(
                  MessageType.VALIDATE_SCREENSHOT_DIRECT,
                  {},
                );

                if (response.success && response.data) {
                  return response.data;
                }

                return buildValidationFallback(
                  config.direct.profile!,
                  permissions.direct || false,
                  response.error?.userMessage,
                );
              }}
            />
          ) : null}
        </>
      ) : null}

      {config.mode === 'extract_then_translate' ? (
        <>
          <ProviderConfigSection
            label="截图提取模型（视觉模型）"
            profile={config.extract.profile || DEFAULT_PROFILE}
            onChange={(profile) => update({ extract: { profile } })}
            permissionGranted={permissions.extract || false}
            onRequestPermission={() => config.extract.profile && requestPermissionFor(config.extract.profile, 'extract')}
            onValidate={async (): Promise<ProviderValidationResult> => {
              const response = await sendMessage<unknown, ProviderValidationResult>(
                MessageType.VALIDATE_SCREENSHOT_EXTRACT,
                {},
              );

              if (response.success && response.data) {
                return response.data;
              }

              return buildValidationFallback(
                config.extract.profile || DEFAULT_PROFILE,
                permissions.extract || false,
                response.error?.userMessage,
              );
            }}
          />

          <hr className="divider" />

          <div className="form-group">
            <label>翻译阶段配置来源</label>
            <select
              value={config.translate.source}
              onChange={(event) =>
                update({
                  translate: {
                    ...config.translate,
                    source: event.target.value as TranslateSource,
                    profile: event.target.value === 'custom_translate_profile'
                      ? config.translate.profile || DEFAULT_PROFILE
                      : undefined,
                  },
                })
              }
            >
              <option value="reuse_text_translate">复用文本翻译配置</option>
              <option value="custom_translate_profile">单独配置</option>
            </select>
          </div>

          {config.translate.source === 'reuse_text_translate' ? (
            <StatusMessage type="info" message="当前截图翻译阶段复用文本翻译配置，权限状态与验证状态请参考上方文本翻译配置。" />
          ) : null}

          {config.translate.source === 'custom_translate_profile' && config.translate.profile ? (
            <ProviderConfigSection
              label="截图翻译模型"
              profile={config.translate.profile}
              onChange={(profile) => update({ translate: { ...config.translate, profile } })}
              permissionGranted={permissions.translate || false}
              onRequestPermission={() => requestPermissionFor(config.translate.profile!, 'translate')}
              onValidate={async (): Promise<ProviderValidationResult> => {
                const response = await sendMessage<unknown, ProviderValidationResult>(
                  MessageType.VALIDATE_SCREENSHOT_TRANSLATE,
                  {},
                );

                if (response.success && response.data) {
                  return response.data;
                }

                return buildValidationFallback(
                  config.translate.profile!,
                  permissions.translate || false,
                  response.error?.userMessage,
                );
              }}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
