/* eslint-disable react/prop-types */
import { useProfileStore } from "../store/useProfileStore";
import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile } from "../utils/common";
import { startCheckout, changePlan, previewPlanChange, cancelSubscription } from "../utils/billing";
import ConfirmDialog from "./ConfirmDialog";
import PlanChangePreviewDialog from "./PlanChangePreviewDialog";

const PENDING_PLAN_KEY = "pendingPlanCheckout";
const PLAN_ORDER = { Free: 0, GiggingBand: 1, Organization: 2 };
const REFRESH_RETRY_DELAY_MS = 1;

const PricingCards = ({ isAuthenticated = false }) => {
  const { profile, setUserProfile } = useProfileStore();
  const { loginWithRedirect } = useAuth0();
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planPreview, setPlanPreview] = useState(null);
  const [showPlanPreview, setShowPlanPreview] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showResumeUpgradeConfirm, setShowResumeUpgradeConfirm] = useState(false);
  const [resumeUpgradeMessage, setResumeUpgradeMessage] = useState(null);

  const navigate = useNavigate();

  // Derive current plan from active org
  const activeOrg = profile?.organizations?.find(o => o.id === profile?.orgId || o.Id === profile?.orgId);
  const currentPlan = activeOrg?.plan ||  'Free';
  const currentStatus = activeOrg?.subscriptionStatus ?? 'None';
  const isCancelScheduled = currentStatus === 'ScheduledToEnd';

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
    setSuccessMessage(null);

    if (!isAuthenticated) {
      // Unauthenticated flow: only paid plans need to resume into checkout after login.
      if (plan !== 'Free') {
        localStorage.setItem(PENDING_PLAN_KEY, plan);
      } else {
        localStorage.removeItem(PENDING_PLAN_KEY);
      }
      await loginWithRedirect();
      return;
    }

    // Authenticated flow
    if (!profile?.orgId) {
      setCheckoutError('No active organization selected.');
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    navigate(`/checkout?plan=${plan}`);
  };

  const closePlanPreview = (force = false) => {
    if (isLoading && !force) {
      return;
    }

    setShowPlanPreview(false);
    setPlanPreview(null);
    setSelectedPlan(null);
  };

  const closeResumeUpgradeConfirm = () => {
    if (isLoading) {
      return;
    }

    setShowResumeUpgradeConfirm(false);
    setResumeUpgradeMessage(null);
    setSelectedPlan(null);
  };

  const handlePaidPlanPreview = async (plan) => {
    setCheckoutError(null);
    setSuccessMessage(null);
    setSelectedPlan(plan);
    setShowResumeUpgradeConfirm(false);
    setResumeUpgradeMessage(null);

    const currentRank = PLAN_ORDER[currentPlan] || 0;
    const cardRank = PLAN_ORDER[plan] || 0;

    if (isCancelScheduled && cardRank > currentRank) {
      setPlanPreview(null);
      setShowPlanPreview(false);
      setResumeUpgradeMessage('Your subscription is scheduled to end. Confirming this upgrade will resume it and remove the scheduled cancellation.');
      setShowResumeUpgradeConfirm(true);
      return;
    }

    setIsLoading(true);

    if (!profile?.orgId) {
      setCheckoutError('No active organization selected.');
      setIsLoading(false);
      return;
    }

    try {
      const preview = await previewPlanChange(plan, profile.orgId);
      if (preview?.requiresResumeConfirmation) {
        setPlanPreview(null);
        setShowPlanPreview(false);
        setResumeUpgradeMessage(preview.message || 'Your subscription is scheduled to end. Confirming this upgrade will resume it and remove the scheduled cancellation.');
        setShowResumeUpgradeConfirm(true);
        return;
      }

      setPlanPreview(preview);
      setShowPlanPreview(true);
    } catch (error) {
      console.error('Plan preview error:', error);
      setCheckoutError(error.message || 'An error occurred while previewing the plan change. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmPlanChange = async () => {
    if (!selectedPlan || !profile?.orgId) {
      setCheckoutError('No active organization selected.');
      return;
    }

    setIsLoading(true);
    setCheckoutError(null);
    setSuccessMessage(null);

    const beforePlan = currentPlan;
    const beforeStatus = activeOrg?.subscriptionStatus ?? 'None';
    const beforeExpiresAt = activeOrg?.planExpiresAt ?? null;

    try {
      const result = await changePlan(selectedPlan, profile.orgId);
      const freshProfile = await getProfile();
      if (freshProfile) {
        setUserProfile(freshProfile);

        const freshOrg = freshProfile?.organizations?.find(o => o.id === freshProfile?.orgId || o.Id === freshProfile?.orgId);
        const isStillStale =
          (freshOrg?.plan ?? 'Free') === beforePlan &&
          (freshOrg?.subscriptionStatus ?? 'None') === beforeStatus &&
          (freshOrg?.planExpiresAt ?? null) === beforeExpiresAt;

        if (isStillStale) {
          await new Promise(resolve => setTimeout(resolve, REFRESH_RETRY_DELAY_MS));
          const retriedProfile = await getProfile();
          if (retriedProfile) {
            setUserProfile(retriedProfile);
          }
        }
      }

      setSuccessMessage(result?.message || 'Your plan change was submitted.');
      closePlanPreview(true);
    } catch (error) {
      console.error('Plan change error:', error);
      setCheckoutError(error.message || 'An error occurred while changing plans. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!profile?.orgId) {
      setCheckoutError('No active organization selected.');
      return;
    }

    try {
      setCheckoutError(null);
      setSuccessMessage(null);
      await cancelSubscription(profile.orgId);
      // Re-fetch profile to update plan
      const freshProfile = await getProfile();
      if (freshProfile) {
        setUserProfile(freshProfile);
      }
      setSuccessMessage('Your subscription cancellation has been scheduled. Access continues until the end of the billing period.');
    } catch (error) {
      console.error('Cancel error:', error);
      setCheckoutError(error.message || 'An error occurred while canceling.');
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
    } else if (currentPlan === 'Free') {
      return (
        <button
          onClick={() => handleCheckout(cardPlan)}
          className="w-full bg-blue-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-600 transition duration-300"
        >
          {cardPlan === 'Free' ? 'Current Plan' : 'Choose Plan'}
        </button>
      );
    } else {
      if (cardPlan === 'Free') {
        if (isCancelScheduled) {
          return (
            <button
              disabled
              className="w-full bg-gray-200 text-gray-700 font-bold py-3 px-6 rounded-lg cursor-not-allowed"
            >
              Cancellation Scheduled
            </button>
          );
        }

        return (
          <button
            onClick={() => setShowCancelConfirm(true)}
            className="w-full bg-red-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-red-600 transition duration-300"
          >
            Cancel Plan
          </button>
        );
      }

      return (
        <button
          onClick={() => handlePaidPlanPreview(cardPlan)}
          disabled={isLoading}
          className="w-full bg-blue-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-600 transition duration-300"
        >
          {isCancelScheduled && cardRank > currentRank ? 'Resume & Upgrade' : cardRank > currentRank ? 'Upgrade' : 'Downgrade'}
        </button>
      );
    }
  };

  return (
    // Avoid forcing a full-screen min-height here and ensure the component respects parent width.
    <div className="bg-gray-100 w-full">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-center mb-4">Find the Right Plan for Your Library</h1>
        <p className="text-xl text-gray-600 text-center mb-12">
          Each account can own one organization, and invites can still add you to other organizations.
        </p>
        <div className="mx-auto mb-8 max-w-4xl space-y-2 rounded-lg border border-gray-200 bg-white px-5 py-4 text-center text-sm text-gray-700 shadow-sm">
          <p>All paid plans are billed monthly. You can cancel anytime, and your access will remain active until the end of the billing period.</p>
          <p>Subscriptions are non-refundable except where required by law.</p>
          <p>Live Mode keeps the shared set list view in sync when the creator changes keys, capos, song order, or chord-sheet content. Gigging Band adds musician-local transpose controls, offline reuse of previously opened live views, and print/PDF support.</p>
        </div>
        {/*<div className="max-w-3xl mx-auto mb-12 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 text-center">*/}
        {/*  Tiering is based on chord sheet and set list capacity inside your organization.*/}
        {/*</div>*/}

        {/* Pricing Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Tier 1: Jam Session */}
          <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col">
            <h2 className="text-2xl font-bold mb-4">Jam Session</h2>
            <p className="text-4xl font-extrabold mb-4">$0<span className="text-lg font-normal text-gray-500">/ month</span></p>
            <p className="text-gray-600 mb-6">For solo artists and hobbyists getting started with a small library.</p>
            <ul className="space-y-4 text-gray-700 mb-8 grow">
              <li><span className="font-bold">50 Chord Sheets</span> (ChordPro sheets)</li>
              <li><span className="font-bold">3 Set Lists</span></li>
              <li><span className="font-bold">3 Team Members</span></li>
              <li>Basic ChordPro Editor</li>
              <li>Read-only public sharing</li>
              <li>Real-Time Live Mode for shared set list updates</li>
            </ul>
            {getPlanButton('Free')}
          </div>

          {/* Tier 2: Gigging Band */}
          <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col border-4 border-blue-500 relative">
            {/* center the badge to avoid horizontal overflow on small screens */}
            <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white font-bold py-1 px-4 rounded-full">
              Most Popular
            </div>
            <div className="mb-3 inline-flex w-fit rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700">
              Perfect for Worship Teams
            </div>
            <h2 className="text-2xl font-bold mb-4">Gigging Band</h2>
            <p className="text-4xl font-extrabold mb-4">$5<span className="text-lg font-normal text-gray-500">/ month</span></p>
            <p className="text-gray-600 mb-5">For active groups that need a bigger shared library and flexible set lists.</p>
            <ul className="space-y-4 text-gray-700 mb-8 grow">
              <li><span className="font-bold">250 Chord Sheets</span></li>
              <li><span className="font-bold">Unlimited</span> Set Lists</li>
              <li><span className="font-bold">Unlimited</span> Team Members</li>
              <li>Everything in Jam Session</li>
              <li>Transposition Tools</li>
              <li>Offline access for previously opened live views</li>
              <li>PDF Export / Print</li>
            </ul>
            {getPlanButton('GiggingBand')}
          </div>

          {/* Tier 3: Pro Library */}
          <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col">
            <h2 className="text-2xl font-bold mb-4">Pro Library</h2>
            <p className="text-4xl font-extrabold mb-4">$49<span className="text-lg font-normal text-gray-500">/ month</span></p>
            <p className="text-gray-600 mb-5">For organizations that need the largest shared chord library and set list capacity.</p>
            <ul className="space-y-4 text-gray-700 mb-8 grow">
              <li><span className="font-bold">Unlimited Chord Sheets</span></li>
              <li><span className="font-bold">Unlimited Set Lists</span></li>
              <li><span className="font-bold">Unlimited Team Members</span></li>
              <li>Everything in Gigging Band</li>
              <li>Priority Support</li>
              <li>Best fit for larger organizations with higher capacity needs</li>
            </ul>
            {getPlanButton('Organization')}
          </div>
        </div>

        {checkoutError && (
          <div className="mt-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {checkoutError}
          </div>
        )}

        {successMessage && (
          <div className="mt-8 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {successMessage}
          </div>
        )}

        {isLoading && (
          <div className="mt-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600">Processing billing change...</p>
          </div>
        )}

        <PlanChangePreviewDialog
          isOpen={showPlanPreview}
          onClose={closePlanPreview}
          onConfirm={handleConfirmPlanChange}
          preview={planPreview}
          isSubmitting={isLoading}
          isCancellationScheduled={isCancelScheduled}
        />

        {/* Feature Gating Matrix */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center mb-8">Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow-lg">
              <thead className="bg-gray-200">
                <tr>
                  <th className="py-3 px-6 text-left font-bold">Feature</th>
                  <th className="py-3 px-6 text-center font-bold">Jam Session (Free)</th>
                  <th className="py-3 px-6 text-center font-bold">Gigging Band ($5)</th>
                  <th className="py-3 px-6 text-center font-bold">Pro Library ($49)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-4 px-6 font-semibold">Real-Time Live Mode for shared set list updates</td>
                  <td className="py-4 px-6 text-center text-green-500 font-bold">✓</td>
                  <td className="py-4 px-6 text-center text-green-500 font-bold">✓</td>
                  <td className="py-4 px-6 text-center text-green-500 font-bold">✓</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-6 font-semibold">Basic ChordPro Editor</td>
                  <td className="py-4 px-6 text-center font-bold">Yes</td>
                  <td className="py-4 px-6 text-center font-bold">Yes</td>
                  <td className="py-4 px-6 text-center font-bold">Yes</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-6 font-semibold">Read-only public sharing</td>
                  <td className="py-4 px-6 text-center font-bold">Yes</td>
                  <td className="py-4 px-6 text-center font-bold">Yes</td>
                  <td className="py-4 px-6 text-center font-bold">Yes</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-6 font-semibold">Transposition Tools</td>
                  <td className="py-4 px-6 text-center">No</td>
                  <td className="py-4 px-6 text-center font-bold">Yes</td>
                  <td className="py-4 px-6 text-center font-bold">Yes</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-6 font-semibold">Offline access for previously opened live views</td>
                  <td className="py-4 px-6 text-center">No</td>
                  <td className="py-4 px-6 text-center font-bold">Yes</td>
                  <td className="py-4 px-6 text-center font-bold">Yes</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-6 font-semibold">PDF Export / Print</td>
                  <td className="py-4 px-6 text-center">No</td>
                  <td className="py-4 px-6 text-center font-bold">Yes</td>
                  <td className="py-4 px-6 text-center font-bold">Yes</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-6 font-semibold">Chord Sheets</td>
                  <td className="py-4 px-6 text-center">50</td>
                  <td className="py-4 px-6 text-center font-bold">250</td>
                  <td className="py-4 px-6 text-center font-bold">Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-6 font-semibold">Set Lists</td>
                  <td className="py-4 px-6 text-center">3</td>
                  <td className="py-4 px-6 text-center font-bold">Unlimited</td>
                  <td className="py-4 px-6 text-center font-bold">Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-6 font-semibold">Team Members</td>
                  <td className="py-4 px-6 text-center">3</td>
                  <td className="py-4 px-6 text-center font-bold">Unlimited</td>
                  <td className="py-4 px-6 text-center font-bold">Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-6 font-semibold">Priority Support</td>
                  <td className="py-4 px-6 text-center">No</td>
                  <td className="py-4 px-6 text-center">No</td>
                  <td className="py-4 px-6 text-center font-bold">Yes</td>
                </tr>
                {/*<tr>*/}
                {/*  <td className="py-4 px-6 font-semibold">Library Sharing</td>*/}
                {/*  <td className="py-4 px-6 text-center">No</td>*/}
                {/*  <td className="py-4 px-6 text-center">No</td>*/}
                {/*  <td className="py-4 px-6 text-center font-bold">Cross-Org</td>*/}
                {/*</tr>*/}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          Each account can own one organization. If you are invited into other organizations, you can still join them.
        </div>
        <div className="mt-3 text-center text-sm text-gray-500">
          Billing is monthly. Cancel anytime. No refunds except where required by law. Support: support@teamchords.com.
        </div>

        {/* Cancel Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showCancelConfirm}
          onClose={() => setShowCancelConfirm(false)}
          onConfirm={handleCancel}
          title="Confirm Cancellation"
          message="Are you sure you want to cancel your plan? Your access will remain active until the end of the billing period, and no refunds are issued for the current billing period except where required by law."
          confirmLabel="Yes, Cancel Plan"
          cancelLabel="No, Keep Plan"
        />

        <ConfirmDialog
          isOpen={showResumeUpgradeConfirm}
          onClose={closeResumeUpgradeConfirm}
          onConfirm={handleConfirmPlanChange}
          title="Resume & Upgrade"
          message={resumeUpgradeMessage || 'Your subscription is scheduled to end. Upgrading will resume it and remove the scheduled cancellation.'}
          confirmLabel="Yes, Resume & Upgrade"
          cancelLabel="Keep Scheduled Cancellation"
        />
      </div>
    </div>
  );
};

export default PricingCards;
