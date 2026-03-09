import { defineConfig } from 'wxt';

export default defineConfig({
  browser: 'edge',
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  runner: {
    binaries: {
      edge: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    },
  },
  manifest: {
    name: 'Edge 翻译插件',
    description: '网页选区翻译、截图区域翻译、粘贴翻译',
    permissions: ['storage', 'activeTab'],
    optional_host_permissions: ['https://*/*', 'http://*/*'],
  },
});
