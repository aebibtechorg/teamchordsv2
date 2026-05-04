import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { getOutputs, getCapoText } from "../utils/outputs";
import { getSetList } from "../utils/setlists";
import { keys } from "../constants";
import { clearLiveViewOverrides, clearLiveViewSnapshot, loadLiveViewOverrides, loadLiveViewSnapshot, saveLiveViewOverrides, saveLiveViewSnapshot } from "../utils/liveViewCache";
import ChordSheetJS from "chordsheetjs";
import { Key } from "chordsheetjs";
import { Guitar, PrinterIcon, RefreshCw, SlidersHorizontal } from "lucide-react";
import { HubConnectionBuilder } from "@microsoft/signalr";
import { Toaster, toast } from 'react-hot-toast';
import { AnimatePresence, motion } from "framer-motion";
import Spinner from "../components/Spinner";
import { getSignalRHubUrl } from "../utils/signalr";

// Paper sizes in px at 96dpi
const PAGE_SIZES = {
    letter: { widthPx: 816,  heightPx: 1056, size: 'letter', label: 'Letter' },
    a4:     { widthPx: 794,  heightPx: 1123, size: 'a4',     label: 'A4'     },
    legal:  { widthPx: 816,  heightPx: 1344, size: 'legal',  label: 'Legal'  },
};

// Renders a chord sheet scaled to fit its wrapper, preserving paper aspect ratio
const ScaledPage = ({ html, pageSizeKey }) => {
    const wrapperRef = useRef(null);
    const [scale, setScale] = useState(1);
    const [wrapperWidth, setWrapperWidth] = useState(0);
    const { widthPx, heightPx } = PAGE_SIZES[pageSizeKey];

    useEffect(() => {
        const el = wrapperRef.current;
        if (!el) return;
        const observer = new ResizeObserver(([entry]) => {
            setScale(entry.contentRect.width / widthPx);
            setWrapperWidth(entry.contentRect.width);
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, [widthPx]);

    if (!html) {
        return (
            <div className="mt-4 rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500 shadow-sm">
                This output does not have chord-sheet content available right now.
            </div>
        );
    }

    const isMobile = wrapperWidth < 768;

    if (isMobile) {
        return (
            <div
                ref={wrapperRef}
                className="mt-4 w-full sheet bg-white shadow-lg border border-gray-200 p-6 text-[14px] overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: html }}
            />
        );
    }

    return (
        <div
            ref={wrapperRef}
            className="mt-4 w-full max-w-4xl mx-auto overflow-hidden"
            style={{ height: heightPx * scale }}
        >
            <pre
                className="columns-2 sheet bg-white shadow-lg border border-gray-200 p-6 text-[12px]"
                dangerouslySetInnerHTML={{ __html: html }}
                style={{
                    width: widthPx,
                    height: heightPx,
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                    columnGap: '10px',
                    columnFill: 'auto',
                    whiteSpace: 'pre-wrap',
                    breakInside: 'avoid'
                }}
            />
        </div>
    );
};

const AnimatedOutputCard = motion.div;

const SHARED_KEY_LABEL = "Use shared key";

const getOutputStorageKey = (output, index) => String(output?.id ?? output?.chordSheetId ?? output?.order ?? index);

const getResolvedKey = (output, overrides, index) => {
    const storageKey = getOutputStorageKey(output, index);
    return overrides?.[storageKey] || output?.targetKey || output?.chordsheets?.key || "";
};

const SetListView = () => {
    const { id } = useParams();
    const [setlist, setSetlist] = useState(null);
    const [outputs, setOutputs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pageSize, setPageSize] = useState("letter");
    const [controlsOpen, setControlsOpen] = useState(false);
    const [personalKeyOverrides, setPersonalKeyOverrides] = useState({});
    const [isOfflineView, setIsOfflineView] = useState(false);
    const controlsRef = useRef(null);

    useEffect(() => {
        if (!controlsOpen) return;

        const handlePointerDown = (event) => {
            if (controlsRef.current && !controlsRef.current.contains(event.target)) {
                setControlsOpen(false);
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setControlsOpen(false);
            }
        };

        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [controlsOpen]);

    useEffect(() => {
        if (!id) {
            setSetlist(null);
            setOutputs([]);
            setPersonalKeyOverrides({});
            setIsOfflineView(false);
            setIsLoading(false);
            return;
        }

        setPersonalKeyOverrides(loadLiveViewOverrides(id));
        setIsLoading(true);
        setIsOfflineView(false);

        const fetchSet = async () => {
            try {
                const setlistData = await getSetList(id);
                const outputData = await getOutputs(id);

                if (setlistData && outputData !== null) {
                    setSetlist(setlistData);
                    setOutputs(outputData ?? []);
                    setIsOfflineView(false);
                    document.title = setlistData?.name ? `Team Chords - ${setlistData.name}` : "Team Chords";
                    saveLiveViewSnapshot(id, {
                        setlist: {
                            id: setlistData?.id ?? id,
                            name: setlistData?.name ?? "",
                            updatedAt: setlistData?.updatedAt ?? null,
                        },
                        outputs: outputData ?? [],
                        savedAt: new Date().toISOString(),
                    });
                    return;
                }
            } catch (error) {
                console.error(error);
            }

            const cachedView = loadLiveViewSnapshot(id);
            if (cachedView?.setlist) {
                setSetlist(cachedView.setlist);
                setOutputs(cachedView.outputs ?? []);
                setIsOfflineView(true);
                document.title = cachedView.setlist?.name ? `Team Chords - ${cachedView.setlist.name}` : "Team Chords";
                toast.success("Loaded the last saved live view for offline use.");
                return;
            }

            toast.error(`An error has occured.`);
            setSetlist(null);
            setOutputs([]);
        };

        fetchSet().finally(() => setIsLoading(false));
    }, [id]);

    useEffect(() => {
        if (!id) {
            return;
        }

        saveLiveViewOverrides(id, personalKeyOverrides);
    }, [id, personalKeyOverrides]);

    useEffect(() => {
        if (!id || !setlist) {
            return;
        }

        saveLiveViewSnapshot(id, {
            setlist: {
                id: setlist?.id ?? id,
                name: setlist?.name ?? "",
                updatedAt: setlist?.updatedAt ?? null,
            },
            outputs,
            savedAt: new Date().toISOString(),
        });
    }, [id, setlist, outputs]);

    useEffect(() => {
        if (!id) return;

        const setlistConn = new HubConnectionBuilder()
            .withUrl(getSignalRHubUrl("/hubs/setlists", { setListId: id }))
            .withAutomaticReconnect()
            .build();

        setlistConn.on("SetListUpdated", (sl) => {
            if (String(sl.id ?? sl.Id) === String(id)) {
                setSetlist(prevSetlist => ({
                    ...(prevSetlist ?? {}),
                    name: sl.name ?? sl.Name,
                    updatedAt: sl.updatedAt ?? sl.UpdatedAt
                }));
            }
        });

        setlistConn.on("SetListDeleted", (sid) => {
            if (String(sid?.id ?? sid?.Id ?? sid) === String(id)) {
                setSetlist(null);
                setOutputs([]);
                clearLiveViewSnapshot(id);
                clearLiveViewOverrides(id);
            }
        });

        const upsertOutput = (outputPayload) => {
            const setListId = outputPayload?.setListId ?? outputPayload?.SetListId ?? outputPayload?.setlistid;
            if (!setListId || String(setListId) !== String(id)) return;

            const normalized = {
                id: outputPayload.id ?? outputPayload.Id,
                setListId: outputPayload.setListId ?? outputPayload.SetListId,
                targetKey: outputPayload.targetKey ?? outputPayload.TargetKey,
                chordSheetId: outputPayload.chordSheetId ?? outputPayload.ChordSheetId,
                capo: outputPayload.capo ?? outputPayload.Capo,
                order: outputPayload.order ?? outputPayload.Order,
                createdAt: outputPayload.createdAt ?? outputPayload.CreatedAt,
                updatedAt: outputPayload.updatedAt ?? outputPayload.UpdatedAt,
                chordsheets: outputPayload.chordsheets ?? outputPayload.Chordsheets,
            };

            setOutputs((prevOutputs) => {
                const without = prevOutputs.filter((prevOutput) => String(prevOutput.id) !== String(normalized.id));
                return [...without, normalized].sort((a, b) => a.order - b.order);
            });
        };

        setlistConn.on('OutputCreated', upsertOutput);
        setlistConn.on('OutputUpdated', upsertOutput);

        setlistConn.on('OutputDeleted', (outputId) => {
            const oid = outputId?.id ?? outputId?.Id ?? outputId;
            setOutputs((prevOutputs) => prevOutputs.filter((p) => String(p.id) !== String(oid)).sort((a, b) => a.order - b.order));
        });

        setlistConn.on('ChordSheetUpdated', (cs) => {
            const csId = cs?.id ?? cs?.Id;
            setOutputs((prevOutputs) => prevOutputs.map((output) => {
                if (String(output.chordSheetId) === String(csId)) {
                    return {
                        ...output,
                        chordsheets: {
                            ...(output.chordsheets ?? {}),
                            key: cs.key ?? cs.Key,
                            content: cs.content ?? cs.Content,
                        },
                    };
                }
                return output;
            }).sort((a, b) => a.order - b.order));
        });

        setlistConn.on('ChordSheetDeleted', (csId) => {
            const deletedCsId = csId?.id ?? csId?.Id ?? csId;
            setOutputs((prevOutputs) => prevOutputs.map((output) => {
                if (String(output.chordSheetId) === String(deletedCsId)) {
                    return {
                        ...output,
                        chordsheets: null,
                    };
                }
                return output;
            }).sort((a, b) => a.order - b.order));
        });

        setlistConn.start().catch((err) => console.error('SetList SignalR Connection Error:', err));

        return () => {
            try {
                setlistConn.stop().catch(() => {});
            } catch {
                // ignore
            }
        };
    }, [id]);

    const renderChordPro = (chordProContent, originalKey, targetKey, capo) => {
        try {
            if (chordProContent) {
                const parser = new ChordSheetJS.ChordProParser();
                const safeOriginalKey = originalKey || targetKey;
                const safeTargetKey = targetKey || originalKey;
                const normalizedCapo = Number(capo) || 0;
                const distance = safeOriginalKey && safeTargetKey ? Key.distance(safeOriginalKey, safeTargetKey) : 0;
                chordProContent = chordProContent.replaceAll('{ci:', '{c:');
                const song = parser.parse(chordProContent);
                const transposedSong = song.transpose(distance);
                const changedTitleSong = transposedSong.changeMetadata('title', normalizedCapo !== 0 ? `${transposedSong.title} (Capo on ${getCapoText(normalizedCapo)})` : transposedSong.title);
                const formatter = new ChordSheetJS.HtmlTableFormatter();
                return formatter.format(changedTitleSong);
            }
            return '';
        } catch (error) {
            console.error(error);
            return '';
        }
    };

    if (isLoading) {
        return (
            <div className="w-screen h-screen flex items-center justify-center">
                <Toaster />
                <Spinner />
            </div>
        );
    }

    if (!setlist) {
        return (
            <div className="w-screen h-screen flex flex-col items-center justify-center gap-4">
                <Toaster />
                <h2 className="text-2xl font-bold">Set List Not Found</h2>
                <p>The set list you are looking for does not exist or has been deleted.</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-100">
            <style dangerouslySetInnerHTML={{ __html: `@page { size: ${PAGE_SIZES[pageSize].size}; }` }} />

            <h2 className="print:hidden sticky top-0 left-0 z-10 w-full bg-gray-700 px-4 py-4 text-center text-sm font-bold text-white shadow-md md:text-base lg:text-lg">
                <span>{setlist.name}</span>
            </h2>

            <div className="print:hidden mx-auto mt-4 max-w-4xl px-4">
                <div className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${isOfflineView ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="font-semibold">{isOfflineView ? 'Offline snapshot' : 'Live Mode'}</p>
                            <p className="mt-1 text-sm">
                                {isOfflineView
                                    ? 'This view was loaded from a previously opened live set list and can be used offline.'
                                    : 'Shared updates appear in real time when the creator changes the set list.'}
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                            <span className="rounded-full bg-white/70 px-3 py-1">{isOfflineView ? 'Offline ready' : 'Real-time sync'}</span>
                            <span className="rounded-full bg-white/70 px-3 py-1">Personal transpose is local only</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="hidden print:block">
                {outputs.map((output) => (
                    <pre key={output.id} dangerouslySetInnerHTML={{ __html: renderChordPro(output.chordsheets?.content, output.chordsheets?.key, output.targetKey, output.capo) }} />
                ))}
            </div>

            <div ref={controlsRef} className="print:hidden fixed z-20 right-3 bottom-3 lg:right-4 lg:bottom-4">
                <div className="relative flex items-end justify-end">
                    <button
                        type="button"
                        onClick={() => setControlsOpen((open) => !open)}
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-700 bg-gray-800 text-white shadow-2xl transition-colors hover:bg-gray-700"
                        aria-expanded={controlsOpen}
                        aria-label="View controls"
                    >
                        <SlidersHorizontal size={18} />
                    </button>

                    <AnimatePresence initial={false}>
                        {controlsOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                                transition={{ duration: 0.2, ease: 'easeOut' }}
                                className="absolute bottom-14 right-0 w-56 overflow-hidden rounded-2xl border border-gray-700 bg-gray-800 text-white shadow-2xl lg:w-60"
                            >
                                <div className="flex flex-col gap-2 p-3">
                                    <label className="block text-sm font-medium text-gray-200">
                                        Page size
                                        <select
                                            value={pageSize}
                                            onChange={(e) => setPageSize(e.target.value)}
                                            className="mt-2 w-full rounded-md bg-gray-700 px-2.5 py-2 text-sm text-white outline-none ring-1 ring-transparent transition focus:ring-gray-400"
                                        >
                                            {Object.entries(PAGE_SIZES).map(([key, { label }]) => (
                                                <option key={key} value={key}>{label}</option>
                                            ))}
                                        </select>
                                    </label>

                                    <button
                                        onClick={() => window.print()}
                                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-600"
                                    >
                                        <PrinterIcon size={16} />
                                        Print / Save PDF
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="print:hidden md:px-4">
                <AnimatePresence initial={false} mode="popLayout">
                    {outputs.map((output, index) => {
                        const outputStorageKey = getOutputStorageKey(output, index);
                        const overrideKey = personalKeyOverrides[outputStorageKey] ?? '';

                        return (
                            <AnimatedOutputCard
                                key={output.id ?? `${output.chordSheetId}-${output.order ?? index}`}
                                layout
                                initial={{ opacity: 0, y: 16, scale: 0.985 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -16, scale: 0.985 }}
                                transition={{ duration: 0.24, ease: 'easeOut' }}
                            >
                                <div className="mx-auto mt-4 w-full max-w-4xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
                                    <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">Song {index + 1}</p>
                                            <p className="text-xs text-gray-500">
                                                Shared key: {output.targetKey || '—'} · Original key: {output.chordsheets?.key || '—'}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap items-end gap-3">
                                            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Personal transpose
                                                <select
                                                    value={overrideKey}
                                                    onChange={(e) => {
                                                        const nextValue = e.target.value;
                                                        setPersonalKeyOverrides((prev) => {
                                                            const next = { ...prev };
                                                            if (nextValue) {
                                                                next[outputStorageKey] = nextValue;
                                                            } else {
                                                                delete next[outputStorageKey];
                                                            }
                                                            return next;
                                                        });
                                                    }}
                                                    className="mt-1 w-44 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-normal text-gray-900 outline-none transition focus:border-gray-500"
                                                >
                                                    <option value="">{SHARED_KEY_LABEL}</option>
                                                    {keys.map((key) => (
                                                        <option key={key} value={key}>{key}</option>
                                                    ))}
                                                </select>
                                            </label>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPersonalKeyOverrides((prev) => {
                                                        if (!(outputStorageKey in prev)) {
                                                            return prev;
                                                        }
                                                        const next = { ...prev };
                                                        delete next[outputStorageKey];
                                                        return next;
                                                    });
                                                }}
                                                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                                                disabled={!overrideKey}
                                            >
                                                <RefreshCw size={14} />
                                                Reset
                                            </button>
                                        </div>
                                    </div>

                                    <ScaledPage
                                        html={renderChordPro(
                                            output.chordsheets?.content,
                                            output.chordsheets?.key,
                                            getResolvedKey(output, personalKeyOverrides, index),
                                            output.capo,
                                        )}
                                        pageSizeKey={pageSize}
                                    />
                                </div>
                            </AnimatedOutputCard>
                        );
                    })}
                </AnimatePresence>
            </div>

            <footer className="print:hidden text-center text-sm text-white w-full bg-gray-700 mt-8 py-2">
                <p>
                    Generated by{' '}
                    <a href={window.location.origin} target="_blank" rel="noopener noreferrer">
                        <Guitar className="inline-block" /> Team Chords
                    </a>
                </p>
            </footer>
        </div>
    );
};

export default SetListView;
