import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/main.dart';

import '../core/api_client.dart';
import '../models/chord_sheet.dart';
import '../models/setlist.dart';

final apiClientProvider = Provider<ApiClient>((ref) {
  final auth = ref.read(authServiceProvider);
  return ApiClient(auth);
});

final chordSheetsProvider = FutureProvider.family<List<ChordSheet>, String>((ref, orgId) async {
  final client = ref.read(apiClientProvider);
  return client.getChordSheets(orgId: orgId);
});

final setListsProvider = FutureProvider.family<List<SetList>, String>((ref, orgId) async {
  final client = ref.read(apiClientProvider);
  return client.getSetLists(orgId: orgId);
});
