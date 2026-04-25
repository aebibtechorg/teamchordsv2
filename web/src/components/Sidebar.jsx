import { User, Power, Library, BookAudio, Users, CreditCard } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import MobileSidebar from "./MobileSidebar";
import MainLogo from "./MainLogo";
import { useAuth0 } from '@auth0/auth0-react';
import { useProfileStore } from "../store/useProfileStore";
import OrgSelector from "./OrgSelector";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const { logout, user } = useAuth0();
  const { setUserProfile } = useProfileStore();

  const handleSignOut = async (e) => {
    e.preventDefault();

    try {
      setUserProfile(null);
      await logout({ logoutParams: { returnTo: window.location.origin } });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSidebarToggle = () => {
    if (document.body.clientWidth >= 720) {
      setIsOpen(!isOpen);
    }
    else {
      setIsOpen(false);
    }
  };

  return (
    <>
      <div className={`${ isOpen ? "w-64" : "w-20" } hidden md:flex bg-gray-700 text-white flex-col p-4 transition-all duration-500 ease-in-out`}>
        <NavItem onClick={handleSidebarToggle} label={<span className="font-bold">Team Chords</span>} icon={<MainLogo size={32} />} isOpen={isOpen} />
        <hr className="my-4" />
        <nav className="flex flex-col justify-between h-full">
            <div className="flex flex-col space-y-4">
                <NavItem to="/library" icon={<Library size={24} />} label="Library" isOpen={isOpen} />
                <NavItem to="/setlists" icon={<BookAudio size={24} />} label="Set Lists" isOpen={isOpen} />
                <NavItem to="/team" icon={<Users size={24} />} label="Team" isOpen={isOpen} />
                <NavItem to="/billing" icon={<CreditCard size={24} />} label="Billing" isOpen={isOpen} />
            </div>
            <div className="flex flex-col space-y-4">
                <hr />
                <NavItem to="/profile" icon={<User size={24} />} label={user?.name || user?.email} isOpen={isOpen} />
                {isOpen && (
                  <div>
                    <OrgSelector />
                  </div>
                )}
                <NavItem onClick={handleSignOut} icon={<Power size={24} />} label="Sign out" isOpen={isOpen} />
            </div>
        </nav>
      </div>
      <MobileSidebar />
    </>
  );
};

function NavItem({ to, icon, label, isOpen, onClick }) {
    if (to) {
      return (
        <Link
          to={to}
          className="flex items-center space-x-2 p-2 rounded-md cursor-pointer hover:bg-gray-500"
          title={label}
        >
          {icon}
          {isOpen && <span>{label}</span>}
        </Link>
      );
    }
  
    return (
      <button
        onClick={onClick}
        className="flex items-center space-x-2 p-2 rounded-md cursor-pointer hover:bg-gray-500"
        title={label}
      >
        {icon}
        {isOpen && <span>{label}</span>}
      </button>
    );
  }
  

export default Sidebar;