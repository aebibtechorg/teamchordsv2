import 'package:shared_preferences/shared_preferences.dart';
import 'auth_config.dart';
import 'package:auth0_flutter/auth0_flutter.dart';

/// AuthService: uses `auth0_flutter` WebAuth if `AuthConfig` is configured,
/// otherwise falls back to a local dev token for quick iteration.
class AuthService {
  String? _accessToken;
  Auth0? _auth0;

  bool get isConfigured => AuthConfig.domain.isNotEmpty && AuthConfig.clientId.isNotEmpty;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _accessToken = prefs.getString('access_token');
    if (isConfigured) {
      _auth0 = Auth0(AuthConfig.domain, AuthConfig.clientId);
    }
  }

  Future<bool> login() async {
    final prefs = await SharedPreferences.getInstance();
    if (!isConfigured) {
      // Dev fallback
      _accessToken = 'dev-token';
      await prefs.setString('access_token', _accessToken!);
      return true;
    }

    try {
      final webAuth = _auth0!.webAuthentication(scheme: AuthConfig.callbackScheme);
      final creds = await webAuth.login(audience: AuthConfig.audience, scopes: {'openid', 'profile', 'offline_access'}, useEphemeralSession: true);
      _accessToken = creds.accessToken ?? creds.idToken;
      if (_accessToken != null) await prefs.setString('access_token', _accessToken!);
      return true;
    } catch (e) {
      // Log the error for debugging (visible in `flutter run` logs).
      // Include stack trace when available.
      try {
        // ignore: avoid_print
        print('AuthService.login error: $e');
      } catch (_) {}
      return false;
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    if (isConfigured && _auth0 != null) {
      try {
        await _auth0!.webAuthentication(scheme: AuthConfig.callbackScheme).logout();
      } catch (_) {}
    }
    _accessToken = null;
    await prefs.remove('access_token');
  }

  Future<String?> getAccessToken() async {
    if (_accessToken != null) return _accessToken;
    final prefs = await SharedPreferences.getInstance();
    _accessToken = prefs.getString('access_token');
    return _accessToken;
  }
}
