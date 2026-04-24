import { apiFetch } from "../utils/api";
import { useProfileStore } from "../store/useProfileStore";
import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";
import { getProfile } from "../utils/common";
import ConfirmDialog from "./ConfirmDialog";

const PENDING_PLAN_KEY = "pendingPlanCheckout";
const PLAN_ORDER = { Free: 0, GiggingBand: 1, Organization: 2 };

const PricingCards = ({ isAuthenticated = false }) => {
  const { profile, setUserProfile } = useProfileStore();
  const { loginWithRedirect } = useAuth0();
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Derive current plan from active org
  const activeOrg = profile?.organizations?.find(o => o.id === profile?.orgId || o.Id === profile?.orgId);
  const currentPlan = activeOrg?.plan || 'Free';

  useEffect(() => {
    const handleCheckoutRedirect = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('checkout') === '1') {
        // Re-fetch profile to ensure fresh plan data
        const freshProfile = await getProfile();
        if (freshProfile) {
          setUserProfile(freshProfile);
        }
        const pendingPlan = localStorage.getItem(PENDING_PLAN_KEY);
        if (pendingPlan && freshProfile?.orgId) {
          localStorage.removeItem(PENDING_PLAN_KEY);
          handleCheckout(pendingPlan);
        }
      }
    };
    handleCheckoutRedirect();
  }, []);

  const handleCheckout = async (plan) => {
    setIsLoading(true);
    setCheckoutError(null);

    if (!isAuthenticated) {
      // Unauthenticated flow: save plan then send to Auth0 login
      localStorage.setItem(PENDING_PLAN_KEY, plan);
      await loginWithRedirect();
      return;
    }

    // Authenticated flow
    if (!profile?.orgId) {
      setCheckoutError('No active organization selected.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await apiFetch('/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan, orgId: profile.orgId, redirectUrl: `${window.location.origin}/profile` })
      });
      const data = await res.json();
      window.location.href = data.url;
    } catch (error) {
      console.error('Checkout error:', error);
      setCheckoutError('An error occurred during checkout. Please try again.');
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!profile?.orgId) {
      setCheckoutError('No active organization selected.');
      return;
    }

    try {
      const res = await apiFetch('/api/billing/cancel', {
        method: 'POST',
        body: JSON.stringify({ orgId: profile.orgId })
      });
      if (res.ok) {
        // Re-fetch profile to update plan
        const freshProfile = await getProfile();
        if (freshProfile) {
          setUserProfile(freshProfile);
        }
      } else {
        setCheckoutError('Failed to cancel subscription.');
      }
    } catch (error) {
      console.error('Cancel error:', error);
      setCheckoutError('An error occurred while canceling.');
    }
  };

  const getPlanButton = (cardPlan) => {
    if (!isAuthenticated) {
      return (
        <button
          onClick={() => handleCheckout(cardPlan)}
          className="w-full bg-blue-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-600 transition duration-300"
        >
          {cardPlan === 'Free' ? 'Get Started' : 'Choose Plan'}
        </button>
      );
    }

    const currentRank = PLAN_ORDER[currentPlan] || 0;
    const cardRank = PLAN_ORDER[cardPlan] || 0;

    if (cardRank === currentRank) {
      return (
        <button
          disabled
          className="w-full bg-gray-200 text-gray-700 font-bold py-3 px-6 rounded-lg cursor-not-allowed"
        >
          Current Plan
        </button>
      );
    } else if (cardRank > currentRank) {
      return (
        <button
          onClick={() => handleCheckout(cardPlan)}
          className="w-full bg-blue-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-600 transition duration-300"
        >
          Upgrade
        </button>
      );
    } else {
      // cardRank < currentRank, only possible for Free card
      return (
        <button
          onClick={() => setShowCancelConfirm(true)}
          className="w-full bg-red-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-red-600 transition duration-300"
        >
          Cancel Plan
        </button>
      );
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-center mb-4">Find the Right Plan for Your Team</h1>
        <p className="text-xl text-gray-600 text-center mb-12">
          From solo artists to large organizations, we have a plan that fits your needs.
        </p>

        {/* Pricing Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Tier 1: Jam Session */}
          <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col">
            <h2 className="text-2xl font-bold mb-4">Jam Session</h2>
            <p className="text-4xl font-extrabold mb-4">$0<span className="text-lg font-normal text-gray-500">/ month</span></p>
            <p className="text-gray-600 mb-6">For solo artists, hobbyists, or users testing the platform.</p>
            <ul className="space-y-4 text-gray-700 mb-8 flex-grow">
              <li><span className="font-bold">1 Team</span> allowed</li>
              <li>Max <span className="font-bold">3 Team Members</span></li>
              <li><span className="font-bold">50 Songs</span> (ChordPro sheets)</li>
              <li><span className="font-bold">3 Set Lists</span></li>
              <li>Basic ChordPro Editor</li>
              <li>Read-only public sharing</li>
              <li className="text-gray-400">Real-time live view sync (Live Mode)</li>
            </ul>
            {getPlanButton('Free')}
          </div>

          {/* Tier 2: Gigging Band */}
          <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col border-4 border-blue-500 relative">
            <div className="absolute top-0 -translate-y-1/2 bg-blue-500 text-white font-bold py-1 px-4 rounded-full">
              Most Popular
            </div>
            <h2 className="text-2xl font-bold mb-4">Gigging Band</h2>
            <p className="text-4xl font-extrabold mb-4">$5<span className="text-lg font-normal text-gray-500">/ month</span></p>
            <p className="text-gray-600 mb-6">For local bands, worship teams, and performing groups.</p>
            <ul className="space-y-4 text-gray-700 mb-8 flex-grow">
              <li><span className="font-bold">1 Team</span> allowed</li>
              <li><span className="font-bold">Unlimited</span> Team Members</li>
              <li><span className="font-bold">Unlimited</span> Songs</li>
              <li><span className="font-bold">Unlimited</span> Set Lists</li>
              <li><span className="font-bold text-blue-600">Real-Time "Live Mode"</span></li>
              <li>Transposition Tools</li>
              <li>PDF Export/Print</li>
              <li>Offline Mode</li>
            </ul>
            {getPlanButton('GiggingBand')}
          </div>

          {/* Tier 3: Organization */}
          <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col">
            <h2 className="text-2xl font-bold mb-4">Organization</h2>
            <p className="text-4xl font-extrabold mb-4">$49<span className="text-lg font-normal text-gray-500">/ month</span></p>
            <p className="text-gray-600 mb-6">For multi-campus churches, music schools, or booking agencies.</p>
            <ul className="space-y-4 text-gray-700 mb-8 flex-grow">
              <li><span className="font-bold">Up to 5 Teams</span></li>
              <li>Everything in Gigging Band</li>
              <li><span className="font-bold text-blue-600">Centralized Library</span></li>
              <li>Admin Controls</li>
              <li>Priority Support</li>
            </ul>
            {getPlanButton('Organization')}
          </div>
        </div>

        {checkoutError && (
          <div className="mt-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {checkoutError}
          </div>
        )}

        {isLoading && (
          <div className="mt-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600">Processing checkout...</p>
          </div>
        )}

        {/* Feature Gating Matrix */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center mb-8">Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow-lg">
              <thead className="bg-gray-200">
                <tr>
                  <th className="py-3 px-6 text-left font-bold">Feature</th>
                  <th className="py-3 px-6 text-center font-bold">Jam Session (Free)</th>
                  <th className="py-3 px-6 text-center font-bold">Gigging Band ($15)</th>
                  <th className="py-3 px-6 text-center font-bold">Organization ($49)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-4 px-6 font-semibold">Members</td>
                  <td className="py-4 px-6 text-center">3</td>
                  <td className="py-4 px-6 text-center font-bold">Unlimited</td>
                  <td className="py-4 px-6 text-center font-bold">Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-6 font-semibold">Songs</td>
                  <td className="py-4 px-6 text-center">50</td>
                  <td className="py-4 px-6 text-center font-bold">Unlimited</td>
                  <td className="py-4 px-6 text-center font-bold">Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-6 font-semibold">Teams</td>
                  <td className="py-4 px-6 text-center">1</td>
                  <td className="py-4 px-6 text-center">1</td>
                  <td className="py-4 px-6 text-center font-bold">Up to 5</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-6 font-semibold">Live Sync</td>
                  <td className="py-4 px-6 text-center">No</td>
                  <td className="py-4 px-6 text-center text-green-500 font-bold">✓</td>
                  <td className="py-4 px-6 text-center text-green-500 font-bold">✓</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-6 font-semibold">Key Transpose</td>
                  <td className="py-4 px-6 text-center">Personal Only</td>
                  <td className="py-4 px-6 text-center font-bold">Global Sync</td>
                  <td className="py-4 px-6 text-center font-bold">Global Sync</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold">Library Sharing</td>
                  <td className="py-4 px-6 text-center">No</td>
                  <td className="py-4 px-6 text-center">No</td>
                  <td className="py-4 px-6 text-center font-bold">Cross-Team</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Cancel Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showCancelConfirm}
          onClose={() => setShowCancelConfirm(false)}
          onConfirm={handleCancel}
          title="Confirm Cancellation"
          message="Are you sure you want to cancel your plan? This action cannot be undone."
          confirmLabel="Yes, Cancel Plan"
          cancelLabel="No, Keep Plan"
        />
      </div>
    </div>
  );
};

export default PricingCards;
