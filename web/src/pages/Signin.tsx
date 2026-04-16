import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useProfileStore } from "../store/useProfileStore";
import { getProfile } from "../utils/common";
import { useAuth0 } from "@auth0/auth0-react";
import MainLogo from "../components/MainLogo";
import { FcGoogle } from "react-icons/fc";
import { FaFacebookF } from "react-icons/fa";
import Spinner from "../components/Spinner";

const Signin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { loginWithRedirect, isAuthenticated, isLoading, user } = useAuth0();
  const { setUserProfile } = useProfileStore();
  const navigate = useNavigate();

  const fetchProfile = async (data) => {
    const id = data?.user?.id || data?.user?.sub || data?.userId;
    const d = await getProfile(id);
    if (d) {
      setUserProfile(d);
      setLoading(false);
      navigate("/library");
    }
    else {
      navigate("/onboard");
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchProfile({ user });
    }
    else {
      loginWithRedirect();
    }
  }, [isAuthenticated, user]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Use Auth0 Universal Login for password-based sign-in
    try {
      await loginWithRedirect();
    } catch (err) {
      setError('Login failed');
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider) => {
    setLoading(true);
    // Map provider keys to Auth0 connection names
    const connection = provider === 'google' ? 'google-oauth2' : provider === 'facebook' ? 'facebook' : undefined;
    try {
      await loginWithRedirect({ authorizationParams: connection ? { connection } : {} });
    } catch (err) {
      setError('Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-700 w-screen h-screen flex flex-col items-center align-center">
      <Spinner />
    </div>
  );
};

export default Signin;
