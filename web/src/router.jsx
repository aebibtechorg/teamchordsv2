import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Signup from "./pages/Signup";
import Signin from "./pages/Signin";
import ChordLibrary from "./pages/ChordLibrary";
import SetLists from "./pages/SetLists";
import ChordProSheet from "./pages/ChordProSheet";
import SetListForm from "./pages/SetListForm";
import SetListView from "./pages/SetListView";
import Onboarding from "./pages/Onboarding";
import Profile from "./pages/Profile";
import NoSidebar from "./components/NoSidebar";
import InviteUser from "./components/InviteUser";
import UpdatePassword from "./pages/UpdatePassword";
import AuthCallback from "./pages/AuthCallback";
import Protected from "./components/Protected";
import Logout from "./pages/Logout";
import AcceptInvitePage from "./pages/AcceptInvite";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import TeamManagement from "./pages/TeamManagement";
import Pricing from "./pages/Pricing.jsx";
import Billing from "./pages/Billing.jsx";

export const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/signup", element: <Signup /> },
  { path: "/signin", element: <Signin /> },
  {
    path: "/library",
    element: <Protected><ChordLibrary /></Protected>,
  },
  {
    path: "/library/:id",
    element: <Protected><ChordProSheet /></Protected>,
  },
  {
    path: "/setlists",
    element: <Protected><SetLists /></Protected>,
  },
  {
    path: "/setlists/:id",
    element: <Protected><SetListForm /></Protected>,
  },
  {
    path: "/setlists/share/:id",
    element: <SetListView />,
  },
  {
    path: "/onboard",
    element: <NoSidebar><Onboarding /></NoSidebar>,
  },
  {
    path: "/profile",
    element: <Protected><Profile /></Protected>,
  },
  {
    path: "/invite",
    element: <Protected><InviteUser /></Protected>,
  },
  {
    path: "/invites/:inviteId",
    element: <AcceptInvitePage />,
  },
  {
    path: "/update-password",
    element: <Protected><UpdatePassword /></Protected>,
  },
  {
    path: "/callback",
    element: <AuthCallback />
  },
  {
    path: "/auth/callback",
    element: <AuthCallback />
  },
  {
    path: "/logout",
    element: <Logout />
  },
  {
    path: "/privacy-policy",
    element: <PrivacyPolicy />
  },
  {
    path: "/terms-and-conditions",
    element: <TermsAndConditions />
  },
  {
    path: "/team",
    element: <Protected><TeamManagement /></Protected>,
  },
  { path: "/pricing", element: <Protected><Pricing /></Protected> },
  { path: "/billing", element: <Protected><Billing /></Protected> },
]);
