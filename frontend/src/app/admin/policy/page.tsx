"use client";

import { useEffect, useState } from "react";
import { api, formatPrice } from "@/lib/api";
import { PageLoader } from "@/components/ui/spinner";

interface PolicyConfig {
  autoResolveCap: number;
  enabledClaimTypes: string[];
  returnWindowDays: number;
  policyPackVersion: number;
}

interface PolicyClause {
  clauseId: string;
  title: string;
  body: string;
  category: string;
  isActive: boolean;
}

const ALL_CLAIM_TYPES = [
  "damage",
  "wrong_item",
  "delivery_delay",
  "size_exchange",
  "not_as_described",
  "other",
];

export default function AdminPolicyPage() {
  const [config, setConfig] = useState<PolicyConfig | null>(null);
  const [clauses, setClauses] = useState<PolicyClause[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const res = await api<{ config: PolicyConfig; clauses: PolicyClause[] }>("/api/admin/policy");
    setConfig(res.config);
    setClauses(res.clauses);
  }

  function toggleClaimType(type: string) {
    if (!config) return;
    const enabled = config.enabledClaimTypes.includes(type)
      ? config.enabledClaimTypes.filter((t) => t !== type)
      : [...config.enabledClaimTypes, type];
    setConfig({ ...config, enabledClaimTypes: enabled });
  }

  async function save() {
    if (!config) return;
    setSaving(true);
    try {
      await api("/api/admin/policy/config", {
        method: "PATCH",
        body: JSON.stringify({
          autoResolveCap: Number(config.autoResolveCap),
          enabledClaimTypes: config.enabledClaimTypes,
          returnWindowDays: Number(config.returnWindowDays),
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  if (!config) return <PageLoader />;

  return (
    <div>
      <h1 className="font-display text-3xl text-ink-900">Policy & Refunds</h1>
      <p className="mt-1 text-sm text-ink-500">
        Controls used by Resolvr for auto-resolution decisions
      </p>

      <div className="mt-8 card-surface p-7">
        <h3 className="font-display text-lg text-ink-900">Refund Guardrails</h3>
        <div className="mt-5 grid grid-cols-2 gap-5">
          <div>
            <label className="label-field">Auto-Resolve Cap (₹)</label>
            <input
              type="number"
              value={config.autoResolveCap / 100}
              onChange={(e) =>
                setConfig({ ...config, autoResolveCap: Number(e.target.value) * 100 })
              }
              className="input-field"
            />
            <p className="mt-1 text-xs text-ink-400">
              Currently {formatPrice(config.autoResolveCap)} — disputes above this need HITL approval
            </p>
          </div>
          <div>
            <label className="label-field">Return Window (days)</label>
            <input
              type="number"
              value={config.returnWindowDays}
              onChange={(e) => setConfig({ ...config, returnWindowDays: Number(e.target.value) })}
              className="input-field"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="label-field">Enabled Claim Types</label>
          <div className="flex flex-wrap gap-2">
            {ALL_CLAIM_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => toggleClaimType(type)}
                className={`rounded-full px-3.5 py-2 text-xs font-medium capitalize transition-colors ${
                  config.enabledClaimTypes.includes(type)
                    ? "bg-ink-900 text-cream-50"
                    : "bg-cream-200 text-ink-500"
                }`}
              >
                {type.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        <button onClick={save} disabled={saving} className="btn-primary mt-6">
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save Changes"}
        </button>
      </div>

      <div className="mt-6 card-surface p-7">
        <h3 className="font-display text-lg text-ink-900">Policy Clauses</h3>
        <div className="mt-5 space-y-4">
          {clauses.map((c) => (
            <div key={c.clauseId} className="border-b border-ink-900/[0.06] pb-4 last:border-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-ink-900">
                  {c.clauseId} — {c.title}
                </p>
                <span className="rounded-full bg-cream-200 px-2 py-0.5 text-[10px] uppercase text-ink-500">
                  {c.category}
                </span>
              </div>
              <p className="mt-1 text-sm text-ink-600">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
