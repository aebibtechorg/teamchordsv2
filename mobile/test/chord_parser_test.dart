import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/utils/chord_parser.dart';

void main() {
  test('transposeChord with 0 steps returns same chord', () {
    expect(transposeChord('C', 0), 'C');
    expect(transposeChord('Gm', 0), 'Gm');
  });

  test('parseChordPro splits lines', () {
    final data = 'Title: Foo\n{start_of_chorus}\n[C]Hello';
    final lines = parseChordPro(data);
    expect(lines.length, 3);
  });

  test('transposeChord basic shifts', () {
    expect(transposeChord('C', 2), 'D');
    expect(transposeChord('Gm', 2), 'Am');
    expect(transposeChord('Bb', 2), 'C');
    expect(transposeChord('Am7/G', 2), 'Bm7/A');
  });
}
