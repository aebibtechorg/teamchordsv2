import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/auth_service.dart';
import 'features/auth/login_page.dart';
import 'features/auth/auth_callback.dart';
import 'features/library/library_page.dart';
import 'features/onboarding/onboarding_page.dart';
import 'features/library/chord_sheet_viewer.dart';
import 'features/setlists/setlists_page.dart';
import 'core/signalr_service.dart';
import 'features/setlists/live_view.dart';

final authServiceProvider = Provider<AuthService>((ref) => AuthService());
final signalRServiceProvider = Provider<SignalRService>((ref) => SignalRService());

final _router = GoRouter(
  initialLocation: '/signin',
  routes: [
    GoRoute(path: '/signin', builder: (context, state) => const LoginPage()),
    GoRoute(path: '/login', builder: (context, state) => const LoginPage()),
    GoRoute(path: '/callback', builder: (context, state) => const AuthCallbackPage()),
    ShellRoute(
      builder: (context, state, child) => MainShell(child: child),
      routes: [
        GoRoute(path: '/onboard', builder: (context, state) => const OnboardingPage()),
        GoRoute(path: '/', redirect: (context, state) => '/library'),
        GoRoute(path: '/library/:id', builder: (context, state) => ChordSheetViewer(sheetId: state.pathParameters['id'] ?? '')),
        GoRoute(path: '/library', builder: (context, state) => const LibraryPage()),
        GoRoute(path: '/setlists', builder: (context, state) => const SetlistsPage()),
        GoRoute(path: '/live', builder: (context, state) => const LiveViewPage()),
      ],
    ),
  ],
);

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final container = ProviderContainer();
  await container.read(authServiceProvider).init();
  runApp(UncontrolledProviderScope(container: container, child: const MyApp()));
}

class MyApp extends ConsumerWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp.router(
      title: 'TeamChords Mobile (scaffold)',
      routerDelegate: _router.routerDelegate,
      routeInformationParser: _router.routeInformationParser,
      routeInformationProvider: _router.routeInformationProvider,
      theme: ThemeData(primarySwatch: Colors.blue),
    );
  }
}

class MainShell extends StatefulWidget {
  final Widget child;
  const MainShell({super.key, required this.child});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _selectedIndex = 0;

  void _onItemTapped(int index) {
    setState(() => _selectedIndex = index);
    switch (index) {
      case 0:
        context.go('/library');
        break;
      case 1:
        context.go('/setlists');
        break;
      case 2:
        context.go('/live');
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: widget.child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: _onItemTapped,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.library_music), label: 'Library'),
          BottomNavigationBarItem(icon: Icon(Icons.queue_music), label: 'Setlists'),
          BottomNavigationBarItem(icon: Icon(Icons.wifi_tethering), label: 'Live'),
        ],
      ),
    );
  }
}
        // try changing the seedColor in the colorScheme below to Colors.green
