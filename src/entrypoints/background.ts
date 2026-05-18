import { registerSelectionTranslateMenu } from '@/services/context-menu';
import { registerBackgroundMessageHandler } from '@/services/messaging/background-router';

export default defineBackground(() => {
  registerBackgroundMessageHandler();
  registerSelectionTranslateMenu();
});
