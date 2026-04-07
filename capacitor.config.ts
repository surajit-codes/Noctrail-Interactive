import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.briefai.app',
  appName: 'BriefAI',
  webDir: 'out',
  server: {
    url: 'https://briefai.co.in',
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
