import 'dart:convert';

import 'package:http/http.dart' as http;
import 'auth_service.dart';
import '../models/chord_sheet.dart';
import '../models/setlist.dart';

class ApiClient {
  final AuthService auth;
  final String baseUrl;

  ApiClient(this.auth, {String? baseUrl}) : baseUrl = baseUrl ?? const String.fromEnvironment('API_BASE_URL', defaultValue: 'http://localhost:5268');

  Future<http.Response> get(String path) async {
    final token = await auth.getAccessToken();
    final headers = <String, String>{'Accept': 'application/json'};
    if (token != null) headers['Authorization'] = 'Bearer $token';
    return http.get(Uri.parse('$baseUrl$path'), headers: headers);
  }

  Future<http.Response> post(String path, {Map<String, String>? headers, Object? body}) async {
    final token = await auth.getAccessToken();
    final finalHeaders = <String, String>{'Accept': 'application/json', 'Content-Type': 'application/json'};
    if (token != null) finalHeaders['Authorization'] = 'Bearer $token';
    if (headers != null) finalHeaders.addAll(headers);
    return http.post(Uri.parse('$baseUrl$path'), headers: finalHeaders, body: body);
  }

  Future<List<ChordSheet>> getChordSheets({required String orgId, int page = 1, int pageSize = 50}) async {
    final path = '/api/chordsheets?orgId=${Uri.encodeComponent(orgId)}&page=$page&pageSize=$pageSize';
    final res = await get(path);
    if (res.statusCode != 200) throw Exception('Failed to load chord sheets (${res.statusCode})');
    final json = jsonDecode(res.body);
    final items = (json['items'] as List<dynamic>?) ?? [];
    return items.map((e) => ChordSheet.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<ChordSheet> getChordSheetById(String id) async {
    final path = '/api/chordsheets/${Uri.encodeComponent(id)}';
    final res = await get(path);
    if (res.statusCode != 200) throw Exception('Failed to load chord sheet (${res.statusCode})');
    final json = jsonDecode(res.body);
    return ChordSheet.fromJson(json as Map<String, dynamic>);
  }

  Future<List<SetList>> getSetLists({required String orgId, int page = 1, int pageSize = 50}) async {
    final path = '/api/setlists?orgId=${Uri.encodeComponent(orgId)}&page=$page&pageSize=$pageSize';
    final res = await get(path);
    if (res.statusCode != 200) throw Exception('Failed to load set lists (${res.statusCode})');
    final json = jsonDecode(res.body);
    final items = (json['items'] as List<dynamic>?) ?? [];
    return items.map((e) => SetList.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<http.Response> put(String path, {Map<String, String>? headers, Object? body}) async {
    final token = await auth.getAccessToken();
    final finalHeaders = <String, String>{'Accept': 'application/json', 'Content-Type': 'application/json'};
    if (token != null) finalHeaders['Authorization'] = 'Bearer $token';
    if (headers != null) finalHeaders.addAll(headers);
    return http.put(Uri.parse('$baseUrl$path'), headers: finalHeaders, body: body);
  }

  Future<http.Response> deleteReq(String path, {Map<String, String>? headers}) async {
    final token = await auth.getAccessToken();
    final finalHeaders = <String, String>{'Accept': 'application/json'};
    if (token != null) finalHeaders['Authorization'] = 'Bearer $token';
    if (headers != null) finalHeaders.addAll(headers);
    return http.delete(Uri.parse('$baseUrl$path'), headers: finalHeaders);
  }

  /// Fetch the current authenticated user from the backend.
  /// Returns `null` when the request fails or the response is not 200.
  Future<Map<String, dynamic>?> getCurrentUser() async {
    final res = await get('/api/users/me');
    if (res.statusCode != 200) return null;
    final jsonBody = jsonDecode(res.body);
    return jsonBody as Map<String, dynamic>?;
  }

  Future<ChordSheet> createChordSheet({required String orgId, required String title, required String artist, required String content, String key = ''}) async {
    final path = '/api/chordsheets';
    final body = jsonEncode({'orgId': orgId, 'title': title, 'artist': artist, 'content': content, 'key': key});
    final res = await post(path, body: body);
    if (res.statusCode != 200 && res.statusCode != 201) throw Exception('Failed to create chord sheet (${res.statusCode})');
    final json = jsonDecode(res.body);
    return ChordSheet.fromJson(json as Map<String, dynamic>);
  }

  Future<ChordSheet> updateChordSheet(String id, {required String title, required String artist, required String content, String key = ''}) async {
    final path = '/api/chordsheets/${Uri.encodeComponent(id)}';
    final body = jsonEncode({'title': title, 'artist': artist, 'content': content, 'key': key});
    final res = await put(path, body: body);
    if (res.statusCode != 200) throw Exception('Failed to update chord sheet (${res.statusCode})');
    final json = jsonDecode(res.body);
    return ChordSheet.fromJson(json as Map<String, dynamic>);
  }

  Future<void> deleteChordSheet(String id) async {
    final path = '/api/chordsheets/${Uri.encodeComponent(id)}';
    final res = await deleteReq(path);
    if (res.statusCode != 200 && res.statusCode != 204) throw Exception('Failed to delete chord sheet (${res.statusCode})');
  }

  /// Create an organization with the given name. Returns the created org JSON or null.
  Future<Map<String, dynamic>?> createOrganization(String name) async {
    final path = '/api/organizations';
    final body = jsonEncode({'name': name});
    final res = await post(path, body: body);
    if (res.statusCode != 200 && res.statusCode != 201) return null;
    return jsonDecode(res.body) as Map<String, dynamic>?;
  }

  /// Create a profile for the given user and organization. Returns the created profile JSON or null.
  Future<Map<String, dynamic>?> createProfile({required String userId, required String orgId}) async {
    final path = '/api/profiles';
    final body = jsonEncode({'userId': userId, 'orgId': orgId});
    final res = await post(path, body: body);
    if (res.statusCode != 200 && res.statusCode != 201) return null;
    return jsonDecode(res.body) as Map<String, dynamic>?;
  }
}
