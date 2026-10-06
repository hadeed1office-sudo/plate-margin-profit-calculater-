"use client";

import { ChangePill, PageHeader, SeverityPill } from "@/components/ui";
import { MarginTrack } from "@/components/visuals";
import { formatMoney, formatPct } from "@/lib/format";
import { useApp } from "@/lib/store";

export default function MarginsPage() {
  const { kitchen, metrics } = useApp();
  if (!kitchen || !metrics) return null;
  const currency = kitchen.profile.currency;
  const gap = metrics.blendedMargin == null ? null : metrics.blendedMargin - metrics.target;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="The line"
        title="Margin monitor"
        lede="The floor is your target profit margin. Plates below it are losing ground, even when the blended menu still looks fine."
      />
      <section className="card p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-[1fr_1fr_1fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-ink-soft">Actual blended margin</p>
            <p className="num mt-2 text-5xl">{metrics.blendedMargin == null ? "—" : formatPct(metrics.blendedMargin)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-ink-soft">Target floor</p>
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
          <p className="mt-2 text-xs text-ink-soft">The mark on the bar is the floor. The fill is the blended menu, weighted by weekly covers.</p>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Count label="Holding" value={metrics.healthy.length} tone="text-sage" />
        <Count label="Warning" value={metrics.warning.length} tone="text-brass" />
        <Count label="Critical" value={metrics.critical.length} tone="text-chili" />
      </section>

      <div className="card scroll-thin overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.12em] text-ink-soft">
            <tr>
              <th className="px-4 py-3 font-semibold">Plate</th>
              <th className="px-4 py-3 font-semibold">Cost</th>
              <th className="px-4 py-3 font-semibold">Price</th>
              <th className="px-4 py-3 font-semibold">Margin</th>
              <th className="px-4 py-3 font-semibold">Vs floor</th>
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
        <List title="Slipping" empty="No plates lost margin this week." dishes={metrics.declining} />
        <List title="Improving" empty="No plates gained margin this week." dishes={metrics.improving} />
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
