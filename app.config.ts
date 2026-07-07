import 'dotenv/config';
import type { ConfigContext, ExpoConfig } from 'expo/config';
import { APP_IDENTITY } from './src/config/appIdentity.js';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: APP_IDENTITY.name,
  slug: APP_IDENTITY.slug,
  scheme: APP_IDENTITY.scheme,
  ios: {
    ...config.ios,
    bundleIdentifier: APP_IDENTITY.iosBundleIdentifier,
    supportsTablet: true,
    appleTeamId: process.env.APPLE_TEAM_ID,
    entitlements: {
      'com.apple.security.application-groups': [APP_IDENTITY.appGroup],
    },
    infoPlist: {
      NSSiriUsageDescription:
        'Patch Fund uses Siri so you can log allowance entries by voice.',
    },
  },
  android: {
    ...config.android,
    package: APP_IDENTITY.iosBundleIdentifier,
  },
  extra: {
    openAiApiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '',
    appGroup: APP_IDENTITY.appGroup,
    scheme: APP_IDENTITY.scheme,
  },
  plugins: [
    'expo-dev-client',
    [
      './modules/allowance-intents/plugin/withAllowanceIntents.js',
      {
        appGroup: APP_IDENTITY.appGroup,
        siriDeepLink: `${APP_IDENTITY.scheme}://${APP_IDENTITY.siriDeepLinkPath}`,
      },
    ],
  ],
});
