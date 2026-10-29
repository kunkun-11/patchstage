import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  timeout: 30000,
  use: { baseURL: 'http://127.0.0.1:4181', trace: 'retain-on-failure' },
  webServer: { command: 'npm run dev -- --port 4181', url: 'http://127.0.0.1:4181', reuseExistingServer: !process.env.CI },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium', channel: process.env.PLAYWRIGHT_CHANNEL } },
    { name: 'mobile', use: { browserName: 'chromium', channel: process.env.PLAYWRIGHT_CHANNEL, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: 'firefox', use: { browserName: 'firefox' } },
  ],
});
