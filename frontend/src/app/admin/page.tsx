"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, IndianRupee, MessageSquareWarning, ShoppingBag } from "lucide-react";
import { api, formatPrice } from "@/lib/api";
import { PageLoader } from "@/components/ui/spinner";

interface Dashboard {
  ordersToday: number;
  revenueToday: number;
  openDisputes: number;
  pendingRefunds: number;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);

  useEffect(() => {
    api<Dashboard>("/api/admin/dashboard").then(setData);
  }, []);

  if (!data) return <PageLoader />;

  const cards = [
    { label: "Orders Today", value: data.ordersToday, icon: ShoppingBag, color: "text-terracotta-500" },
    { label: "Revenue Today", value: formatPrice(data.revenueToday), icon: IndianRupee, color: "text-sage-500" },
    { label: "Open Disputes", value: data.openDisputes, icon: MessageSquareWarning, color: "text-gold-500" },
    { label: "Pending Refunds", value: data.pendingRefunds, icon: AlertCircle, color: "text-red-500" },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl text-ink-900">Dashboard</h1>
      <p className="mt-1 text-sm text-ink-500">
        Overview of store activity for Zevora Styles
      </p>

      <div className="mt-8 grid grid-cols-2 gap-5 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card-surface p-6">
            <c.icon size={20} className={c.color} />
            <p className="mt-4 text-2xl font-semibold text-ink-900">{c.value}</p>
            <p className="mt-1 text-xs text-ink-500">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        <Link href="/admin/orders" className="card-surface p-6 transition-shadow hover:shadow-card">
          <p className="font-display text-lg text-ink-900">Manage Orders</p>
          <p className="mt-1 text-xs text-ink-500">View and update order status</p>
        </Link>
        <Link href="/admin/disputes" className="card-surface p-6 transition-shadow hover:shadow-card">
          <p className="font-display text-lg text-ink-900">Review Disputes</p>
          <p className="mt-1 text-xs text-ink-500">Approve HITL cases, issue refunds</p>
        </Link>
        <Link href="/admin/products" className="card-surface p-6 transition-shadow hover:shadow-card">
          <p className="font-display text-lg text-ink-900">Manage Catalog</p>
          <p className="mt-1 text-xs text-ink-500">Add products, update stock</p>
        </Link>
      </div>
    </div>
  );
}
