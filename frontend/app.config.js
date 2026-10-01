module.exports = ({ config }) => {
  const auth0Domain = process.env.EXPO_PUBLIC_AUTH0_DOMAIN || "teamchords.us.auth0.com";
  const auth0ClientId = process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID || "your-auth0-client-id";
  const auth0Audience = process.env.EXPO_PUBLIC_AUTH0_AUDIENCE || "your-auth0-audience";
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  // Filter out any simple string "react-native-auth0" plugin if present
  const basePlugins = config.plugins ? config.plugins.filter((p) => {
    if (typeof p === 'string') return p !== 'react-native-auth0';
    if (Array.isArray(p)) return p[0] !== 'react-native-auth0';
    return true;
  }) : [];

  // Add configured react-native-auth0 plugin
  basePlugins.push([
    "react-native-auth0",
    {
      domain: auth0Domain,
      customScheme: config.scheme || "frontend"
    }
  ]);

  return {
    ...config,
    plugins: basePlugins,
    extra: {
      ...config.extra,
      auth0Domain,
      auth0ClientId,
      auth0Audience,
      apiUrl
    }
  };
};
