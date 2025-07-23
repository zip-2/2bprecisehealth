import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    baseURL: 'https://api.pharmgkb.org',
    extraHTTPHeaders: {
      'Accept': 'application/json'
    }
  },
  timeout: 30000,
});
