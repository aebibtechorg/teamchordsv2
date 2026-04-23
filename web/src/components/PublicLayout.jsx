import { Link } from "react-router-dom";
import MainLogo from "./MainLogo";

const PublicLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 w-full flex justify-between p-3 sm:p-4 bg-gray-700 text-white shadow-md z-10">
        <h1 className="flex items-center text-lg sm:text-xl">
          <Link to="/" className="flex items-center">
            <MainLogo size={28} className="mr-2" /> Team Chords
          </Link>
        </h1>
        <div>
          <Link to="/" className="px-3 py-2 sm:px-4 sm:py-2 rounded bg-gray-500 hover:bg-gray-600 transition text-sm sm:text-base">
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-16 pb-16"> {/* Adjust for fixed navbar and footer */}
        {children}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 w-full bg-gray-200 text-gray-600 text-center px-2 sm:px-4 py-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-sm text-gray-500 justify-center">
          <Link to="/privacy-policy" className="hover:underline">Privacy Policy</Link>
          <Link to="/terms-and-conditions" className="hover:underline">Terms & Conditions</Link>
        </div>
        <p className="mt-2 text-sm">© {new Date().getFullYear()} Team Chords. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default PublicLayout;
