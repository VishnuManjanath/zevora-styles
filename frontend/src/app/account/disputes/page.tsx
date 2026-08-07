"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, ShieldQuestion } from "lucide-react";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageLoader } from "@/components/ui/spinner";
import type { Dispute } from "@/lib/types";

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[] | null>(null);

  useEffect(() => {
    api<{ disputes: Dispute[] }>("/api/disputes").then((res) => setDisputes(res.disputes));
  }, []);

  if (!disputes) return <PageLoader />;

  if (disputes.length === 0) {
    return (
      <div className="card-surface flex flex-col items-center py-20 text-center">
        <ShieldQuestion size={36} className="mb-4 text-ink-300" />
        <p className="text-ink-600">No disputes yet.</p>
        <p className="mt-1 text-sm text-ink-400">
          If something goes wrong with an order, you can report it from the order detail page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {disputes.map((d) => (
        <Link
          key={d.id}
          href={`/account/disputes/${d.id}`}
          className="card-surface flex items-center justify-between gap-4 p-5 transition-shadow hover:shadow-card"
        >
          <div>
            <div className="flex items-center gap-3">
              <p className="font-display text-lg capitalize text-ink-900">
                {d.claimType.replace(/_/g, " ")}
              </p>
              <StatusBadge status={d.status} />
            </div>
            <p className="mt-1 text-xs text-ink-500">
              Order {d.orderId} · Opened{" "}
              {new Date(d.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
              })}
            </p>
          </div>
          <ChevronRight size={18} className="text-ink-400" />
        </Link>
      ))}
    </div>
  );
}
