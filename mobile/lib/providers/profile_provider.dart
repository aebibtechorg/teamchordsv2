import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'api_providers.dart';

/// Simple profile notifier that stores the current user/profile object
/// as a map. This mirrors the web flow where `/api/users/me` returns
/// the user record and `/api/profiles` stores profile/org membership.
class ProfileNotifier extends StateNotifier<Map<String, dynamic>?> {
  final Ref ref;

  ProfileNotifier(this.ref) : super(null);

  Map<String, dynamic>? get profile => state;

  Future<void> load() async {
    final client = ref.read(apiClientProvider);
    final user = await client.getCurrentUser();
    state = user;
  }

  void setProfile(Map<String, dynamic>? p) {
    state = p;
  }

  void clear() {
    state = null;
  }
}

final profileProvider = StateNotifierProvider<ProfileNotifier, Map<String, dynamic>?>((ref) => ProfileNotifier(ref));
