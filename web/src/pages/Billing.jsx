import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, ExternalLink, ArrowUpCircle, XCircle } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { useProfileStore } from '../store/useProfileStore';
import { getProfile } from '../utils/common';
import { cancelSubscription, openBillingPortal } from '../utils/billing';
import ConfirmDialog from '../components/ConfirmDialog';

const PLAN_LABELS = {
  Free: 'Jam Session (Free)',
  GiggingBand: 'Gigging Band',
  Organization: 'Organization',
};

const STATUS_BADGE = {
  Active:     'bg-green-100 text-green-800',
  Canceled:   'bg-red-100 text-red-800',
  PastDue:    'bg-yellow-100 text-yellow-800',
  Incomplete: 'bg-orange-100 text-orange-800',
  None:       'bg-gray-100 text-gray-600',
};

export default function Billing() {
  const { profile, setUserProfile } = useProfileStore();
  const [portalLoading, setPortalLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const orgId = profile?.orgId;
  const activeOrg = profile?.organizations?.find(o => o.id === orgId);
  const isAdmin = activeOrg?.role?.toLowerCase() === 'admin';

  const plan = activeOrg?.plan ?? 'Free';
  const status = activeOrg?.subscriptionStatus ?? 'None';
  const expiresAt = activeOrg?.planExpiresAt;

  const isPaid = plan !== 'Free';
  const isCancelPending = status === 'Canceled' && isPaid; // cancelled but period not ended yet

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const { url } = await openBillingPortal(orgId, window.location.href);
      // window.location.href = url;
      window.open(url, '_blank');
      setPortalLoading(false);
    } catch (err) {
      toast.error(err.message || 'Could not open billing portal.');
      setPortalLoading(false);
    }
  };

  const handleCancel = async () => {
    setCancelLoading(true);
    try {
      await cancelSubscription(orgId);
      toast.success('Subscription cancelled. Access continues until the end of your billing period.');
      // Refresh profile so status reflects the webhook eventually, but for now just refetch
      const fresh = await getProfile();
      if (fresh) setUserProfile(fresh);
    } catch (err) {
      toast.error(err.message || 'Failed to cancel subscription.');
    } finally {
      setCancelLoading(false);
    }
  };

  if (!orgId) {
    return <div className="p-6 text-gray-500">No organization selected.</div>;
  }

  return (
    <div className="p-6 max-w-2xl">
      <Toaster />
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <CreditCard size={24} /> Billing
      </h1>

      {/* Current Plan Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Current Plan</h2>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-2xl font-bold text-gray-900">{PLAN_LABELS[plan] ?? plan}</p>
            {expiresAt && (
              <p className="text-sm text-gray-500 mt-1">
                {isCancelPending ? 'Access until' : 'Renews'}{' '}
                {new Date(expiresAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            )}
          </div>

          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_BADGE[status] ?? STATUS_BADGE.None}`}>
            {isCancelPending ? 'Cancels at period end' : status}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        {/* Manage Billing — only if a Dodo customer exists (paid plan) */}
        {isPaid && isAdmin && (
          <button
            onClick={handlePortal}
            disabled={portalLoading}
            className="flex items-center gap-2 justify-center w-full sm:w-auto bg-gray-500 hover:bg-gray-600 disabled:opacity-50 text-white font-semibold py-2.5 px-5 rounded-lg transition"
          >
            <ExternalLink size={16} />
            {portalLoading ? 'Opening portal…' : 'Manage Billing'}
          </button>
        )}

        {/* Upgrade */}
        {plan === 'Free' && (
          <Link
            to="/pricing"
            className="flex items-center gap-2 justify-center w-full sm:w-auto bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2.5 px-5 rounded-lg transition"
          >
            <ArrowUpCircle size={16} />
            Upgrade Plan
          </Link>
        )}

        {/* Cancel */}
        {isPaid && isAdmin && !isCancelPending && (
          <button
            onClick={() => setShowCancelConfirm(true)}
            disabled={cancelLoading}
            className="flex items-center gap-2 justify-center w-full sm:w-auto border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 font-semibold py-2.5 px-5 rounded-lg transition"
          >
            <XCircle size={16} />
            {cancelLoading ? 'Cancelling…' : 'Cancel Subscription'}
          </button>
        )}
      </div>

      {/* What's included */}
      {plan !== 'Free' && (
        <div className="mt-6 text-sm text-gray-500">
          Want to change plans?{' '}
          <Link to="/pricing" className="text-blue-600 hover:underline">View all plans</Link>
        </div>
      )}

      <ConfirmDialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleCancel}
        title="Cancel Subscription"
        message={`Your subscription will remain active until ${expiresAt ? new Date(expiresAt).toLocaleDateString() : 'the end of your billing period'}, then downgrade to the free plan. Are you sure?`}
        confirmLabel="Yes, Cancel"
        cancelLabel="Keep Subscription"
      />
    </div>
  );
}
