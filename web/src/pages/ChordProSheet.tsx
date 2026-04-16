import { useParams, useNavigate } from "react-router-dom";
import { getChordsheet, createChordsheet, updateChordsheet, deleteChordsheet } from "../utils/chordsheets";
import { useState, useEffect, useMemo } from "react";
import ChordSheetJS from "chordsheetjs";
import { Save, Trash2 } from "lucide-react";
import { useProfileStore } from "../store/useProfileStore";
import Editor from "@monaco-editor/react";
import Modal from "../components/Modal";
import { defaultContent, defaultKey, chordProGuideURL, keys } from "../constants";
import { Toaster, toast } from 'react-hot-toast';
import Spinner from "../components/Spinner";
import ConfirmDialog from "../components/ConfirmDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {Textarea} from "@/components/ui/textarea";

const ChordProSheet = () => {
    const { profile } = useProfileStore();
    const { id } = useParams();
    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [artist, setArtist] = useState("");
    const [key, setKey] = useState(defaultKey);
    const [content, setContent] = useState(defaultContent);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isConverterOpen, setIsConverterOpen] = useState(false);
    const [sourceText, setSourceText] = useState("");
    const [selectedFormat, setSelectedFormat] = useState("ultimate-guitar");
    const [preview, setPreview] = useState("");
    const [editorTheme, setEditorTheme] = useState<"vs" | "vs-dark">("vs");

    // State for ConfirmDialog
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

    useEffect(() => {
        if (id !== 'new') {
            const fetchChordsheet = async () => {
                const data = await getChordsheet(id);
                if (data.orgId != profile.orgId) {
                    navigate('/library');
                }
                setTitle(data.title);
                setArtist(data.artist);
                setKey(data.key);
                setContent(data.content);
            };
            fetchChordsheet().then(() => setIsLoading(false)).catch((err) => toast.error("A network error has occured."));
        }
        else {
            setIsLoading(false);
        }
    }, [id, profile.orgId, navigate]);

    // Monitor theme changes and update editor theme
    useEffect(() => {
        const updateEditorTheme = () => {
            const isDark = document.documentElement.classList.contains("dark");
            setEditorTheme(isDark ? "vs-dark" : "vs");
        };

        // Set initial theme
        updateEditorTheme();

        // Listen for theme changes
        const observer = new MutationObserver(updateEditorTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

        return () => observer.disconnect();
    }, []);

    const renderChordPro = (chordProContent) => {
        try {
            if (chordProContent) {
                const parser = new ChordSheetJS.ChordProParser();
                chordProContent = chordProContent.replaceAll('{ci:', '{c:');
                const song = parser.parse(chordProContent);
                const formatter = new ChordSheetJS.HtmlTableFormatter();
                return formatter.format(song);
            }
            return '';
        } catch (error) {
            console.error(error);
            return '';
        }
    };

    // --- Conversion helpers ---
    const insertChordIntoLyric = (lyricLine, chord, pos) => {
        // find insertion index in lyric: first non-space at or after pos
        if (!lyricLine) return `[${chord}]`;
        let idx = pos;
        if (idx > lyricLine.length) idx = lyricLine.length;
        while (idx < lyricLine.length && lyricLine[idx] === ' ') idx++;
        // insert chord token before character at idx
        return lyricLine.slice(0, idx) + `[${chord}]` + lyricLine.slice(idx);
    };

    const parseChordsOverWords = (input) => {
        const parser = new ChordSheetJS.ChordsOverWordsParser();
        try {
            return parser.parse(input);
        } catch (error) {
            console.error(error);
            return '';
        }
    };

    const parseUltimateGuitar = (input) => {
        const parser = new ChordSheetJS.UltimateGuitarParser();
        try {
            return parser.parse(input);
        } catch (error) {
            console.error(error);
            // Fallback to ChordsOverWordsParser if UltimateGuitarParser fails
            return parseChordsOverWords(input);
        }
    };

    const convert = (format, input) => {
        const formatter = new ChordSheetJS.ChordProFormatter();
        if (!input) return '';
        if (format === 'chords-over-words')
            return formatter.format(parseChordsOverWords(input));
        if (format === 'ultimate-guitar')
            return formatter.format(parseUltimateGuitar(input));
        return '';
    };

    const handleSave = async () => {
        setIsSaving(true);
        const chordsheet = { title, artist, key, content, orgId: profile.orgId };
        if (id === 'new') {
            const response = await createChordsheet(chordsheet);
            if (response != null) {
                toast.success("Chordsheet saved!");
                navigate(`/library/${response.id}`);
            }
            else {
                toast.error("An error has occured.");
            }
        } else {
            await updateChordsheet(id, chordsheet);
            toast.success("Changes successfully saved!");
        }
        setIsSaving(false);
    };

    // Function to open the confirmation dialog
    const handleDeleteClick = () => {
        setIsConfirmDialogOpen(true);
    };

    // Function to perform the actual deletion after confirmation
    const confirmDelete = async () => {
        try {
            const success = await deleteChordsheet(id);
            if (success) {
                toast.success("Chord sheet deleted successfully!");
                navigate('/library'); // Redirect to library after successful deletion
            } else {
                toast.error("Failed to delete chord sheet.");
            }
        } catch (error) {
            console.error("Error deleting chord sheet:", error);
            toast.error("Failed to delete chord sheet.");
        } finally {
            setIsConfirmDialogOpen(false);
        }
    };

    // Memoize rendered HTML for main preview to avoid re-parsing on every render
    const renderedHtml = useMemo(() => renderChordPro(content), [content]);

    // Debounce modal preview-as-you-type so conversion runs after user pauses typing
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setPreview(convert(selectedFormat, sourceText));
        }, 250);
        return () => clearTimeout(timeoutId);
    }, [sourceText, selectedFormat]);

    if (isLoading) {
        return (
            <>
                <Toaster />
                <Spinner />
            </>
        );
    }

    return (
        <div className="p-4">
            <Toaster />
            <div className="mb-4 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                        id="title"
                        type="text"
                        className="w-full p-2 border rounded text-lg"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Title"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="artist">Artist</Label>
                    <Input
                        id="artist"
                        type="text"
                        className="w-full p-2 border rounded text-lg"
                        value={artist}
                        onChange={(e) => setArtist(e.target.value)}
                        placeholder="Artist"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="key">Key</Label>
                    <Select value={key} onValueChange={setKey}>
                        <SelectTrigger id="key" className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {keys.map((note) => (
                                <SelectItem key={note} value={note}>
                                    {note}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-4 mb-4">
                <Button
                    onClick={handleSave}
                    className="px-4 py-2 rounded flex items-center justify-center gap-2 disabled:opacity-50 w-full sm:w-1/4 md:w-[128px]"
                    disabled={!title || !artist || !key || !content || isSaving}
                >
                    <Save size={16} />
                    Save
                </Button>

                <Button
                    onClick={() => { setIsConverterOpen(true); setSourceText(content); setPreview(''); }}
                    className="px-4 py-2 rounded flex items-center justify-center gap-2 w-full sm:w-1/4 md:w-[160px]"
                    variant="secondary"
                >
                    Convert format
                </Button>

                {id !== 'new' && (
                    <Button
                        onClick={handleDeleteClick} // Call handleDeleteClick to open dialog
                        className="px-4 py-2 rounded flex items-center justify-center gap-2 w-full sm:w-1/4 md:w-[128px]"
                        variant="destructive"
                    >
                        <Trash2 size={16} />
                        Delete
                    </Button>
                )}
            </div>
            <a className="text-primary block mb-2 hover:underline" href={chordProGuideURL} target="_blank" rel="noopener noreferrer">ChordPro Syntax Guide</a>
            <div className="flex flex-col lg:flex-row gap-4 h-auto lg:h-[64vh] mb-20 md:mb-0">
                <div className="flex-1 min-h-[240px] h-auto lg:h-[64vh] border border-border rounded overflow-hidden">
                    <Editor
                        height="64vh"
                        defaultLanguage="plaintext"
                        value={content}
                        onChange={(value) => setContent(value)}
                        theme={editorTheme}
                        options={{ minimap: { enabled: false }, wordWrap: "on" }}
                    />
                </div>
                <div
                    className="flex-1 min-h-[240px] h-auto lg:h-[64vh] p-4 border border-border rounded overflow-auto bg-muted shadow-inner text-foreground text-sm whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: renderedHtml }}
                />
            </div>

            {isConverterOpen && (
                <Modal onClose={() => setIsConverterOpen(false)}>
                    <div className="p-4">
                        <h3 className="text-lg font-semibold mb-2">Convert to ChordPro</h3>
                        <Label className="block text-sm font-medium">Source format</Label>
                        <select
                            value={selectedFormat}
                            onChange={(e) => setSelectedFormat(e.target.value)}
                            className="w-full p-2 border rounded mb-3"
                        >
                            <option value="ultimate-guitar">Ultimate Guitar</option>
                            <option value="chords-over-words">Chords over Words</option>
                        </select>

                        <Label className="block text-sm font-medium">Source text</Label>
                        <Textarea
                            className="w-full h-40 p-2 mb-2 font-mono text-sm"
                            value={sourceText}
                            onChange={(e) => setSourceText(e.target.value)}
                        />

                        <div className="flex gap-2 mb-3">
                            <Button
                                onClick={() => setPreview(convert(selectedFormat, sourceText))}
                                className="px-3 py-1 rounded"
                            >Preview</Button>
                            <Button
                                onClick={() => {
                                    const converted = convert(selectedFormat, sourceText);
                                    setPreview(converted);
                                    setContent(converted);
                                    setIsConverterOpen(false);
                                    toast.success('Converted and applied to editor');
                                }}
                                className="px-3 py-1 rounded"
                            >Apply</Button>
                            <Button
                                onClick={() => { setIsConverterOpen(false); }}
                                className="ml-auto text-sm "
                            >Close</Button>
                        </div>

                        <Label className="block text-sm font-medium">Preview (ChordPro)</Label>
                        <pre className="w-full h-40 p-2 text-sm whitespace-pre-wrap overflow-auto">{preview}</pre>
                    </div>
                </Modal>
            )}

            <ConfirmDialog
                isOpen={isConfirmDialogOpen}
                onClose={() => setIsConfirmDialogOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Chord Sheet"
                message="Are you sure you want to delete this chord sheet? This action cannot be undone."
            />
        </div>
    );
};

export default ChordProSheet;
