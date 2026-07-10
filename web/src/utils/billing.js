import { apiFetch } from './api';

async function getErrorMessage(res, fallbackMessage) {
    const text = await res.text().catch(() => '');
    if (!text) {
        return fallbackMessage;
    }

    try {
        const data = JSON.parse(text);
        return data?.error || data?.message || data?.code || fallbackMessage;
    } catch {
        return text || fallbackMessage;
    }
}

export async function startCheckout(plan, orgId, redirectUrl, discountCode = null) {
    const res = await apiFetch('/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan, orgId, redirectUrl, discountCode }),
    });
    if (!res.ok) {
        throw new Error(await getErrorMessage(res, 'Failed to create checkout session'));
    }
    return res.json(); // { url }
}

export async function validateDiscountCode(code) {
    const res = await apiFetch(`/api/billing/discount/validate?code=${encodeURIComponent(code)}`, {
        method: 'GET',
    });
    if (!res.ok) {
        throw new Error(await getErrorMessage(res, 'Invalid discount code'));
    }
    return res.json();
}


export async function changePlan(plan, orgId, discountCode = null) {
    const res = await apiFetch('/api/billing/change-plan', {
        method: 'POST',
        body: JSON.stringify({ plan, orgId, discountCode }),
    });
    if (!res.ok) {
        throw new Error(await getErrorMessage(res, 'Failed to change plan'));
    }
    return res.json();
}

export async function previewPlanChange(plan, orgId, discountCode = null) {
    const res = await apiFetch('/api/billing/change-plan/preview', {
        method: 'POST',
        body: JSON.stringify({ plan, orgId, discountCode }),
    });
    if (!res.ok) {
        throw new Error(await getErrorMessage(res, 'Failed to preview plan change'));
    }
    return res.json();
}

export async function cancelSubscription(orgId) {
    const res = await apiFetch('/api/billing/cancel', {
        method: 'POST',
        body: JSON.stringify({ orgId }),
    });
    if (!res.ok) {
        throw new Error(await getErrorMessage(res, 'Failed to cancel subscription'));
    }
}

export async function openBillingPortal(orgId, returnUrl) {
    const res = await apiFetch('/api/billing/portal', {
        method: 'POST',
        body: JSON.stringify({ orgId, returnUrl }),
    });
    if (!res.ok) {
        throw new Error(await getErrorMessage(res, 'Failed to open billing portal'));
    }
    return res.json(); // { url }
}
