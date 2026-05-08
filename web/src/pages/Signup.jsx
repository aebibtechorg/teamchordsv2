import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

const Signup = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("e") || "";
  const inviteId = searchParams.get("inviteId") || searchParams.get("orgId") || "";
  const [error, setError] = useState(null);
  const redirectStarted = useRef(false);

  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading || redirectStarted.current) {
      return;
    }

    if (isAuthenticated) {
      navigate("/library", { replace: true });
      return;
    }

    redirectStarted.current = true;

    Promise.resolve(loginWithRedirect({
      authorizationParams: {
        screen_hint: "signup",
        ...(email ? { login_hint: email } : {}),
        ...(inviteId ? { inviteId } : {}),
      },
    })).catch((err) => {
      console.error(err);
      redirectStarted.current = false;
      setError("Unable to start Auth0 signup.");
    });
  }, [email, inviteId, isAuthenticated, isLoading, loginWithRedirect, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="flex flex-col items-center gap-4 rounded-lg bg-white p-8 shadow">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-gray-600" />
        <p className="text-sm text-gray-700">Redirecting you to secure signup…</p>
        {error && <p className="text-center text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
};

export default Signup;
