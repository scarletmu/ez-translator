import { describe, expect, it, vi } from 'vitest';
import { MessageType } from '@/contracts';
import { registerSelectionTranslateMenu } from './register-selection-translate-menu';

const menuClickData = {
  menuItemId: 'ez-translator:translate-selection',
  selectionText: ' hello world ',
} as chrome.contextMenus.OnClickData;

const tab = { id: 123 } as chrome.tabs.Tab;

function getContextMenuClickListener() {
  registerSelectionTranslateMenu();
  return vi.mocked(chrome.contextMenus.onClicked.addListener).mock.calls[0][0];
}

describe('registerSelectionTranslateMenu', () => {
  it('registers the menu only for regular web pages', () => {
    registerSelectionTranslateMenu();

    const onInstalledListener = vi.mocked(chrome.runtime.onInstalled.addListener).mock.calls[0][0];
    onInstalledListener({ reason: 'install' });

    expect(chrome.contextMenus.create).toHaveBeenCalledWith({
      id: 'ez-translator:translate-selection',
      title: '翻译选中文本',
      contexts: ['selection'],
      documentUrlPatterns: ['http://*/*', 'https://*/*'],
    });
  });

  it('forwards selected text to the content script', async () => {
    const listener = getContextMenuClickListener();

    listener(menuClickData, tab);

    await vi.waitFor(() => {
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(123, {
        type: MessageType.TRIGGER_SELECTION_TRANSLATE,
        payload: { text: 'hello world' },
      });
    });
  });

  it('handles tabs without a receiving content script', async () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.mocked(chrome.tabs.sendMessage).mockRejectedValueOnce(
      new Error('Could not establish connection. Receiving end does not exist.'),
    );
    const listener = getContextMenuClickListener();

    listener(menuClickData, tab);

    await vi.waitFor(() => expect(chrome.tabs.sendMessage).toHaveBeenCalled());
    await Promise.resolve();

    expect(consoleWarn).not.toHaveBeenCalled();
  });
});
