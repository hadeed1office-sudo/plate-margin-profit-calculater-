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
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden overflow-hidden bg-walnut text-paper lg:flex lg:flex-col lg:justify-between lg:px-14 lg:py-12">
        <Link href="/" className="flex items-center gap-3">
          <Mark className="h-11 w-11" />
          <span className="font-display text-3xl">Hearthline</span>
        </Link>
        <div>
          <p className="eyebrow text-[#f0c7ad]">The pass, priced</p>
          <h2 className="mt-4 max-w-lg font-display text-5xl leading-[1.05]">Are the plates still paying for themselves?</h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-[#eadfce]">
            Ingredient tickets, recipe cards, and menu prices live on one board. When the market moves, the margin moves with it.
          </p>
          <div className="mt-8 grid max-w-lg grid-cols-3 gap-3">
            <Ticket kicker="Floor" value="68%" note="target margin" />
            <Ticket kicker="Food cost" value="32%" note="of the selling price" />
            <Ticket kicker="Watch" value="3" note="plates under the line" />
          </div>
        </div>
        <p className="text-sm text-[#cbbba6]">Built for chefs, owners, and the person who prices the specials.</p>
      </section>
      <section className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <Mark className="h-9 w-9" />
            <span className="font-display text-2xl">Hearthline</span>
          </Link>
          <h1 className="font-display text-4xl tracking-tight">{title}</h1>
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
    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
      <p className="text-[10px] uppercase tracking-[0.16em] text-[#cbbba6]">{kicker}</p>
      <p className="num mt-2 text-2xl">{value}</p>
      <p className="mt-1 text-[11px] text-[#eadfce]">{note}</p>
    </div>
  );
}
