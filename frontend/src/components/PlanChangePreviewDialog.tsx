import React from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import Modal from './Modal';
import { Ticket, Trash2 } from 'lucide-react-native';

const PLAN_LABELS: Record<string, string> = {
  Free: 'Jam Session (Free)',
  GiggingBand: 'Gigging Band',
  Organization: 'Pro Library',
};

const formatMoney = (amountMinor: number | null | undefined, currency?: string) => {
  const amount = (amountMinor ?? 0) / 100;
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount);
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

interface PlanChangePreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  preview: any;
  isSubmitting?: boolean;
  isCancellationScheduled?: boolean;
  discountCode?: string;
  setDiscountCode?: (code: string) => void;
  appliedDiscount?: any;
  onApplyDiscount?: (code: string) => void;
  onRemoveDiscount?: () => void;
  validatingCode?: boolean;
  validationError?: string;
}

export default function PlanChangePreviewDialog({
  isOpen,
  onClose,
  onConfirm,
  preview,
  isSubmitting = false,
  isCancellationScheduled = false,
  discountCode = '',
  setDiscountCode,
  appliedDiscount = null,
  onApplyDiscount,
  onRemoveDiscount,
  validatingCode = false,
  validationError = '',
}: PlanChangePreviewDialogProps) {
  if (!isOpen || !preview) return null;

  const currentPlanLabel = PLAN_LABELS[preview.currentPlan] ?? preview.currentPlan;
  const targetPlanLabel = PLAN_LABELS[preview.targetPlan] ?? preview.targetPlan;
  const requiresResumeConfirmation = Boolean(preview.requiresResumeConfirmation);
  const immediateCharge = preview.immediateCharge?.totalAmount ?? 0;
  const currency = preview.immediateCharge?.currency ?? 'USD';
  const effectiveAt =
    preview.effectiveAt ?? preview.newPlan?.scheduledChange?.effectiveAt ?? preview.newPlan?.nextBillingDate;
  const isUpgrade = Boolean(preview.isUpgrade);
  const isCredit = immediateCharge < 0;
  const absoluteCharge = Math.abs(immediateCharge);
  const dueNowCopy =
    absoluteCharge === 0 ? 'No charge due now' : `${isCredit ? 'Credit' : 'Due now'}: ${formatMoney(absoluteCharge, currency)}`;

  return (
    <Modal visible={isOpen} onClose={onClose}>
      <ScrollView className="p-6 bg-white max-h-[85vh]">
        <View className="mb-4">
          <Text className="text-xl font-bold text-gray-900">
            {requiresResumeConfirmation
              ? 'Confirm Resume & Upgrade'
              : isUpgrade
              ? 'Confirm Upgrade'
              : 'Confirm Downgrade'}
          </Text>
          <Text className="mt-1.5 text-sm text-gray-600">
            {preview.message ||
              (requiresResumeConfirmation
                ? 'Your subscription is scheduled to end. Upgrading will resume it and remove the scheduled cancellation.'
                : 'Review the charge and timing before you continue.')}
          </Text>
        </View>

        <View className="flex-row gap-3 my-2">
          <View className="flex-1 rounded-xl border border-gray-200 p-3 bg-gray-50">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Current Plan</Text>
            <Text className="mt-1 text-sm font-bold text-gray-900">{currentPlanLabel}</Text>
          </View>
          <View className="flex-1 rounded-xl border border-blue-200 p-3 bg-blue-50">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-blue-700">New Plan</Text>
            <Text className="mt-1 text-sm font-bold text-blue-900">{targetPlanLabel}</Text>
          </View>
        </View>

        {!requiresResumeConfirmation && (
          <View className="my-2 rounded-xl border border-green-200 bg-green-50 p-4">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-green-700">Immediate Settlement</Text>
            <Text className="mt-1 text-xl font-extrabold text-green-900">{dueNowCopy}</Text>
            <Text className="mt-1 text-xs text-green-800">
              {isUpgrade
                ? 'You will be billed right away for the plan change.'
                : 'The plan changes right away and may produce a credit.'}
            </Text>
          </View>
        )}

        {isUpgrade && !requiresResumeConfirmation && (
          <View className="my-2 rounded-xl border border-gray-200 p-3.5">
            <Text className="text-xs font-bold text-gray-900 mb-2">Discount Code</Text>
            {!appliedDiscount ? (
              <View>
                <View className="flex-row gap-2">
                  <TextInput
                    value={discountCode}
                    onChangeText={setDiscountCode}
                    placeholder="Enter promo code"
                    autoCapitalize="characters"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                  />
                  <TouchableOpacity
                    onPress={() => onApplyDiscount?.(discountCode)}
                    disabled={validatingCode || isSubmitting || !discountCode.trim()}
                    className="bg-gray-900 px-4 py-2 rounded-lg items-center justify-center active:bg-gray-800"
                  >
                    {validatingCode ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text className="text-white text-xs font-bold">Apply</Text>
                    )}
                  </TouchableOpacity>
                </View>
                {Boolean(validationError) && (
                  <Text className="text-xs font-semibold text-red-500 mt-1">{validationError}</Text>
                )}
              </View>
            ) : (
              <View className="flex-row items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <View className="flex-row items-center gap-2">
                  <Ticket size={16} color="#065F46" />
                  <View>
                    <Text className="text-xs font-bold text-emerald-900">Code {appliedDiscount.code} Applied</Text>
                    <Text className="text-[10px] text-emerald-700 font-medium">{appliedDiscount.name}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={onRemoveDiscount} className="p-1">
                  <Trash2 size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <View className="my-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
          <Text className="text-xs font-semibold text-gray-900">What to expect</Text>
          <Text className="text-xs text-gray-600 mt-1">• This change applies immediately.</Text>
          {preview.newPlan?.nextBillingDate && (
            <Text className="text-xs text-gray-600 mt-0.5">
              • Next billing date: {formatDateTime(preview.newPlan.nextBillingDate)}
            </Text>
          )}
        </View>

        <View className="flex-row justify-end gap-3 mt-4">
          <TouchableOpacity
            onPress={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-lg border border-gray-300 bg-white active:bg-gray-50"
          >
            <Text className="text-sm font-semibold text-gray-700">Keep current plan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onConfirm}
            disabled={isSubmitting}
            className={`px-4 py-2.5 rounded-lg ${
              isUpgrade ? 'bg-blue-600 active:bg-blue-700' : 'bg-orange-600 active:bg-orange-700'
            }`}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text className="text-sm font-semibold text-white">
                {isUpgrade
                  ? isCancellationScheduled
                    ? 'Resume & Upgrade'
                    : 'Confirm Upgrade'
                  : 'Confirm Downgrade'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Modal>
  );
}
