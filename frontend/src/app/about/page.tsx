import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ABOUT_HERO, CRAFT_IMAGE, STORY_IMAGE_DETAIL } from "@/lib/images";
import { SectionHeading } from "@/components/ui/section-heading";

export default function AboutPage() {
  return (
    <div>
      <section className="relative h-[420px] overflow-hidden">
        <Image src={ABOUT_HERO} alt="Zevora Styles" fill className="object-cover" />
        <div className="absolute inset-0 bg-ink-900/50" />
        <div className="container-page relative z-10 flex h-full flex-col items-center justify-center text-center">
          <p className="eyebrow mb-3 text-gold-400">Our Story</p>
          <h1 className="font-display text-[46px] text-cream-50">
            Made With Intention
          </h1>
        </div>
      </section>

      <section className="container-page py-20">
        <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeading eyebrow="Since 2019" title="Rooted In Craft, Built For Today" />
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-ink-600">
              Zevora Styles began with a simple belief: ethnic wear shouldn&apos;t
              have to choose between tradition and everyday comfort. We work
              directly with small ateliers to bring hand-finished kurtis,
              dupattas, and kurta sets to your wardrobe — without compromise
              on fabric, fit, or fairness.
            </p>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-600">
              Every order is backed by transparent policies and a dispute
              resolution promise: if something&apos;s wrong, we make it right
              quickly, fairly, and without the runaround.
            </p>
            <Link href="/shop" className="btn-primary mt-8 inline-flex">
              Shop The Collection
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
            <Image src={STORY_IMAGE_DETAIL} alt="Craftsmanship" fill className="object-cover" />
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-28">
        <Image src={CRAFT_IMAGE} alt="Craft" fill className="object-cover" />
        <div className="absolute inset-0 bg-ink-900/60" />
        <div className="container-page relative z-10 text-center">
          <h2 className="mx-auto max-w-lg font-display text-[38px] text-cream-50">
            Fair Fashion, Honest Policies
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm text-cream-200/80">
            7-day returns, transparent refunds, and dispute resolution
            powered by Resolvr AI — so you always know where you stand.
          </p>
        </div>
      </section>
    </div>
  );
}
