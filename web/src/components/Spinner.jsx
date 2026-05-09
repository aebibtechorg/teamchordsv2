import { motion } from "framer-motion";
import MainLogo from "./MainLogo";

const pulseTransition = {
    duration: 1.8,
    repeat: Infinity,
    repeatType: "mirror",
    ease: "easeInOut",
};

const Spinner = () => {
    return (
        <div className="flex h-full items-center justify-center" role="status" aria-live="polite" aria-label="Loading Team Chords">
            <div className="relative flex h-32 w-32 items-center justify-center">
                <motion.div
                    aria-hidden="true"
                    className="absolute h-24 w-24 rounded-full bg-gray-400/20 blur-xl"
                    animate={{ scale: [0.92, 1.08, 0.92], opacity: [0.35, 0.7, 0.35] }}
                    transition={pulseTransition}
                />
                <motion.div
                    className="relative flex items-center justify-center rounded-full bg-white/85 p-5 shadow-lg ring-1 ring-gray-200/80"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={pulseTransition}
                >
                    <MainLogo size={72} className="drop-shadow-sm rounded-full" alt="" aria-hidden="true" />
                </motion.div>
            </div>
            <span className="sr-only">Loading Team Chords</span>
        </div>
    );
};

export default Spinner;