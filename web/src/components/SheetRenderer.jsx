import React, { useMemo } from 'react';
import ChordSheetJS from 'chordsheetjs';
import { Key } from 'chordsheetjs';
import AlphaTabViewer from './AlphaTabViewer';
import { getCapoText } from '../utils/outputs';

const escapeHtml = (unsafe) => {
  if (!unsafe) return '';
  return String(unsafe)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
};

export default function SheetRenderer({ sheetType, content, originalKey, targetKey, capo = 0, className = '', style = {}, forPrint = false }) {
  // compute semitone distance for transposition (used for ChordPro and notation/tab rendering)
  let distance = 0;
  try { distance = (originalKey && targetKey) ? Key.distance(originalKey, targetKey) : 0; } catch { distance = 0; }

  const html = useMemo(() => {
    try {
      if (!content) return '';

      const formatter = new ChordSheetJS.HtmlTableFormatter();

      if (sheetType === 'ChordsOverWords') {
        const parser = new ChordSheetJS.ChordsOverWordsParser();
        const song = parser.parse(content);
        return formatter.format(song);
      }

      if (sheetType === 'UltimateGuitar') {
        const parser = new ChordSheetJS.UltimateGuitarParser();
        const song = parser.parse(content);
        return formatter.format(song);
      }

      if (sheetType === 'ChordPro' || !sheetType) {
        const parser = new ChordSheetJS.ChordProParser();
        const normalized = content.replaceAll('{ci:', '{c:');
        const song = parser.parse(normalized);
        const transposedSong = distance ? song.transpose(distance) : song;
        const title = transposedSong.title ?? '';
        const changedTitleSong = transposedSong.changeMetadata('title', capo !== 0 ? `${title} (Capo on ${getCapoText(capo)})` : title);
        return formatter.format(changedTitleSong);
      }

      // Notation/tab types - for printing fall back to source, otherwise render with alphaTab
      if (sheetType === 'SheetMusic' || sheetType === 'GuitarTabs') {
        return `<pre class="whitespace-pre-wrap">${escapeHtml(content)}</pre>`;
      }

      // Fallback: show raw source
      return `<pre class="whitespace-pre-wrap">${escapeHtml(content)}</pre>`;
    } catch (e) {
      console.error(e);
      return '';
    }
  }, [sheetType, content, originalKey, targetKey, capo]);

  if (sheetType === 'SheetMusic' || sheetType === 'GuitarTabs') {
    if (forPrint) {
      return <div className={className} style={style} dangerouslySetInnerHTML={{ __html: html }} />;
    }
    return (
      <div className={className} style={style}>
        <AlphaTabViewer source={content} format="auto" transpose={distance} capo={capo} />
      </div>
    );
  }

  return <div className={className} style={style} dangerouslySetInnerHTML={{ __html: html }} />;
}
