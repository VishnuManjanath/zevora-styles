"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { Logo } from "./logo";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { clsx } from "clsx";

const NAV = [
  { href: "/shop", label: "All" },
  { href: "/shop/kurtis", label: "Kurtis" },
  { href: "/shop/dupattas", label: "Dupattas" },
  { href: "/shop/sets", label: "Kurta Sets" },
  { href: "/about", label: "Our Story" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { cart } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (isAdmin) return null;

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    setSearchOpen(false);
    setQuery("");
  }

  return (
    <header
      className={clsx(
        "sticky top-0 z-50 border-b transition-all duration-300",
        scrolled
          ? "border-ink-900/[0.06] bg-cream-50/95 shadow-soft backdrop-blur-md"
          : "border-transparent bg-cream-50",
      )}
    >
      <div className="container-page flex h-[76px] items-center justify-between">
        <button
          className="flex items-center gap-2 lg:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={22} className="text-ink-900" />
        </button>

        <Logo className="lg:flex-none" />

        <nav className="hidden items-center gap-9 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "link-underline text-[13px] font-medium uppercase tracking-wide text-ink-700 transition-colors hover:text-terracotta-600",
                pathname === item.href && "text-terracotta-600",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4 sm:gap-5">
          <button
            aria-label="Search"
            onClick={() => setSearchOpen((s) => !s)}
            className="text-ink-800 transition-colors hover:text-terracotta-600"
          >
            <Search size={20} />
          </button>
          <Link
            href={user ? "/account/orders" : "/login"}
            aria-label="Account"
            className="hidden text-ink-800 transition-colors hover:text-terracotta-600 sm:block"
          >
            <User size={20} />
          </Link>
          <Link
            href="/cart"
            aria-label="Cart"
            className="relative text-ink-800 transition-colors hover:text-terracotta-600"
          >
            <ShoppingBag size={20} />
            {cart && cart.itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-terracotta-500 px-1 text-[10px] font-semibold text-white">
                {cart.itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-ink-900/[0.06] bg-cream-50 py-4 animate-fadeIn">
          <div className="container-page">
            <form onSubmit={submitSearch} className="flex items-center gap-3">
              <Search size={18} className="text-ink-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for kurtis, dupattas, sets…"
                className="w-full bg-transparent text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="text-ink-500 hover:text-ink-900"
              >
                <X size={18} />
              </button>
            </form>
          </div>
        </div>
      )}

      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-sm lg:hidden">
          <div className="fixed inset-y-0 left-0 flex w-[78%] max-w-[320px] flex-col bg-cream-50 p-6 shadow-lift animate-fadeIn">
            <div className="mb-8 flex items-center justify-between">
              <Logo />
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <X size={22} className="text-ink-900" />
              </button>
            </div>
            <nav className="flex flex-col gap-5">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="font-display text-2xl text-ink-900"
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-6 border-t border-ink-900/10 pt-6">
                <Link
                  href={user ? "/account/orders" : "/login"}
                  onClick={() => setMobileOpen(false)}
                  className="text-sm font-medium uppercase tracking-wide text-ink-700"
                >
                  {user ? "My Account" : "Sign In"}
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
