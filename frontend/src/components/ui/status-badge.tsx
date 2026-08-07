import { clsx } from "clsx";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-ink-900/[0.06] text-ink-600",
  confirmed: "bg-sage-400/15 text-sage-500",
  processing: "bg-gold-400/20 text-gold-500",
  shipped: "bg-terracotta-100 text-terracotta-600",
  out_for_delivery: "bg-terracotta-100 text-terracotta-600",
  delivered: "bg-sage-400/20 text-sage-500",
  cancelled: "bg-red-100 text-red-500",
  refunded: "bg-ink-900/[0.06] text-ink-500",
  paid: "bg-sage-400/20 text-sage-500",
  failed: "bg-red-100 text-red-500",
  partial_refund: "bg-gold-400/20 text-gold-500",
  opened: "bg-gold-400/20 text-gold-600",
  evidence_pending: "bg-gold-400/20 text-gold-600",
  under_review: "bg-terracotta-100 text-terracotta-600",
  auto_resolved: "bg-sage-400/20 text-sage-500",
  escalated: "bg-red-100 text-red-500",
  approved: "bg-sage-400/20 text-sage-500",
  rejected: "bg-red-100 text-red-500",
  closed: "bg-ink-900/[0.06] text-ink-500",
};

export function StatusBadge({ status }: { status: string }) {
  const label = status.replace(/_/g, " ");
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium capitalize",
        STATUS_STYLES[status] || "bg-ink-900/[0.06] text-ink-600",
      )}
    >
      {label}
    </span>
  );
}
