import { useState, useEffect } from 'react';
import type { ConfigStatus } from '@/contracts';
import { MessageType } from '@/contracts';
import { sendMessage } from '@/services/messaging';

export function useConfigStatus() {
  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sendMessage<unknown, ConfigStatus>(MessageType.GET_PROVIDER_CONFIG_STATUS, {})
      .then((response) => {
        if (response.success && response.data) {
          setConfigStatus(response.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return { configStatus, loading };
}
