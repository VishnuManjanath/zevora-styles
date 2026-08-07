"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Package, MapPin, MessageSquare, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { PageLoader } from "@/components/ui/spinner";
import { clsx } from "clsx";

const NAV = [
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/disputes", label: "Disputes", icon: MessageSquare },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/login?redirect=${pathname}`);
    }
  }, [loading, user, pathname, router]);

  if (loading || !user) return <PageLoader />;

  return (
    <div className="container-page py-14">
      <div className="mb-10">
        <p className="eyebrow mb-2">My Account</p>
        <h1 className="font-display text-[34px] text-ink-900">
          Hello, {user.name.split(" ")[0]}
        </h1>
      </div>

      <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
        <aside className="flex flex-row gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-2.5 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                pathname.startsWith(item.href)
                  ? "bg-ink-900 text-cream-50"
                  : "text-ink-700 hover:bg-cream-200",
              )}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          ))}
          <button
            onClick={logout}
            className="flex items-center gap-2.5 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-medium text-ink-500 hover:bg-cream-200"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </aside>

        <div>{children}</div>
      </div>
    </div>
  );
}
