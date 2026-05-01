import { apiFetch } from './api';

export async function startCheckout(plan, orgId, redirectUrl) {
    const res = await apiFetch('/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan, orgId, redirectUrl }),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to create checkout session');
    }
    return res.json(); // { url }
}

export async function cancelSubscription(orgId) {
    const res = await apiFetch('/api/billing/cancel', {
        method: 'POST',
        body: JSON.stringify({ orgId }),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to cancel subscription');
    }
}

export async function openBillingPortal(orgId, returnUrl) {
    const res = await apiFetch('/api/billing/portal', {
        method: 'POST',
        body: JSON.stringify({ orgId, returnUrl }),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to open billing portal');
    }
    return res.json(); // { url }
}
