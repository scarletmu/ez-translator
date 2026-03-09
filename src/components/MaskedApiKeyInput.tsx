import { useState } from 'react';

interface MaskedApiKeyInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function MaskedApiKeyInput({ value, onChange }: MaskedApiKeyInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="sk-..."
        style={{ flex: 1 }}
        autoComplete="off"
      />
      <button
        type="button"
        className="btn btn-outline btn-sm"
        onClick={() => setVisible(!visible)}
      >
        {visible ? '隐藏' : '显示'}
      </button>
    </div>
  );
}
