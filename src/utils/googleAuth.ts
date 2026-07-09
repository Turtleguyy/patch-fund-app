export function getGoogleIosUrlScheme(iosClientId: string): string | null {
  const suffix = '.apps.googleusercontent.com';
  if (!iosClientId.endsWith(suffix)) {
    return null;
  }

  return `com.googleusercontent.apps.${iosClientId.slice(0, -suffix.length)}`;
}
