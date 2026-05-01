import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { getOutputs, getCapoText } from "../utils/outputs";
import { getSetList } from "../utils/setlists";
import ChordSheetJS from "chordsheetjs";
import { Key } from "chordsheetjs";
import { Guitar, PrinterIcon, SlidersHorizontal } from "lucide-react";
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

const SetListView = () => {
    const { id } = useParams();
    const [setlist, setSetlist] = useState(null);
    const [outputs, setOutputs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pageSize, setPageSize] = useState("letter");
    const [controlsOpen, setControlsOpen] = useState(false);
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
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        const fetchSet = async () => {
            const setlistData = await getSetList(id);
            const outputData = await getOutputs(id);
            setSetlist(setlistData);
            setOutputs(outputData ?? []);
            document.title = setlistData?.name ? `Team Chords - ${setlistData.name}` : "Team Chords";
        };

        fetchSet().then(() => setIsLoading(false)).catch(() => {
            toast.error(`An error has occured.`);
            setIsLoading(false);
        });
    }, [id]);

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
            }
        });

        setlistConn.on("OutputCreated", (o) => {
            const setListId = o?.setListId ?? o?.SetListId ?? o?.setlistid;
            if (setListId && String(setListId) === String(id)) {
                const newOutput = {
                    id: o.id ?? o.Id,
                    setListId: o.setListId ?? o.SetListId,
                    targetKey: o.targetKey ?? o.TargetKey,
                    chordSheetId: o.chordSheetId ?? o.ChordSheetId,
                    capo: o.capo ?? o.Capo,
                    order: o.order ?? o.Order,
                    createdAt: o.createdAt ?? o.CreatedAt,
                    updatedAt: o.updatedAt ?? o.UpdatedAt,
                    chordsheets: o.chordsheets ?? o.Chordsheets
                };
                setOutputs(prevOutputs => [...prevOutputs, newOutput].sort((a, b) => a.order - b.order));
            }
        });

        setlistConn.on("OutputUpdated", (o) => {
            const setListId = o?.setListId ?? o?.SetListId ?? o?.setlistid;
            const outputId = o?.id ?? o?.Id;
            if (setListId && String(setListId) === String(id)) {
                const updatedOutput = {
                    id: o.id ?? o.Id,
                    setListId: o.setListId ?? o.SetListId,
                    targetKey: o.targetKey ?? o.TargetKey,
                    chordSheetId: o.chordSheetId ?? o.ChordSheetId,
                    capo: o.capo ?? o.Capo,
                    order: o.order ?? o.Order,
                    createdAt: o.createdAt ?? o.CreatedAt,
                    updatedAt: o.updatedAt ?? o.UpdatedAt,
                    chordsheets: o.chordsheets ?? o.Chordsheets
                };
                setOutputs(prevOutputs => prevOutputs.map(prevOutput => String(prevOutput.id) === String(outputId) ? updatedOutput : prevOutput).sort((a, b) => a.order - b.order));
            }
        });

        setlistConn.on("OutputDeleted", (outputId) => {
            const oid = outputId?.id ?? outputId?.Id ?? outputId;
            setOutputs(prevOutputs => prevOutputs.filter(p => String(p.id) !== String(oid)).sort((a, b) => a.order - b.order));
        });

        setlistConn.on("ChordSheetUpdated", (cs) => {
            const csId = cs?.id ?? cs?.Id;
            setOutputs(prevOutputs => {
                return prevOutputs.map(output => {
                    if (output.chordSheetId === csId) {
                        return {
                            ...output,
                            chordsheets: {
                                ...(output.chordsheets ?? {}),
                                key: cs.key ?? cs.Key,
                                content: cs.content ?? cs.Content
                            }
                        };
                    }
                    return output;
                }).sort((a, b) => a.order - b.order);
            });
        });

        setlistConn.on("ChordSheetDeleted", (csId) => {
            const deletedCsId = csId?.id ?? csId?.Id ?? csId;
            setOutputs(prevOutputs => {
                return prevOutputs.map(output => {
                    if (String(output.chordSheetId) === String(deletedCsId)) {
                        return {
                            ...output,
                            chordsheets: null
                        };
                    }
                    return output;
                }).sort((a, b) => a.order - b.order);
            });
        });

        setlistConn.start().catch((err) => console.error("SetList SignalR Connection Error: ", err));

        return () => {
            try { setlistConn.stop().catch(() => {}); } catch (e) {}
        };
    }, [id]);

    const renderChordPro = (chordProContent, originalKey, targetKey, capo) => {
        try {
            if (chordProContent) {
                const parser = new ChordSheetJS.ChordProParser();
                const distance = Key.distance(originalKey, targetKey);
                chordProContent = chordProContent.replaceAll('{ci:', '{c:');
                const song = parser.parse(chordProContent);
                const transposedSong = song.transpose(distance);
                const changedTitleSong = transposedSong.changeMetadata('title', capo !== 0 ? `${transposedSong.title} (Capo on ${getCapoText(capo)})` : transposedSong.title);
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
            <style dangerouslySetInnerHTML={{__html: `@page { size: ${PAGE_SIZES[pageSize].size}; }`}} />

            <h2 className="print:hidden text-center text-sm md:text-base lg:text-lg font-bold sticky top-0 left-0 z-10 w-full bg-gray-700 text-white py-4 shadow-md">
                <span>{setlist.name}</span>
            </h2>

            {/* Print-only output */}
            <div className="hidden print:block">
                {outputs.map((output) => (
                    <pre key={output.id} dangerouslySetInnerHTML={{ __html: renderChordPro(output.chordsheets.content, output.chordsheets.key, output.targetKey, output.capo) }} />
                ))}
            </div>

            {/* Floating controls */}
            <div
                ref={controlsRef}
                className="print:hidden fixed z-20 right-3 bottom-3 lg:right-4 lg:bottom-4"
            >
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
                                transition={{ duration: 0.2, ease: "easeOut" }}
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
                                        Print set list
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Scaled page previews */}
            <div className="print:hidden md:px-4">
                <AnimatePresence initial={false} mode="popLayout">
                    {outputs.map((output, index) => (
                        <AnimatedOutputCard
                            key={output.id ?? `${output.chordSheetId}-${output.order ?? index}`}
                            layout
                            initial={{ opacity: 0, y: 16, scale: 0.985 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -16, scale: 0.985 }}
                            transition={{ duration: 0.24, ease: "easeOut" }}
                        >
                            <ScaledPage
                                html={renderChordPro(output.chordsheets.content, output.chordsheets.key, output.targetKey, output.capo)}
                                pageSizeKey={pageSize}
                            />
                        </AnimatedOutputCard>
                    ))}
                </AnimatePresence>
            </div>

            <footer className="print:hidden text-center text-sm text-white w-full bg-gray-700 mt-8 py-2">
                <p>Generated by <a href={window.location.origin} target="_blank" rel="noopener noreferrer"><Guitar className="inline-block" /> Team Chords</a></p>
            </footer>

            {/* Bluetooth Pedal */}
            {/*<div className="print:hidden fixed bottom-4 right-4 z-20">*/}
            {/*    <BluetoothPedal*/}
            {/*        outputs={outputs}*/}
            {/*        setOutputs={setOutputs}*/}
            {/*        show={showPedal}*/}
            {/*        onClose={() => setShowPedal(false)}*/}
            {/*    />*/}
            {/*    <button*/}
            {/*        onClick={() => setShowPedal(true)}*/}
            {/*        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow-md"*/}
            {/*    >*/}
            {/*        <BluetoothPedal className="w-5 h-5" />*/}
            {/*        Show Pedal*/}
            {/*    </button>*/}
            {/*</div>*/}
        </div>
    );
};

export default SetListView;
