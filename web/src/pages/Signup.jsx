import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import MainLogo from "../components/MainLogo";
import { useAuth0 } from "@auth0/auth0-react";
import PublicLayout from "../components/PublicLayout.jsx";
// import { FcGoogle } from "react-icons/fc";
// import { FaFacebookF } from "react-icons/fa";

const Signup = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(decodeURIComponent(searchParams.get("e") || ""));
  const [orgId] = useState(decodeURIComponent(searchParams.get("orgId") || ""));
  const [password, setPassword] = useState("");
  const [givenName, setGivenName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { loginWithRedirect, isAuthenticated } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/library");
    }
  }, [isAuthenticated]);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        email: email || undefined,
        emailVerified: false,
        givenName: givenName || undefined,
        familyName: familyName || undefined,
        password: password || undefined,
        inviteOrganizationId: orgId || undefined
      };

      const resp = await fetch(`/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (resp.ok) {
        // Created. Redirect to signin or home.
        navigate('/signin');
      } else {
        let text = await resp.text();
        try {
          const json = JSON.parse(text);
          text = json.message || json.detail || JSON.stringify(json);
        } catch {
        }
        setError(text || 'Signup failed');
        setTimeout(() => setError(null), 4000);
      }
    } catch (err) {
      console.error(err);
      setError('Signup failed');
      setTimeout(() => setError(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  // const handleOAuthSignUp = async (provider) => {
  //   setLoading(true);
  //   const connection = provider === 'google' ? 'google-oauth2' : provider === 'facebook' ? 'facebook' : undefined;
  //   try {
  //     await loginWithRedirect({ authorizationParams: connection ? { connection } : { screen_hint: 'signup' } });
  //   } catch (err) {
  //     setError('Signup failed');
  //     setLoading(false);
  //     setTimeout(() => setError(null), 3000);
  //   }
  // };

  return (
    <PublicLayout>
      <form onSubmit={handleSignUp} className="m-auto p-12 bg-gray-100 max-w-full md:max-w-1/2">
        <h1 className="text-2xl mb-12 font-bold text-center flex justify-center"><Link to="/"><MainLogo size={96} /></Link></h1>
        <h2 className="font-bold pb-2">Sign up today!</h2>
        <p>
          Already have an account? <Link className="text-blue-500" to="/signin">Sign in</Link>
        </p>

        <div className="flex flex-col py-2">
          <input
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            className="p-3 mt-2 border rounded"
            type="email"
            name="email"
            id="email"
            placeholder="Email"
            required
          />
        </div>
        <div className="flex flex-col lg:flex-row lg:gap-2">
          <div className="flex-1 flex flex-col py-2">
            <input
              onChange={(e) => setGivenName(e.target.value)}
              value={givenName}
              className="p-3 mt-2 border rounded"
              type="text"
              name="givenName"
              id="givenName"
              placeholder="Given name"
              required
            />
          </div>
          <div className="flex-1 flex flex-col py-2">
            <input
              onChange={(e) => setFamilyName(e.target.value)}
              value={familyName}
              className="p-3 mt-2 border rounded"
              type="text"
              name="familyName"
              id="familyName"
              placeholder="Family name"
              required
            />
          </div>
        </div>

        <div className="flex flex-col py-2">
          <input
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            className="p-3 mt-2 border rounded"
            type="password"
            name="password"
            id="password"
            placeholder="Password"
            required
          />
        </div>

        <button type="submit" disabled={loading} className="w-full mt-4 border rounded bg-gray-500 p-2 text-white hover:bg-gray-600 disabled:opacity-50">
          Sign Up
        </button>
        {/*<div className="flex flex-col gap-2 mt-4">
          <button
            type="button"
            className="w-full border rounded flex items-center justify-center gap-2 bg-white p-2 text-gray-700 hover:bg-gray-200 shadow"
            onClick={() => handleOAuthSignUp('google')}
            disabled={loading}
          >
            <FcGoogle size={20} />
            <span>Sign up with Google</span>
          </button>
          <button
            type="button"
            className="w-full border rounded flex items-center justify-center gap-2 bg-blue-800 p-2 text-white hover:bg-blue-900 shadow"
            onClick={() => handleOAuthSignUp('facebook')}
            disabled={loading}
          >
            <FaFacebookF size={20} />
            <span>Sign up with Facebook</span>
          </button>
        </div>*/}
        {error && <p className="text-red-600 text-center pt-4">{error}</p>}
      </form>
    </PublicLayout>
  );
};

export default Signup;
