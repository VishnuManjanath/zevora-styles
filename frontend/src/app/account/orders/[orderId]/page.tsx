"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, MapPin, Truck } from "lucide-react";
import { api, ApiError, formatPrice } from "@/lib/api";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageLoader } from "@/components/ui/spinner";
import type { OrderDetail } from "@/lib/types";
import { clsx } from "clsx";

const TIMELINE_STEPS = [
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
];

export default function OrderDetailPage() {
  const params = useParams<{ orderId: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, [params.orderId]);

  async function load() {
    setLoading(true);
    try {
      const res = await api<OrderDetail>(`/api/orders/${params.orderId}`);
      setOrder(res);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!confirm("Cancel this order?")) return;
    setCancelling(true);
    setError("");
    try {
      await api(`/api/orders/${params.orderId}/cancel`, { method: "POST" });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not cancel order");
    } finally {
      setCancelling(false);
    }
  }

  if (loading) return <PageLoader />;
  if (!order) {
    return <div className="text-ink-500">Order not found.</div>;
  }

  const currentStepIndex = TIMELINE_STEPS.indexOf(order.status);
  const canCancel = order.status === "pending" || order.status === "confirmed";
  const canDispute = order.status === "delivered";

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-display text-2xl text-ink-900">{order.orderId}</h2>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-xs text-ink-500">
            Placed {new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex gap-3">
          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="btn-secondary"
            >
              {cancelling ? "Cancelling…" : "Cancel Order"}
            </button>
          )}
          {canDispute && (
            <Link href={`/account/orders/${order.orderId}/dispute`} className="btn-primary">
              Report An Issue
            </Link>
          )}
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

      {/* Tracking timeline */}
      {order.status !== "cancelled" && (
        <div className="card-surface mb-8 p-7">
          <h3 className="mb-6 flex items-center gap-2 font-display text-lg text-ink-900">
            <Truck size={18} className="text-terracotta-500" />
            Delivery Tracking
          </h3>
          <div className="flex items-center">
            {TIMELINE_STEPS.map((step, i) => (
              <div key={step} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={clsx(
                      "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold",
                      i <= currentStepIndex
                        ? "border-terracotta-500 bg-terracotta-500 text-white"
                        : "border-ink-900/15 text-ink-300",
                    )}
                  >
                    {i <= currentStepIndex ? <CheckCircle2 size={16} /> : i + 1}
                  </div>
                  <p
                    className={clsx(
                      "w-20 text-center text-[10px] capitalize leading-tight",
                      i <= currentStepIndex ? "text-ink-800" : "text-ink-400",
                    )}
                  >
                    {step.replace(/_/g, " ")}
                  </p>
                </div>
                {i < TIMELINE_STEPS.length - 1 && (
                  <div
                    className={clsx(
                      "h-0.5 flex-1",
                      i < currentStepIndex ? "bg-terracotta-500" : "bg-ink-900/10",
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          {order.deliveryEvents.length > 0 && (
            <div className="mt-8 space-y-3 border-t border-ink-900/[0.08] pt-6">
              {order.deliveryEvents.slice().reverse().map((ev, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <div>
                    <p className="text-ink-800">{ev.description}</p>
                    {ev.location && (
                      <p className="text-xs text-ink-400">{ev.location}</p>
                    )}
                  </div>
                  <p className="whitespace-nowrap text-xs text-ink-400">
                    {new Date(ev.occurredAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Items */}
      <div className="card-surface mb-8 p-7">
        <h3 className="mb-5 font-display text-lg text-ink-900">Items</h3>
        <div className="space-y-4">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between border-b border-ink-900/[0.06] pb-4 last:border-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-medium text-ink-900">{item.productName}</p>
                <p className="text-xs text-ink-400">
                  Size {item.size} · {item.sku} · Serial {item.unitSerial}
                </p>
              </div>
              <p className="text-sm text-ink-800">
                {item.quantity} × {formatPrice(item.unitPrice)}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-5 space-y-1.5 border-t border-ink-900/[0.08] pt-4 text-sm">
          <div className="flex justify-between text-ink-600">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-ink-600">
            <span>Shipping</span>
            <span>{order.shippingFee === 0 ? "Free" : formatPrice(order.shippingFee)}</span>
          </div>
          <div className="flex justify-between border-t border-ink-900/[0.08] pt-2 text-base font-semibold text-ink-900">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="card-surface p-7">
        <h3 className="mb-3 flex items-center gap-2 font-display text-lg text-ink-900">
          <MapPin size={18} className="text-terracotta-500" />
          Delivery Address
        </h3>
        <p className="text-sm text-ink-600">
          {order.addressSnapshot.line1}
          {order.addressSnapshot.line2 ? `, ${order.addressSnapshot.line2}` : ""},{" "}
          {order.addressSnapshot.city}, {order.addressSnapshot.state} -{" "}
          {order.addressSnapshot.pincode}
        </p>
      </div>
    </div>
  );
}
