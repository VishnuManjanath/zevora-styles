"use client";

import { useState } from "react";
import { CreditCard, Lock, X } from "lucide-react";
import { formatPrice } from "@/lib/api";
import { Spinner } from "@/components/ui/spinner";

export function RazorpayMockModal({
  amount,
  orderId,
  onResult,
  onClose,
}: {
  amount: number;
  orderId: string;
  onResult: (success: boolean) => void;
  onClose: () => void;
}) {
  const [processing, setProcessing] = useState(false);
  const [card, setCard] = useState("4111 1111 1111 1111");

  function pay(success: boolean) {
    setProcessing(true);
    setTimeout(() => {
      onResult(success);
    }, 1400);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-900/60 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-lift">
        <div className="flex items-center justify-between bg-[#072654] px-5 py-4">
          <div className="flex items-center gap-2 text-white">
            <CreditCard size={18} />
            <span className="text-sm font-semibold">Razorpay</span>
            <span className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] uppercase">
              Test Mode
            </span>
          </div>
          <button onClick={onClose} disabled={processing} className="text-white/70 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-xs text-ink-500">Paying Zevora Styles</p>
          <p className="mt-1 font-display text-3xl text-ink-900">
            {formatPrice(amount)}
          </p>
          <p className="mt-1 text-xs text-ink-400">Order {orderId}</p>

          {processing ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <Spinner size={30} className="text-terracotta-500" />
              <p className="text-sm text-ink-600">Processing payment…</p>
            </div>
          ) : (
            <>
              <div className="mt-6 space-y-3">
                <div>
                  <label className="label-field">Card Number</label>
                  <input
                    value={card}
                    onChange={(e) => setCard(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="label-field">Expiry</label>
                    <input defaultValue="12/29" className="input-field" />
                  </div>
                  <div className="flex-1">
                    <label className="label-field">CVV</label>
                    <input defaultValue="123" className="input-field" />
                  </div>
                </div>
              </div>

              <button
                onClick={() => pay(true)}
                className="btn-primary mt-6 w-full"
              >
                <Lock size={14} />
                Pay {formatPrice(amount)}
              </button>
              <button
                onClick={() => pay(false)}
                className="mt-2 w-full py-2 text-center text-xs font-medium text-ink-400 hover:text-red-500"
              >
                Simulate payment failure
              </button>
              <p className="mt-4 text-center text-[11px] text-ink-400">
                This is a mock gateway for demo purposes. No real charge occurs.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
