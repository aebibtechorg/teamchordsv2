import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import html2canvas from "html2canvas";
import { getOutputs } from "../utils/outputs";
import { getSetList } from "../utils/setlists";
import ChordSheetJS from "chordsheetjs";
import { Guitar, PrinterIcon } from "lucide-react";
import { supabase } from "../supabaseClient";
import { Toaster, toast } from 'react-hot-toast';
import Spinner from "../components/Spinner";

const SetListLyricsView = () => {
    const { id } = useParams();
    const [setlist, setSetlist] = useState(null);
    const [outputs, setOutputs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [ogImage, setOgImage] = useState("");

    useEffect(() => {
        const fetchSet = async () => {
            const setlistData = await getSetList(id);
            const outputData = await getOutputs(id);
            
            setSetlist(setlistData);
            setOutputs(outputData);
            document.title = `Team Chords - ${setlistData.name}`;
        };
        fetchSet().then(() => setIsLoading(false)).catch((err) => toast.error(`A network error has occured: ${err}`));
        
        supabase.channel('custom-filter-channel')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'setlists', filter: `id=eq.${id}` },
            () => {
                fetchSet();
            }
        )
        .subscribe();
    }, [id]);

    useEffect(() => {
        if (outputs.length > 0) {
            document.querySelectorAll('.sheet h1').forEach((element) => {
                element.style.fontWeight = 'bold';
                element.style.textAlign = 'center';
                element.style.fontSize = '1.5rem';
            });

            document.querySelectorAll('.chord').forEach(e => e.classList.add('hidden'));
    
            // Check if the ogImage is already stored in localStorage
            const storedOgImage = localStorage.getItem(`ogImage_${id}`);
            if (storedOgImage) {
                setOgImage(storedOgImage);
            } else {
                // Generate screenshot for OpenGraph image
                html2canvas(document.querySelector(".sheet")).then(async (canvas) => {
                    const imageData = canvas.toDataURL("image/png");
                    const blob = await (await fetch(imageData)).blob(); // Convert base64 to Blob
    
                    // Upload the image to Supabase Storage
                    const uploadImage = async () => {
                        try {
                            const fileName = `og-image-${id}-${Date.now()}.png`; // Unique file name
                            const { error } = await supabase.storage
                                .from("og-images") // Replace with your bucket name
                                .upload(fileName, blob, {
                                    contentType: "image/png",
                                });
    
                            if (error) {
                                console.error("Error uploading image:", error);
                                return;
                            }
    
                            // Get the public URL of the uploaded image
                            const res = supabase.storage
                                .from("og-images")
                                .getPublicUrl(fileName);
    
                            setOgImage(res.data.publicUrl); // Set the public URL to state
    
                            // Save the public URL to localStorage
                            localStorage.setItem(`ogImage_${id}`, res.data.publicUrl);
                        } catch (error) {
                            console.error("Error uploading image to Supabase Storage:", error);
                        }
                    };
    
                    uploadImage();
                });
            }
        }
    }, [outputs, id]);

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
  
    return (
        <div className="bg-gray-100">
            <Helmet>
                <title>{setlist ? `Team Chords - ${setlist.name}` : "Team Chords"}</title>
                <meta property="og:image" content={ogImage} />
            </Helmet>
            <div className="hidden print:block">
                {outputs.map((output) => <pre key={output.id} dangerouslySetInnerHTML={{ __html: renderChordPro(output.chordsheets.content, output.chordsheets.key, output.targetKey, output.capo) }} />)}
            </div>
            {setlist && <h2 className="print:hidden text-center text-sm md:text-base lg:text-lg font-bold sticky top-0 left-0 z-10 w-full bg-gray-700 text-white py-4 shadow-md flex items-center gap-2 justify-center"><span>{setlist.name}</span><button onClick={handlePrint} className="flex items-center justify-center gap-1 bg-gray-500 hover:bg-gray-600 p-2 rounded font-normal"><PrinterIcon size={18} /> Print</button></h2>}
            <div className="print:hidden flex flex-col items-center">
            {outputs.map((output) =>
                <div
                    key={output.id}
                    dangerouslySetInnerHTML={
                        { __html: renderChordPro(output.chordsheets.content, output.chordsheets.key, output.targetKey, output.capo)}}
                    className="columns-1 lg:columns-2 sheet overflow-x-auto text-[12px] xl:text-base mt-4 bg-white shadow-lg rounded-lg p-6 max-w-3xl xl:max-w-5xl w-full border border-gray-200"
                    style={{columnGap: '20px'}}
                />
            )}
            </div>
            <footer className="print:hidden text-center text-sm text-white w-full bg-gray-700">
                <p>Generated by <a href={window.location.origin} target="_blank" rel="noopener noreferrer"><Guitar className="inline-block" /> Team Chords</a></p>
            </footer>
        </div>
    );
};

export default SetListLyricsView;

