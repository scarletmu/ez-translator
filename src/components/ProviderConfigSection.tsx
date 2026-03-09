import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ProviderProfile, ProviderValidationResult } from '@/contracts';
import type { ProviderPreset } from '@/constants/provider-presets';
import { PROVIDER_PRESETS } from '@/constants/provider-presets';
import ProviderPresetSelect from './ProviderPresetSelect';
import MaskedApiKeyInput from './MaskedApiKeyInput';
import StatusMessage from './StatusMessage';

type ValidationState = 'idle' | 'pending' | 'success' | 'error';

interface ProviderConfigSectionProps {
  label: string;
  profile: ProviderProfile;
  onChange: (profile: ProviderProfile) => void;
  permissionGranted: boolean;
  onRequestPermission: () => void;
  onValidate: () => Promise<ProviderValidationResult>;
}

export default function ProviderConfigSection({
  label,
  profile,
  onChange,
  permissionGranted,
  onRequestPermission,
  onValidate,
}: ProviderConfigSectionProps) {
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ProviderValidationResult | null>(null);
  const [validationState, setValidationState] = useState<ValidationState>('idle');

  useEffect(() => {
    setValidationResult(null);
    setValidationState('idle');
  }, [permissionGranted]);

  const updateField = useCallback(
    <K extends keyof ProviderProfile>(key: K, value: ProviderProfile[K]) => {
      onChange({ ...profile, [key]: value });
      setValidationResult(null);
      setValidationState('idle');
    },
    [profile, onChange],
  );

  const handlePresetChange = useCallback(
    (preset: ProviderPreset) => {
      const defaultUrl = PROVIDER_PRESETS[preset].defaultBaseUrl;
      onChange({
        ...profile,
        providerPreset: preset,
        baseUrl: defaultUrl || profile.baseUrl,
      });
      setValidationResult(null);
      setValidationState('idle');
    },
    [profile, onChange],
  );

  const handleValidate = useCallback(async () => {
    setValidating(true);
    setValidationState('pending');

    try {
      const result = await onValidate();
      setValidationResult(result);
      setValidationState(result.ok ? 'success' : 'error');
    } catch {
      setValidationResult({
        ok: false,
        provider: profile.providerPreset,
        baseUrl: profile.baseUrl,
        model: profile.model,
        permissionGranted,
        error: '验证失败，请稍后重试',
      });
      setValidationState('error');
    } finally {
      setValidating(false);
    }
  }, [onValidate, permissionGranted, profile]);

  const canValidate = useMemo(() => {
    return !!profile.baseUrl.trim() && !!profile.apiKey.trim() && !!profile.model.trim() && !validating && permissionGranted;
  }, [permissionGranted, profile.apiKey, profile.baseUrl, profile.model, validating]);

  const validationStatusMessage = useMemo(() => {
    if (validationState === 'pending') {
      return <StatusMessage type="info" message="验证中，请稍候..." />;
    }

    if (validationState === 'success' && validationResult) {
      return <StatusMessage type="success" message="验证通过，可正常连接当前模型" />;
    }

    if (validationState === 'error' && validationResult) {
      return <StatusMessage type="error" message={validationResult.error || '验证失败'} />;
    }

    return <StatusMessage type="info" message="尚未验证" />;
  }, [validationResult, validationState]);

  return (
    <div className="sub-section">
      <h3>{label}</h3>

      <div className="form-group">
        <label>供应商类型</label>
        <ProviderPresetSelect value={profile.providerPreset} onChange={handlePresetChange} />
      </div>

      <div className="form-group">
        <label>服务地址</label>
        <input
          type="url"
          value={profile.baseUrl}
          onChange={(event) => updateField('baseUrl', event.target.value)}
          placeholder="https://api.openai.com/v1"
        />
      </div>

      <div className="form-group">
        <label>API Key</label>
        <MaskedApiKeyInput value={profile.apiKey} onChange={(value) => updateField('apiKey', value)} />
        <p className="privacy-note" style={{ marginTop: 'var(--space-sm)' }}>
          API Key 仅保存在当前浏览器扩展本地环境中，由后台统一读取，不会同步到浏览器账户。
        </p>
      </div>

      <div className="form-group">
        <label>模型</label>
        <input
          type="text"
          value={profile.model}
          onChange={(event) => updateField('model', event.target.value)}
          placeholder="gpt-4.1-mini"
        />
      </div>

      <div className="status-stack">
        <div className="status-row">
          <span className="status-row-label">权限状态</span>
          <div className="status-row-content">
            {permissionGranted ? (
              <StatusMessage type="success" message="已授权，可访问当前服务地址" />
            ) : (
              <StatusMessage
                type="warning"
                message="未授权，请先授予当前服务地址访问权限"
                action={(
                  <button type="button" className="btn btn-outline btn-sm" onClick={onRequestPermission}>
                    请求权限
                  </button>
                )}
              />
            )}
          </div>
        </div>

        <div className="status-row">
          <span className="status-row-label">验证状态</span>
          <div className="status-row-content">
            {validationStatusMessage}
          </div>
        </div>
      </div>

      <div className="inline-row" style={{ marginTop: 'var(--space-md)' }}>
        <button type="button" className="btn btn-outline btn-sm" onClick={handleValidate} disabled={!canValidate}>
          {validating ? '验证中...' : '验证连接'}
        </button>
        {!permissionGranted ? (
          <span className="helper-text">请先授权后再验证</span>
        ) : null}
      </div>
    </div>
  );
}
