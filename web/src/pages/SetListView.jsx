import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getOutputs, getCapoText } from "../utils/outputs";
import { getSetList } from "../utils/setlists";
import ChordSheetJS from "chordsheetjs";
import { Key } from "chordsheetjs";
import SheetRenderer from "../components/SheetRenderer";
import { Guitar, PrinterIcon } from "lucide-react";
import { HubConnectionBuilder } from "@microsoft/signalr";
import { Toaster, toast } from 'react-hot-toast';
import Spinner from "../components/Spinner";
import { useNavigate } from "react-router-dom";


const SetListView = () => {
    const { id } = useParams();
    const [setlist, setSetlist] = useState(null);
    const [outputs, setOutputs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [ogImage, setOgImage] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const signalRHub = '/hubs';

        const fetchSet = async () => {
            const setlistData = await getSetList(id);
            const outputData = await getOutputs(id);
            
            setSetlist(setlistData);
            setOutputs(outputData);
            document.title = `Team Chords - ${setlistData.name}`;
        };
        fetchSet().then(() => setIsLoading(false)).catch((err) => {
            toast.error(`An error has occured.`)
            setIsLoading(false);
        });
        
        // Setup SignalR hub connections for realtime updates
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

    const escapeHtml = (unsafe) => {
        if (!unsafe) return '';
        return String(unsafe)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    };

    // Rendering is handled by the shared SheetRenderer component.

    const handlePrint = () => {
        window.print();
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
            <div className="hidden print:block">
                {outputs.map((output) => {
                    const sheetType = output.chordsheets?.sheetType;
                    const isNotation = sheetType === 'SheetMusic' || sheetType === 'GuitarTabs';
                    const baseClasses = "sheet overflow-x-auto text-[12px] xl:text-base mt-4 bg-white shadow-lg rounded-lg p-6 w-full border border-gray-200";
                    const textColumnClasses = "columns-1 lg:columns-2 max-w-3xl xl:max-w-5xl";
                    const notationClasses = "max-w-3xl xl:max-w-5xl"; // match printed width with text sheets
                    return (
                        <div key={output.id} className={`${baseClasses} ${isNotation ? notationClasses + ' notation' : textColumnClasses}`} style={isNotation ? undefined : { columnGap: '20px' }}>
                            {output.chordsheets?.content ? (
                                <SheetRenderer sheetType={output.chordsheets.sheetType} content={output.chordsheets.content} originalKey={output.chordsheets.key} targetKey={output.targetKey} capo={output.capo} forPrint={true} />
                            ) : (
                                <pre />
                            )}
                        </div>
                    );
                })}
            </div>
            {setlist && <h2 className="print:hidden text-center text-sm md:text-base lg:text-lg font-bold sticky top-0 left-0 z-10 w-full bg-gray-700 text-white py-4 shadow-md flex items-center gap-2 justify-center"><span>{setlist.name}</span><button onClick={handlePrint} className="flex items-center justify-center gap-1 bg-gray-500 hover:bg-gray-600 p-2 rounded font-normal"><PrinterIcon size={18} /> Print</button></h2>}
            <div className="print:hidden flex flex-col items-center">
            {outputs.map((output) => {
                const sheetType = output.chordsheets?.sheetType;
                const isNotation = sheetType === 'SheetMusic' || sheetType === 'GuitarTabs';
                const baseClasses = "sheet overflow-x-auto text-[12px] xl:text-base mt-4 bg-white shadow-lg rounded-lg p-6 w-full border border-gray-200";
                const textColumnClasses = "columns-1 lg:columns-2 max-w-3xl xl:max-w-5xl";
                const notationClasses = "max-w-3xl xl:max-w-5xl";
                return (
                    <div
                        key={output.id}
                        className={`${baseClasses} ${isNotation ? notationClasses + ' notation' : textColumnClasses}`}
                        style={isNotation ? undefined : { columnGap: '20px' }}
                    >
                        {output.chordsheets?.content ? (
                            <SheetRenderer sheetType={output.chordsheets.sheetType} content={output.chordsheets.content} originalKey={output.chordsheets.key} targetKey={output.targetKey} capo={output.capo} />
                        ) : (
                            <div className="text-sm text-gray-600">Chordsheet missing</div>
                        )}
                    </div>
                );
            })}
            </div>
            <footer className="print:hidden text-center text-sm text-white w-full bg-gray-700">
                <p>Generated by <a href={window.location.origin} target="_blank" rel="noopener noreferrer"><Guitar className="inline-block" /> Team Chords</a></p>
            </footer>
        </div>
    );
};

export default SetListView;

