import 'dart:async';

import 'package:signalr_core/signalr_core.dart';

class SignalRService {
  HubConnection? _connection;
  final _events = StreamController<Map<String, dynamic>>.broadcast();

  Stream<Map<String, dynamic>> get events => _events.stream;

  Future<void> connect(String url, {String? accessToken}) async {
    final options = HttpConnectionOptions(
      accessTokenFactory: () async => accessToken ?? '',
    );
    _connection = HubConnectionBuilder().withUrl(url, options).build();
    _connection?.onclose((error) {
      _events.add({'type': 'closed', 'error': error?.toString()});
    });
    await _connection?.start();
  }

  void on(String methodName, void Function(List<Object?> args) handler) {
    _connection?.on(methodName, (args) {
      handler(args!);
      _events.add({'type': methodName, 'args': args});
    });
  }

  Future<dynamic> invoke(String methodName, [List<Object?>? args]) async {
    return _connection?.invoke(methodName, args: args ?? []);
  }

  Future<void> stop() async {
    try {
      await _connection?.stop();
    } catch (_) {}
    _connection = null;
    await _events.close();
  }
}
