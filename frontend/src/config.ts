import Constants from 'expo-constants';

export const AUTH0_DOMAIN: string =
  process.env.EXPO_PUBLIC_AUTH0_DOMAIN ||
  Constants.expoConfig?.extra?.auth0Domain ||
  '';

export const AUTH0_CLIENT_ID: string =
  process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID ||
  Constants.expoConfig?.extra?.auth0ClientId ||
  '';

export const AUTH0_AUDIENCE: string =
  process.env.EXPO_PUBLIC_AUTH0_AUDIENCE ||
  Constants.expoConfig?.extra?.auth0Audience ||
  '';

export const API_BASE_URL: string =
  process.env.EXPO_PUBLIC_API_URL ||
  Constants.expoConfig?.extra?.apiUrl ||
  '';

export const WEB_BASE_URL: string =
  process.env.EXPO_PUBLIC_WEB_URL ||
  Constants.expoConfig?.extra?.webUrl ||
  'https://app.teamchords.com';
