/* eslint-disable react/prop-types */
import Modal from './Modal';
import { Ticket, Trash2, Loader2 } from 'lucide-react';

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

const PlanChangePreviewDialog = ({
  isOpen,
  onClose,
  onConfirm,
  preview,
  isSubmitting = false,
  isCancellationScheduled = false,
  discountCode = "",
  setDiscountCode,
  appliedDiscount = null,
  onApplyDiscount,
  onRemoveDiscount,
  validatingCode = false,
  validationError = "",
}) => {
  if (!isOpen || !preview) {
    return null;
  }

  const currentPlanLabel = PLAN_LABELS[preview.currentPlan] ?? preview.currentPlan;
  const targetPlanLabel = PLAN_LABELS[preview.targetPlan] ?? preview.targetPlan;
  const requiresResumeConfirmation = Boolean(preview.requiresResumeConfirmation);
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

  if (requiresResumeConfirmation) {
    return (
      <Modal
        onClose={onClose}
        className="fixed inset-x-4 top-10 mx-auto w-full max-w-2xl rounded-xl bg-white shadow-2xl backdrop:bg-black/50"
      >
        <div className="p-6">
          <div className="mb-4">
            <h3 className="text-2xl font-bold text-gray-900">Confirm Resume & Upgrade</h3>
            <p className="mt-2 text-sm text-gray-600">
              {preview.message || 'Your subscription is scheduled to end. Upgrading will resume it and remove the scheduled cancellation.'}
            </p>
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

          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Scheduled cancellation detected</p>
            <p className="mt-1">
              Confirming this upgrade will keep the subscription active and remove the scheduled cancellation{preview.scheduledCancellationEndsAt ? ` (scheduled to end on ${formatDateTime(preview.scheduledCancellationEndsAt)})` : ''}.
            </p>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 transition hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Keep scheduled cancellation
            </button>
            <button
              onClick={onConfirm}
              disabled={isSubmitting}
              className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Processing…' : 'Resume & Upgrade'}
            </button>
          </div>
        </div>
      </Modal>
    );
  }

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

        {/* Discount Code Section */}
        {isUpgrade && (
          <div className="mt-4 rounded-lg border border-gray-200 p-4">
            <h4 className="text-sm font-bold text-gray-900 mb-2">Discount Code</h4>
            
            {!appliedDiscount ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      placeholder="Enter promo code"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none uppercase"
                      disabled={validatingCode || isSubmitting}
                    />
                  </div>
                  <button
                    onClick={() => onApplyDiscount(discountCode)}
                    disabled={validatingCode || isSubmitting || !discountCode.trim()}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 transition disabled:opacity-55 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
                  >
                    {validatingCode ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Applying...
                      </>
                    ) : (
                      "Apply"
                    )}
                  </button>
                </div>
                {validationError && (
                  <p className="text-xs font-semibold text-red-650">{validationError}</p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-100 p-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-emerald-100 p-1.5 text-emerald-800">
                    <Ticket size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-900">
                      Code {appliedDiscount.code} Applied
                    </p>
                    <p className="text-xs text-emerald-700 font-medium">
                      {appliedDiscount.name} ({(appliedDiscount.amount / 100).toFixed(0)}% Off)
                    </p>
                  </div>
                </div>
                <button
                  onClick={onRemoveDiscount}
                  disabled={validatingCode || isSubmitting}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-100 hover:text-red-600 transition cursor-pointer"
                  title="Remove Discount"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
        )}

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
            {isSubmitting ? 'Processing…' : isUpgrade ? (isCancellationScheduled ? 'Resume & Upgrade' : 'Confirm Upgrade') : 'Confirm Downgrade'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PlanChangePreviewDialog;


