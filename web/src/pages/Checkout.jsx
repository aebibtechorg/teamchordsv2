import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Ticket, Trash2, Loader2, ShieldCheck, HelpCircle, XCircle } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import { useProfileStore } from "../store/useProfileStore";
import { startCheckout, validateDiscountCode } from "../utils/billing";
import { DodoPayments } from "dodopayments-checkout";

const formatErrorMessage = (errString) => {
  if (!errString) return "An unexpected error occurred.";
  try {
    const parsed = JSON.parse(errString);
    if (parsed.message) return parsed.message;
    if (parsed.error) return typeof parsed.error === 'string' ? formatErrorMessage(parsed.error) : JSON.stringify(parsed.error);
    if (parsed.code) return `Error: ${parsed.code}`;
  } catch (e) {
    // Not JSON
  }
  return errString;
};


const PLAN_DETAILS = {
  GiggingBand: {
    name: "Gigging Band",
    priceCents: 500,
    priceStr: "$5.00",
    features: [
      "250 Chord Sheets limit",
      "Unlimited Set Lists & Team Members",
      "Transposition Tools",
      "Offline access for open live views",
      "PDF Export / Print",
    ],
  },
  Organization: {
    name: "Pro Library",
    priceCents: 4900,
    priceStr: "$49.00",
    features: [
      "Unlimited Chord Sheets, Set Lists & Members",
      "Everything in Gigging Band",
      "Priority Email & Chat Support",
      "Best fit for larger organizations",
    ],
  },
};

export default function Checkout() {
  const { profile } = useProfileStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const plan = searchParams.get("plan");
  const planInfo = PLAN_DETAILS[plan];
  const orgId = profile?.orgId;

  // State
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(true);
  const [checkoutError, setCheckoutError] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [validatingCode, setValidatingCode] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [iframeInitialized, setIframeInitialized] = useState(false);

  const containerRef = useRef(null);

  // Redirect if invalid plan
  useEffect(() => {
    if (!planInfo) {
      toast.error("Invalid plan selected.");
      navigate("/pricing");
    }
  }, [plan, planInfo, navigate]);

  // Load checkout session
  const loadCheckoutSession = async (discountToApply = null) => {
    if (!plan || !orgId) return;

    setCheckoutLoading(true);
    setCheckoutError("");
    setIframeInitialized(false);

    try {
      // Dodo Payments requires absolute success redirect URL
      const redirectUrl = `${window.location.origin}/billing`;
      const { url } = await startCheckout(plan, orgId, redirectUrl, discountToApply);
      setCheckoutUrl(url);
    } catch (err) {
      console.error("Failed to load checkout session:", err);
      setCheckoutError(err.message || "Failed to initialize checkout session. Please try again.");
      setCheckoutLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (orgId && planInfo) {
      loadCheckoutSession();
    }
  }, [orgId, plan]);

  // Initialize DodoPayments SDK
  useEffect(() => {
    if (!checkoutUrl) return;

    // Clean up any existing checkout overlay/iframe elements
    try {
      DodoPayments.Checkout.close();
    } catch (e) {
      // Ignored
    }

    DodoPayments.Initialize({
      mode: "test", // Uses test mode for development
      displayType: "inline",
      onEvent: (event) => {
        console.log("Dodo Checkout Event:", event);
        if (event.event_type === "checkout.opened") {
          setCheckoutLoading(false);
          setIframeInitialized(true);
        } else if (event.event_type === "checkout.error") {
          setCheckoutError(event.data?.message || "An error occurred in the payment frame.");
          setCheckoutLoading(false);
        }
      },
    });

    // Mount Checkout Frame inline
    try {
      DodoPayments.Checkout.open({
        checkoutUrl: checkoutUrl,
        elementId: "dodo-inline-checkout",
      });
    } catch (err) {
      console.error("Failed to mount inline checkout:", err);
      setCheckoutError("Failed to render the payment frame.");
      setCheckoutLoading(false);
    }

    return () => {
      try {
        DodoPayments.Checkout.close();
      } catch (e) {
        // Ignored
      }
    };
  }, [checkoutUrl]);

  // Handle validating & applying discount code
  const handleApplyDiscount = async (e) => {
    e.preventDefault();
    if (!discountCode.trim()) return;

    setValidatingCode(true);
    setValidationError("");

    try {
      const discount = await validateDiscountCode(discountCode);
      setAppliedDiscount(discount);
      toast.success(`Discount "${discount.code}" applied!`);
      // Reload checkout session with the new discount code
      loadCheckoutSession(discount.code);
    } catch (err) {
      setValidationError(err.message || "Invalid or expired discount code.");
      toast.error("Failed to apply discount code.");
    } finally {
      setValidatingCode(false);
    }
  };

  // Handle removing applied discount code
  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode("");
    setValidationError("");
    toast.success("Discount code removed.");
    // Reload checkout session without discount code
    loadCheckoutSession(null);
  };

  // Calculate pricing breakdown
  const subtotal = planInfo?.priceCents || 0;
  let discountAmount = 0;
  if (appliedDiscount) {
    if (appliedDiscount.type === "percentage") {
      // amount is in basis points (100 basis points = 1%)
      const discountPercent = appliedDiscount.amount / 10000;
      discountAmount = Math.round(subtotal * discountPercent);
    }
  }
  const total = Math.max(0, subtotal - discountAmount);

  const formatPrice = (cents) => {
    return (cents / 100).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  };

  if (!planInfo) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-100 to-zinc-200 py-12 px-4 sm:px-6 lg:px-8">
      <Toaster position="top-right" />
      <div className="mx-auto max-w-5xl">
        {/* Back Button */}
        <button
          onClick={() => navigate("/pricing")}
          className="mb-8 flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Plans
        </button>

        {/* Page Header */}
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Complete your subscription
          </h1>
          <p className="mt-2 text-lg text-slate-600">
            Set up your organization's subscription to unlock premium ChordPro tools.
          </p>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          
          {/* Left Column: Checkout Frame & Discount Input */}
          <div className="space-y-6 lg:col-span-7">
            {/* Secure Checkout Card */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-xl transition-all duration-300">
              <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-4">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  Secure Checkout
                </h2>
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  <ShieldCheck size={14} /> PCI Compliant
                </span>
              </div>

              {/* Dodo Payments Container */}
              <div className="relative min-h-[480px] rounded-xl bg-slate-50 p-2 border border-dashed border-gray-200">
                {checkoutLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 bg-opacity-90 z-10 rounded-xl">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-3" />
                    <p className="text-sm font-medium text-slate-600">
                      Loading secure payment options...
                    </p>
                  </div>
                )}

                {checkoutError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-white z-10 rounded-xl text-center">
                    <div className="mb-4 rounded-full bg-red-50 p-3 text-red-600 animate-pulse">
                      <XCircle size={36} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Checkout Error</h3>
                    <p className="max-w-md text-sm text-slate-600 mb-6 leading-relaxed">
                      {formatErrorMessage(checkoutError)}
                    </p>
                    <button
                      onClick={() => loadCheckoutSession(appliedDiscount?.code)}
                      className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-805 transition cursor-pointer"
                    >
                      Retry Secure Payment
                    </button>
                  </div>
                )}

                <div
                  id="dodo-inline-checkout"
                  className={`w-full min-h-[460px] transition-opacity duration-500 ${
                    iframeInitialized ? "opacity-100" : "opacity-0"
                  }`}
                  ref={containerRef}
                />
              </div>

              <div className="mt-4 flex items-start gap-2 text-xs text-slate-500">
                <HelpCircle size={14} className="shrink-0 mt-0.5" />
                <p>
                  Payments are securely processed by Dodo Payments. Your sensitive card credentials
                  are never transmitted to or stored on our servers.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Discount Code */}
          <div className="space-y-6 lg:col-span-5">
            {/* Order Summary Card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
              <h2 className="text-lg font-bold text-slate-900 border-b border-gray-100 pb-4 mb-4">
                Order Summary
              </h2>

              {/* Selected Plan Details */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-bold text-slate-800">{planInfo.name} Plan</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Billed Monthly</p>
                </div>
                <span className="text-lg font-bold text-slate-900">{planInfo.priceStr}</span>
              </div>

              {/* Discount Code Form */}
              <div className="mb-6 border-t border-b border-gray-100 py-6">
                {!appliedDiscount ? (
                  <form onSubmit={handleApplyDiscount} className="flex gap-2">
                    <div className="relative grow">
                      <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="text"
                        placeholder="Discount code"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                        disabled={validatingCode}
                        className="w-full rounded-xl border border-gray-300 bg-slate-50 pl-10 pr-3 py-2 text-sm font-medium uppercase tracking-wider text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all disabled:opacity-50"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={validatingCode || !discountCode.trim()}
                      className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 transition disabled:opacity-40 cursor-pointer"
                    >
                      {validatingCode ? <Loader2 size={16} className="animate-spin" /> : "Apply"}
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="text-emerald-600 shrink-0" size={18} />
                      <div>
                        <p className="text-sm font-bold text-emerald-800">
                          {appliedDiscount.code} applied
                        </p>
                        <p className="text-xs text-emerald-600">
                          {appliedDiscount.name || `${appliedDiscount.amount / 100}% off`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveDiscount}
                      className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 rounded-lg transition"
                      title="Remove discount"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}

                {validationError && (
                  <p className="mt-2 text-xs font-semibold text-red-600">{validationError}</p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm font-medium text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {appliedDiscount && (
                  <div className="flex justify-between text-sm font-medium text-emerald-600">
                    <span>Discount</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center border-t border-gray-100 pt-4 font-bold text-slate-950">
                  <span className="text-base">Total Due</span>
                  <span className="text-2xl tracking-tight">{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            {/* Plan Features Card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 mb-4">
                What's Included
              </h3>
              <ul className="space-y-3">
                {planInfo.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <CheckCircle2 className="text-blue-500 shrink-0 mt-0.5" size={16} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
