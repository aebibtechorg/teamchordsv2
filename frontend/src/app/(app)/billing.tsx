import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Linking, Platform } from 'react-native';
import { ExternalLink, ArrowUpCircle, XCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { useProfileStore } from '../../store/useProfileStore';
import { getProfile } from '../../utils/common';
import { cancelSubscription, openBillingPortal } from '../../utils/billing';
import ConfirmDialog from '../../components/ConfirmDialog';

const PLAN_LABELS: Record<string, string> = {
  Free: 'Jam Session (Free)',
  GiggingBand: 'Gigging Band',
  Organization: 'Pro Library',
};

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  Active: { bg: 'bg-green-100', text: 'text-green-800' },
  ScheduledToEnd: { bg: 'bg-amber-100', text: 'text-amber-800' },
  Canceled: { bg: 'bg-red-100', text: 'text-red-800' },
  PastDue: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  None: { bg: 'bg-gray-100', text: 'text-gray-600' },
};

export default function Billing() {
  const { profile, setUserProfile } = useProfileStore();
  const [portalLoading, setPortalLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const orgId = profile?.orgId;
  const activeOrg = profile?.organizations?.find((o) => o.id === orgId);
  const isAdmin = activeOrg?.role?.toLowerCase() === 'admin';

  const plan = activeOrg?.plan != null ? (typeof activeOrg.plan === 'number' ? ['Free', 'GiggingBand', 'Organization'][activeOrg.plan] : String(activeOrg.plan)) : 'Free';
  const status = activeOrg?.subscriptionStatus != null ? String(activeOrg.subscriptionStatus) : 'None';
  const expiresAt = activeOrg?.planExpiresAt;

  const isPaid = plan !== 'Free';
  const isCancelPending = status === 'ScheduledToEnd';

  const handlePortal = async () => {
    if (!orgId) return;
    setPortalLoading(true);
    try {
      const returnUrl = Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.href : 'teamchords://billing';
      const { url } = await openBillingPortal(orgId, returnUrl);
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        await Linking.openURL(url);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not open billing portal.');
    } finally {
      setPortalLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!orgId) return;
    setCancelLoading(true);
    try {
      await cancelSubscription(orgId);
      const fresh = await getProfile();
      if (fresh) setUserProfile(fresh);
      Alert.alert('Subscription Cancelled', 'Access continues until the end of your billing period.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to cancel subscription.');
    } finally {
      setCancelLoading(false);
    }
  };

  if (!orgId) {
    return (
      <View className="p-6">
        <Text className="text-gray-500">No organization selected.</Text>
      </View>
    );
  }

  const badgeStyle = STATUS_BADGE[status] || STATUS_BADGE.None;

  return (
    <ScrollView className="flex-1 bg-gray-100 p-4 md:p-8">
      <View className="max-w-2xl mx-auto w-full mb-12">
        <Text className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Billing & Subscription</Text>

        {/* Current Plan Card */}
        <View className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Current Plan
          </Text>

          <View className="flex-row items-center justify-between flex-wrap gap-4">
            <View>
              <Text className="text-2xl font-bold text-gray-900">{PLAN_LABELS[plan] ?? plan}</Text>
              {expiresAt && (
                <Text className="text-xs text-gray-500 mt-1">
                  {isCancelPending ? 'Access until' : 'Renews'}{' '}
                  {new Date(expiresAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              )}
            </View>

            <View className={`px-3 py-1 rounded-full ${badgeStyle.bg}`}>
              <Text className={`text-xs font-semibold ${badgeStyle.text}`}>
                {isCancelPending ? 'Scheduled to end' : status}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="space-y-3">
          {isPaid && isAdmin && (
            <TouchableOpacity
              onPress={handlePortal}
              disabled={portalLoading}
              className="flex-row items-center justify-center bg-gray-800 py-3 px-5 rounded-xl active:bg-gray-900 mb-2"
            >
              <ExternalLink size={16} color="#fff" />
              <Text className="text-white font-semibold text-sm ml-2">
                {portalLoading ? 'Opening portal...' : 'Manage Billing / Invoices'}
              </Text>
            </TouchableOpacity>
          )}

          {plan === 'Free' && (
            <TouchableOpacity
              onPress={() => router.push('/(app)/pricing' as any)}
              className="flex-row items-center justify-center bg-blue-600 py-3 px-5 rounded-xl active:bg-blue-700 mb-2"
            >
              <ArrowUpCircle size={16} color="#fff" />
              <Text className="text-white font-semibold text-sm ml-2">Upgrade Plan</Text>
            </TouchableOpacity>
          )}

          {isPaid && isAdmin && !isCancelPending && (
            <TouchableOpacity
              onPress={() => setShowCancelConfirm(true)}
              disabled={cancelLoading}
              className="flex-row items-center justify-center border border-red-200 bg-red-50 py-3 px-5 rounded-xl active:bg-red-100"
            >
              <XCircle size={16} color="#DC2626" />
              <Text className="text-red-600 font-semibold text-sm ml-2">
                {cancelLoading ? 'Cancelling...' : 'Cancel Subscription'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {plan !== 'Free' && (
          <TouchableOpacity onPress={() => router.push('/(app)/pricing' as any)} className="mt-6">
            <Text className="text-sm text-gray-500 text-center">
              Want to change plans? <Text className="text-blue-600 font-semibold">View all plans</Text>
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ConfirmDialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleCancel}
        title="Cancel Subscription"
        message={`Your subscription will remain active until ${
          expiresAt ? new Date(expiresAt).toLocaleDateString() : 'the end of the billing period'
        }, then downgrade to the free plan. Are you sure?`}
        confirmLabel="Yes, Cancel"
        cancelLabel="Keep Subscription"
      />
    </ScrollView>
  );
}
