"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChangePill, PageHeader, SeverityPill } from "@/components/ui";
import { MarginTrack } from "@/components/visuals";
import { formatMoney, formatPct } from "@/lib/format";
import { useApp } from "@/lib/store";

export default function MarginsPage() {
  const { kitchen, metrics } = useApp();
  const [drawn, setDrawn] = useState(false);
  useEffect(() => setDrawn(true), []);
  if (!kitchen || !metrics) return null;
  const currency = kitchen.profile.currency;
  const gap = metrics.blendedMargin == null ? null : metrics.blendedMargin - metrics.target;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Margins"
        title="Margin monitor"
        lede="Compare the blended menu with your target. Healthy dishes are on target. Watch is close. Critical is below it."
      />
      <section className="card p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-[1fr_1fr_1fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-ink-soft">Actual blended margin</p>
            <p className="num mt-2 text-5xl">{metrics.blendedMargin == null ? "—" : formatPct(metrics.blendedMargin)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-ink-soft">Target</p>
            <p className="num mt-2 text-5xl">{formatPct(metrics.target, 0)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-ink-soft">Gap</p>
            <p className={`num mt-2 text-5xl ${gap != null && gap < 0 ? "text-chili" : "text-sage"}`}>
              {gap == null ? "—" : `${gap > 0 ? "+" : ""}${gap.toFixed(1)} pts`}
            </p>
          </div>
        </div>
        <div className="mt-6">
          <MarginTrack margin={metrics.blendedMargin} target={metrics.target} />
          <p className="mt-2 text-xs text-ink-soft">The mark on the bar is the target. The fill is the blended menu, weighted by weekly covers.</p>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Count label="Healthy" value={metrics.healthy.length} tone="text-sage" />
        <Count label="Watch" value={metrics.warning.length} tone="text-brass" />
        <Count label="Critical" value={metrics.critical.length} tone="text-chili" />
      </section>

      <section className="card p-5">
        <h2 className="text-xl font-semibold">Margin trend</h2>
        <p className="mt-1 text-sm text-ink-soft">Blended margin over the recent service window.</p>
        <div className="mt-4 h-52">
          {drawn && metrics.trend.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.trend}>
                <XAxis dataKey="date" tick={{ fill: "#AEB8AF", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#AEB8AF", fontSize: 12 }} axisLine={false} tickLine={false} width={36} />
                <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} contentStyle={{ borderRadius: 12, borderColor: "rgba(221,232,223,0.15)", background: "#0D1812", color: "#F6F3E9" }} />
                <Area type="monotone" dataKey="margin" name="Margin" stroke="#718C78" fill="#718C78" fillOpacity={0.22} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-ink-soft">A trend appears once the menu has prices.</p>
          )}
        </div>
      </section>

      <div className="card scroll-thin overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.12em] text-ink-soft">
            <tr>
              <th className="px-4 py-3 font-semibold">Plate</th>
              <th className="px-4 py-3 font-semibold">Cost</th>
              <th className="px-4 py-3 font-semibold">Price</th>
              <th className="px-4 py-3 font-semibold">Margin</th>
              <th className="px-4 py-3 font-semibold">Vs target</th>
              <th className="px-4 py-3 font-semibold">Week</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {[...metrics.onMenu].sort((a, b) => (a.margin ?? 0) - (b.margin ?? 0)).map((dish) => (
              <tr key={dish.menuId} className="border-t border-line">
                <td className="px-4 py-3 font-medium">{dish.name}</td>
                <td className="num px-4 py-3">{formatMoney(dish.plateCost, currency)}</td>
                <td className="num px-4 py-3">{formatMoney(dish.sellingPrice, currency)}</td>
                <td className="num px-4 py-3">{dish.margin == null ? "—" : formatPct(dish.margin)}</td>
                <td className="px-4 py-3 w-40"><MarginTrack margin={dish.margin} target={dish.target} /></td>
                <td className="px-4 py-3"><ChangePill value={dish.marginDelta} /></td>
                <td className="px-4 py-3"><SeverityPill status={dish.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <List title="Declining" empty="No dishes lost margin this week." dishes={metrics.declining} />
        <List title="Improving" empty="No dishes gained margin this week." dishes={metrics.improving} />
      </section>
    </div>
  );
}

function Count({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="card px-4 py-4">
      <p className="text-xs text-ink-soft">{label}</p>
      <p className={`num text-3xl ${tone}`}>{value}</p>
    </div>
  );
}

function List({ title, empty, dishes }: { title: string; empty: string; dishes: { menuId: string; name: string; marginDelta: number | null; margin: number | null }[] }) {
  return (
    <div className="card p-5">
      <h2 className="font-display text-2xl">{title}</h2>
      <ul className="mt-3 space-y-2">
        {dishes.map((dish) => (
          <li key={dish.menuId} className="flex items-center justify-between gap-3 text-sm">
            <span>{dish.name}</span>
            <ChangePill value={dish.marginDelta} />
          </li>
        ))}
        {dishes.length === 0 ? <li className="text-sm text-ink-soft">{empty}</li> : null}
      </ul>
    </div>
  );
}
