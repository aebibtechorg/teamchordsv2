import Constants from 'expo-constants';

export const AUTH0_DOMAIN: string =
  process.env.EXPO_PUBLIC_AUTH0_DOMAIN ||
  Constants.expoConfig?.extra?.auth0Domain ||
  'teamchords.jp.auth0.com';

export const AUTH0_CLIENT_ID: string =
  process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID ||
  Constants.expoConfig?.extra?.auth0ClientId ||
  'rhR9jdQZVmSrlnbwgk0AyFSk7qiaFs4y';

export const AUTH0_AUDIENCE: string =
  process.env.EXPO_PUBLIC_AUTH0_AUDIENCE ||
  Constants.expoConfig?.extra?.auth0Audience ||
  'https://teamchordsapp.io';

export const API_BASE_URL: string =
  process.env.EXPO_PUBLIC_API_URL ||
  Constants.expoConfig?.extra?.apiUrl ||
  '';
