import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/features/library/chord_sheet_editor.dart';
import '../../providers/api_providers.dart';
import '../../models/chord_sheet.dart';
import 'chord_preview.dart';

class ChordSheetViewer extends ConsumerStatefulWidget {
  final String sheetId;
  const ChordSheetViewer({super.key, required this.sheetId});

  @override
  ConsumerState<ChordSheetViewer> createState() => _ChordSheetViewerState();
}

class _ChordSheetViewerState extends ConsumerState<ChordSheetViewer> {
  ChordSheet? _sheet;
  bool _loading = true;
  int _transpose = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final client = ref.read(apiClientProvider);
      final sheet = await client.getChordSheetById(widget.sheetId);
      if (mounted) setState(() { _sheet = sheet; });
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Load failed: $e')));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_sheet?.title ?? 'Chord Sheet'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _load,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _sheet == null
              ? const Center(child: Text('Not found'))
              : Padding(
                  padding: const EdgeInsets.all(12.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(_sheet!.title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Text(_sheet!.artist, style: const TextStyle(color: Colors.black54)),
                      const SizedBox(height: 12),
                      Row(children: [
                        const Text('Transpose'),
                        IconButton(onPressed: () => setState(() => _transpose = (_transpose - 1).clamp(-11, 11)), icon: const Icon(Icons.remove)),
                        Text('$_transpose'),
                        IconButton(onPressed: () => setState(() => _transpose = (_transpose + 1).clamp(-11, 11)), icon: const Icon(Icons.add)),
                        const Spacer(),
                        IconButton(
                          icon: const Icon(Icons.edit),
                          onPressed: () async {
                            // open editor
                            final updated = await Navigator.of(context).push<bool?>(
                              MaterialPageRoute(builder: (_) => ChordSheetEditor(orgId: '', sheet: _sheet)),
                            );
                            if (updated == true) _load();
                          },
                        ),
                      ]),
                      const SizedBox(height: 8),
                      Expanded(child: SingleChildScrollView(child: ChordProPreview(chordPro: _sheet!.content, transpose: _transpose))),
                    ],
                  ),
                ),
    );
  }
}
