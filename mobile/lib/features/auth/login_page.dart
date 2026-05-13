import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../main.dart';
import '../../providers/api_providers.dart';
import '../../providers/profile_provider.dart';

// Sign-in page: mirrors web flow. Automatically attempts login on open,
// then fetches `/api/users/me` to decide whether to route to `/library` or
// `/onboard` (if user has no org membership).

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  bool _loading = true;
  bool _failed = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _attemptLogin());
  }

  Future<void> _attemptLogin() async {
    setState(() {
      _loading = true;
      _failed = false;
    });

    final auth = ref.read(authServiceProvider);
    final client = ref.read(apiClientProvider);

    bool ok = false;
    try {
      ok = await auth.login().timeout(const Duration(seconds: 30), onTimeout: () {
        // login timed out
        return false;
      });
    } catch (e) {
      // surface unexpected errors
      // ignore: avoid_print
      print('LoginPage._attemptLogin: login error: $e');
      ok = false;
    }
    if (!ok) {
      if (mounted) setState(() => _failed = true);
      return;
    }

    // If Auth0 isn't configured (dev fallback), just continue to library.
    if (!auth.isConfigured) {
      if (mounted) context.go('/library');
      return;
    }

    try {
      final user = await client.getCurrentUser();
      if (user != null) {
        // store for app-wide access
        ref.read(profileProvider.notifier).setProfile(user);
      }

      final hasOrg = (user != null) && (user['orgId'] != null || user['org_id'] != null || user['org'] != null);
      if (mounted) context.go(hasOrg ? '/library' : '/onboard');
    } catch (_) {
      if (mounted) context.go('/library');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Sign In')),
      body: Center(
        child: _loading
            ? const CircularProgressIndicator()
            : _failed
                ? ElevatedButton(
                    onPressed: _attemptLogin,
                    child: const Text('Retry sign in'),
                  )
                : ElevatedButton(
                    onPressed: _attemptLogin,
                    child: const Text('Sign in'),
                  ),
      ),
    );
  }
}
