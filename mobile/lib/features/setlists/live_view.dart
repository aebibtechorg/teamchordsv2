import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../main.dart';
import '../../providers/api_providers.dart';

class LiveViewPage extends ConsumerStatefulWidget {
  const LiveViewPage({super.key});

  @override
  ConsumerState<LiveViewPage> createState() => _LiveViewPageState();
}

class _LiveViewPageState extends ConsumerState<LiveViewPage> {
  final List<String> _events = [];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _connect());
  }

  Future<void> _connect() async {
    final signalR = ref.read(signalRServiceProvider);
    final auth = ref.read(authServiceProvider);
    final token = await auth.getAccessToken();
    final client = ref.read(apiClientProvider);
    final base = client.baseUrl.endsWith('/') ? client.baseUrl.substring(0, client.baseUrl.length - 1) : client.baseUrl;
    final hubUrl = '$base/hubs/setlists';
    try {
      await signalR.connect(hubUrl, accessToken: token);
      signalR.on('SetListUpdated', (args) {
        setState(() {
          _events.add('SetListUpdated: ${args.join(', ')}');
        });
      });
      signalR.on('OutputUpdated', (args) {
        setState(() {
          _events.add('OutputUpdated: ${args.join(', ')}');
        });
      });
    } catch (e) {
      setState(() {
        _events.add('Connection error: $e');
      });
    }
  }

  @override
  void dispose() {
    final signalR = ref.read(signalRServiceProvider);
    signalR.stop();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Live View')),
      body: _events.isEmpty
          ? const Center(child: Text('No events yet'))
          : ListView.builder(
              itemCount: _events.length,
              itemBuilder: (context, index) => ListTile(title: Text(_events[index])),
            ),
    );
  }
}
