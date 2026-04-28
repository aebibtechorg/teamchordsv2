import { useAuth0 } from '@auth0/auth0-react';
import { useProfileStore } from "../store/useProfileStore";

const NoSidebar = ({ children }) => {
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
        <div className="fixed inset-0 w-screen h-screen flex justify-center align-center bg-gray-700">
            <div className="w-full md:w-1/2 lg:w-1/4 m-auto border rounded bg-gray-100 p-6 flex flex-col">
                {children}
                <button className="w-full mt-4 border border-gray-500 rounded bg-white p-2 text-gray-500 hover:bg-gray-600 hover:text-white disabled:opacity-50" onClick={handleSignOut}>Sign out</button>
            </div>
        </div>
    );
};

export default NoSidebar;