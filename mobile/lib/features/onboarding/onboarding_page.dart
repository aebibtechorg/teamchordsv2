import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/api_providers.dart';
import '../../providers/profile_provider.dart';

class OnboardingPage extends ConsumerStatefulWidget {
  const OnboardingPage({super.key});

  @override
  ConsumerState<OnboardingPage> createState() => _OnboardingPageState();
}

class _OnboardingPageState extends ConsumerState<OnboardingPage> {
  final TextEditingController _orgController = TextEditingController();
  bool _loading = false;

  Future<void> _createProfile() async {
    final name = _orgController.text.trim();
    if (name.isEmpty) return;
    setState(() => _loading = true);
    final client = ref.read(apiClientProvider);
    try {
      final user = ref.read(profileProvider);
      final userId = user?['id'] ?? user?['sub'] ?? user?['userId'];
      final org = await client.createOrganization(name);
      if (org == null) throw Exception('Failed to create organization');
      final orgId = org['id'] ?? org['Id'] ?? org['orgId'];
      final profile = await client.createProfile(userId: userId ?? '', orgId: orgId?.toString() ?? '');
      if (profile == null) throw Exception('Failed to create profile');
      // store profile and navigate
      ref.read(profileProvider.notifier).setProfile(profile);
      if (mounted) Navigator.of(context).pushReplacementNamed('/library');
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error creating organization: $e')));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _orgController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Onboarding')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Welcome! Let\'s set up your organization', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            TextField(controller: _orgController, decoration: const InputDecoration(labelText: 'Organization name')),
            const SizedBox(height: 16),
            Row(children: [
              Expanded(
                child: ElevatedButton(
                  onPressed: _loading ? null : _createProfile,
                  child: _loading ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Text('Create organization'),
                ),
              )
            ])
          ],
        ),
      ),
    );
  }
}
