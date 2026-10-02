import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import Toast from 'react-native-toast-message';
import {
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  HelpCircle,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react-native';
import { useProfileStore } from '../../store/useProfileStore';
import { getProfile } from '../../utils/common';
import { startCheckout } from '../../utils/billing';
import {
  initRevenueCat,
  fetchOfferings,
  purchaseSubscriptionPackage,
  restorePurchases,
} from '../../utils/revenuecat';
import { PurchasesPackage } from 'react-native-purchases';
import { useIconColor } from '../../hooks/use-icon-color';
import { Plan } from '../../types/api';

const PLAN_DETAILS: Record<
  string,
  {
    name: string;
    priceCents: number;
    priceStr: string;
    rcPackageIdentifier?: string;
    features: string[];
  }
> = {
  GiggingBand: {
    name: 'Gigging Band',
    priceCents: 500,
    priceStr: '$5.00',
    rcPackageIdentifier: 'gigging_band',
    features: [
      '250 Chord Sheets limit',
      'Unlimited Set Lists & Team Members',
      'Transposition Tools',
      'Offline access for open live views',
      'PDF Export / Print',
    ],
  },
  Organization: {
    name: 'Pro Library',
    priceCents: 4900,
    priceStr: '$49.00',
    rcPackageIdentifier: 'pro_library',
    features: [
      'Unlimited Chord Sheets, Set Lists & Members',
      'Everything in Gigging Band',
      'Priority Email & Chat Support',
      'Best fit for larger organizations',
    ],
  },
};

export default function Checkout() {
  const { profile, setUserProfile } = useProfileStore();
  const params = useLocalSearchParams<{ plan?: string }>();
  const ic = useIconColor();

  const planKey = params.plan as string;
  const planInfo = PLAN_DETAILS[planKey];
  const orgId = profile?.orgId;

  // Native IAP state
  const [rcPackage, setRcPackage] = useState<PurchasesPackage | null>(null);
  const [loadingOfferings, setLoadingOfferings] = useState<boolean>(Platform.OS !== 'web');
  const [isPurchasing, setIsPurchasing] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [iapError, setIapError] = useState<string | null>(null);

  // Web checkout state
  const [webCheckoutLoading, setWebCheckoutLoading] = useState<boolean>(false);

  // Redirect if invalid plan
  useEffect(() => {
    if (!planInfo) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Plan',
        text2: 'Please select a valid subscription plan.',
      });
      router.replace('/(app)/pricing' as any);
    }
  }, [planKey, planInfo]);

  // Load RevenueCat packages on Native
  useEffect(() => {
    if (Platform.OS === 'web' || !orgId || !planInfo) return;

    let isMounted = true;

    const loadRevenueCat = async () => {
      setLoadingOfferings(true);
      setIapError(null);
      try {
        await initRevenueCat(orgId);
        const offerings = await fetchOfferings();

        if (isMounted && offerings?.current) {
          const available = offerings.current.availablePackages;
          // Match by package identifier or product identifier
          const matchedPkg =
            available.find(
              (p) =>
                p.identifier.toLowerCase() === planKey.toLowerCase() ||
                p.identifier.toLowerCase() === planInfo.rcPackageIdentifier?.toLowerCase() ||
                p.product.identifier.toLowerCase().includes(planKey.toLowerCase())
            ) || available[0] || null;

          setRcPackage(matchedPkg);
        }
      } catch (err: any) {
        console.error('[Checkout] Error loading RevenueCat offerings:', err);
        if (isMounted) {
          setIapError('Unable to load in-app purchase packages. You can still retry.');
        }
      } finally {
        if (isMounted) {
          setLoadingOfferings(false);
        }
      }
    };

    loadRevenueCat();

    return () => {
      isMounted = false;
    };
  }, [orgId, planKey, planInfo]);

  // Handle Native In-App Purchase
  const handleNativePurchase = async () => {
    if (!orgId) {
      Toast.show({
        type: 'error',
        text1: 'No Team Selected',
        text2: 'Please select an active organization before subscribing.',
      });
      return;
    }

    if (!rcPackage) {
      Toast.show({
        type: 'error',
        text1: 'Package Unavailable',
        text2: 'In-app purchase product is not configured in the store yet.',
      });
      return;
    }

    setIsPurchasing(true);
    setIapError(null);

    try {
      const { userCancelled } = await purchaseSubscriptionPackage(rcPackage);

      if (userCancelled) {
        setIsPurchasing(false);
        return;
      }

      // Re-fetch profile to pick up updated subscription status
      const freshProfile = await getProfile();
      if (freshProfile) {
        setUserProfile(freshProfile);
      }

      Toast.show({
        type: 'success',
        text1: 'Subscription Activated!',
        text2: `You are now subscribed to ${planInfo.name}.`,
      });

      router.replace('/(app)/billing' as any);
    } catch (err: any) {
      console.error('[Checkout] Purchase failed:', err);
      setIapError(err?.message || 'Failed to complete subscription purchase.');
      Toast.show({
        type: 'error',
        text1: 'Purchase Failed',
        text2: err?.message || 'Transaction could not be completed.',
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  // Handle Restore Purchases
  const handleRestorePurchases = async () => {
    setIsRestoring(true);
    setIapError(null);
    try {
      const info = await restorePurchases();
      const freshProfile = await getProfile();
      if (freshProfile) {
        setUserProfile(freshProfile);
      }

      Toast.show({
        type: 'success',
        text1: 'Purchases Restored',
        text2: 'Your subscription status has been synced.',
      });

      const currentOrg = freshProfile?.organizations?.find((o) => o.id === orgId);
      const isPaidPlan =
        currentOrg?.plan != null &&
        currentOrg.plan !== (Plan.Free as any) &&
        currentOrg.plan !== ('Free' as any) &&
        currentOrg.plan !== (0 as any);

      if (isPaidPlan) {
        router.replace('/(app)/billing' as any);
      }
    } catch (err: any) {
      console.error('[Checkout] Restore failed:', err);
      Toast.show({
        type: 'error',
        text1: 'Restore Failed',
        text2: err?.message || 'Could not restore previous purchases.',
      });
    } finally {
      setIsRestoring(false);
    }
  };

  // Handle Web Dodo Payments Checkout
  const handleWebCheckout = async () => {
    if (!orgId || !planKey) return;

    setWebCheckoutLoading(true);
    try {
      const redirectUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/billing`
          : 'teamchords://billing';
      const { url } = await startCheckout(planKey, orgId, redirectUrl, null);
      if (typeof window !== 'undefined') {
        window.location.href = url;
      } else {
        await Linking.openURL(url);
      }
    } catch (err: any) {
      console.error('[Checkout] Web checkout failed:', err);
      Toast.show({
        type: 'error',
        text1: 'Checkout Error',
        text2: err?.message || 'Failed to initialize web checkout.',
      });
    } finally {
      setWebCheckoutLoading(false);
    }
  };

  if (!planInfo) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const displayPrice = rcPackage?.product?.priceString || planInfo.priceStr;
  const storeName = Platform.OS === 'ios' ? 'Apple App Store' : 'Google Play';

  return (
    <ScrollView className="flex-1 bg-background p-4 md:p-8">
      <View className="max-w-4xl mx-auto w-full mb-12">
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center mb-6 self-start active:opacity-70"
        >
          <ArrowLeft size={18} color={ic.mutedText} />
          <Text className="text-sm font-medium text-muted-foreground ml-2">Back to Plans</Text>
        </TouchableOpacity>

        {/* Page Header */}
        <View className="mb-8">
          <Text className="text-2xl md:text-3xl font-extrabold text-foreground">
            Complete your subscription
          </Text>
          <Text className="text-sm md:text-base text-muted-foreground mt-1">
            Upgrade your organization to unlock premium ChordPro tools and unlimited set lists.
          </Text>
        </View>

        {iapError && (
          <View className="mb-6 p-4 bg-red-100 dark:bg-red-950/40 border border-red-300 dark:border-red-800 rounded-xl">
            <Text className="text-red-700 dark:text-red-400 font-medium text-sm">{iapError}</Text>
          </View>
        )}

        <View className="flex-col lg:flex-row gap-6">
          {/* Left Column / Main Action Card */}
          <View className="flex-1 space-y-6">
            <View className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <View className="flex-row items-center justify-between border-b border-border pb-4 mb-6">
                <View className="flex-row items-center">
                  <ShoppingBag size={20} color="#3b82f6" />
                  <Text className="text-lg font-bold text-foreground ml-2">
                    {Platform.OS === 'web' ? 'Web Checkout' : 'In-App Purchase'}
                  </Text>
                </View>
                <View className="flex-row items-center bg-emerald-500/15 px-2.5 py-1 rounded-full">
                  <ShieldCheck size={14} color="#10b981" />
                  <Text className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 ml-1">
                    {Platform.OS === 'web' ? 'Dodo Payments' : storeName}
                  </Text>
                </View>
              </View>

              {Platform.OS === 'web' ? (
                /* Web Mode Action */
                <View className="py-4">
                  <Text className="text-sm text-muted-foreground mb-6">
                    You will be securely redirected to Dodo Payments to complete your card or local
                    payment.
                  </Text>
                  <TouchableOpacity
                    onPress={handleWebCheckout}
                    disabled={webCheckoutLoading}
                    className="w-full bg-primary py-3.5 rounded-xl items-center flex-row justify-center active:opacity-90"
                  >
                    {webCheckoutLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Text className="text-primary-foreground font-bold text-base mr-2">
                          Continue to Payment ({planInfo.priceStr}/mo)
                        </Text>
                        <ExternalLink size={16} color="#fff" />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                /* Native Mobile Mode Action */
                <View className="py-2">
                  {loadingOfferings ? (
                    <View className="py-8 items-center justify-center">
                      <ActivityIndicator size="small" color="#3b82f6" />
                      <Text className="text-xs text-muted-foreground mt-2">
                        Loading store pricing...
                      </Text>
                    </View>
                  ) : (
                    <>
                      <View className="bg-muted/40 p-4 rounded-xl mb-6">
                        <Text className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">
                          Billing Cycle
                        </Text>
                        <Text className="text-lg font-bold text-foreground">
                          {displayPrice} <Text className="text-sm font-normal text-muted-foreground">/ month</Text>
                        </Text>
                        <Text className="text-xs text-muted-foreground mt-1">
                          Processed securely through your {storeName} account. Cancel anytime in store settings.
                        </Text>
                      </View>

                      <TouchableOpacity
                        onPress={handleNativePurchase}
                        disabled={isPurchasing || loadingOfferings}
                        className="w-full bg-primary py-3.5 rounded-xl items-center justify-center active:opacity-90 mb-4"
                      >
                        {isPurchasing ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text className="text-primary-foreground font-bold text-base">
                            Subscribe with {Platform.OS === 'ios' ? 'Apple' : 'Google Play'}
                          </Text>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={handleRestorePurchases}
                        disabled={isRestoring}
                        className="w-full py-2.5 items-center justify-center flex-row active:opacity-70"
                      >
                        {isRestoring ? (
                          <ActivityIndicator size="small" color="#64748b" />
                        ) : (
                          <>
                            <RefreshCw size={14} color={ic.mutedText} />
                            <Text className="text-xs font-semibold text-muted-foreground ml-1.5">
                              Restore Purchases
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}

              <View className="mt-6 pt-4 border-t border-border flex-row items-start">
                <HelpCircle size={14} color={ic.mutedText} className="mt-0.5" />
                <Text className="text-xs text-muted-foreground ml-2 flex-1 leading-relaxed">
                  Subscriptions automatically renew each month unless canceled at least 24 hours
                  before the end of the current period. Manage or cancel subscriptions in your {storeName} account settings.
                </Text>
              </View>
            </View>
          </View>

          {/* Right Column / Summary & Included Features */}
          <View className="w-full lg:w-80 space-y-6">
            {/* Order Summary */}
            <View className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <Text className="text-base font-bold text-foreground border-b border-border pb-3 mb-4">
                Order Summary
              </Text>

              <View className="flex-row justify-between items-start mb-4">
                <View>
                  <Text className="font-bold text-foreground">{planInfo.name}</Text>
                  <Text className="text-xs text-muted-foreground mt-0.5">Billed Monthly</Text>
                </View>
                <Text className="text-base font-bold text-foreground">{displayPrice}</Text>
              </View>

              <View className="border-t border-border pt-4 flex-row justify-between items-center">
                <Text className="text-sm font-semibold text-foreground">Total Due</Text>
                <Text className="text-xl font-extrabold text-foreground">{displayPrice}</Text>
              </View>
            </View>

            {/* Plan Features */}
            <View className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <Text className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground mb-4">
                What's Included
              </Text>
              <View className="space-y-3">
                {planInfo.features.map((feature, idx) => (
                  <View key={idx} className="flex-row items-start">
                    <CheckCircle2 size={16} color="#3b82f6" className="mt-0.5" />
                    <Text className="text-sm text-foreground ml-2 flex-1">{feature}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
