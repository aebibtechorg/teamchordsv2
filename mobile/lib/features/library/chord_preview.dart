import 'package:flutter/material.dart';
import '../../utils/chord_parser.dart';

class ChordProPreview extends StatelessWidget {
  final String chordPro;
  final int transpose;

  const ChordProPreview({super.key, required this.chordPro, this.transpose = 0});

  @override
  Widget build(BuildContext context) {
    final lines = chordPro.split('\n');
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: lines.map((l) => _buildLine(context, l)).toList(),
    );
  }

  Widget _buildLine(BuildContext context, String line) {
    final pattern = RegExp(r'\[([^\]]+)\]');
    final matches = pattern.allMatches(line).toList();
    final segments = <Map<String, String>>[];

    if (matches.isEmpty) {
      segments.add({'chord': '', 'text': line});
    } else {
      int pos = 0;
      for (var i = 0; i < matches.length; i++) {
        final m = matches[i];
        if (m.start > pos) {
          // text before the chord
          segments.add({'chord': '', 'text': line.substring(pos, m.start)});
        }
        final chord = m.group(1) ?? '';
        final nextStart = (i + 1 < matches.length) ? matches[i + 1].start : line.length;
        final textAfter = line.substring(m.end, nextStart);
        segments.add({'chord': chord, 'text': textAfter});
        pos = nextStart;
      }
      if (pos < line.length) {
        segments.add({'chord': '', 'text': line.substring(pos)});
      }
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2.0),
      child: Wrap(
        crossAxisAlignment: WrapCrossAlignment.center,
        children: segments.map((s) {
          final chord = s['chord'] ?? '';
          final text = s['text'] ?? '';
          final displayChord = chord.isEmpty ? '' : transposeChord(chord, transpose);
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 2.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  height: 18,
                  child: Text(
                    displayChord,
                    style: TextStyle(fontSize: 12, fontFamily: 'monospace', color: Colors.blue[800]),
                  ),
                ),
                Text(text, style: const TextStyle(fontSize: 14)),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }
}
