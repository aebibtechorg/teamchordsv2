import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import { router } from "./router";
import { RouterProvider } from "react-router-dom";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import { setTokenProvider } from "./utils/api";

import { loadConfig } from "./config";

function AuthTokenProviderSetup() {
  const { getAccessTokenSilently } = useAuth0();

  // Wire the token provider to Auth0. This will make apiFetch call
  // useAuth0.getAccessTokenSilently() to obtain the access token.
  // We set it once here; if getAccessTokenSilently changes identity, the provider will update.
  import.meta.env;

  // run effect to set provider
  useEffect(() => {
    setTokenProvider(async () => {
      try {
        const config = await loadConfig();
        return await getAccessTokenSilently({ audience: config.auth0Audience || import.meta.env.VITE_AUTH0_AUDIENCE });
      } catch (e) {
        return null;
      }
    });
  }, [getAccessTokenSilently]);

  return null;
}

async function bootstrap() {
  const config = await loadConfig()
  const audience = config.auth0Audience || import.meta.env.VITE_AUTH0_AUDIENCE;

  createRoot(document.getElementById("root")).render(
    <StrictMode>
        <Auth0Provider
          domain={config.auth0Domain || import.meta.env.VITE_AUTH0_DOMAIN}
          clientId={config.auth0ClientId || import.meta.env.VITE_AUTH0_CLIENT_ID}
          authorizationParams={{
            redirect_uri: window.location.origin + "/callback",
            audience: audience,
          }}
          cacheLocation="localstorage"
        >
          <AuthTokenProviderSetup />
            <RouterProvider router={router} />
        </Auth0Provider>
    </StrictMode>
  );
}

bootstrap();

