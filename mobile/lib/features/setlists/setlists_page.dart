import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class SetlistsPage extends StatelessWidget {
  const SetlistsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Setlists')),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Setlists and Live View stubs'),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: () => context.go('/live'),
              child: const Text('Open Live View'),
            ),
          ],
        ),
      ),
    );
  }
}
