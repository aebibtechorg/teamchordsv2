/// Minimal ChordPro / chord parsing utilities
library;

List<String> parseChordPro(String input) {
  return input.split('\n');
}

String transposeChord(String chord, int steps) {
  if (chord.trim().isEmpty) return chord;

  // Handle optional bass (e.g. Am7/G)
  final parts = chord.split('/');
  final main = parts[0];
  final bass = parts.length > 1 ? parts.sublist(1).join('/') : null;

  String transposePart(String part) {
    final m = RegExp(r'^([A-Ga-g][#bB]?)(.*)$').firstMatch(part);
    if (m == null) return part;
    final root = m.group(1)!;
    final suffix = m.group(2)!;
    final newRoot = _transposeRoot(root, steps);
    return '$newRoot$suffix';
  }

  final newMain = transposePart(main);
  if (bass != null && bass.isNotEmpty) {
    final newBass = transposePart(bass);
    return '$newMain/$newBass';
  }

  return newMain;
}

String _transposeRoot(String root, int steps) {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  String letter = root.substring(0, 1).toUpperCase();
  String accidental = root.length > 1 ? root.substring(1) : '';
  if (accidental == 'B') accidental = 'b';

  // Normalize flats to sharps where necessary
  final flats = {
    'Db': 'C#',
    'Eb': 'D#',
    'Gb': 'F#',
    'Ab': 'G#',
    'Bb': 'A#',
    'Cb': 'B',
    'Fb': 'E'
  };
  final enharmonics = {'E#': 'F', 'B#': 'C'};

  String normalized = letter + accidental;
  if (flats.containsKey(normalized)) normalized = flats[normalized]!;
  if (enharmonics.containsKey(normalized)) normalized = enharmonics[normalized]!;

  final idx = notes.indexOf(normalized);
  if (idx == -1) return root; // unknown root -- return as-is

  var newIdx = (idx + steps) % 12;
  if (newIdx < 0) newIdx += 12;
  return notes[newIdx];
}
