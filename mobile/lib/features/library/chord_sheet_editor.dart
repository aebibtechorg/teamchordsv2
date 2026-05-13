import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/chord_sheet.dart';
import '../../providers/api_providers.dart';
import 'chord_preview.dart';

class ChordSheetEditor extends ConsumerStatefulWidget {
  final ChordSheet? sheet;
  final String orgId;

  const ChordSheetEditor({super.key, this.sheet, required this.orgId});

  @override
  ConsumerState<ChordSheetEditor> createState() => _ChordSheetEditorState();
}

class _ChordSheetEditorState extends ConsumerState<ChordSheetEditor> {
  late final TextEditingController _titleController;
  late final TextEditingController _artistController;
  late final TextEditingController _keyController;
  late final TextEditingController _contentController;
  bool _saving = false;
  bool _showPreview = true;
  int _transpose = 0;

  @override
  void initState() {
    super.initState();
    final s = widget.sheet;
    _titleController = TextEditingController(text: s?.title ?? '');
    _artistController = TextEditingController(text: s?.artist ?? '');
    _keyController = TextEditingController(text: s?.key ?? '');
    _contentController = TextEditingController(text: s?.content ?? '');
  }

  @override
  void dispose() {
    _titleController.dispose();
    _artistController.dispose();
    _keyController.dispose();
    _contentController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    final client = ref.read(apiClientProvider);
    try {
      if (widget.sheet == null) {
        await client.createChordSheet(
          orgId: widget.orgId,
          title: _titleController.text.trim(),
          artist: _artistController.text.trim(),
          content: _contentController.text,
          key: _keyController.text.trim(),
        );
      } else {
        await client.updateChordSheet(widget.sheet!.id,
            title: _titleController.text.trim(), artist: _artistController.text.trim(), content: _contentController.text, key: _keyController.text.trim());
      }
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Save failed: $e')));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.sheet != null;
    return Scaffold(
      appBar: AppBar(title: Text(isEdit ? 'Edit Chord Sheet' : 'New Chord Sheet')),
      body: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          children: [
            TextField(controller: _titleController, decoration: const InputDecoration(labelText: 'Title')),
            TextField(controller: _artistController, decoration: const InputDecoration(labelText: 'Artist')),
            TextField(controller: _keyController, decoration: const InputDecoration(labelText: 'Key')),
            const SizedBox(height: 8),
            Expanded(
              flex: 3,
              child: TextField(
                controller: _contentController,
                decoration: const InputDecoration(labelText: 'ChordPro Content'),
                keyboardType: TextInputType.multiline,
                maxLines: null,
                expands: true,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: Row(
                    children: [
                      const Text('Preview'),
                      Switch(value: _showPreview, onChanged: (v) => setState(() => _showPreview = v)),
                      const SizedBox(width: 8),
                      const Text('Transpose'),
                      IconButton(onPressed: () => setState(() => _transpose = (_transpose - 1).clamp(-11, 11)), icon: const Icon(Icons.remove)),
                      Text('$_transpose'),
                      IconButton(onPressed: () => setState(() => _transpose = (_transpose + 1).clamp(-11, 11)), icon: const Icon(Icons.add)),
                    ],
                  ),
                ),
              ],
            ),
            if (_showPreview) SizedBox(height: 180, child: SingleChildScrollView(child: ChordProPreview(chordPro: _contentController.text, transpose: _transpose))),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: _saving ? null : _save,
                    child: _saving ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator()) : const Text('Save'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton(
                    onPressed: _saving ? null : () => Navigator.of(context).pop(false),
                    child: const Text('Cancel'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
