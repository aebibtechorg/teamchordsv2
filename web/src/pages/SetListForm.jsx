import { useParams, useNavigate } from "react-router-dom";
import { getSetList, createSetList, updateSetList } from "../utils/setlists";
import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { getChordsheets } from "../utils/chordsheets";
import { Plus, X, Trash, Edit, Link2, Eye } from "lucide-react";
import { createOutputs, deleteOutputs, getCapoText } from "../utils/outputs";
import { handleCopyLink, handlePreview } from "../utils/setlists";
import { v4 as uuidv4 } from 'uuid';
import { useSongSelectionStore } from "../store/useSongSelectionStore";
import { useProfileStore } from "../store/useProfileStore";
import { defaultFretValue, defaultKeyValue, defaultOutputValue, defaultSelectedSongValue, frets, keys } from "../constants";
import { DndContext, closestCenter, useSensors, useSensor, PointerSensor, TouchSensor } from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Toaster, toast } from 'react-hot-toast';
import Spinner from "../components/Spinner";
import Select from "react-select";
import Modal from "../components/Modal";

const SongSelectionDialog = ({ sheets, onAdd, isOpen, onClose }) => {
    const songStuff = useSongSelectionStore();
    const selectSongOptions = [defaultSelectedSongValue].concat(sheets.map((sheet) => ({ value: sheet.id, label: `${sheet.title} - ${sheet.artist} - ${sheet.key}` })));
    const selectKeyOptions = [defaultKeyValue].concat(keys.map(k => ({ value: k, label: k })));
    const selectCapoOptions = [defaultFretValue].concat(frets.map(f => ({ value: f, label: getCapoText(f) })));

    const handleAdd = () => {
        onAdd((prevOutputs) => [...prevOutputs, { song: songStuff.selectedSong.song, targetKey: songStuff.selectedSong.targetKey, capo: songStuff.selectedSong.capo, index: uuidv4() }]);
        songStuff.setSelectedSong(defaultOutputValue);
        onClose();
    };

    const handleEdit = () => {
        onAdd((prevOutputs) => prevOutputs.map((output) => output.index === songStuff.songId ? { song: songStuff.selectedSong.song, targetKey: songStuff.selectedSong.targetKey, capo: songStuff.selectedSong.capo, index: output.index } : output));
        songStuff.setSelectedSong(defaultOutputValue);
        songStuff.setIsEdit(false);
        onClose();
    };

    const handleEditClose = () => {
        songStuff.setSelectedSong(defaultOutputValue);
        songStuff.setIsEdit(false);
        onClose();
    };

    return (
        (isOpen && <Modal onClose={onClose}>
            <div className="p-4">
                <h3 className="text-lg font-bold flex justify-between items-center mb-4">
                    <span>{songStuff.isEdit ? "Edit" : "Add"} Song</span>
                    <X size={24} onClick={songStuff.isEdit ? handleEditClose : onClose} className="cursor-pointer text-gray-500 hover:text-gray-600" />
                </h3>

                <label htmlFor="song">Song</label>
                <Select value={songStuff.selectedSong.song !== "" ? selectSongOptions.find((v) => v.value === songStuff.selectedSong.song) : defaultSelectedSongValue} options={selectSongOptions} isSearchable id="song" onChange={(e) => songStuff.setSelectedSong({ ...songStuff.selectedSong, song: e.value })} />

                <label className="mt-4 block" htmlFor="key">Key</label>
                <Select onChange={(e) => songStuff.setSelectedSong({ ...songStuff.selectedSong, targetKey: e.value })} value={songStuff.selectedSong.targetKey !== "" ? selectKeyOptions.find(k => k.value === songStuff.selectedSong.targetKey) : defaultKeyValue} options={selectKeyOptions} isSearchable id="key" />

                <label className="mt-4 block" htmlFor="capo">Capo</label>
                <Select onChange={(e) => songStuff.setSelectedSong({ ...songStuff.selectedSong, capo: Number(e.value) })} value={songStuff.selectedSong.song !== "" ? selectCapoOptions.find(f => f.value === songStuff.selectedSong.capo) : defaultFretValue} options={selectCapoOptions} isSearchable id="capo" />
                
                <div className="mt-4 flex justify-end gap-2">
                    <button className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg mt-4 flex items-center gap-2 disabled:opacity-50" onClick={songStuff.isEdit ? handleEdit : handleAdd} disabled={!songStuff.selectedSong.song || !songStuff.selectedSong.targetKey}>
                        {songStuff.isEdit ? "Update" : "Add"}
                    </button>
                    <button className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg mt-4 flex items-center gap-2" onClick={songStuff.isEdit ? handleEditClose : onClose}>
                        Cancel
                    </button>
                </div>
            </div>
        </Modal>)
    );
};

const SortableSongItem = ({ output, sheets, handleDeleteSong, openEditDialog, handleDuplicateSong, handleMoveUp, handleMoveDown }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: output.index });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        userSelect: 'none',
        touchAction: 'manipulation'
    };

    const sheet = sheets.find(sheet => sheet.id === output.song);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-white rounded-lg shadow p-4 mb-3 flex items-center"
        >
            <div {...attributes} {...listeners} className="cursor-grab p-2 text-gray-400 hover:text-gray-600">
                <svg viewBox="0 0 20 20" width="20" fill="currentColor"><path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path></svg>
            </div>

            <div className="flex-grow ml-4">
                <p className="font-semibold">{sheet?.title || "Unknown"}</p>
                <p className="text-sm text-gray-500">{sheet?.artist || 'Unknown Artist'}</p>
            </div>
            
            <div className="flex items-center gap-6 mr-4">
                <div>
                    <span className="text-xs text-gray-500">Key</span>
                    <p className="font-medium">{output.targetKey}</p>
                </div>
                <div>
                    <span className="text-xs text-gray-500">Capo</span>
                    <p className="font-medium">{output.capo > 0 ? getCapoText(output.capo) : 'None'}</p>
                </div>
            </div>

            <div className="flex gap-1 items-center">
                <button
                    data-no-dnd="true"
                    title="Duplicate"
                    className="text-gray-500 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                    onClick={(event) => handleDuplicateSong(output.index, event)}
                >
                    <Plus size={16} />
                </button>
                <button
                    data-no-dnd="true"
                    title="Move up"
                    className="text-gray-500 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                    onClick={(event) => handleMoveUp(output.index, event)}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V6"/><path d="M5 12l7-7 7 7"/></svg>
                </button>
                <button
                    data-no-dnd="true"
                    title="Move down"
                    className="text-gray-500 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                    onClick={(event) => handleMoveDown(output.index, event)}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v13"/><path d="M19 12l-7 7-7-7"/></svg>
                </button>
                <button
                    data-no-dnd="true"
                    className="text-gray-500 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                    onClick={(event) => openEditDialog(output.index, output, event)}
                >
                    <Edit size={18} />
                </button>
                <button
                    data-no-dnd="true"
                    className="text-gray-500 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                    onClick={(event) => handleDeleteSong(output.index, event)}
                >
                    <Trash size={18} />
                </button>
            </div>
        </div>
    );
};


const SetListForm = () => {
    const { profile } = useProfileStore();
    const { id } = useParams();
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [sheets, setSheets] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [outputs, setOutputs] = useState([]);
    const songStuff = useSongSelectionStore();
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                distance: 8,
                delay: 300,
                tolerance: 5,
            },
        })
    );

    useEffect(() => {
        const fetchSheets = async () => {
            const { data } = await getChordsheets(profile.orgId, 0, -1, "");
            setSheets(data);
        };

        if (id !== "new") {
            const fetchSetList = async () => {
                await fetchSheets();
                const data = await getSetList(id);
                if (data.orgId != profile.orgId) {
                    navigate('/setlists');
                }
                setName(data.name);
                setOutputs(data.outputs.map(output => ({
                    song: output.chordSheetId,
                    targetKey: output.targetKey,
                    capo: String(output.capo),
                    order: output.order,
                    index: uuidv4(),
                })).sort((a, b) => a.order - b.order));
            };
            fetchSetList().then(() => setIsLoading(false)).catch((err) => {
                toast.error("A network error has occured.");
                setIsLoading(false);
            });
        }
        else {
            fetchSheets().then(() => setIsLoading(false)).catch((err) => {
                toast.error("A network error has occured.");
                setIsLoading(false);
            });
        }
    }, [id, profile.orgId, navigate]);

    const handleSave = async () => {
        setIsSaving(true);
        const setlist = { name, orgId: profile.orgId };
        try {
            if (id === "new") {
                const newSetList = await createSetList(setlist);
                if (newSetList) {
                    await createOutputs(outputs.map((output, index) => ({
                        chordSheetId: output.song,
                        targetKey: output.targetKey,
                        capo: output.capo,
                        setListId: newSetList.id,
                        order: index
                    })));
                } else {
                    toast.error("Failed to create set list.");
                }
                navigate("/setlists");
            } else {
                await updateSetList(id, setlist);
                await deleteOutputs(id);
                await createOutputs(outputs.map((output, index) => ({
                    chordSheetId: output.song,
                    targetKey: output.targetKey,
                    capo: output.capo,
                    setListId: id,
                    order: index
                })));
                toast.success("Set list updated!");
            }
        } catch (error) {
            toast.error("An error occurred while saving.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteSong = (index, event) => {
        event.stopPropagation();
        event.preventDefault();
        setOutputs((prevOutputs) => prevOutputs.filter((output) => output.index !== index));
    };
    
    const handleDuplicateSong = (index, event) => {
        event.stopPropagation();
        event.preventDefault();
        setOutputs((prevOutputs) => {
            const idx = prevOutputs.findIndex(o => o.index === index);
            if (idx === -1) return prevOutputs;
            const item = prevOutputs[idx];
            const copy = { ...item, index: uuidv4() };
            const newOutputs = [...prevOutputs];
            newOutputs.splice(idx + 1, 0, copy);
            return newOutputs;
        });
    };

    const handleMoveUp = (index, event) => {
        event.stopPropagation();
        event.preventDefault();
        setOutputs((prevOutputs) => {
            const idx = prevOutputs.findIndex(o => o.index === index);
            if (idx <= 0) return prevOutputs;
            const newOutputs = arrayMove(prevOutputs, idx, idx - 1);
            return newOutputs;
        });
    };

    const handleMoveDown = (index, event) => {
        event.stopPropagation();
        event.preventDefault();
        setOutputs((prevOutputs) => {
            const idx = prevOutputs.findIndex(o => o.index === index);
            if (idx === -1 || idx >= prevOutputs.length - 1) return prevOutputs;
            const newOutputs = arrayMove(prevOutputs, idx, idx + 1);
            return newOutputs;
        });
    };
    
    const openEditDialog = (index, song, event) => {
        event.stopPropagation();
        event.preventDefault();
        setIsOpen(true);
        songStuff.setIsEdit(true);
        songStuff.setSongId(index);
        songStuff.setSelectedSong({ song: song.song, targetKey: song.targetKey, capo: song.capo });
    };    

    const handleDragEnd = event => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = outputs.findIndex(output => output.index === active.id);
        const newIndex = outputs.findIndex(output => output.index === over.id);

        setOutputs(arrayMove(outputs, oldIndex, newIndex));
    };

    const handleCopyLinkWrapper = async (id) => {
        await handleCopyLink(id);
        toast.success('Link copied to clipboard!');
    };

    if (isLoading) {
        return (
            <>
                <Toaster />
                <div className="flex justify-center items-center h-screen">
                    <Spinner />
                </div>
            </>
        );
    }

    return (
        <div className="p-4">
            <Toaster />
            <SongSelectionDialog sheets={sheets} onAdd={setOutputs} isOpen={isOpen} onClose={() => setIsOpen(false)} />
            <div className="mb-4">
                <label htmlFor="name">Set List Name</label>
                <input
                    id="name"
                    type="text"
                    className="w-full p-2 border rounded text-lg"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Set List Name"
                />
            </div>
            <div className="flex flex-col sm:flex-row justify-between">
                <div className="flex flex-col sm:flex-row sm:gap-1 flex-wrap">
                    <button onClick={handleSave} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded mt-4 flex justify-center items-center gap-2 disabled:opacity-50" disabled={!name || isSaving}>
                        <Save size={16} /> {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={() => setIsOpen(true)} className="border border-gray-500 rounded p-2 text-gray-500 hover:text-gray-600 mt-4 flex justify-center items-center gap-2 disabled:opacity-50" disabled={isSaving}>
                        <Plus size={16} /> Add Song
                    </button>
                </div>
                <div className="flex flex-col sm:flex-row sm:gap-1 flex-wrap">
                    {id !== "new" && (
                        <>
                            <button onClick={() => handleCopyLinkWrapper(id)} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded mt-4 flex justify-center items-center gap-2 disabled:opacity-50" disabled={isSaving}>
                                <Link2 size={16} /> Copy Link
                            </button>
                            <button onClick={() => handlePreview(id)} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded mt-4 flex justify-center items-center gap-2 disabled:opacity-50" disabled={isSaving}>
                                <Eye size={16} /> Preview
                            </button>
                        </>
                    )}
                </div>
            </div>
            <div className="mt-4 md:min-h-[480px] lg:min-h-[640px] overflow-y-auto pb-24">
                <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
                    <SortableContext items={outputs.map(output => output.index)} strategy={verticalListSortingStrategy}>
                        {outputs.length > 0 ? (
                            outputs.map((output) => (
                                <SortableSongItem
                                    key={output.index}
                                    output={output}
                                    sheets={sheets}
                                    handleDeleteSong={handleDeleteSong}
                                    openEditDialog={openEditDialog}
                                    handleDuplicateSong={handleDuplicateSong}
                                    handleMoveUp={handleMoveUp}
                                    handleMoveDown={handleMoveDown}
                                />
                            ))
                        ) : (
                            <div className="text-center py-10 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                <p className="text-gray-500">This set list is empty.</p>
                                <p className="text-gray-400 text-sm mt-1">Add a song to get started!</p>
                            </div>
                        )}
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    );
};

export default SetListForm;