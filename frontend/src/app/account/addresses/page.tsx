"use client";

import { useEffect, useState } from "react";
import { MapPin, Plus, Star, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { PageLoader } from "@/components/ui/spinner";
import type { Address } from "@/lib/types";

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    label: "Home",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const res = await api<{ addresses: Address[] }>("/api/addresses");
    setAddresses(res.addresses);
  }

  async function addAddress() {
    setError("");
    try {
      await api("/api/addresses", {
        method: "POST",
        body: JSON.stringify({ ...form, isDefault: (addresses?.length ?? 0) === 0 }),
      });
      setForm({ label: "Home", line1: "", line2: "", city: "", state: "", pincode: "" });
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save");
    }
  }

  async function remove(id: string) {
    if (!confirm("Remove this address?")) return;
    await api(`/api/addresses/${id}`, { method: "DELETE" });
    await load();
  }

  async function makeDefault(id: string) {
    await api(`/api/addresses/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ isDefault: true }),
    });
    await load();
  }

  if (!addresses) return <PageLoader />;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-2xl text-ink-900">Saved Addresses</h2>
        <button onClick={() => setShowForm((s) => !s)} className="btn-secondary">
          <Plus size={15} /> Add Address
        </button>
      </div>

      {showForm && (
        <div className="card-surface mb-6 p-6">
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Label (Home/Work)"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              className="input-field col-span-2"
            />
            <input
              placeholder="Address line 1"
              value={form.line1}
              onChange={(e) => setForm({ ...form, line1: e.target.value })}
              className="input-field col-span-2"
            />
            <input
              placeholder="Address line 2 (optional)"
              value={form.line2}
              onChange={(e) => setForm({ ...form, line2: e.target.value })}
              className="input-field col-span-2"
            />
            <input
              placeholder="City"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="input-field"
            />
            <input
              placeholder="State"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              className="input-field"
            />
            <input
              placeholder="Pincode"
              value={form.pincode}
              onChange={(e) => setForm({ ...form, pincode: e.target.value })}
              className="input-field col-span-2"
            />
          </div>
          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
          <button onClick={addAddress} className="btn-primary mt-4">
            Save Address
          </button>
        </div>
      )}

      {addresses.length === 0 && !showForm ? (
        <div className="card-surface flex flex-col items-center py-16 text-center">
          <MapPin size={32} className="mb-3 text-ink-300" />
          <p className="text-ink-500">No saved addresses yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div key={addr._id} className="card-surface flex items-start justify-between gap-4 p-5">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-ink-900">{addr.label}</p>
                  {addr.isDefault && (
                    <span className="rounded-full bg-sage-400/20 px-2 py-0.5 text-[10px] font-medium text-sage-500">
                      Default
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-ink-600">
                  {addr.line1}
                  {addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}, {addr.state} -{" "}
                  {addr.pincode}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {!addr.isDefault && (
                  <button
                    onClick={() => makeDefault(addr._id)}
                    title="Make default"
                    className="text-ink-400 hover:text-gold-500"
                  >
                    <Star size={16} />
                  </button>
                )}
                <button
                  onClick={() => remove(addr._id)}
                  className="text-ink-400 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
