import type { MessageType, MessageEnvelope } from '@/contracts';

export async function sendTabMessage<TPayload>(
  tabId: number,
  type: MessageType,
  payload: TPayload,
): Promise<void> {
  const envelope: MessageEnvelope<TPayload> = { type, payload };
  await chrome.tabs.sendMessage(tabId, envelope);
}
