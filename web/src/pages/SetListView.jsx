import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { getOutputs, getCapoText } from "../utils/outputs";
import { getSetList } from "../utils/setlists";
import ChordSheetJS from "chordsheetjs";
import { Key } from "chordsheetjs";
import { Guitar, PrinterIcon } from "lucide-react";
import { HubConnectionBuilder } from "@microsoft/signalr";
import { Toaster, toast } from 'react-hot-toast';
import Spinner from "../components/Spinner";

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

const SetListView = () => {
    const { id } = useParams();
    const [setlist, setSetlist] = useState(null);
    const [outputs, setOutputs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pageSize, setPageSize] = useState("letter");

    useEffect(() => {
        const signalRHub = '/hubs';

        const fetchSet = async () => {
            const setlistData = await getSetList(id);
            const outputData = await getOutputs(id);
            setSetlist(setlistData);
            setOutputs(outputData);
            document.title = `Team Chords - ${setlistData.name}`;
        };
        fetchSet().then(() => setIsLoading(false)).catch(() => {
            toast.error(`An error has occured.`);
            setIsLoading(false);
        });

        const setlistConn = new HubConnectionBuilder()
            .withUrl(`${signalRHub}/setlists`)
            .withAutomaticReconnect()
            .build();

        setlistConn.on("SetListUpdated", (sl) => {
            if (String(sl.id) === String(id)) {
                setSetlist(prevSetlist => ({
                    ...prevSetlist,
                    name: sl.name ?? sl.Name,
                    updatedAt: sl.updatedAt ?? sl.UpdatedAt
                }));
            }
        });

        setlistConn.on("SetListDeleted", (sid) => {
            if (String(sid) === String(id)) {
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
                                ...output.chordsheets,
                                key: cs.key,
                                content: cs.content
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
                    if (output.chordSheetId === deletedCsId) {
                        return {
                            ...output,
                            chordsheets: null
                        };
                    }
                    return output;
                }).sort((a, b) => a.order - b.order);
            });
        });

        // Start connections
        setlistConn.start().catch((err) => console.error("SetList SignalR Connection Error: ", err));

        // Cleanup on unmount — stop connections
        return () => {
            try { setlistConn.stop().catch(() => {}); } catch (e) {}
        };
    }, []);

    useEffect(() => {
        if (outputs.length > 0) {
            document.querySelectorAll('.sheet h1').forEach((element) => {
                element.style.fontWeight = 'bold';
                element.style.textAlign = 'center';
                element.style.fontSize = '1.5rem';
            });
        }
    }, [outputs, id]);

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
        <div className="bg-gray-100 pb-8">
            <style dangerouslySetInnerHTML={{__html: `@page { size: ${PAGE_SIZES[pageSize].size}; }`}} />

            {/* Print-only output */}
            <div className="hidden print:block">
                {outputs.map((output) => (
                    <pre key={output.id} dangerouslySetInnerHTML={{ __html: renderChordPro(output.chordsheets.content, output.chordsheets.key, output.targetKey, output.capo) }} />
                ))}
            </div>

            {/* Toolbar */}
            <h2 className="print:hidden text-center text-sm md:text-base lg:text-lg font-bold sticky top-0 left-0 z-10 w-full bg-gray-700 text-white py-4 shadow-md flex items-center gap-2 justify-center">
                <span>{setlist.name}</span>
                <select
                    value={pageSize}
                    onChange={(e) => setPageSize(e.target.value)}
                    className="hidden md:flex bg-gray-500 hover:bg-gray-600 p-2 rounded font-normal text-white"
                >
                    {Object.entries(PAGE_SIZES).map(([key, { label }]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </select>
                <button
                    onClick={() => window.print()}
                    className="flex items-center justify-center gap-1 bg-gray-500 hover:bg-gray-600 p-2 rounded font-normal"
                >
                    <PrinterIcon size={18} /> Print
                </button>
            </h2>

            {/* Scaled page previews */}
            <div className="print:hidden md:px-4">
                {outputs.map((output) => (
                    <ScaledPage
                        key={output.id}
                        html={renderChordPro(output.chordsheets.content, output.chordsheets.key, output.targetKey, output.capo)}
                        pageSizeKey={pageSize}
                    />
                ))}
            </div>

            <footer className="print:hidden text-center text-sm text-white w-full bg-gray-700 mt-8 py-2">
                <p>Generated by <a href={window.location.origin} target="_blank" rel="noopener noreferrer"><Guitar className="inline-block" /> Team Chords</a></p>
            </footer>
        </div>
    );
};

export default SetListView;

