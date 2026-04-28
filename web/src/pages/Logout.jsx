import { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useProfileStore } from "../store/useProfileStore";

const Logout= () => {
    const { logout } = useAuth0();
    const { clearUserProfile } = useProfileStore();

    useEffect(() => {
        // Trigger Auth0 logout and return to app origin
        if (typeof window !== "undefined") {
            logout({ logoutParams: { returnTo: window.location.origin } })
                .then(() => { clearUserProfile() });
        }
    }, [clearUserProfile, logout]);

    return <div>Logging out…</div>;
};

export default Logout;