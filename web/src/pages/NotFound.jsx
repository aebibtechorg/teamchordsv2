import { useAuth0 } from "@auth0/auth0-react";
import { Link } from "react-router-dom";
import PublicLayout from "../components/PublicLayout";
import MainLogo from "../components/MainLogo";

const NotFound = () => {
  const { isAuthenticated, isLoading } = useAuth0();
  const isSignedIn = !isLoading && isAuthenticated;

  const actions = isSignedIn
    ? [
        { to: "/library", label: "Open Library", primary: true },
        { to: "/setlists", label: "View Set Lists" },
        { to: "/profile", label: "Go to Profile" },
      ]
    : [
        { to: "/", label: "Go home", primary: true },
        { to: "/signin", label: "Sign in" },
        { to: "/signup", label: "Create account" },
      ];

  return (
    <PublicLayout>
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-3xl items-center justify-center px-4 py-8">
        <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center gap-3 bg-gray-700 px-6 py-4 text-white">
            <MainLogo size={32} />
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-200">Team Chords</p>
              <h1 className="text-xl font-bold">Page not found</h1>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gray-600">
              404
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
              {isLoading
                ? "Finding your place in Team Chords..."
                : isSignedIn
                  ? "That page doesn't exist, but your workspace is still just a click away."
                  : "The page you're looking for doesn't exist or may have moved. Use one of the links below to get back into Team Chords."}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {actions.map((action) => (
                <Link
                  key={action.to}
                  to={action.to}
                  className={
                    action.primary
                      ? "rounded bg-gray-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-600"
                      : "rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                  }
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default NotFound;

