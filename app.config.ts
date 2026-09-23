import 'dotenv/config';
import type { ConfigContext, ExpoConfig } from 'expo/config';
import { APP_IDENTITY } from './src/config/appIdentity.js';

function getGoogleIosUrlScheme(iosClientId: string): string | null {
  const suffix = '.apps.googleusercontent.com';
  if (!iosClientId.endsWith(suffix)) {
    return null;
  }

  return `com.googleusercontent.apps.${iosClientId.slice(0, -suffix.length)}`;
}

const googleAuthWebClientId = process.env.EXPO_PUBLIC_GOOGLE_AUTH_WEB_CLIENT_ID ?? '';
const googleAuthIosClientId = process.env.EXPO_PUBLIC_GOOGLE_AUTH_IOS_CLIENT_ID ?? '';
const googleIosUrlScheme = getGoogleIosUrlScheme(googleAuthIosClientId);

const plugins: ExpoConfig['plugins'] = [
  'expo-dev-client',
  [
    'expo-splash-screen',
    {
      image: './assets/splash-icon.png',
      backgroundColor: '#FAFAF8',
      imageWidth: 220,
    },
  ],
  'expo-apple-authentication',
  'expo-web-browser',
];

if (googleIosUrlScheme) {
  plugins.push([
    '@react-native-google-signin/google-signin',
    { iosUrlScheme: googleIosUrlScheme },
  ]);
  plugins.push('./plugins/withGoogleSignInPods.js');
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: APP_IDENTITY.name,
  slug: APP_IDENTITY.slug,
  scheme: APP_IDENTITY.scheme,
  icon: './assets/icon.png',
  ios: {
    ...config.ios,
    bundleIdentifier: APP_IDENTITY.iosBundleIdentifier,
    supportsTablet: true,
    usesAppleSignIn: true,
    appleTeamId: process.env.APPLE_TEAM_ID,
  },
  android: {
    ...config.android,
    package: APP_IDENTITY.iosBundleIdentifier,
    adaptiveIcon: {
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundColor: '#FAFAF8',
    },
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    googleAuthWebClientId,
    googleAuthIosClientId,
    scheme: APP_IDENTITY.scheme,
  },
  plugins,
});
