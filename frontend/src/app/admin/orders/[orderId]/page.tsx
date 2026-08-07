"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, formatPrice } from "@/lib/api";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageLoader } from "@/components/ui/spinner";
import type { OrderDetail } from "@/lib/types";

const STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

export default function AdminOrderDetailPage() {
  const params = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [eventDesc, setEventDesc] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    load();
  }, [params.orderId]);

  async function load() {
    const res = await api<OrderDetail>(`/api/admin/orders/${params.orderId}`);
    setOrder(res);
  }

  async function updateStatus(status: string) {
    setUpdating(true);
    try {
      await api(`/api/admin/orders/${params.orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await load();
    } finally {
      setUpdating(false);
    }
  }

  async function addEvent() {
    if (!eventDesc.trim()) return;
    await api(`/api/admin/orders/${params.orderId}/delivery-event`, {
      method: "POST",
      body: JSON.stringify({
        status: order?.status || "processing",
        description: eventDesc,
        location: eventLocation || undefined,
      }),
    });
    setEventDesc("");
    setEventLocation("");
    await load();
  }

  if (!order) return <PageLoader />;

  return (
    <div>
      <div className="flex items-center gap-3">
        <h1 className="font-display text-3xl text-ink-900">{order.orderId}</h1>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card-surface p-6">
          <h3 className="font-display text-lg text-ink-900">Update Status</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => updateStatus(s)}
                disabled={updating || order.status === s}
                className={`rounded-full px-3.5 py-2 text-xs font-medium capitalize transition-colors ${
                  order.status === s
                    ? "bg-ink-900 text-cream-50"
                    : "bg-cream-200 text-ink-700 hover:bg-cream-300"
                }`}
              >
                {s.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        <div className="card-surface p-6">
          <h3 className="font-display text-lg text-ink-900">Add Delivery Event</h3>
          <div className="mt-4 space-y-3">
            <input
              placeholder="Description (e.g. Package left origin hub)"
              value={eventDesc}
              onChange={(e) => setEventDesc(e.target.value)}
              className="input-field"
            />
            <input
              placeholder="Location (optional)"
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
              className="input-field"
            />
            <button onClick={addEvent} className="btn-secondary w-full">
              Add Event
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 card-surface p-6">
        <h3 className="font-display text-lg text-ink-900">Items</h3>
        <div className="mt-4 space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between border-b border-ink-900/[0.06] pb-3 text-sm last:border-0">
              <div>
                <p className="text-ink-900">{item.productName}</p>
                <p className="text-xs text-ink-400">Size {item.size} · Serial {item.unitSerial}</p>
              </div>
              <p className="text-ink-800">{item.quantity} × {formatPrice(item.unitPrice)}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-between border-t border-ink-900/[0.08] pt-3 font-semibold text-ink-900">
          <span>Total</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </div>

      <div className="mt-6 card-surface p-6">
        <h3 className="font-display text-lg text-ink-900">Delivery Timeline</h3>
        <div className="mt-4 space-y-2 text-sm">
          {order.deliveryEvents.map((ev, i) => (
            <div key={i} className="flex justify-between text-ink-600">
              <span>{ev.description} {ev.location && `— ${ev.location}`}</span>
              <span className="text-xs text-ink-400">
                {new Date(ev.occurredAt).toLocaleString("en-IN")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
