import React, { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useProfileStore } from "../store/useProfileStore";
import { getProfile } from "../utils/common";
import SidebarLayout from "./SidebarLayout";
import Spinner from "./Spinner";
import ErrorBoundary from "./ErrorBoundary";

const Protected = ({ children }) => {
  const { isAuthenticated, isLoading, user, getAccessTokenSilently, loginWithRedirect } = useAuth0();
  const { setUserProfile, clearUserProfile } = useProfileStore();
  const [isProfileSyncing, setIsProfileSyncing] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    const sync = async () => {
      if (isLoading) return;

      setIsProfileSyncing(true);

      if (!isAuthenticated) {
        // redirect to Auth0 login
        await loginWithRedirect();
        if (!isCancelled) setIsProfileSyncing(false);
        return;
      }

      // Optionally obtain token for API calls (not persisted here)
      try {
        await getAccessTokenSilently();
      } catch (e) {
        await loginWithRedirect();
        if (!isCancelled) setIsProfileSyncing(false);
        return;
      }

      // Always refresh the profile on auth bootstrap so we never reuse stale state.
      const id = user?.sub;
      console.log("Protected: fetching profile for user id", id);
      if (id) {
        const p = await getProfile(id);
        if (!isCancelled) {
          if (p) setUserProfile(p);
          else clearUserProfile();
        }
      }

      if (!isCancelled) setIsProfileSyncing(false);

      // Register service worker in production (kept from previous PrivateRoute)
      if (typeof window !== "undefined" && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/service-worker.js')
            .then(() => {
              console.log('ServiceWorker registration successful');
            })
            .catch(err => {
              console.log('ServiceWorker registration failed: ', err);
            });
        });
      }
    };

    sync();
    return () => {
      isCancelled = true;
    };
  }, [clearUserProfile, getAccessTokenSilently, isAuthenticated, isLoading, loginWithRedirect, setUserProfile, user?.sub]);

  if (isLoading || isProfileSyncing) return <div className="p-8"><Spinner /></div>;

  if (!isAuthenticated) return <div>Redirecting to login...</div>;

  return <ErrorBoundary><SidebarLayout>{children}</SidebarLayout></ErrorBoundary>;
};

export default Protected;
