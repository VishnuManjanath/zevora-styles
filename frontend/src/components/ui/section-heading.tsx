import { clsx } from "clsx";

export function SectionHeading({
  eyebrow,
  title,
  align = "left",
  light = false,
  className,
}: {
  eyebrow?: string;
  title: string;
  align?: "left" | "center";
  light?: boolean;
  className?: string;
}) {
  return (
    <div className={clsx(align === "center" && "text-center", className)}>
      {eyebrow && (
        <p className={clsx("eyebrow mb-3", light && "text-gold-400")}>
          {eyebrow}
        </p>
      )}
      <h2
        className={clsx(
          "font-display text-[34px] leading-[1.15] sm:text-[42px]",
          light ? "text-cream-50" : "text-ink-900",
        )}
      >
        {title}
      </h2>
    </div>
  );
}
