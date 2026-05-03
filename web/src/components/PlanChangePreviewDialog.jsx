/* eslint-disable react/prop-types */
import Modal from './Modal';

const PLAN_LABELS = {
  Free: 'Jam Session (Free)',
  GiggingBand: 'Gigging Band',
  Organization: 'Pro Library',
};

const formatMoney = (amountMinor, currency) => {
  const amount = (amountMinor ?? 0) / 100;
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount);
};

const formatDateTime = (value) => {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const PlanChangePreviewDialog = ({ isOpen, onClose, onConfirm, preview, isSubmitting = false }) => {
  if (!isOpen || !preview) {
    return null;
  }

  const currentPlanLabel = PLAN_LABELS[preview.currentPlan] ?? preview.currentPlan;
  const targetPlanLabel = PLAN_LABELS[preview.targetPlan] ?? preview.targetPlan;
  const immediateCharge = preview.immediateCharge?.totalAmount ?? 0;
  const currency = preview.immediateCharge?.currency ?? 'USD';
  const effectiveAt = preview.effectiveAt ?? preview.newPlan?.scheduledChange?.effectiveAt ?? preview.newPlan?.nextBillingDate;
  const isUpgrade = Boolean(preview.isUpgrade);
  const isCredit = immediateCharge < 0;
  const absoluteCharge = Math.abs(immediateCharge);
  const dueNowCopy = absoluteCharge === 0
    ? 'No charge due now'
    : `${isCredit ? 'Credit' : 'Due now'}: ${formatMoney(absoluteCharge, currency)}`;
  const timingCopy = 'This change applies immediately.';

  return (
    <Modal
      onClose={onClose}
      className="fixed inset-x-4 top-10 mx-auto w-full max-w-2xl rounded-xl bg-white shadow-2xl backdrop:bg-black/50"
    >
      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-2xl font-bold text-gray-900">
            {isUpgrade ? 'Confirm Upgrade' : 'Confirm Downgrade'}
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            Review the charge and timing before you continue.
          </p>
          {preview.message && (
            <p className="mt-3 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700">
              {preview.message}
            </p>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Current plan</p>
            <p className="mt-1 text-lg font-bold text-gray-900">{currentPlanLabel}</p>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">New plan</p>
            <p className="mt-1 text-lg font-bold text-blue-900">{targetPlanLabel}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Immediate settlement</p>
            <p className="mt-1 text-2xl font-extrabold text-green-900">{dueNowCopy}</p>
            <p className="mt-2 text-sm text-green-800">
              {isUpgrade
                ? 'You will be billed right away for the plan change.'
                : 'The plan changes right away and may produce a credit instead of a charge.'}
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">When it takes effect</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{timingCopy}</p>
            {!isUpgrade && (
              <p className="mt-2 text-sm font-semibold text-orange-700">Your subscription is updated immediately and settle the prorated difference now.</p>
            )}
            <p className="mt-2 text-sm text-gray-600">Effective: {formatDateTime(effectiveAt)}</p>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          <p className="font-semibold text-gray-900">What to expect</p>
          <ul className="mt-2 space-y-2">
            <li>• {absoluteCharge === 0 ? 'No money moves now.' : isCredit ? `You will receive a credit of ${formatMoney(absoluteCharge, currency)} now.` : `Your card will be charged ${formatMoney(absoluteCharge, currency)} now.`}</li>
            <li>• {isUpgrade ? 'The new tier is applied immediately after confirmation.' : 'The lower tier is applied immediately after confirmation.'}</li>
            {preview.newPlan?.nextBillingDate && (
              <li>• Next billing date: {formatDateTime(preview.newPlan.nextBillingDate)}</li>
            )}
          </ul>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 transition hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Keep current plan
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className={`rounded-lg px-4 py-2 font-semibold text-white transition ${
              isUpgrade ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {isSubmitting ? 'Processing…' : isUpgrade ? 'Confirm Upgrade' : 'Confirm Downgrade'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PlanChangePreviewDialog;


