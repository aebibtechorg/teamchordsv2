import { Platform } from 'react-native';
import Purchases, { PurchasesOfferings, PurchasesPackage, CustomerInfo, LOG_LEVEL } from 'react-native-purchases';

let isConfigured = false;

export const REVENUECAT_APPLE_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_APPLE || '';
export const REVENUECAT_GOOGLE_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_GOOGLE || '';

export const getRevenueCatApiKey = (): string => {
  if (Platform.OS === 'ios') {
    return REVENUECAT_APPLE_API_KEY;
  } else if (Platform.OS === 'android') {
    return REVENUECAT_GOOGLE_API_KEY;
  }
  return '';
};

/**
 * Configure and initialize RevenueCat.
 */
export const initRevenueCat = async (orgId?: string): Promise<boolean> => {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return false;
  }

  const apiKey = getRevenueCatApiKey();
  if (!apiKey) {
    console.warn('[RevenueCat] No API key configured for platform:', Platform.OS);
    return false;
  }

  try {
    if (!isConfigured) {
      Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);
      const appUserID = orgId ? `org_${orgId}` : undefined;
      Purchases.configure({
        apiKey,
        appUserID,
      });
      isConfigured = true;
    } else if (orgId) {
      await identifyRevenueCatOrg(orgId);
    }
    return true;
  } catch (error) {
    console.error('[RevenueCat] Failed to initialize:', error);
    return false;
  }
};

/**
 * Associate purchases with a specific organization.
 */
export const identifyRevenueCatOrg = async (orgId: string): Promise<CustomerInfo | null> => {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return null;

  try {
    const { customerInfo } = await Purchases.logIn(`org_${orgId}`);
    return customerInfo;
  } catch (error) {
    console.error('[RevenueCat] Failed to log in organization user:', error);
    return null;
  }
};

/**
 * Reset user session on logout.
 */
export const resetRevenueCat = async (): Promise<CustomerInfo | null> => {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return null;

  try {
    const isAnonymous = await Purchases.isAnonymous();
    if (!isAnonymous) {
      return await Purchases.logOut();
    }
  } catch (error) {
    console.error('[RevenueCat] Failed to log out:', error);
  }
  return null;
};

/**
 * Fetch available offerings / subscription packages.
 */
export const fetchOfferings = async (): Promise<PurchasesOfferings | null> => {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return null;

  try {
    await initRevenueCat();
    return await Purchases.getOfferings();
  } catch (error) {
    console.error('[RevenueCat] Failed to fetch offerings:', error);
    return null;
  }
};

/**
 * Purchase a subscription package.
 */
export const purchaseSubscriptionPackage = async (
  pkg: PurchasesPackage
): Promise<{ customerInfo: CustomerInfo; userCancelled: boolean }> => {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { customerInfo, userCancelled: false };
  } catch (error: any) {
    if (error?.userCancelled) {
      return { customerInfo: null as any, userCancelled: true };
    }
    throw error;
  }
};

/**
 * Restore previous purchases.
 */
export const restorePurchases = async (): Promise<CustomerInfo | null> => {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return null;

  try {
    return await Purchases.restorePurchases();
  } catch (error) {
    console.error('[RevenueCat] Failed to restore purchases:', error);
    throw error;
  }
};

/**
 * Get current customer subscription information.
 */
export const getCustomerInfo = async (): Promise<CustomerInfo | null> => {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return null;

  try {
    return await Purchases.getCustomerInfo();
  } catch (error) {
    console.error('[RevenueCat] Failed to get customer info:', error);
    return null;
  }
};
