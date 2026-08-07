"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Camera, Paperclip, Send, ShieldCheck } from "lucide-react";
import { api, apiUpload, imageUrl } from "@/lib/api";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageLoader } from "@/components/ui/spinner";
import type { Dispute } from "@/lib/types";
import { clsx } from "clsx";

export default function DisputeDetailPage() {
  const params = useParams<{ id: string }>();
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [captureChallenge, setCaptureChallenge] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    load();
  }, [params.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [dispute?.messages?.length]);

  async function load() {
    const res = await api<Dispute>(`/api/disputes/${params.id}`);
    setDispute(res);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      await api(`/api/disputes/${params.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ body: message }),
      });
      setMessage("");
      await load();
    } finally {
      setSending(false);
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await apiUpload(`/api/disputes/${params.id}/evidence`, formData);
      await load();
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function startCapture() {
    setCapturing(true);
    try {
      const res = await api<{ challenge: string }>(
        `/api/disputes/${params.id}/capture-session`,
        { method: "POST" },
      );
      setCaptureChallenge(res.challenge);
    } finally {
      setCapturing(false);
    }
  }

  if (!dispute) return <PageLoader />;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      {/* Chat */}
      <div className="card-surface flex h-[560px] flex-col">
        <div className="flex items-center justify-between border-b border-ink-900/[0.08] p-5">
          <div>
            <p className="font-display text-lg capitalize text-ink-900">
              {dispute.claimType.replace(/_/g, " ")}
            </p>
            <p className="text-xs text-ink-500">Order {dispute.orderId}</p>
          </div>
          <StatusBadge status={dispute.status} />
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {dispute.messages?.map((m) => (
            <div
              key={m.id}
              className={clsx(
                "flex",
                m.sender === "customer" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={clsx(
                  "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                  m.sender === "customer"
                    ? "bg-ink-900 text-cream-50"
                    : m.sender === "agent"
                    ? "bg-terracotta-50 text-ink-800"
                    : "bg-cream-200 text-ink-700",
                )}
              >
                {m.sender !== "customer" && (
                  <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-terracotta-600">
                    {m.sender === "agent" ? "Resolvr AI" : "System"}
                  </p>
                )}
                <p className="leading-relaxed">{m.body}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={sendMessage} className="flex items-center gap-3 border-t border-ink-900/[0.08] p-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-ink-400 hover:text-terracotta-600"
            title="Attach evidence"
          >
            <Paperclip size={19} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFile}
          />
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 bg-transparent text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending || !message.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-900 text-cream-50 disabled:opacity-40"
          >
            <Send size={15} />
          </button>
        </form>
      </div>

      {/* Sidebar: evidence + capture */}
      <div className="space-y-6">
        <div className="card-surface p-6">
          <h3 className="font-display text-lg text-ink-900">Evidence</h3>
          <p className="mt-1 text-xs text-ink-500">
            Upload photos/videos to support your claim
          </p>

          {dispute.evidence && dispute.evidence.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {dispute.evidence.map((ev) => (
                <div
                  key={ev.id}
                  className="relative aspect-square overflow-hidden rounded-lg bg-cream-200"
                >
                  {ev.fileUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl(ev.fileUrl)}
                      alt="Evidence"
                      className="h-full w-full object-cover"
                    />
                  )}
                  {ev.trustTier && (
                    <span className="absolute bottom-1 right-1 rounded bg-ink-900/80 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                      Tier {ev.trustTier}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-xs text-ink-400">No evidence uploaded yet.</p>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn-secondary mt-4 w-full text-xs"
          >
            {uploading ? "Uploading…" : "Upload Photo/Video"}
          </button>
        </div>

        <div className="card-surface p-6">
          <h3 className="flex items-center gap-2 font-display text-lg text-ink-900">
            <ShieldCheck size={17} className="text-terracotta-500" />
            Live Capture
          </h3>
          <p className="mt-1 text-xs text-ink-500">
            High-trust verification for faster resolution
          </p>

          {captureChallenge ? (
            <div className="mt-4 rounded-xl bg-terracotta-50/60 p-4">
              <p className="flex items-center gap-2 text-xs font-medium text-terracotta-600">
                <Camera size={14} /> Challenge
              </p>
              <p className="mt-1.5 text-sm text-ink-800">{captureChallenge}</p>
              <p className="mt-3 text-[11px] text-ink-400">
                Session expires in 5 minutes. Capture flow simulated for demo.
              </p>
            </div>
          ) : (
            <button
              onClick={startCapture}
              disabled={capturing}
              className="btn-secondary mt-4 w-full text-xs"
            >
              {capturing ? "Starting…" : "Start Live Capture"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
