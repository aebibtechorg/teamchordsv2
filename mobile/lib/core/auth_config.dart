/// Auth0 configuration for the mobile app.
///
/// Prefer passing values at build/run time with `--dart-define`.
/// Example:
///   flutter run --dart-define=AUTH0_DOMAIN=your-tenant.us.auth0.com \
///               --dart-define=AUTH0_CLIENT_ID=your-client-id \
///               --dart-define=AUTH0_AUDIENCE=https://api.example.com
class AuthConfig {
  static const String domain = String.fromEnvironment('AUTH0_DOMAIN', defaultValue: '');
  static const String clientId = String.fromEnvironment('AUTH0_CLIENT_ID', defaultValue: '');
  static const String audience = String.fromEnvironment('AUTH0_AUDIENCE', defaultValue: '');
  // Default to custom scheme 'teamchords' for local/dev usage.
  // Override at build/run time with `--dart-define=AUTH0_CALLBACK_SCHEME=...` when needed.
  static const String callbackScheme = String.fromEnvironment('AUTH0_CALLBACK_SCHEME', defaultValue: 'teamchords');
}
