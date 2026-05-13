import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../models/chord_sheet.dart';
import '../../providers/api_providers.dart';
import '../library/chord_sheet_editor.dart';

class LibraryPage extends ConsumerStatefulWidget {
  const LibraryPage({super.key});

  @override
  ConsumerState<LibraryPage> createState() => _LibraryPageState();
}

class _LibraryPageState extends ConsumerState<LibraryPage> {
  final _orgController = TextEditingController();
  String _currentOrgId = '';

  @override
  void dispose() {
    _orgController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final orgId = _currentOrgId;
    return Scaffold(
      appBar: AppBar(title: const Text('Library')),
      body: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          children: [
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _orgController,
                    decoration: const InputDecoration(labelText: 'Organization ID'),
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: () {
                    setState(() {
                      _currentOrgId = _orgController.text.trim();
                    });
                  },
                  child: const Text('Load'),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (orgId.isEmpty)
              const Expanded(child: Center(child: Text('Enter an Organization ID and tap Load')))
            else
              Expanded(
                child: Consumer(
                  builder: (context, ref, _) {
                    final list = ref.watch(chordSheetsProvider(orgId));
                    return list.when(
                      data: (items) => _buildList(items),
                      loading: () => const Center(child: CircularProgressIndicator()),
                      error: (e, st) => Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text('Error loading chord sheets: $e'),
                            const SizedBox(height: 8),
                            ElevatedButton(onPressed: () => ref.refresh(chordSheetsProvider(orgId)), child: const Text('Retry')),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
          ],
        ),
      ),
      floatingActionButton: orgId.isEmpty
          ? null
          : FloatingActionButton(
              onPressed: () async {
                final created = await Navigator.of(context).push<bool?>(
                  MaterialPageRoute(
                    builder: (_) => ChordSheetEditor(orgId: orgId),
                  ),
                );
                if (created == true) ref.refresh(chordSheetsProvider(orgId));
              },
              child: const Icon(Icons.add),
            ),
    );
  }

  Widget _buildList(List<ChordSheet> items) {
    return ListView.separated(
      itemCount: items.length,
      separatorBuilder: (_, _) => const Divider(height: 1),
          itemBuilder: (context, index) {
        final s = items[index];
        return ListTile(
          title: Text(s.title),
          subtitle: Text(s.artist),
          onTap: () async {
            // Navigate to read-only viewer route `/library/:id`
            context.go('/library/${s.id}');
          },
          trailing: PopupMenuButton<String>(
            onSelected: (v) async {
                  if (v == 'delete') {
                final ok = await showDialog<bool>(
                  context: context,
                  builder: (_) => AlertDialog(
                    title: const Text('Delete chord sheet?'),
                    content: Text('Delete "${s.title}"? This cannot be undone.'),
                    actions: [
                      TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
                      TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Delete')),
                    ],
                  ),
                );
                if (ok == true) {
                  try {
                    await ref.read(apiClientProvider).deleteChordSheet(s.id);
                    ref.refresh(chordSheetsProvider(_currentOrgId));
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Deleted')));
                  } catch (e) {
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Delete failed: $e')));
                  }
                }
                  } else if (v == 'edit') {
                    final updated = await Navigator.of(context).push<bool?>(
                      MaterialPageRoute(builder: (_) => ChordSheetEditor(orgId: _currentOrgId, sheet: s)),
                    );
                    if (updated == true) ref.refresh(chordSheetsProvider(_currentOrgId));
              }
            },
            itemBuilder: (_) => [
              const PopupMenuItem(value: 'delete', child: Text('Delete')),
              const PopupMenuItem(value: 'edit', child: Text('Edit')),
            ],
          ),
        );
      },
    );
  }
}
