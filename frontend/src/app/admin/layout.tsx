"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  MessageSquareWarning,
  FileText,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { PageLoader } from "@/components/ui/spinner";
import { clsx } from "clsx";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/disputes", label: "Disputes", icon: MessageSquareWarning },
  { href: "/admin/policy", label: "Policy & Refunds", icon: FileText },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) return;
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/admin/login");
    }
  }, [isLoginPage, loading, user, router]);

  if (isLoginPage) return <>{children}</>;
  if (loading || !user || user.role !== "admin") return <PageLoader />;

  return (
    <div className="flex min-h-screen bg-cream-100">
      <aside className="flex w-64 flex-none flex-col border-r border-ink-900/[0.08] bg-ink-900 text-cream-100">
        <div className="flex h-[76px] items-center px-6">
          <span className="font-display text-xl text-cream-50">Zevora</span>
          <span className="ml-1.5 text-[10px] font-medium uppercase tracking-wide2 text-gold-400">
            Admin
          </span>
        </div>
        <nav className="flex-1 space-y-1 px-4 py-4">
          {NAV.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-terracotta-500 text-white"
                    : "text-cream-200/70 hover:bg-cream-50/5 hover:text-cream-50",
                )}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-1 border-t border-cream-50/10 p-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm text-cream-200/70 hover:bg-cream-50/5 hover:text-cream-50"
          >
            <ExternalLink size={16} />
            View Storefront
          </Link>
          <button
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm text-cream-200/70 hover:bg-cream-50/5 hover:text-cream-50"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-6xl px-8 py-10">{children}</div>
      </main>
    </div>
  );
}
