"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, ShieldAlert, XCircle } from "lucide-react";
import { api, ApiError, formatPrice, imageUrl } from "@/lib/api";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageLoader } from "@/components/ui/spinner";
import type { Dispute } from "@/lib/types";

export default function AdminDisputeDetailPage() {
  const params = useParams<{ id: string }>();
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    load();
  }, [params.id]);

  async function load() {
    const res = await api<Dispute>(`/api/admin/disputes/${params.id}`);
    setDispute(res);
  }

  async function approve() {
    setBusy(true);
    try {
      await api(`/api/admin/disputes/${params.id}/hitl-approve`, { method: "POST" });
      await load();
      setMessage("Dispute approved. Resolvr can now proceed with the refund.");
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    setBusy(true);
    try {
      await api(`/api/admin/disputes/${params.id}/hitl-reject`, { method: "POST" });
      await load();
      setMessage("Dispute rejected.");
    } finally {
      setBusy(false);
    }
  }

  async function issueRefund() {
    if (!refundAmount || !dispute) return;
    setBusy(true);
    setMessage("");
    try {
      await api("/api/admin/refunds", {
        method: "POST",
        body: JSON.stringify({
          orderId: dispute.orderId,
          amount: Math.round(Number(refundAmount) * 100),
          reason,
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      setMessage("Refund issued successfully.");
      setRefundAmount("");
      setReason("");
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Refund failed");
    } finally {
      setBusy(false);
    }
  }

  if (!dispute) return <PageLoader />;

  return (
    <div>
      <div className="flex items-center gap-3">
        <h1 className="font-display text-3xl capitalize text-ink-900">
          {dispute.claimType.replace(/_/g, " ")}
        </h1>
        <StatusBadge status={dispute.status} />
      </div>
      <p className="mt-1 text-sm text-ink-500">Order {dispute.orderId}</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card-surface p-6">
          <h3 className="font-display text-lg text-ink-900">Description</h3>
          <p className="mt-2 text-sm text-ink-600">{dispute.description}</p>

          {dispute.evidence && dispute.evidence.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Evidence</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {dispute.evidence.map((ev) => (
                  <div key={ev.id} className="relative aspect-square overflow-hidden rounded-lg bg-cream-200">
                    {ev.fileUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imageUrl(ev.fileUrl)} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={approve}
              disabled={busy}
              className="flex-1 rounded-full bg-sage-500 py-2.5 text-sm font-medium text-white hover:bg-sage-500/90 disabled:opacity-50"
            >
              <CheckCircle2 size={15} className="mr-1.5 inline" />
              HITL Approve
            </button>
            <button
              onClick={reject}
              disabled={busy}
              className="flex-1 rounded-full bg-red-500 py-2.5 text-sm font-medium text-white hover:bg-red-500/90 disabled:opacity-50"
            >
              <XCircle size={15} className="mr-1.5 inline" />
              Reject
            </button>
          </div>
        </div>

        <div className="card-surface p-6">
          <h3 className="flex items-center gap-2 font-display text-lg text-ink-900">
            <ShieldAlert size={17} className="text-terracotta-500" />
            Issue Refund
          </h3>
          <div className="mt-4 space-y-3">
            <div>
              <label className="label-field">Amount (₹)</label>
              <input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-field">Reason</label>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="input-field"
                placeholder="Damaged on arrival — clause 4.2"
              />
            </div>
            <button onClick={issueRefund} disabled={busy} className="btn-primary w-full">
              {busy ? "Processing…" : "Issue Refund"}
            </button>
          </div>
          {message && <p className="mt-3 text-sm text-terracotta-600">{message}</p>}
        </div>
      </div>

      {dispute.messages && dispute.messages.length > 0 && (
        <div className="mt-6 card-surface p-6">
          <h3 className="font-display text-lg text-ink-900">Conversation</h3>
          <div className="mt-4 space-y-3">
            {dispute.messages.map((m) => (
              <div key={m.id} className="text-sm">
                <span className="mr-2 font-medium capitalize text-ink-800">{m.sender}:</span>
                <span className="text-ink-600">{m.body}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
