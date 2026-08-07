"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageLoader } from "@/components/ui/spinner";
import type { Dispute } from "@/lib/types";

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[] | null>(null);

  useEffect(() => {
    api<{ disputes: Dispute[] }>("/api/admin/disputes").then((res) => setDisputes(res.disputes));
  }, []);

  if (!disputes) return <PageLoader />;

  return (
    <div>
      <h1 className="font-display text-3xl text-ink-900">Disputes</h1>
      <p className="mt-1 text-sm text-ink-500">{disputes.length} total disputes</p>

      {disputes.length === 0 ? (
        <div className="mt-8 card-surface flex flex-col items-center justify-center gap-2 py-16 text-center">
          <p className="text-sm font-medium text-ink-700">No disputes yet</p>
          <p className="max-w-sm text-xs text-ink-500">
            Disputes appear here when a customer opens one from a real order in their account.
          </p>
        </div>
      ) : (
      <div className="mt-8 card-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-900/[0.08] bg-cream-100 text-left text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-5 py-3">Order</th>
              <th className="px-5 py-3">Claim Type</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Opened</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {disputes.map((d) => (
              <tr key={d.id} className="border-b border-ink-900/[0.06] last:border-0">
                <td className="px-5 py-3 font-medium text-ink-900">{d.orderId}</td>
                <td className="px-5 py-3 capitalize text-ink-700">{d.claimType.replace(/_/g, " ")}</td>
                <td className="px-5 py-3"><StatusBadge status={d.status} /></td>
                <td className="px-5 py-3 text-ink-500">
                  {new Date(d.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </td>
                <td className="px-5 py-3 text-right">
                  <Link href={`/admin/disputes/${d.id}`} className="text-xs font-medium text-terracotta-600">
                    Review →
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
