import { useNavigate, Link } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";
import { motion } from "framer-motion";
import MainLogo from "./components/MainLogo";
import PricingCards from "./components/PricingCards";
import ChatwootWidget from "./components/ChatwootWidget";

function App() {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/library");
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Animation Variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
  };

  return (
    // Use a flexible min-height container and allow auto scrolling.
    // This avoids stacking many full-height sections that push content off-screen on small viewports.
    <div className="min-h-screen overflow-x-hidden overflow-y-auto scroll-smooth">
      <ChatwootWidget />
      {/* Navbar */}
      <nav className="fixed top-0 left-0 z-10 w-full flex justify-between items-center bg-gray-700 bg-opacity-95 p-3 text-white shadow-md sm:p-4 h-14 sm:h-16">
        <h1 className="flex items-center text-lg sm:text-xl">
          <MainLogo size={28} className="mr-2" /> Team Chords
        </h1>
        <div>
          <div className="flex items-center gap-3">
            <a
              href="/#pricing"
              className="px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-gray-600 transition text-sm sm:text-base"
            >
              Pricing
            </a>
            {/*<a*/}
            {/*  href="/help"*/}
            {/*  className="px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-gray-600 transition text-sm sm:text-base"*/}
            {/*>*/}
            {/*  Help*/}
            {/*</a>*/}
            <button
              onClick={() => loginWithRedirect()}
              className="px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-gray-600 transition text-sm sm:text-base"
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        // Make hero smaller on mobile while keeping a full-screen feel on larger viewports
        className="min-h-[70vh] sm:min-h-screen flex flex-col items-center justify-center bg-gray-700 text-white text-center px-2 sm:px-4"
      >
        <h2 className="text-3xl sm:text-5xl font-bold mb-3 sm:mb-4">
          Your Team&apos;s Ultimate Chord Sharing Hub
        </h2>
        <p className="text-base sm:text-lg max-w-md sm:max-w-2xl">
          Collaborate on chord sheets, create set lists, and share updates in real time.
        </p>
        <motion.div whileHover={{ scale: 1.05 }} className="mt-4 sm:mt-6">
          <button
            onClick={() => navigate('/signup')}
            className="px-5 py-2 text-base sm:px-6 sm:py-3 sm:text-lg rounded bg-gray-500 hover:bg-gray-600 transition"
          >
            Get Started
          </button>
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
        // Don't force a full viewport height for features; allow content to flow naturally on small screens
        className="min-h-[60vh] sm:min-h-screen flex flex-col items-center justify-center text-center bg-gray-100 px-2 sm:px-4"
      >
        <h3 className="text-2xl sm:text-4xl font-semibold mb-4 sm:mb-6">Why Use Team Chords?</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full max-w-6xl">
          {[
            { title: "ChordPro Library", desc: "Store and organize your chord sheets." },
            { title: "Set Lists", desc: "Create and manage set lists effortlessly." },
            { title: "Real-Time Sync", desc: "See changes instantly with live updates." },
            { title: "Team Collaboration", desc: "Share with your bandmates and teams." },
          ].map((feature, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              className="p-4 sm:p-6 border rounded-lg shadow-md bg-white"
            >
              <h4 className="text-lg sm:text-2xl font-bold mb-2">{feature.title}</h4>
              <p className="text-sm sm:text-base text-gray-700">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Pricing Section */}
      <motion.section
        id="pricing"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
        className="min-h-[70vh] sm:min-h-screen flex flex-col items-center justify-center bg-gray-100 px-2 sm:px-4"
      >
        <PricingCards isAuthenticated={isAuthenticated} />
      </motion.section>

      {/* Call to Action Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
        className="min-h-[65vh] sm:min-h-screen flex flex-col items-center justify-center bg-gray-700 text-white text-center px-2 sm:px-4"
      >
        <h3 className="text-2xl sm:text-4xl font-bold mb-4 sm:mb-6">
          Start Your Musical Journey Today!
        </h3>
        <p className="text-base sm:text-lg max-w-md sm:max-w-2xl">
          Built for worship teams and musicians who need reliable, real-time collaboration.
        </p>
        <p className="mt-3 text-sm sm:text-base max-w-md sm:max-w-2xl text-gray-200">
          After signing up, you&apos;ll get instant access to your workspace where you can create chord sheets, build set lists, and invite your team.
        </p>
        <motion.div whileHover={{ scale: 1.05 }} className="mt-4 sm:mt-6">
          <button
            onClick={() => navigate('/signup')}
            className="px-5 py-2 text-base sm:px-6 sm:py-3 sm:text-lg rounded bg-gray-500 hover:bg-gray-600 transition"
          >
            Sign Up Now
          </button>
        </motion.div>
      </motion.section>

      {/* Footer */}
      <motion.footer
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
        // Footer should size to content instead of filling the viewport on mobile
        className="py-12 flex flex-col items-center justify-center text-gray-600 bg-gray-200 text-center px-2 sm:px-4"
      >
        <h3 className="text-2xl sm:text-3xl font-semibold mb-3 sm:mb-4">Stay Connected</h3>
        <p className="text-base sm:text-lg">Follow us on social media and keep up with the latest updates.</p>
        <div className="mt-3 sm:mt-4">
          <span className="px-2 sm:px-4">Facebook</span>
          <span className="px-2 sm:px-4">Twitter</span>
          <span className="px-2 sm:px-4">Instagram</span>
        </div>
        <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-6 text-sm text-gray-500">
          <a href="/#pricing" className="hover:underline">Pricing</a>
          <Link to="/privacy-policy" className="hover:underline">Privacy Policy</Link>
          <Link to="/terms-and-conditions" className="hover:underline">Terms & Conditions</Link>
        </div>
        <p className="mt-3 text-sm text-gray-500">Support: support@teamchords.com</p>
        <p className="mt-4 sm:mt-6 text-sm"> {new Date().getFullYear()} Team Chords. All rights reserved.</p>
      </motion.footer>
    </div>
  );
}

export default App;
