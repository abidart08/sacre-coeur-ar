const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 45000,
  use: {
    baseURL: 'http://127.0.0.1:8080',
    permissions: ['camera'],
    launchOptions: {
      args: [
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
        '--enable-webgl',
        '--use-gl=swiftshader'
      ]
    }
  }
});
