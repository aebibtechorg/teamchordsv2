import { User, Power, Library, BookAudio } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth0 } from '@auth0/auth0-react';
import OrgSelector from './OrgSelector';

const MobileSidebar = () => {
  const { logout } = useAuth0();
  const navigate = useNavigate();

  const handleSignOut = async (e) => {
    e.preventDefault();

    try {
      await logout({ logoutParams: { returnTo: window.location.origin } });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <nav className={`md:hidden w-screen fixed bottom-0 flex flex-col items-center p-2 transition-all duration-300 ease-in-out z-50 border-t bg:white dark:bg:black`}>
      <div className="w-full flex items-center justify-center mb-4">
        <OrgSelector />
      </div>
      <div className="w-full flex justify-between">
        <MobileNavItem to="/library" icon={<Library size={16} />} label="Chord Library" />
        <MobileNavItem to="/setlists" icon={<BookAudio size={16} />} label="Set Lists" />
        <MobileNavItem to="/profile" icon={<User size={16} />} label="Profile" />
        <MobileNavItem onClick={handleSignOut} icon={<Power size={16} />} label="Sign out" />
      </div>
    </nav>
  );
};

function MobileNavItem({ to, icon, label, onClick }) {
  if (to) {
    return (
      <Link
        to={to}
        className="flex flex-col w-full justify-center items-center space-y-2 rounded-md cursor-pointer hover:bg-muted transition-colors"
        title={label}
      >
        {icon}
        <span className="text-xs">{label}</span>
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className="flex flex-col w-full justify-center items-center space-y-2 rounded-md cursor-pointer hover:bg-muted transition-colors"
      title={label}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </button>
  );
}
  

export default MobileSidebar;