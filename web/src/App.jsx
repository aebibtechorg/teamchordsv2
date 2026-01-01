import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";
import { motion } from "framer-motion";
import MainLogo from "./components/MainLogo";

function App() {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/library");
    }
  }, [isAuthenticated, isLoading]);

  // Animation Variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
  };

  return (
    <div className="h-screen overflow-y-scroll snap-mandatory snap-y scroll-smooth">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 w-full flex justify-between p-3 sm:p-4 bg-gray-700 text-white shadow-md z-10">
        <h1 className="flex items-center text-lg sm:text-xl">
          <MainLogo size={28} className="mr-2" /> Team Chords
        </h1>
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => loginWithRedirect()}
              className="px-3 py-2 sm:px-4 sm:py-2 rounded bg-gray-500 hover:bg-gray-600 transition text-sm sm:text-base"
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
        className="h-screen snap-center flex flex-col items-center justify-center bg-gray-700 text-white text-center px-2 sm:px-4"
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
        className="h-screen snap-center flex flex-col items-center justify-center text-center bg-gray-100 px-2 sm:px-4"
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
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
        className="min-h-screen snap-center flex flex-col items-center justify-center bg-gray-100 px-2 sm:px-4"
      >
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold text-center mb-4">Find the Right Plan for Your Team</h1>
          <p className="text-xl text-gray-600 text-center mb-12">
            From solo artists to large organizations, we have a plan that fits your needs.
          </p>

          {/* Pricing Tiers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Tier 1: Jam Session */}
            <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col">
              <h2 className="text-2xl font-bold mb-4">Jam Session</h2>
              <p className="text-4xl font-extrabold mb-4">$0<span className="text-lg font-normal text-gray-500">/ month</span></p>
              <p className="text-gray-600 mb-6">For solo artists, hobbyists, or users testing the platform.</p>
              <ul className="space-y-4 text-gray-700 mb-8 flex-grow">
                <li><span className="font-bold">1 Team</span> allowed</li>
                <li>Max <span className="font-bold">3 Team Members</span></li>
                <li><span className="font-bold">50 Songs</span> (ChordPro sheets)</li>
                <li><span className="font-bold">3 Set Lists</span></li>
                <li>Basic ChordPro Editor</li>
                <li>Read-only public sharing</li>
                <li className="text-gray-400">Real-time live view sync (Live Mode)</li>
              </ul>
              <button className="w-full bg-gray-200 text-gray-700 font-bold py-3 px-6 rounded-lg hover:bg-gray-300 transition duration-300">
                Get Started
              </button>
            </div>

            {/* Tier 2: Gigging Band */}
            <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col border-4 border-blue-500 relative">
              <div className="absolute top-0 -translate-y-1/2 bg-blue-500 text-white font-bold py-1 px-4 rounded-full">
                Most Popular
              </div>
              <h2 className="text-2xl font-bold mb-4">Gigging Band</h2>
              <p className="text-4xl font-extrabold mb-4">$5<span className="text-lg font-normal text-gray-500">/ month</span></p>
              <p className="text-gray-600 mb-6">For local bands, worship teams, and performing groups.</p>
              <ul className="space-y-4 text-gray-700 mb-8 flex-grow">
                <li><span className="font-bold">1 Team</span> allowed</li>
                <li><span className="font-bold">Unlimited</span> Team Members</li>
                <li><span className="font-bold">Unlimited</span> Songs</li>
                <li><span className="font-bold">Unlimited</span> Set Lists</li>
                <li><span className="font-bold text-blue-600">Real-Time "Live Mode"</span></li>
                <li>Transposition Tools</li>
                <li>PDF Export/Print</li>
                <li>Offline Mode</li>
              </ul>
              <button className="w-full bg-blue-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-600 transition duration-300">
                Choose Plan
              </button>
            </div>

            {/* Tier 3: Organization */}
            <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col">
              <h2 className="text-2xl font-bold mb-4">Organization</h2>
              <p className="text-4xl font-extrabold mb-4">$50<span className="text-lg font-normal text-gray-500">/ month</span></p>
              <p className="text-gray-600 mb-6">For multi-campus churches, music schools, or booking agencies.</p>
              <ul className="space-y-4 text-gray-700 mb-8 flex-grow">
                <li><span className="font-bold">Up to 5 Teams</span></li>
                <li>Everything in Gigging Band</li>
                <li><span className="font-bold text-blue-600">Centralized Library</span></li>
                <li>Admin Controls</li>
                <li>Priority Support</li>
              </ul>
              <button className="w-full bg-gray-200 text-gray-700 font-bold py-3 px-6 rounded-lg hover:bg-gray-300 transition duration-300">
                Choose Plan
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Call to Action Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
        className="h-screen snap-center flex flex-col items-center justify-center bg-gray-700 text-white text-center px-2 sm:px-4"
      >
        <h3 className="text-2xl sm:text-4xl font-bold mb-4 sm:mb-6">
          Start Your Musical Journey Today!
        </h3>
        <p className="text-base sm:text-lg max-w-md sm:max-w-2xl">
          Join thousands of musicians and make chord sharing effortless.
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
        className="h-screen snap-center flex flex-col items-center justify-center text-gray-600 bg-gray-200 text-center px-2 sm:px-4"
      >
        <h3 className="text-2xl sm:text-3xl font-semibold mb-3 sm:mb-4">Stay Connected</h3>
        <p className="text-base sm:text-lg">Follow us on social media and keep up with the latest updates.</p>
        <div className="mt-3 sm:mt-4">
          <span className="px-2 sm:px-4">Facebook</span>
          <span className="px-2 sm:px-4">Twitter</span>
          <span className="px-2 sm:px-4">Instagram</span>
        </div>
        <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-6 text-sm text-gray-500">
          <button onClick={() => navigate('/privacy')} className="hover:underline">Privacy Policy</button>
          <button onClick={() => navigate('/terms')} className="hover:underline">Terms & Conditions</button>
        </div>
        <p className="mt-4 sm:mt-6 text-sm"> {new Date().getFullYear()} Team Chords. All rights reserved.</p>
      </motion.footer>
    </div>
  );
}

export default App;
