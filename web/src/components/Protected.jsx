import React, { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useProfileStore } from "../store/useProfileStore";
import { getProfile } from "../utils/common";
import SidebarLayout from "./SidebarLayout";
import Spinner from "./Spinner";
import ErrorBoundary from "./ErrorBoundary";

const Protected = ({ children }) => {
  const { isAuthenticated, isLoading, user, getAccessTokenSilently, loginWithRedirect } = useAuth0();
  const { profile, setUserProfile } = useProfileStore();

  useEffect(() => {
    const sync = async () => {
      if (isLoading) return;
      if (!isAuthenticated) {
        // redirect to Auth0 login
        await loginWithRedirect();
        return;
      }

      // Optionally obtain token for API calls (not persisted here)
      try {
        await getAccessTokenSilently();
      } catch (e) {
        // ignore token errors for now
      }

      // ensure profile is loaded from backend (supabase DB)
      if (isAuthenticated && !profile) {
        const id = user?.sub;
        console.log("Protected: fetching profile for user id", id);
        if (id) {
          const p = await getProfile(id);
          if (p) setUserProfile(p);
        }
      }

      // Register service worker in production (kept from previous PrivateRoute)
      if (typeof window !== "undefined" && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
              console.log('ServiceWorker registration successful');
            })
            .catch(err => {
              console.log('ServiceWorker registration failed: ', err);
            });
        });
      }
    };

    sync();
  }, [isAuthenticated, isLoading, user]);

  if (isLoading) return <div className="p-8"><Spinner /></div>;

  if (!isAuthenticated) return <div>Redirecting to login...</div>;

  return <ErrorBoundary><SidebarLayout>{children}</SidebarLayout></ErrorBoundary>;
};

export default Protected;
