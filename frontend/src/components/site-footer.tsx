"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Instagram, Facebook, Twitter } from "lucide-react";
import { Logo } from "./logo";

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="border-t border-ink-900/[0.06] bg-ink-900 text-cream-100">
      <div className="container-page grid gap-12 py-16 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream-200/70">
            Ethnic elegance, woven for you. Handcrafted kurtis, dupattas, and
            kurta sets made for everyday grace.
          </p>
          <div className="mt-6 flex gap-4">
            {[Instagram, Facebook, Twitter].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-cream-50/15 text-cream-100 transition-colors hover:border-terracotta-400 hover:text-terracotta-400"
              >
                <Icon size={15} />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="eyebrow text-gold-400">Shop</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-cream-200/80">
            <li><Link href="/shop/kurtis" className="hover:text-cream-50">Kurtis</Link></li>
            <li><Link href="/shop/dupattas" className="hover:text-cream-50">Dupattas</Link></li>
            <li><Link href="/shop/sets" className="hover:text-cream-50">Kurta Sets</Link></li>
            <li><Link href="/shop" className="hover:text-cream-50">New Arrivals</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="eyebrow text-gold-400">Support</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-cream-200/80">
            <li><Link href="/account/orders" className="hover:text-cream-50">Track Order</Link></li>
            <li><Link href="/account/orders" className="hover:text-cream-50">Returns &amp; Disputes</Link></li>
            <li><a href="mailto:support@zevora.com" className="hover:text-cream-50">Contact Us</a></li>
            <li><Link href="/shop" className="hover:text-cream-50">Size Guide</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="eyebrow text-gold-400">Stay In Touch</h4>
          <p className="mt-4 text-sm text-cream-200/80">
            Get 10% off your first order and early access to new drops.
          </p>
          <form className="mt-4 flex overflow-hidden rounded-full border border-cream-50/20 bg-cream-50/5">
            <input
              type="email"
              placeholder="Your email"
              className="w-full bg-transparent px-4 py-2.5 text-sm text-cream-50 placeholder:text-cream-200/50 focus:outline-none"
            />
            <button className="whitespace-nowrap bg-terracotta-500 px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-terracotta-600">
              Join
            </button>
          </form>
        </div>
      </div>

      <div className="border-t border-cream-50/10 py-6">
        <div className="container-page flex flex-col items-center justify-between gap-3 text-xs text-cream-200/50 sm:flex-row">
          <p>© {new Date().getFullYear()} Zevora Styles. All rights reserved.</p>
          <p>Disputes &amp; returns handled by Resolvr AI</p>
        </div>
      </div>
    </footer>
  );
}
