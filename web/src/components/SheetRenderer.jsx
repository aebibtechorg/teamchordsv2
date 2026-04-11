import React, { useMemo, useEffect, useRef, useState } from 'react';
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

  // Helper component to prepare and render notation for print by exporting SVG/PNG from AlphaTab
  const PrintNotation = ({ source, format = 'auto', transpose = 0, capo = 0, className = '', style = {} }) => {
    const viewerRef = useRef(null);
    const [exported, setExported] = useState(null);

    const doExport = async () => {
      try {
        if (viewerRef.current && viewerRef.current.exportForPrint) {
          const res = await viewerRef.current.exportForPrint(3000);
          if (res?.kind === 'svg') {
            // Try to ensure responsive width
            let svg = res.data;
            try {
              const parser = new DOMParser();
              const doc = parser.parseFromString(svg, 'image/svg+xml');
              const root = doc.documentElement;
              if (root) {
                root.setAttribute('width', '100%');
                root.setAttribute('height', 'auto');
                svg = new XMLSerializer().serializeToString(doc);
              }
            } catch (e) {
              // ignore parser errors
            }
            setExported(svg);
            return;
          }
          if (res?.kind === 'png') {
            setExported(`<img src="${res.data}" style="width:100%;height:auto;" />`);
            return;
          }
        }
      } catch (e) {
        // ignore
      }
      // Fallback to raw source text
      setExported(`<pre class="whitespace-pre-wrap">${escapeHtml(source)}</pre>`);
    };

    useEffect(() => {
      let mounted = true;
      doExport();

      const onBeforePrint = () => { if (mounted) doExport(); };
      window.addEventListener('beforeprint', onBeforePrint);
      const mql = window.matchMedia && window.matchMedia('print');
      const onMedia = (e) => { if (e.matches && mounted) doExport(); };
      try { mql?.addEventListener?.('change', onMedia); } catch (e) { try { mql?.addListener?.(onMedia); } catch (e) {} }

      return () => {
        mounted = false;
        window.removeEventListener('beforeprint', onBeforePrint);
        try { mql?.removeEventListener?.('change', onMedia); } catch (e) { try { mql?.removeListener?.(onMedia); } catch (e) {} }
      };
    }, [source, transpose, capo]);

    return (
      <div className={className} style={style}>
        {/* Keep a live viewer mounted (hidden) while exporting so alphatab can render */}
        {!exported && (
          <div style={{ position: 'relative' }}>
            <AlphaTabViewer ref={viewerRef} source={source} format={format} transpose={transpose} capo={capo} />
          </div>
        )}
        {exported ? <div dangerouslySetInnerHTML={{ __html: exported }} /> : <div className="text-sm text-gray-600">Preparing notation for print…</div>}
      </div>
    );
  };

  if (sheetType === 'SheetMusic' || sheetType === 'GuitarTabs') {
    if (forPrint) {
      return <PrintNotation source={content} format="auto" transpose={distance} capo={capo} className={className} style={style} />;
    }
    return (
      <div className={className} style={style}>
        <AlphaTabViewer source={content} format="auto" transpose={distance} capo={capo} />
      </div>
    );
  }

  return <div className={className} style={style} dangerouslySetInnerHTML={{ __html: html }} />;
}
