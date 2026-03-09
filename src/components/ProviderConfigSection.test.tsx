import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ProviderConfigSection from '@/components/ProviderConfigSection';
import type { ProviderProfile, ProviderValidationResult } from '@/contracts';
import { createProviderProfile } from '@/test/factories';

function TestHarness({ permissionGranted = false, onValidate }: { permissionGranted?: boolean; onValidate?: () => Promise<ProviderValidationResult> }) {
  const profileState = React.useState<ProviderProfile>(createProviderProfile());
  const [profile, setProfile] = profileState;

  return (
    <ProviderConfigSection
      label="文本翻译模型"
      profile={profile}
      onChange={setProfile}
      permissionGranted={permissionGranted}
      onRequestPermission={vi.fn()}
      onValidate={onValidate || (async () => ({
        ok: true,
        provider: profile.providerPreset,
        baseUrl: profile.baseUrl,
        model: profile.model,
        permissionGranted,
      }))}
    />
  );
}

describe('ProviderConfigSection', () => {
  it('shows permission warning when not authorized', () => {
    render(<TestHarness />);

    expect(screen.getByText('未授权，请先授予当前服务地址访问权限')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '验证连接' })).toBeDisabled();
  });

  it('shows validation success state', async () => {
    render(<TestHarness permissionGranted />);

    fireEvent.click(screen.getByRole('button', { name: '验证连接' }));

    await screen.findByText('验证通过，可正常连接当前模型');
  });

  it('shows validation failure state', async () => {
    render(<TestHarness permissionGranted onValidate={async () => ({
      ok: false,
      provider: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4.1-mini',
      permissionGranted: true,
      error: '验证失败',
    })} />);

    fireEvent.click(screen.getByRole('button', { name: '验证连接' }));

    await screen.findByText('验证失败');
  });

  it('clears stale validation state after field changes', async () => {
    render(<TestHarness permissionGranted />);

    fireEvent.click(screen.getByRole('button', { name: '验证连接' }));
    await screen.findByText('验证通过，可正常连接当前模型');

    fireEvent.change(screen.getByPlaceholderText('gpt-4.1-mini'), { target: { value: 'gpt-4.1' } });

    await waitFor(() => expect(screen.getByText('尚未验证')).toBeInTheDocument());
  });
});
