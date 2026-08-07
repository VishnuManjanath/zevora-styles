"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, MapPin, Plus, Truck, Wallet } from "lucide-react";
import { api, ApiError, formatPrice } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { PageLoader } from "@/components/ui/spinner";
import { RazorpayMockModal } from "@/components/razorpay-mock-modal";
import type { Address } from "@/lib/types";
import { clsx } from "clsx";

type CheckoutPreview = {
  lines: Array<{
    variantId: string;
    productName: string;
    size: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  freeShippingMin: number;
};

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const { cart, refresh: refreshCart } = useCart();
  const router = useRouter();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [preview, setPreview] = useState<CheckoutPreview | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"razorpay_mock" | "cod">(
    "razorpay_mock",
  );
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: "Home",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [payment, setPayment] = useState<{ orderId: string; amount: number } | null>(
    null,
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login?redirect=/checkout");
      return;
    }
    loadAddresses();
  }, [authLoading, user]);

  async function loadAddresses() {
    setLoading(true);
    try {
      const res = await api<{ addresses: Address[] }>("/api/addresses");
      setAddresses(res.addresses);
      const def = res.addresses.find((a) => a.isDefault) || res.addresses[0];
      if (def) {
        setSelectedAddress(def._id);
        await loadPreview(def._id);
      } else {
        setShowAddressForm(true);
        await loadPreview();
      }
    } catch {
      setError("Failed to load checkout");
    } finally {
      setLoading(false);
    }
  }

  async function loadPreview(addressId?: string) {
    try {
      const res = await api<CheckoutPreview>("/api/checkout/preview", {
        method: "POST",
        body: JSON.stringify(addressId ? { addressId } : {}),
      });
      setPreview(res);
    } catch (err) {
      if (err instanceof ApiError && err.code === "EMPTY_CART") {
        router.push("/cart");
      }
    }
  }

  async function saveNewAddress() {
    setError("");
    try {
      const res = await api<{ address: Address }>("/api/addresses", {
        method: "POST",
        body: JSON.stringify({ ...newAddress, isDefault: addresses.length === 0 }),
      });
      setAddresses((prev) => [...prev, res.address]);
      setSelectedAddress(res.address._id);
      setShowAddressForm(false);
      await loadPreview(res.address._id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save address");
    }
  }

  async function placeOrder() {
    if (!selectedAddress) {
      setError("Please select or add a delivery address");
      return;
    }
    setError("");
    setPlacing(true);
    try {
      const res = await api<{
        order: { orderId: string };
        nextStep: "order_confirmed" | "initiate_payment";
      }>("/api/checkout/create-order", {
        method: "POST",
        body: JSON.stringify({ addressId: selectedAddress, paymentMethod }),
      });

      if (res.nextStep === "order_confirmed") {
        await refreshCart();
        router.push(`/order/${res.order.orderId}/confirmation`);
        return;
      }

      const initiated = await api<{ orderId: string; amount: number }>(
        "/api/payments/initiate",
        {
          method: "POST",
          body: JSON.stringify({ orderId: res.order.orderId }),
        },
      );
      setPayment({ orderId: initiated.orderId, amount: initiated.amount });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to place order");
    } finally {
      setPlacing(false);
    }
  }

  async function handlePaymentResult(success: boolean) {
    if (!payment) return;
    try {
      await api("/api/payments/mock/confirm", {
        method: "POST",
        body: JSON.stringify({ orderId: payment.orderId, success }),
      });
      await refreshCart();
      if (success) {
        router.push(`/order/${payment.orderId}/confirmation`);
      } else {
        setPayment(null);
        setError("Payment failed. Please try again.");
      }
    } catch {
      setPayment(null);
      setError("Payment confirmation failed");
    }
  }

  if (authLoading || loading) return <PageLoader />;
  if (!cart || cart.items.length === 0) {
    return (
      <div className="container-page py-24 text-center text-ink-500">
        Your cart is empty.{" "}
        <Link href="/shop" className="text-terracotta-600">Continue shopping</Link>
      </div>
    );
  }

  return (
    <div className="container-page py-14">
      <h1 className="font-display text-[38px] text-ink-900">Checkout</h1>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          {/* Address */}
          <div className="card-surface p-7">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-xl text-ink-900">
                <MapPin size={18} className="text-terracotta-500" />
                Delivery Address
              </h2>
              {!showAddressForm && (
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-terracotta-600"
                >
                  <Plus size={14} /> Add New
                </button>
              )}
            </div>

            {!showAddressForm && addresses.length > 0 && (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <button
                    key={addr._id}
                    onClick={() => {
                      setSelectedAddress(addr._id);
                      loadPreview(addr._id);
                    }}
                    className={clsx(
                      "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                      selectedAddress === addr._id
                        ? "border-terracotta-400 bg-terracotta-50/40"
                        : "border-ink-900/10 hover:border-ink-900/25",
                    )}
                  >
                    <div
                      className={clsx(
                        "mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full border-2",
                        selectedAddress === addr._id
                          ? "border-terracotta-500 bg-terracotta-500"
                          : "border-ink-900/20",
                      )}
                    >
                      {selectedAddress === addr._id && (
                        <Check size={11} className="text-white" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink-900">
                        {addr.label}
                      </p>
                      <p className="mt-0.5 text-sm text-ink-600">
                        {addr.line1}
                        {addr.line2 ? `, ${addr.line2}` : ""}, {addr.city},{" "}
                        {addr.state} - {addr.pincode}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {showAddressForm && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    placeholder="Label (Home/Work)"
                    value={newAddress.label}
                    onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                    className="input-field col-span-2"
                  />
                  <input
                    placeholder="Address line 1"
                    value={newAddress.line1}
                    onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })}
                    className="input-field col-span-2"
                  />
                  <input
                    placeholder="Address line 2 (optional)"
                    value={newAddress.line2}
                    onChange={(e) => setNewAddress({ ...newAddress, line2: e.target.value })}
                    className="input-field col-span-2"
                  />
                  <input
                    placeholder="City"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    className="input-field"
                  />
                  <input
                    placeholder="State"
                    value={newAddress.state}
                    onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                    className="input-field"
                  />
                  <input
                    placeholder="Pincode"
                    value={newAddress.pincode}
                    onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                    className="input-field col-span-2"
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={saveNewAddress} className="btn-primary">
                    Save Address
                  </button>
                  {addresses.length > 0 && (
                    <button
                      onClick={() => setShowAddressForm(false)}
                      className="btn-ghost"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Payment method */}
          <div className="card-surface p-7">
            <h2 className="mb-5 font-display text-xl text-ink-900">
              Payment Method
            </h2>
            <div className="space-y-3">
              <button
                onClick={() => setPaymentMethod("razorpay_mock")}
                className={clsx(
                  "flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors",
                  paymentMethod === "razorpay_mock"
                    ? "border-terracotta-400 bg-terracotta-50/40"
                    : "border-ink-900/10 hover:border-ink-900/25",
                )}
              >
                <Wallet size={18} className="text-terracotta-500" />
                <div>
                  <p className="text-sm font-semibold text-ink-900">
                    Pay Online (Razorpay)
                  </p>
                  <p className="text-xs text-ink-500">
                    Cards, UPI, Netbanking — simulated for demo
                  </p>
                </div>
              </button>
              <button
                onClick={() => setPaymentMethod("cod")}
                className={clsx(
                  "flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors",
                  paymentMethod === "cod"
                    ? "border-terracotta-400 bg-terracotta-50/40"
                    : "border-ink-900/10 hover:border-ink-900/25",
                )}
              >
                <Truck size={18} className="text-terracotta-500" />
                <div>
                  <p className="text-sm font-semibold text-ink-900">
                    Cash On Delivery
                  </p>
                  <p className="text-xs text-ink-500">Pay when your order arrives</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="card-surface h-fit p-7">
          <h2 className="font-display text-xl text-ink-900">Order Summary</h2>
          {preview && (
            <>
              <div className="mt-5 max-h-64 space-y-3 overflow-y-auto pr-1">
                {preview.lines.map((line) => (
                  <div key={line.variantId} className="flex justify-between text-sm">
                    <span className="text-ink-600">
                      {line.productName} ({line.size}) × {line.quantity}
                    </span>
                    <span className="text-ink-900">{formatPrice(line.lineTotal)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 space-y-2 border-t border-ink-900/[0.08] pt-4 text-sm">
                <div className="flex justify-between text-ink-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(preview.subtotal)}</span>
                </div>
                <div className="flex justify-between text-ink-600">
                  <span>Shipping</span>
                  <span>
                    {preview.shippingFee === 0 ? "Free" : formatPrice(preview.shippingFee)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-ink-900/[0.08] pt-3 text-base font-semibold text-ink-900">
                  <span>Total</span>
                  <span>{formatPrice(preview.total)}</span>
                </div>
              </div>
            </>
          )}

          {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

          <button
            onClick={placeOrder}
            disabled={placing || !preview}
            className="btn-primary mt-6 w-full"
          >
            {placing
              ? "Placing Order…"
              : paymentMethod === "cod"
              ? "Place Order (COD)"
              : "Proceed To Payment"}
          </button>
        </div>
      </div>

      {payment && (
        <RazorpayMockModal
          amount={payment.amount}
          orderId={payment.orderId}
          onResult={handlePaymentResult}
          onClose={() => setPayment(null)}
        />
      )}
    </div>
  );
}
