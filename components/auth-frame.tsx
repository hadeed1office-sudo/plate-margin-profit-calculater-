"use client";

import Link from "next/link";
import { Mark } from "./boot";

export function AuthFrame({
  title,
  lede,
  children,
  footer,
}: {
  title: string;
  lede: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:px-14 lg:py-12">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url(/hero/kitchen-bg.jpg)" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07100C] via-[#07100C]/75 to-[#07100C]/35" />
        <Link href="/" className="relative z-10 flex items-center gap-3">
          <Mark className="h-11 w-11" />
          <span className="font-sora text-2xl font-semibold leading-tight tracking-tight text-cream">Kitchen Profit Calculator</span>
        </Link>
        <div className="relative z-10">
          <p className="eyebrow">Kitchen profit</p>
          <h2 className="mt-4 max-w-lg font-sora text-5xl font-semibold leading-[1.08] tracking-tight text-cream">How profitable is the kitchen today?</h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-ink-soft">
            Ingredients, recipes, and menu prices stay on one calm board. When a price moves, every affected margin moves with it.
          </p>
          <div className="mt-8 grid max-w-lg grid-cols-3 gap-3">
            <Ticket kicker="Target" value="68%" note="profit margin" />
            <Ticket kicker="Food cost" value="32%" note="of the selling price" />
            <Ticket kicker="Watch" value="3" note="dishes to review" />
          </div>
        </div>
        <p className="relative z-10 text-sm text-ink-soft">For owners, chefs, and the people who price the menu.</p>
      </section>
      <section className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md rounded-2xl border border-line bg-card p-6 shadow-card md:p-8">
          <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <Mark className="h-9 w-9" />
            <span className="text-xl font-semibold leading-tight">Kitchen Profit Calculator</span>
          </Link>
          <h1 className="font-sora text-[1.75rem] font-semibold tracking-tight text-cream">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{lede}</p>
          <div className="mt-6">{children}</div>
          <div className="mt-6 text-sm text-ink-soft">{footer}</div>
        </div>
      </section>
    </div>
  );
}

function Ticket({ kicker, value, note }: { kicker: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl border border-line bg-card px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{kicker}</p>
      <p className="num mt-2 text-2xl text-ink">{value}</p>
      <p className="mt-1 text-[11px] text-ink-soft">{note}</p>
    </div>
  );
}
