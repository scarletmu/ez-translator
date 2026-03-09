import { PROVIDER_PRESET_OPTIONS } from '@/constants/provider-presets';
import type { ProviderPreset } from '@/constants/provider-presets';

interface ProviderPresetSelectProps {
  value: ProviderPreset;
  onChange: (preset: ProviderPreset) => void;
}

export default function ProviderPresetSelect({ value, onChange }: ProviderPresetSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as ProviderPreset)}
    >
      {PROVIDER_PRESET_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
