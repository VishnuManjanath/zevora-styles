"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, formatPrice } from "@/lib/api";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageLoader } from "@/components/ui/spinner";
import type { Order } from "@/lib/types";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    api<{ orders: Order[] }>("/api/admin/orders").then((res) => setOrders(res.orders));
  }, []);

  if (!orders) return <PageLoader />;

  return (
    <div>
      <h1 className="font-display text-3xl text-ink-900">Orders</h1>
      <p className="mt-1 text-sm text-ink-500">{orders.length} total orders</p>

      {orders.length === 0 ? (
        <div className="mt-8 card-surface flex flex-col items-center justify-center gap-2 py-16 text-center">
          <p className="text-sm font-medium text-ink-700">No orders yet</p>
          <p className="max-w-sm text-xs text-ink-500">
            Orders appear here the moment a customer completes checkout on the storefront —
            nothing is pre-filled. Place a test order from the shop to see it show up live.
          </p>
        </div>
      ) : (
      <div className="mt-8 card-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-900/[0.08] bg-cream-100 text-left text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-5 py-3">Order</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Total</th>
              <th className="px-5 py-3">Payment</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.orderId} className="border-b border-ink-900/[0.06] last:border-0">
                <td className="px-5 py-3 font-medium text-ink-900">{o.orderId}</td>
                <td className="px-5 py-3 text-ink-500">
                  {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </td>
                <td className="px-5 py-3 text-ink-800">{formatPrice(o.total)}</td>
                <td className="px-5 py-3"><StatusBadge status={o.paymentStatus} /></td>
                <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
                <td className="px-5 py-3 text-right">
                  <Link href={`/admin/orders/${o.orderId}`} className="text-xs font-medium text-terracotta-600">
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}
