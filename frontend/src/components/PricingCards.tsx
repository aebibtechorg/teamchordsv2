import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { useProfileStore } from '../store/useProfileStore';
import { useAuth0 } from 'react-native-auth0';
import { getProfile } from '../utils/common';
import { changePlan, previewPlanChange, cancelSubscription, validateDiscountCode } from '../utils/billing';
import ConfirmDialog from './ConfirmDialog';
import PlanChangePreviewDialog from './PlanChangePreviewDialog';
import { router } from 'expo-router';

const PLAN_ORDER: Record<string, number> = { Free: 0, GiggingBand: 1, Organization: 2 };

interface PricingCardsProps {
  isAuthenticated?: boolean;
}

export default function PricingCards({ isAuthenticated = false }: PricingCardsProps) {
  const { profile, setUserProfile } = useProfileStore();
  const { authorize } = useAuth0();
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [planPreview, setPlanPreview] = useState<any>(null);
  const [showPlanPreview, setShowPlanPreview] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showResumeUpgradeConfirm, setShowResumeUpgradeConfirm] = useState(false);
  const [resumeUpgradeMessage, setResumeUpgradeMessage] = useState<string | null>(null);

  const [upgradeDiscountCode, setUpgradeDiscountCode] = useState('');
  const [appliedUpgradeDiscount, setAppliedUpgradeDiscount] = useState<any>(null);
  const [validatingUpgradeCode, setValidatingUpgradeCode] = useState(false);
  const [upgradeValidationError, setUpgradeValidationError] = useState('');

  const activeOrg = profile?.organizations?.find((o) => o.id === profile?.orgId);
  const currentPlan = activeOrg?.plan != null ? (typeof activeOrg.plan === 'number' ? ['Free', 'GiggingBand', 'Organization'][activeOrg.plan] : String(activeOrg.plan)) : 'Free';
  const currentStatus = activeOrg?.subscriptionStatus != null ? String(activeOrg.subscriptionStatus) : 'None';
  const isCancelScheduled = currentStatus === 'ScheduledToEnd' || currentStatus === '2';

  const handleCheckout = async (plan: string) => {
    setIsLoading(true);
    setCheckoutError(null);
    setSuccessMessage(null);

    if (!isAuthenticated) {
      try {
        await authorize();
      } catch (e) {
        console.error('Auth error', e);
      }
      setIsLoading(false);
      return;
    }

    if (!profile?.orgId) {
      setCheckoutError('No active organization selected.');
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    if (Platform.OS === 'web') {
      router.push(`/(app)/checkout?plan=${plan}` as any);
    } else {
      Alert.alert(
        'In-App Purchase',
        `Proceed with ${plan} subscription via ${Platform.OS === 'ios' ? 'Apple App Store' : 'Google Play'}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Subscribe',
            onPress: () => {
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'In-App subscription initiated successfully.',
              });
            },
          },
        ]
      );
    }
  };

  const closePlanPreview = () => {
    setShowPlanPreview(false);
    setPlanPreview(null);
    setSelectedPlan(null);
    setUpgradeDiscountCode('');
    setAppliedUpgradeDiscount(null);
    setUpgradeValidationError('');
  };

  const handlePaidPlanPreview = async (plan: string) => {
    setCheckoutError(null);
    setSuccessMessage(null);
    setSelectedPlan(plan);
    setShowResumeUpgradeConfirm(false);
    setResumeUpgradeMessage(null);

    const currentRank = PLAN_ORDER[currentPlan] || 0;
    const cardRank = PLAN_ORDER[plan] || 0;

    if (isCancelScheduled && cardRank > currentRank) {
      setResumeUpgradeMessage(
        'Your subscription is scheduled to end. Confirming this upgrade will resume it and remove the scheduled cancellation.'
      );
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
      const preview = await previewPlanChange(plan, profile.orgId, null);
      if (preview?.requiresResumeConfirmation) {
        setResumeUpgradeMessage(
          preview.message ||
            'Your subscription is scheduled to end. Confirming this upgrade will resume it and remove the scheduled cancellation.'
        );
        setShowResumeUpgradeConfirm(true);
        return;
      }

      setPlanPreview(preview);
      setShowPlanPreview(true);
    } catch (error: any) {
      setCheckoutError(error.message || 'An error occurred while previewing the plan change.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyUpgradeDiscount = async (code: string) => {
    if (!code || !code.trim() || !selectedPlan || !profile?.orgId) {
      setUpgradeValidationError('Please enter a discount code.');
      return;
    }
    setValidatingUpgradeCode(true);
    setUpgradeValidationError('');
    try {
      const discount = await validateDiscountCode(code.trim());
      const preview = await previewPlanChange(selectedPlan, profile.orgId, code.trim());
      setPlanPreview(preview);
      setAppliedUpgradeDiscount(discount);
    } catch (err: any) {
      setUpgradeValidationError(err.message || 'Invalid or expired discount code.');
    } finally {
      setValidatingUpgradeCode(false);
    }
  };

  const handleConfirmPlanChange = async () => {
    if (!selectedPlan || !profile?.orgId) return;
    setIsLoading(true);
    setCheckoutError(null);
    setSuccessMessage(null);

    try {
      const result = await changePlan(selectedPlan, profile.orgId, appliedUpgradeDiscount?.code);
      const fresh = await getProfile();
      if (fresh) setUserProfile(fresh);
      setSuccessMessage(result?.message || 'Your plan change was submitted.');
      closePlanPreview();
    } catch (error: any) {
      setCheckoutError(error.message || 'An error occurred while changing plans.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!profile?.orgId) return;
    try {
      await cancelSubscription(profile.orgId);
      const fresh = await getProfile();
      if (fresh) setUserProfile(fresh);
      setSuccessMessage('Your subscription cancellation has been scheduled.');
    } catch (error: any) {
      setCheckoutError(error.message || 'An error occurred while canceling.');
    }
  };

  const renderPlanButton = (cardPlan: string) => {
    if (!isAuthenticated) {
      return (
        <TouchableOpacity
          onPress={() => handleCheckout(cardPlan)}
          className="w-full bg-primary py-3 rounded-xl items-center active:opacity-90"
        >
          <Text className="text-primary-foreground font-bold text-base">
            {cardPlan === 'Free' ? 'Get Started' : 'Choose Plan'}
          </Text>
        </TouchableOpacity>
      );
    }

    const currentRank = PLAN_ORDER[currentPlan] || 0;
    const cardRank = PLAN_ORDER[cardPlan] || 0;

    if (cardRank === currentRank) {
      return (
        <View className="w-full bg-muted py-3 rounded-xl items-center">
          <Text className="text-muted-foreground font-bold text-base">Current Plan</Text>
        </View>
      );
    } else if (currentPlan === 'Free') {
      return (
        <TouchableOpacity
          onPress={() => handleCheckout(cardPlan)}
          className="w-full bg-primary py-3 rounded-xl items-center active:opacity-90"
        >
          <Text className="text-primary-foreground font-bold text-base">Choose Plan</Text>
        </TouchableOpacity>
      );
    } else {
      if (cardPlan === 'Free') {
        if (isCancelScheduled) {
          return (
            <View className="w-full bg-muted py-3 rounded-xl items-center">
              <Text className="text-muted-foreground font-bold text-base">Cancellation Scheduled</Text>
            </View>
          );
        }
        return (
          <TouchableOpacity
            onPress={() => setShowCancelConfirm(true)}
            className="w-full bg-red-500 py-3 rounded-xl items-center active:bg-red-600"
          >
            <Text className="text-white font-bold text-base">Cancel Plan</Text>
          </TouchableOpacity>
        );
      }

      return (
        <TouchableOpacity
          onPress={() => handlePaidPlanPreview(cardPlan)}
          disabled={isLoading}
          className="w-full bg-primary py-3 rounded-xl items-center active:opacity-90"
        >
          <Text className="text-primary-foreground font-bold text-base">
            {isCancelScheduled && cardRank > currentRank
              ? 'Resume & Upgrade'
              : cardRank > currentRank
              ? 'Upgrade'
              : 'Downgrade'}
          </Text>
        </TouchableOpacity>
      );
    }
  };

  return (
    <ScrollView className="bg-background flex-1 p-4 md:p-8">
      <View className="max-w-4xl mx-auto w-full mb-12">
        <Text className="text-3xl md:text-4xl font-extrabold text-center text-foreground mb-3">
          Find the Right Plan for Your Library
        </Text>
        <Text className="text-base text-muted-foreground text-center mb-8">
          Each account can own one organization, and invites can still add you to others.
        </Text>

        {Boolean(checkoutError) && (
          <View className="mb-6 p-4 bg-red-100 dark:bg-red-950/40 border border-red-300 dark:border-red-800 rounded-xl">
            <Text className="text-red-700 dark:text-red-400 font-medium text-sm">{checkoutError}</Text>
          </View>
        )}

        {Boolean(successMessage) && (
          <View className="mb-6 p-4 bg-green-100 dark:bg-green-950/40 border border-green-300 dark:border-green-800 rounded-xl">
            <Text className="text-green-700 dark:text-green-400 font-medium text-sm">{successMessage}</Text>
          </View>
        )}

        {/* Pricing Cards Grid */}
        <View className="flex-col md:flex-row gap-6">
          {/* Free Tier */}
          <View className="flex-1 bg-card rounded-2xl shadow-sm border border-border p-6 justify-between">
            <View>
              <Text className="text-xl font-bold text-foreground mb-2">Jam Session</Text>
              <View className="flex-row items-baseline mb-4">
                <Text className="text-3xl font-extrabold text-foreground">$0</Text>
                <Text className="text-sm text-muted-foreground ml-1">/ month</Text>
              </View>
              <Text className="text-xs text-muted-foreground mb-6">
                For solo artists and hobbyists getting started.
              </Text>
              <View className="space-y-3 mb-8">
                <Text className="text-sm text-foreground font-semibold">• 50 Chord Sheets</Text>
                <Text className="text-sm text-foreground font-semibold">• 3 Set Lists</Text>
                <Text className="text-sm text-foreground font-semibold">• 3 Team Members</Text>
                <Text className="text-sm text-muted-foreground">• Basic ChordPro Editor</Text>
                <Text className="text-sm text-muted-foreground">• Real-Time Live Mode</Text>
              </View>
            </View>
            {renderPlanButton('Free')}
          </View>

          {/* Gigging Band */}
          <View className="flex-1 bg-card rounded-2xl shadow-md border-2 border-primary p-6 justify-between relative">
            <View className="self-center bg-primary px-3 py-1 rounded-full mb-2">
              <Text className="text-primary-foreground text-[10px] font-bold uppercase">Most Popular</Text>
            </View>
            <View>
              <Text className="text-xl font-bold text-foreground mb-2">Gigging Band</Text>
              <View className="flex-row items-baseline mb-4">
                <Text className="text-3xl font-extrabold text-foreground">$5</Text>
                <Text className="text-sm text-muted-foreground ml-1">/ month</Text>
              </View>
              <Text className="text-xs text-muted-foreground mb-6">
                For active teams that need a bigger library and tools.
              </Text>
              <View className="space-y-3 mb-8">
                <Text className="text-sm text-foreground font-semibold">• 250 Chord Sheets</Text>
                <Text className="text-sm text-foreground font-semibold">• Unlimited Set Lists</Text>
                <Text className="text-sm text-foreground font-semibold">• Unlimited Members</Text>
                <Text className="text-sm text-muted-foreground">• Transposition Tools</Text>
                <Text className="text-sm text-muted-foreground">• Offline access & PDF export</Text>
              </View>
            </View>
            {renderPlanButton('GiggingBand')}
          </View>

          {/* Pro Library */}
          <View className="flex-1 bg-card rounded-2xl shadow-sm border border-border p-6 justify-between">
            <View>
              <Text className="text-xl font-bold text-foreground mb-2">Pro Library</Text>
              <View className="flex-row items-baseline mb-4">
                <Text className="text-3xl font-extrabold text-foreground">$49</Text>
                <Text className="text-sm text-muted-foreground ml-1">/ month</Text>
              </View>
              <Text className="text-xs text-muted-foreground mb-6">
                For teams that need maximum capacity.
              </Text>
              <View className="space-y-3 mb-8">
                <Text className="text-sm text-foreground font-semibold">• Unlimited Chord Sheets</Text>
                <Text className="text-sm text-foreground font-semibold">• Unlimited Set Lists</Text>
                <Text className="text-sm text-foreground font-semibold">• Unlimited Members</Text>
                <Text className="text-sm text-muted-foreground">• Priority Support</Text>
              </View>
            </View>
            {renderPlanButton('Organization')}
          </View>
        </View>
      </View>

      <PlanChangePreviewDialog
        isOpen={showPlanPreview}
        onClose={closePlanPreview}
        onConfirm={handleConfirmPlanChange}
        preview={planPreview}
        isSubmitting={isLoading}
        isCancellationScheduled={isCancelScheduled}
        discountCode={upgradeDiscountCode}
        setDiscountCode={setUpgradeDiscountCode}
        appliedDiscount={appliedUpgradeDiscount}
        onApplyDiscount={handleApplyUpgradeDiscount}
        onRemoveDiscount={() => setAppliedUpgradeDiscount(null)}
        validatingCode={validatingUpgradeCode}
        validationError={upgradeValidationError}
      />

      <ConfirmDialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleCancel}
        title="Confirm Cancellation"
        message="Are you sure you want to cancel your plan? Your access will remain active until the end of the billing period."
        confirmLabel="Yes, Cancel Plan"
        cancelLabel="Keep Plan"
      />

      <ConfirmDialog
        isOpen={showResumeUpgradeConfirm}
        onClose={() => setShowResumeUpgradeConfirm(false)}
        onConfirm={handleConfirmPlanChange}
        title="Resume & Upgrade"
        message={resumeUpgradeMessage || 'Upgrading will resume your subscription.'}
        confirmLabel="Resume & Upgrade"
        cancelLabel="Cancel"
      />
    </ScrollView>
  );
}
