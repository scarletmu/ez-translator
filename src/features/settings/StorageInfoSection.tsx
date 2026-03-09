import { useState } from 'react';
import { clearAllProviderConfigs } from '@/services/storage';

interface StorageInfoSectionProps {
  onCleared: () => void;
}

export default function StorageInfoSection({ onCleared }: StorageInfoSectionProps) {
  const [confirming, setConfirming] = useState(false);

  const handleClear = async () => {
    await clearAllProviderConfigs();
    setConfirming(false);
    onCleared();
  };

  return (
    <div className="settings-section">
      <h2>本地存储</h2>
      <p className="privacy-note">
        API Key 仅保存在当前浏览器扩展本地环境中，不会同步到浏览器账户或云端。
      </p>

      <div style={{ marginTop: 'var(--space-lg)' }}>
        {confirming ? (
          <div className="inline-row">
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-error)' }}>
              确认清除所有配置？此操作不可撤销。
            </span>
            <button className="btn btn-danger btn-sm" onClick={handleClear}>
              确认清除
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => setConfirming(false)}>
              取消
            </button>
          </div>
        ) : (
          <button className="btn btn-danger" onClick={() => setConfirming(true)}>
            清除所有配置
          </button>
        )}
      </div>
    </div>
  );
}
