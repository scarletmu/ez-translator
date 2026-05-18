import { defineConfig } from 'wxt';

export default defineConfig({
  browser: 'edge',
  srcDir: 'src',
  publicDir: '../public',
  outDir: 'output',
  modules: ['@wxt-dev/module-react'],
  hooks: {
    'build:publicAssets': (_, files) => {
      const sourceIndex = files.findIndex((file) => file.relativeDest === 'icon/source.png');
      if (sourceIndex >= 0) {
        files.splice(sourceIndex, 1);
      }
    },
  },
  runner: {
    binaries: {
      edge: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    },
  },
  manifest: {
    name: 'EZ Translator',
    description: '网页选区翻译、截图区域翻译、粘贴翻译',
    icons: {
      16: 'icon/16.png',
      48: 'icon/48.png',
      128: 'icon/128.png',
    },
    action: {
      default_icon: {
        16: 'icon/16.png',
        48: 'icon/48.png',
        128: 'icon/128.png',
      },
    },
    permissions: ['storage', 'activeTab', 'contextMenus'],
    optional_host_permissions: ['https://*/*', 'http://*/*'],
  },
});
