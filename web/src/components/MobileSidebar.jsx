import {User, Power, Library, BookAudio, Users, CreditCard} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth0 } from '@auth0/auth0-react';
import OrgSelector from './OrgSelector';
import { useProfileStore } from '../store/useProfileStore';

const MobileSidebar = () => {
  const { logout } = useAuth0();
  const { clearUserProfile } = useProfileStore();

  const handleSignOut = async (e) => {
    e.preventDefault();

    try {
      clearUserProfile();
      await logout({ logoutParams: { returnTo: window.location.origin } });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <nav className={`md:hidden bg-gray-700 text-white w-screen fixed bottom-0 flex flex-col items-center p-2 transition-all duration-300 ease-in-out z-50`}>
      <div className="w-full flex items-center justify-center mb-2">
        <OrgSelector />
      </div>
      <div className="w-full flex justify-between">
        <MobileNavItem to="/library" icon={<Library size={16} />} label="Library" />
        <MobileNavItem to="/setlists" icon={<BookAudio size={16} />} label="Set Lists" />
        <MobileNavItem to="/team" icon={<Users size={16} />} label="Team" />
        <MobileNavItem to="/profile" icon={<User size={16} />} label="Profile" />
        <MobileNavItem to="/billing" icon={<CreditCard size={16} />} label="Billing" />
        <MobileNavItem onClick={handleSignOut} icon={<Power size={16} />} />
      </div>
    </nav>
  );
};

function MobileNavItem({ to, icon, label, onClick }) {
  if (to) {
    return (
      <Link
        to={to}
        className="flex flex-col w-full justify-center items-center space-y-2 rounded-md cursor-pointer hover:bg-gray-500"
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
      className="flex flex-col w-full justify-center items-center space-y-2 rounded-md cursor-pointer hover:bg-gray-500"
      title={label}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </button>
  );
}
  

export default MobileSidebar;