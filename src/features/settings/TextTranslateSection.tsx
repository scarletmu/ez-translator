import { useEffect, useState } from 'react';
import type { ProviderProfile, ProviderValidationResult } from '@/contracts';
import { MessageType } from '@/contracts';
import { PROVIDER_PRESETS } from '@/constants/provider-presets';
import { sendMessage } from '@/services/messaging';
import { hasProfilePermission, requestProfilePermission } from '@/services/permissions';
import ProviderConfigSection from '@/components/ProviderConfigSection';

const DEFAULT_PROFILE: ProviderProfile = {
  providerPreset: 'custom-openai-compatible',
  baseUrl: PROVIDER_PRESETS['custom-openai-compatible'].defaultBaseUrl,
  apiKey: '',
  model: '',
};

interface TextTranslateSectionProps {
  initialProfile: ProviderProfile | null;
  onChange: (profile: ProviderProfile) => void;
}

export default function TextTranslateSection({ initialProfile, onChange }: TextTranslateSectionProps) {
  const [profile, setProfile] = useState<ProviderProfile>(initialProfile || DEFAULT_PROFILE);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    if (initialProfile) {
      setProfile(initialProfile);
    }
  }, [initialProfile]);

  useEffect(() => {
    if (!profile.baseUrl) {
      setPermissionGranted(false);
      return;
    }

    hasProfilePermission(profile)
      .then(setPermissionGranted)
      .catch(() => setPermissionGranted(false));
  }, [profile]);

  const handleChange = (updated: ProviderProfile) => {
    setProfile(updated);
    onChange(updated);
  };

  const handleRequestPermission = async () => {
    const granted = await requestProfilePermission(profile).catch(() => false);
    setPermissionGranted(granted);
  };

  const handleValidate = async (): Promise<ProviderValidationResult> => {
    const response = await sendMessage<unknown, ProviderValidationResult>(MessageType.VALIDATE_TEXT_TRANSLATE, {});

    if (response.success && response.data) {
      return response.data;
    }

    return {
      ok: false,
      provider: profile.providerPreset,
      baseUrl: profile.baseUrl,
      model: profile.model,
      permissionGranted,
      error: response.error?.userMessage || '验证失败，请稍后重试',
    };
  };

  return (
    <div className="settings-section">
      <h2>文本翻译配置</h2>
      <ProviderConfigSection
        label="文本翻译模型"
        profile={profile}
        onChange={handleChange}
        permissionGranted={permissionGranted}
        onRequestPermission={handleRequestPermission}
        onValidate={handleValidate}
      />
    </div>
  );
}
