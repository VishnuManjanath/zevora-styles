import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="eyebrow mb-3">404</p>
      <h1 className="font-display text-[42px] text-ink-900">Page Not Found</h1>
      <p className="mt-3 max-w-sm text-sm text-ink-500">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <Link href="/" className="btn-primary mt-8">
        Back To Home
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}
