"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ArrowRight, Package } from "lucide-react";
import { api, formatPrice } from "@/lib/api";
import { PageLoader } from "@/components/ui/spinner";
import type { OrderDetail } from "@/lib/types";

export default function OrderConfirmationPage() {
  const params = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<OrderDetail>(`/api/orders/${params.orderId}`)
      .then(setOrder)
      .finally(() => setLoading(false));
  }, [params.orderId]);

  if (loading) return <PageLoader />;
  if (!order) {
    return (
      <div className="container-page py-24 text-center text-ink-500">
        Order not found.
      </div>
    );
  }

  return (
    <div className="container-page flex flex-col items-center py-20 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sage-400/15 text-sage-500">
        <CheckCircle2 size={40} />
      </div>
      <p className="eyebrow mt-6">Order Confirmed</p>
      <h1 className="mt-2 font-display text-[38px] text-ink-900">
        Thank You, Your Order Is On Its Way
      </h1>
      <p className="mt-3 max-w-md text-sm text-ink-500">
        A confirmation has been sent to your email. We&apos;ll notify you at each
        step of the delivery.
      </p>

      <div className="card-surface mt-10 w-full max-w-md p-7 text-left">
        <div className="flex items-center justify-between border-b border-ink-900/[0.08] pb-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-400">Order ID</p>
            <p className="font-display text-lg text-ink-900">{order.orderId}</p>
          </div>
          <Package size={22} className="text-terracotta-500" />
        </div>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between text-ink-600">
            <span>Total Paid</span>
            <span className="font-semibold text-ink-900">
              {formatPrice(order.total)}
            </span>
          </div>
          <div className="flex justify-between text-ink-600">
            <span>Payment Method</span>
            <span className="capitalize text-ink-900">
              {order.payment?.method?.replace("_", " ") || "—"}
            </span>
          </div>
          <div className="flex justify-between text-ink-600">
            <span>Delivery Address</span>
            <span className="text-right text-ink-900">
              {order.addressSnapshot.city}, {order.addressSnapshot.state}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link href={`/account/orders/${order.orderId}`} className="btn-primary">
          Track Order
          <ArrowRight size={16} />
        </Link>
        <Link href="/shop" className="btn-secondary">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
