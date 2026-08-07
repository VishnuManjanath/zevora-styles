"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, PackageOpen } from "lucide-react";
import { api, formatPrice } from "@/lib/api";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageLoader } from "@/components/ui/spinner";
import type { Order } from "@/lib/types";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    api<{ orders: Order[] }>("/api/orders").then((res) => setOrders(res.orders));
  }, []);

  if (!orders) return <PageLoader />;

  if (orders.length === 0) {
    return (
      <div className="card-surface flex flex-col items-center py-20 text-center">
        <PackageOpen size={36} className="mb-4 text-ink-300" />
        <p className="text-ink-600">You haven&apos;t placed any orders yet.</p>
        <Link href="/shop" className="btn-primary mt-6">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Link
          key={order.orderId}
          href={`/account/orders/${order.orderId}`}
          className="card-surface flex items-center justify-between gap-4 p-5 transition-shadow hover:shadow-card"
        >
          <div>
            <div className="flex items-center gap-3">
              <p className="font-display text-lg text-ink-900">{order.orderId}</p>
              <StatusBadge status={order.status} />
            </div>
            <p className="mt-1 text-xs text-ink-500">
              Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <p className="font-semibold text-ink-900">{formatPrice(order.total)}</p>
            <ChevronRight size={18} className="text-ink-400" />
          </div>
        </Link>
      ))}
    </div>
  );
}
