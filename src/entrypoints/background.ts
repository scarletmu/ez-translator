import { registerBackgroundMessageHandler } from '@/services/messaging/background-router';

export default defineBackground(() => {
  registerBackgroundMessageHandler();
});
