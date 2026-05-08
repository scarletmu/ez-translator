import { createRoot } from 'react-dom/client';
import SelectionTranslateManager from '@/features/selection-translate/SelectionTranslateManager';
import ScreenshotModeManager from '@/features/screenshot-translate/ScreenshotModeManager';

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    const hostId = 'edge-translator-root';

    // Remove existing host if any (e.g. on HMR)
    const existing = document.getElementById(hostId);
    if (existing) existing.remove();

    const host = document.createElement('div');
    host.id = hostId;
    host.style.cssText = 'all: initial; position: absolute; top: 0; left: 0; width: 0; height: 0; z-index: 2147483647;';
    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: 'open' });
    const container = document.createElement('div');
    shadow.appendChild(container);

    const root = createRoot(container);
    root.render(
      <>
        <SelectionTranslateManager />
        <ScreenshotModeManager />
      </>
    );
  },
});
