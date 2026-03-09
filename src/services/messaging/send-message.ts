import type { MessageType, MessageEnvelope, MessageResponse } from '@/contracts';

export async function sendMessage<TPayload, TResponse>(
  type: MessageType,
  payload: TPayload,
): Promise<MessageResponse<TResponse>> {
  const envelope: MessageEnvelope<TPayload> = { type, payload };
  return chrome.runtime.sendMessage(envelope);
}
