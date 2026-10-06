"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChangePill, SeverityPill } from "@/components/ui";
import { MarginTrack, PlateGauge } from "@/components/visuals";
import { formatMoney, formatPct, formatWhen, greeting } from "@/lib/format";
import { stationLabel } from "@/lib/labels";
import { useApp } from "@/lib/store";

export default function DashboardPage() {
  const { user, kitchen, metrics } = useApp();
  const [drawn, setDrawn] = useState(false);
  useEffect(() => setDrawn(true), []);
  if (!kitchen || !metrics || !user) return null;
  const currency = kitchen.profile.currency;
  const margin = metrics.blendedMargin;
  const headline =
    margin == null
      ? "The board is waiting for its first plate."
      : margin >= metrics.target
        ? "The menu is holding."
        : "The menu is under the floor.";
  const lede =
    margin == null
      ? "Add recipes and selling prices. Hearthline will tell you which plates pay for themselves."
      : metrics.atRisk.length === 0
        ? "Every plate on the board is clearing the margin floor."
        : margin >= metrics.target
          ? `${metrics.atRisk.length} ${metrics.atRisk.length === 1 ? "plate sits" : "plates sit"} under the ${metrics.target.toFixed(0)}% floor, while the menu as a whole still holds.`
          : `Blended margin is ${(metrics.target - margin).toFixed(1)} points short. Start with the plates at risk.`;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-12">
        <div className="card rise p-6 md:p-8 lg:col-span-8">
          <p className="eyebrow">{kitchen.profile.name}</p>
          <h1 className="mt-2 font-display text-4xl tracking-tight md:text-5xl">{headline}</h1>
          <p className="mt-2 text-sm text-ink-soft">{greeting(user.name)}</p>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink">{lede}</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <Figure label="Blended margin" value={margin == null ? "—" : formatPct(margin)} hint={`Floor ${formatPct(metrics.target, 0)}`} />
            <Figure label="Food cost" value={metrics.blendedFoodCost == null ? "—" : formatPct(metrics.blendedFoodCost)} hint="Share of selling price" />
            <Figure label="Plates at risk" value={String(metrics.atRisk.length)} hint={`${metrics.onMenu.length} on the menu`} warn={metrics.atRisk.length > 0} />
          </div>
        </div>
        <div className="card flex items-center justify-center p-6 lg:col-span-4">
          <PlateGauge margin={margin} target={metrics.target} />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Mini label="Recipe cards" value={String(kitchen.recipes.length)} href="/recipes" />
        <Mini label="Pantry items" value={String(kitchen.ingredients.length)} href="/ingredients" />
        <Mini label="Prices up" value={String(metrics.rises.filter((move) => (move.changePct ?? 0) >= kitchen.profile.alertPricePct).length)} href="/ingredients" />
        <Mini label="Prices down" value={String(metrics.drops.length)} href="/analytics" />
      </section>

      <section className="grid gap-4 xl:grid-cols-5">
        <div className="card p-5 xl:col-span-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Under the line</p>
              <h2 className="mt-1 font-display text-2xl">Plates that need a look</h2>
            </div>
            <Link href="/menu" className="text-sm font-semibold text-copper">
              Open the menu
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {(metrics.atRisk.length ? metrics.atRisk : metrics.onMenu.slice(0, 4)).map((dish) => (
              <div key={dish.menuId} className="rounded-2xl border border-line bg-white px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{dish.name}</p>
                    <p className="text-xs text-ink-soft">{stationLabel(dish.station)}</p>
                  </div>
                  <SeverityPill status={dish.status === "unset" ? "unset" : dish.status} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                  <Stat label="Cost" value={formatMoney(dish.plateCost, currency)} />
                  <Stat label="Price" value={formatMoney(dish.sellingPrice, currency)} />
                  <Stat label="Margin" value={dish.margin == null ? "—" : formatPct(dish.margin)} />
                </div>
                <div className="mt-3">
                  <MarginTrack margin={dish.margin} target={dish.target} />
                </div>
              </div>
            ))}
            {metrics.onMenu.length === 0 ? <p className="text-sm text-ink-soft">No dishes are on the menu yet.</p> : null}
          </div>
        </div>
        <div className="card p-5 xl:col-span-2">
          <p className="eyebrow">Pass notes</p>
          <h2 className="mt-1 font-display text-2xl">What moved</h2>
          <div className="mt-4 space-y-3">
            {metrics.alerts.slice(0, 4).map((alert) => (
              <Link key={alert.id} href={alert.href} className="block rounded-2xl border border-line bg-white px-3 py-3 transition hover:border-copper/40">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">{alert.tag}</span>
                  <SeverityPill status={alert.severity} />
                </div>
                <p className="mt-1 text-sm font-medium leading-snug">{alert.title}</p>
              </Link>
            ))}
            {metrics.alerts.length === 0 ? <p className="text-sm text-ink-soft">No alerts. The pantry is quiet.</p> : null}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-5">
        <div className="card p-5 xl:col-span-3">
          <p className="eyebrow">Three weeks</p>
          <h2 className="mt-1 font-display text-2xl">Margin on the board</h2>
          <div className="mt-4 h-56">
            {drawn && metrics.trend.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.trend}>
                  <XAxis dataKey="date" tick={{ fill: "#6B5E52", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6B5E52", fontSize: 12 }} axisLine={false} tickLine={false} width={36} domain={["auto", "auto"]} />
                  <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} contentStyle={{ borderRadius: 12, borderColor: "#E4D8C6", background: "#FFFCF7" }} />
                  <Area type="monotone" dataKey="margin" name="Margin" stroke="#246246" fill="#E4F2EA" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-ink-soft">Trend appears once the menu has prices.</p>
            )}
          </div>
        </div>
        <div className="space-y-4 xl:col-span-2">
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl">Pantry movement</h2>
              <Link href="/ingredients" className="text-sm font-semibold text-copper">
                Pantry
              </Link>
            </div>
            <div className="mt-3 space-y-2">
              {metrics.volatile.slice(0, 5).map((move) => (
                <div key={move.ingredient.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate">{move.ingredient.name}</span>
                  <ChangePill value={move.changePct} invert />
                </div>
              ))}
              {metrics.volatile.length === 0 ? <p className="text-sm text-ink-soft">No volatile prices this week.</p> : null}
            </div>
          </div>
          <div className="card p-5">
            <h2 className="font-display text-2xl">Recent activity</h2>
            <ul className="mt-3 space-y-3">
              {kitchen.activity.slice(0, 4).map((item) => (
                <li key={item.id} className="border-l-2 border-copper-bright/70 pl-3">
                  <p className="text-sm">{item.text}</p>
                  <p className="text-xs text-ink-soft">{formatWhen(item.at)}</p>
                </li>
              ))}
              {kitchen.activity.length === 0 ? <li className="text-sm text-ink-soft">Activity will show up as you post prices and edit cards.</li> : null}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

function Figure({ label, value, hint, warn }: { label: string; value: string; hint: string; warn?: boolean }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-3">
      <p className="text-xs text-ink-soft">{label}</p>
      <p className={`num mt-1 text-3xl ${warn ? "text-chili" : "text-ink"}`}>{value}</p>
      <p className="text-xs text-ink-soft">{hint}</p>
    </div>
  );
}

function Mini({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <Link href={href} className="card card-hover block px-4 py-4">
      <p className="text-xs text-ink-soft">{label}</p>
      <p className="num mt-1 text-3xl">{value}</p>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.12em] text-ink-soft">{label}</p>
      <p className="num text-sm">{value}</p>
    </div>
  );
}
