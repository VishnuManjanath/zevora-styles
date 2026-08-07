import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Truck, Undo2, Sparkles } from "lucide-react";
import { getCategories, getFeaturedProducts } from "@/lib/data";
import { ProductCard } from "@/components/ui/product-card";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  HERO_IMAGE,
  HERO_SECONDARY,
  STORY_IMAGE_MAIN,
  STORY_IMAGE_DETAIL,
  CRAFT_IMAGE,
  CATEGORY_IMAGES,
} from "@/lib/images";

const TRUST = [
  { icon: Truck, title: "Free Shipping", desc: "On orders above ₹1,499" },
  { icon: Undo2, title: "Easy Returns", desc: "7-day hassle-free window" },
  { icon: ShieldCheck, title: "Secure Payments", desc: "Razorpay protected" },
  { icon: Sparkles, title: "Handpicked Fabric", desc: "Quality, verified" },
];

export default async function HomePage() {
  const [categories, featured] = await Promise.all([
    getCategories(),
    getFeaturedProducts(),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink-900">
        <div className="absolute inset-0">
          <Image
            src={HERO_IMAGE}
            alt="Zevora Styles ethnic collection"
            fill
            priority
            className="object-cover opacity-[0.55]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink-900 via-ink-900/70 to-ink-900/10" />
        </div>

        <div className="container-page relative z-10 flex min-h-[640px] flex-col justify-center py-24 sm:min-h-[720px]">
          <div className="max-w-xl fade-up">
            <p className="eyebrow mb-5 text-gold-400">
              The Autumn–Winter Edit
            </p>
            <h1 className="font-display text-[52px] leading-[1.05] text-cream-50 sm:text-[68px]">
              Ethnic Elegance,
              <br />
              Woven For You
            </h1>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-cream-200/80">
              Handcrafted kurtis, dupattas, and kurta sets designed for quiet
              grace — made for everyday moments and the ones that matter.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link href="/shop" className="btn-primary">
                Shop The Collection
                <ArrowRight size={16} />
              </Link>
              <Link href="/about" className="btn-outline-light">
                Our Story
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-10 right-10 hidden overflow-hidden rounded-2xl shadow-lift lg:block">
          <div className="relative h-[180px] w-[220px]">
            <Image
              src={HERO_SECONDARY}
              alt="Zevora Styles detail"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-b border-ink-900/[0.06] bg-cream-100">
        <div className="container-page grid grid-cols-2 gap-6 py-10 sm:grid-cols-4">
          {TRUST.map((t) => (
            <div key={t.title} className="flex items-center gap-3">
              <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-cream-50 text-terracotta-500 shadow-soft">
                <t.icon size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-900">{t.title}</p>
                <p className="text-xs text-ink-500">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Story */}
      <section className="container-page py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div className="relative">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
              <Image
                src={STORY_IMAGE_MAIN}
                alt="Zevora Styles craftsmanship"
                fill
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-10 -right-6 hidden w-44 overflow-hidden rounded-2xl border-8 border-cream-50 shadow-lift sm:block">
              <div className="relative aspect-square">
                <Image
                  src={STORY_IMAGE_DETAIL}
                  alt="Fabric detail"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          <div>
            <p className="eyebrow mb-4">Since 2019</p>
            <h2 className="font-display text-[38px] leading-[1.15] text-ink-900 sm:text-[44px]">
              The Art Of Understated Craft
            </h2>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-ink-600">
              Every Zevora piece begins with fabric chosen for how it moves,
              not just how it looks. Our artisans hand-finish each hem and
              seam — small details that make a kurti feel less like an outfit,
              and more like a second skin.
            </p>
            <div className="mt-8 flex items-center gap-10">
              <div>
                <p className="font-display text-3xl text-terracotta-500">40K+</p>
                <p className="text-xs uppercase tracking-wide text-ink-500">
                  Happy Customers
                </p>
              </div>
              <div>
                <p className="font-display text-3xl text-terracotta-500">4.8/5</p>
                <p className="text-xs uppercase tracking-wide text-ink-500">
                  Average Rating
                </p>
              </div>
            </div>
            <Link
              href="/about"
              className="btn-secondary mt-9 inline-flex"
            >
              Read Our Story
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-cream-100 py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="Shop By Category"
            title="Find Your Perfect Silhouette"
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-3">
            {(categories.length
              ? categories
              : [
                  { slug: "kurtis", name: "Kurtis", _id: "1" },
                  { slug: "dupattas", name: "Dupattas", _id: "2" },
                  { slug: "sets", name: "Kurta Sets", _id: "3" },
                ]
            ).map((cat) => (
              <Link
                key={cat.slug}
                href={`/shop/${cat.slug}`}
                className="group relative block h-[420px] overflow-hidden rounded-2xl"
              >
                <Image
                  src={
                    CATEGORY_IMAGES[cat.slug] || CATEGORY_IMAGES.kurtis
                  }
                  alt={cat.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-900/70 via-ink-900/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-6">
                  <h3 className="font-display text-2xl text-cream-50">
                    {cat.name}
                  </h3>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cream-50/90 text-ink-900 transition-transform group-hover:translate-x-1">
                    <ArrowRight size={16} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="container-page py-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading eyebrow="Curated For You" title="Our Most Loved Pieces" />
          <Link href="/shop" className="link-underline text-sm font-medium text-ink-800">
            View All Products →
          </Link>
        </div>

        {featured.products.length > 0 ? (
          <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {featured.products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="mt-12 rounded-2xl border border-dashed border-ink-900/15 p-16 text-center text-ink-500">
            <p>
              No products yet. Run <code className="rounded bg-ink-900/5 px-1.5 py-0.5">npm run seed</code> in the backend to populate the catalog.
            </p>
          </div>
        )}
      </section>

      {/* CTA banner */}
      <section className="relative overflow-hidden py-28">
        <Image
          src={CRAFT_IMAGE}
          alt="Zevora Styles craft"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-ink-900/60" />
        <div className="container-page relative z-10 text-center">
          <p className="eyebrow mb-4 text-gold-400">Limited Edition</p>
          <h2 className="mx-auto max-w-lg font-display text-[38px] leading-[1.2] text-cream-50 sm:text-[46px]">
            Festive Season, Timeless Silhouettes
          </h2>
          <Link href="/shop" className="btn-primary mt-8 inline-flex">
            Explore The Edit
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
