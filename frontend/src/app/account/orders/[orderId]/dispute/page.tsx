"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { PageLoader } from "@/components/ui/spinner";
import type { OrderDetail, ClaimType } from "@/lib/types";

const CLAIM_TYPES: { value: ClaimType; label: string; hint: string }[] = [
  { value: "damage", label: "Item Damaged", hint: "Product arrived damaged or defective" },
  { value: "wrong_item", label: "Wrong Item", hint: "Received a different product" },
  { value: "size_exchange", label: "Size Exchange", hint: "Need a different size" },
  { value: "not_as_described", label: "Not As Described", hint: "Doesn't match listing" },
  { value: "delivery_delay", label: "Delivery Delay", hint: "Order is stuck or late" },
  { value: "other", label: "Other", hint: "Something else" },
];

export default function ReportIssuePage() {
  const params = useParams<{ orderId: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [claimType, setClaimType] = useState<ClaimType>("damage");
  const [orderItemId, setOrderItemId] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api<OrderDetail>(`/api/orders/${params.orderId}`).then((o) => {
      setOrder(o);
      if (o.items[0]) setOrderItemId(o.items[0].id);
    });
  }, [params.orderId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (description.trim().length < 5) {
      setError("Please describe the issue in a bit more detail");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await api<{ dispute: { id: string } }>("/api/disputes", {
        method: "POST",
        body: JSON.stringify({
          orderId: params.orderId,
          claimType,
          description,
          orderItemId: orderItemId || undefined,
        }),
      });
      router.push(`/account/disputes/${res.dispute.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to open dispute");
    } finally {
      setSubmitting(false);
    }
  }

  if (!order) return <PageLoader />;

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-8">
        <h2 className="font-display text-2xl text-ink-900">Report An Issue</h2>
        <p className="mt-1 text-sm text-ink-500">Order {order.orderId}</p>
      </div>

      <form onSubmit={submit} className="card-surface space-y-5 p-7">
        <div>
          <label className="label-field">What went wrong?</label>
          <div className="grid grid-cols-2 gap-2.5">
            {CLAIM_TYPES.map((ct) => (
              <button
                type="button"
                key={ct.value}
                onClick={() => setClaimType(ct.value)}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  claimType === ct.value
                    ? "border-terracotta-400 bg-terracotta-50/40"
                    : "border-ink-900/10 hover:border-ink-900/25"
                }`}
              >
                <p className="text-sm font-medium text-ink-900">{ct.label}</p>
                <p className="mt-0.5 text-[11px] text-ink-500">{ct.hint}</p>
              </button>
            ))}
          </div>
        </div>

        {order.items.length > 1 && (
          <div>
            <label className="label-field">Which item?</label>
            <select
              value={orderItemId}
              onChange={(e) => setOrderItemId(e.target.value)}
              className="input-field"
            >
              {order.items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.productName} ({item.size})
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="label-field">Describe the issue</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-field resize-none"
            placeholder="Tell us what happened — the more detail, the faster we can help."
          />
        </div>

        {error && (
          <p className="flex items-center gap-2 text-sm text-red-500">
            <AlertTriangle size={14} /> {error}
          </p>
        )}

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? "Submitting…" : "Submit Dispute"}
        </button>
        <p className="text-center text-xs text-ink-400">
          Your case will be reviewed by Resolvr AI, our automated resolution agent.
        </p>
      </form>
    </div>
  );
}
