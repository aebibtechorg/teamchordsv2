import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProfileStore } from "../store/useProfileStore";
import { getProfile } from "../utils/common";
import { useAuth0 } from "@auth0/auth0-react";
import Spinner from "../components/Spinner";
import { hasOrgMembership } from "../utils/onboardingTours";

const Signin = () => {
  const { loginWithRedirect, isAuthenticated, user } = useAuth0();
  const { setUserProfile, clearUserProfile } = useProfileStore();
  const navigate = useNavigate();

  const fetchProfile = async (data) => {
    const id = data?.user?.id || data?.user?.sub || data?.userId;
    const d = await getProfile(id);
    if (d) {
      setUserProfile(d);
      navigate(hasOrgMembership(d) ? "/library" : "/onboard");
    }
    else {
      clearUserProfile();
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
  }, [clearUserProfile, isAuthenticated, loginWithRedirect, navigate, setUserProfile, user]);

  return (
    <div className="bg-gray-700 w-screen h-screen flex flex-col items-center align-center">
      <Spinner />
    </div>
  );
};

export default Signin;
