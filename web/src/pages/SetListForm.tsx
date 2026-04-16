import { useParams, useNavigate } from "react-router-dom";
import { getSetList, createSetList, updateSetList } from "../utils/setlists";
import { useState, useEffect, useRef } from "react";
import { Save } from "lucide-react";
import { getChordsheets } from "../utils/chordsheets";
import { Plus, X, Trash, Edit, Link2, Eye, MoreVertical } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import {Input} from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";

const SongSelectionDialog = ({ sheets, onAdd, isOpen, onClose }) => {
    const songStuff = useSongSelectionStore();
    const selectSongOptions = sheets.map((sheet) => ({ value: sheet.id, label: `${sheet.title} - ${sheet.artist} - ${sheet.key}` }));
    const selectKeyOptions = keys.map(k => ({ value: k, label: k }));
    const selectCapoOptions = frets.map(f => ({ value: f.toString(), label: getCapoText(f) }));

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
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{songStuff.isEdit ? "Edit" : "Add"} Song</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <Label htmlFor="song">Song</Label>
                        <Select value={songStuff.selectedSong.song} onValueChange={(value) => songStuff.setSelectedSong({ ...songStuff.selectedSong, song: value })}>
                            <SelectTrigger id="song">
                                <SelectValue placeholder="Select a song..." />
                            </SelectTrigger>
                            <SelectContent>
                                {selectSongOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="key">Key</Label>
                        <Select value={songStuff.selectedSong.targetKey} onValueChange={(value) => songStuff.setSelectedSong({ ...songStuff.selectedSong, targetKey: value })}>
                            <SelectTrigger id="key">
                                <SelectValue placeholder="Select a key..." />
                            </SelectTrigger>
                            <SelectContent>
                                {selectKeyOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="capo">Capo</Label>
                        <Select value={songStuff.selectedSong.capo.toString()} onValueChange={(value) => songStuff.setSelectedSong({ ...songStuff.selectedSong, capo: Number(value) })}>
                            <SelectTrigger id="capo">
                                <SelectValue placeholder="Select capo..." />
                            </SelectTrigger>
                            <SelectContent>
                                {selectCapoOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={songStuff.isEdit ? handleEditClose : onClose} variant="secondary">
                        Cancel
                    </Button>
                    <Button onClick={songStuff.isEdit ? handleEdit : handleAdd} disabled={!songStuff.selectedSong.song || !songStuff.selectedSong.targetKey}>
                        {songStuff.isEdit ? "Update" : "Add"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const SortableSongItem = ({ output, sheets, handleDeleteSong, openEditDialog, handleDuplicateSong, handleMoveUp, handleMoveDown }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: output.index });
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const toggleRef = useRef(null);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        userSelect: 'none',
        touchAction: 'manipulation'
    };

    const sheet = sheets.find(sheet => sheet.id === output.song);

    const closeMenu = () => setMenuOpen(false);

    useEffect(() => {
        if (!menuOpen) return;

        const handleDocPointer = (e) => {
            if (menuRef.current && menuRef.current.contains(e.target)) return;
            if (toggleRef.current && toggleRef.current.contains(e.target)) return;
            setMenuOpen(false);
        };

        const handleKey = (e) => {
            if (e.key === 'Escape') setMenuOpen(false);
        };

        document.addEventListener('pointerdown', handleDocPointer);
        document.addEventListener('keydown', handleKey);

        return () => {
            document.removeEventListener('pointerdown', handleDocPointer);
            document.removeEventListener('keydown', handleKey);
        };
    }, [menuOpen]);

    return (
        <Card
            ref={setNodeRef}
            style={style}
            className="mb-3"
        >
            <CardContent className="p-0 flex items-center">
                <div {...attributes} {...listeners} className="cursor-grab p-4 opacity-70 hover:opacity-100">
                    <svg viewBox="0 0 20 20" width="20" fill="currentColor"><path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path></svg>
                </div>

                <div className="flex-grow">
                    <CardTitle className="text-base">{sheet?.title || "Unknown"}</CardTitle>
                    <CardDescription>{sheet?.artist || 'Unknown Artist'}</CardDescription>
                </div>
                
                <div className="flex items-center gap-6 mr-4">
                    <div>
                        <span className="text-xs text-muted-foreground">Key</span>
                        <p className="font-medium">{output.targetKey}</p>
                    </div>
                    <div>
                        <span className="text-xs text-muted-foreground">Capo</span>
                        <p className="font-medium">{output.capo > 0 ? getCapoText(output.capo) : 'None'}</p>
                    </div>
                </div>

                <div className="hidden sm:flex gap-1 items-center pr-4">
                    <button
                        data-no-dnd="true"
                        title="Duplicate"
                        className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-muted transition-colors"
                        onClick={(event) => handleDuplicateSong(output.index, event)}
                    >
                        <Plus size={16} />
                    </button>
                    <button
                        data-no-dnd="true"
                        title="Move up"
                        className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-muted transition-colors"
                        onClick={(event) => handleMoveUp(output.index, event)}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V6"/><path d="M5 12l7-7 7 7"/></svg>
                    </button>
                    <button
                        data-no-dnd="true"
                        title="Move down"
                        className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-muted transition-colors"
                        onClick={(event) => handleMoveDown(output.index, event)}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v13"/><path d="M19 12l-7 7-7-7"/></svg>
                    </button>
                    <button
                        data-no-dnd="true"
                        className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-muted transition-colors"
                        onClick={(event) => openEditDialog(output.index, output, event)}
                    >
                        <Edit size={18} />
                    </button>
                    <button
                        data-no-dnd="true"
                        className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-muted transition-colors"
                        onClick={(event) => handleDeleteSong(output.index, event)}
                    >
                        <Trash size={18} />
                    </button>
                </div>

                {/* Mobile kebab menu (visible below sm) */}
                <div className="flex sm:hidden items-center relative pr-4">
                    <button
                        ref={toggleRef}
                        data-no-dnd="true"
                        className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted"
                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setMenuOpen(!menuOpen); }}
                        title="More"
                    >
                        <MoreVertical size={18} />
                    </button>

                    {menuOpen && (
                        <div ref={menuRef} className="absolute right-0 top-full mt-2 w-40 bg-popover border rounded shadow z-50">
                            <button className="w-full text-left px-3 py-2 hover:bg-muted text-popover-foreground" onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleDuplicateSong(output.index, e); closeMenu(); }}>Duplicate</button>
                            <button className="w-full text-left px-3 py-2 hover:bg-muted text-popover-foreground" onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleMoveUp(output.index, e); closeMenu(); }}>Move up</button>
                            <button className="w-full text-left px-3 py-2 hover:bg-muted text-popover-foreground" onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleMoveDown(output.index, e); closeMenu(); }}>Move down</button>
                            <button className="w-full text-left px-3 py-2 hover:bg-muted text-popover-foreground" onClick={(e) => { e.stopPropagation(); e.preventDefault(); openEditDialog(output.index, output, e); closeMenu(); }}>Edit</button>
                            <button className="w-full text-left px-3 py-2 text-destructive hover:bg-muted" onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleDeleteSong(output.index, e); closeMenu(); }}>Delete</button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
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
                    toast.success("Set list created!");
                    navigate(`/setlists/${newSetList.id}`);
                } else {
                    toast.error("Failed to create set list.");
                }
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
                <Label htmlFor="name">Set List Name</Label>
                <Input
                    id="name"
                    type="text"
                    className="w-full p-2 rounded text-lg"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Set List Name"
                />
            </div>
            <div className="flex flex-col sm:flex-row justify-between">
                <div className="flex flex-col sm:flex-row sm:gap-1 flex-wrap">
                    <Button onClick={handleSave} disabled={!name || isSaving} className="mt-4">
                        <Save size={16} className="mr-2" /> {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button onClick={() => setIsOpen(true)} variant="secondary" disabled={isSaving} className="mt-4">
                        <Plus size={16} className="mr-2" /> Add Song
                    </Button>
                </div>
                <div className="flex flex-col sm:flex-row sm:gap-1 flex-wrap">
                    {id !== "new" && (
                        <>
                            <Button onClick={() => handleCopyLinkWrapper(id)} disabled={isSaving} className="mt-4">
                                <Link2 size={16} className="mr-2" /> Copy Link
                            </Button>
                            <Button onClick={() => handlePreview(id)} disabled={isSaving} className="mt-4">
                                <Eye size={16} className="mr-2" /> Preview
                            </Button>
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
                            <div className="text-center py-10 rounded-lg border-2 border-dashed">
                                <p>This set list is empty.</p>
                                <p className="text-sm text-muted-foreground mt-1">Add a song to get started!</p>
                            </div>
                        )}
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    );
};

export default SetListForm;
