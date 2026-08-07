import Link from "next/link";
import { clsx } from "clsx";

export function Logo({
  light = false,
  className,
}: {
  light?: boolean;
  className?: string;
}) {
  return (
    <Link
      href="/"
      className={clsx(
        "font-display text-2xl font-semibold tracking-wide",
        light ? "text-cream-50" : "text-ink-900",
        className,
      )}
    >
      Zevora
      <span
        className={clsx(
          "ml-1.5 text-[0.6em] font-medium uppercase tracking-wide2 align-middle",
          light ? "text-cream-200" : "text-terracotta-500",
        )}
      >
        Styles
      </span>
    </Link>
  );
}
