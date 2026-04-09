import React, { useEffect, useRef, useState } from 'react';

export default function AlphaTabViewer({ source, format = 'auto', tracks, transpose = 0, capo = 0 }) {
  const containerRef = useRef(null);
  const apiRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Create / load the alphaTab instance when the source changes
  useEffect(() => {
    let mounted = true;
    setError(null);
    setLoading(true);

    (async () => {
      if (!containerRef.current) return;
      try {
        const alpha = await import('@coderline/alphatab');
        const AlphaTabApi = alpha?.AlphaTabApi ?? alpha?.default?.AlphaTabApi ?? (alpha?.default ?? alpha).AlphaTabApi ?? alpha.AlphaTabApi;
        const api = new AlphaTabApi(containerRef.current, { core: { tex: true, fontDirectory: '/alphatab-font/', useWorkers: false } });
        apiRef.current = api;

        let fmt = format;
        if (fmt === 'auto') {
          const s = (source || '').trim();
          if (s.startsWith('<') || s.startsWith('<?xml') || s.includes('<score')) {
            fmt = 'musicxml';
          } else {
            fmt = 'alphaTex';
          }
        }

        if (fmt === 'alphaTex') {
          if (source) api.tex(source, tracks);
        } else if (fmt === 'musicxml') {
          if (source) {
            const encoder = new TextEncoder();
            const bytes = encoder.encode(source);
            api.load(bytes);
          }
        } else if (fmt === 'url') {
          if (source) api.load(source);
        } else {
          if (source) api.tex(source, tracks);
        }

        // Try to apply transpose/capo after load; retry a few times while score may still be parsing
        const start = Date.now();
        const maxMs = 2000;
        const applySettings = () => {
          try {
            const a = apiRef.current;
            if (!a) return;
            a.settings = a.settings || {};
            a.settings.notation = a.settings.notation || {};
            const semis = Number(transpose) || 0;
            const trackCount = (a.score && a.score.tracks && a.score.tracks.length) || (Array.isArray(tracks) ? tracks.length : 1);
            a.settings.notation.transpositionPitches = new Array(trackCount).fill(semis);
            a.settings.notation.displayTranspositionPitches = new Array(trackCount).fill(semis);
            if (a.updateSettings) a.updateSettings();

            if (capo && a.score && a.score.tracks) {
              a.score.tracks.forEach((t) => {
                if (t && t.staves) {
                  t.staves.forEach((s) => { s.capo = Number(capo); });
                }
              });
              if (a.updateSettings) a.updateSettings();
            }
          } catch (err) {
            // swallow and retry
            console.warn('AlphaTab applySettings failed', err);
          }
        };

        const tryApply = () => {
          try {
            applySettings();
            if (mounted) setLoading(false);
          } catch (e) {
            if (Date.now() - start < maxMs) setTimeout(tryApply, 150);
            else if (mounted) setLoading(false);
          }
        };
        tryApply();
      } catch (e) {
        console.error('AlphaTab load error', e);
        if (mounted) setError(e?.message ?? String(e));
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      if (apiRef.current) {
        try { apiRef.current.destroy(); } catch (e) { /* ignore */ }
        apiRef.current = null;
      }
    };
  }, [source, format, tracks]);

  // Re-apply transpose/capo when those props change without reloading the whole viewer
  useEffect(() => {
    const start = Date.now();
    const maxMs = 2000;
    const applySettings = () => {
      try {
        const a = apiRef.current;
        if (!a) return;
        a.settings = a.settings || {};
        a.settings.notation = a.settings.notation || {};
        const semis = Number(transpose) || 0;
        const trackCount = (a.score && a.score.tracks && a.score.tracks.length) || (Array.isArray(tracks) ? tracks.length : 1);
        a.settings.notation.transpositionPitches = new Array(trackCount).fill(semis);
        a.settings.notation.displayTranspositionPitches = new Array(trackCount).fill(semis);
        if (a.updateSettings) a.updateSettings();

        if (capo && a.score && a.score.tracks) {
          a.score.tracks.forEach((t) => {
            if (t && t.staves) {
              t.staves.forEach((s) => { s.capo = Number(capo); });
            }
          });
          if (a.updateSettings) a.updateSettings();
        }
      } catch (err) {
        if (Date.now() - start < maxMs) setTimeout(applySettings, 150);
      }
    };
    applySettings();
  }, [transpose, capo, tracks]);

  return (
    <div className="alphatab-wrapper">
      <div ref={containerRef} style={{ width: '100%' }} />
      {loading && <div className="text-xs text-gray-500 mt-2">Loading notation preview…</div>}
      {error && <div className="text-xs text-red-600 mt-2">Preview error: {error}</div>}
    </div>
  );
}
