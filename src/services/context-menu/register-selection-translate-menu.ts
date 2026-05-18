import { MessageType } from '@/contracts';
import { sendTabMessage } from '@/services/messaging/send-tab-message';

const MENU_ID = 'ez-translator:translate-selection';
const MENU_TITLE = '翻译选中文本';

function isExpectedDeliveryFailure(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes('Receiving end does not exist') ||
    error.message.includes('No tab with id') ||
    error.message.includes('Cannot access')
  );
}

async function triggerSelectionTranslate(tabId: number, text: string): Promise<void> {
  try {
    await sendTabMessage(tabId, MessageType.TRIGGER_SELECTION_TRANSLATE, { text });
  } catch (error) {
    if (isExpectedDeliveryFailure(error)) {
      return;
    }

    console.warn('EZ Translator failed to forward context-menu translation request', {
      tabId,
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
  }
}

export function registerSelectionTranslateMenu(): void {
  const createMenu = () => {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: MENU_ID,
        title: MENU_TITLE,
        contexts: ['selection'],
        documentUrlPatterns: ['http://*/*', 'https://*/*'],
      });
    });
  };

  chrome.runtime.onInstalled.addListener(createMenu);

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId !== MENU_ID) return;
    if (tab?.id == null) return;

    const text = (info.selectionText ?? '').trim();
    if (!text) return;

    void triggerSelectionTranslate(tab.id, text);
  });
}
