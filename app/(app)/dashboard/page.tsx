"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChangePill, SeverityPill } from "@/components/ui";
import { formatMoney, formatPct, formatSignedPct, greeting } from "@/lib/format";
import { useApp } from "@/lib/store";

export default function DashboardPage() {
  const { user, kitchen, metrics } = useApp();
  const [drawn, setDrawn] = useState(false);
  useEffect(() => setDrawn(true), []);
  if (!kitchen || !metrics || !user) return null;

  const currency = kitchen.profile.currency;
  const margin = metrics.blendedMargin;
  const weekAgo = metrics.trend.length > 3 ? metrics.trend[metrics.trend.length - 4] : metrics.trend[0];
  const latest = metrics.trend[metrics.trend.length - 1];
  const marginDelta = weekAgo && latest ? latest.margin - weekAgo.margin : null;
  const priceMoves = metrics.volatile;
  const risingCosts = metrics.rises.filter((move) => (move.changePct ?? 0) >= kitchen.profile.alertPricePct).length;
  const gap = margin == null ? null : margin - metrics.target;
  const today = new Date().toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm text-ink-soft">{today}</p>
        <h2 className="mt-1 text-[1.75rem] font-semibold tracking-tight text-ink md:text-[2rem]">{greeting(user.name)}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft md:text-base">
          {margin == null
            ? "Add dishes and selling prices to see how profitable the kitchen is today."
            : margin >= metrics.target
              ? `The menu is above the ${metrics.target.toFixed(0)}% target. ${metrics.atRisk.length === 0 ? "Every dish is holding." : `${metrics.atRisk.length} ${metrics.atRisk.length === 1 ? "dish still needs" : "dishes still need"} a look.`}`
              : `The menu is ${Math.abs(gap ?? 0).toFixed(1)} points under the ${metrics.target.toFixed(0)}% target. Start with the dishes below.`}
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Menu margin"
          value={margin == null ? "—" : formatPct(margin)}
          trend={marginDelta}
          detail={`Target ${formatPct(metrics.target, 0)}`}
          tone={margin == null ? "neutral" : margin >= metrics.target ? "good" : "bad"}
        />
        <Kpi
          label="Food cost"
          value={metrics.blendedFoodCost == null ? "—" : formatPct(metrics.blendedFoodCost)}
          trend={marginDelta == null ? null : -marginDelta}
          detail="Share of the selling price"
          tone="neutral"
          invertTrend
        />
        <Kpi
          label="Recipes below target"
          value={String(metrics.atRisk.length)}
          detail={`${metrics.onMenu.length} dishes on the menu`}
          tone={metrics.atRisk.length > 0 ? "bad" : "good"}
        />
        <Kpi
          label="Ingredient cost changes"
          value={String(priceMoves.length)}
          detail={risingCosts ? `${risingCosts} up enough to review` : "No sharp increases this week"}
          tone={risingCosts > 0 ? "warn" : "good"}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-5">
        <div className="card p-5 md:p-6 lg:col-span-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold">Profitability overview</h3>
              <p className="mt-1 text-sm text-ink-soft">Actual menu margin compared with your target.</p>
            </div>
            <Link href="/margins" className="text-sm font-semibold text-brand-soft">
              Margin monitor
            </Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-ink-soft">Actual</p>
              <p className="num mt-1 text-3xl">{margin == null ? "—" : formatPct(margin)}</p>
            </div>
            <div>
              <p className="text-xs text-ink-soft">Target</p>
              <p className="num mt-1 text-3xl">{formatPct(metrics.target, 0)}</p>
            </div>
            <div>
              <p className="text-xs text-ink-soft">Gap</p>
              <p className={`num mt-1 text-3xl ${gap != null && gap < 0 ? "text-chili" : "text-sage"}`}>
                {gap == null ? "—" : `${gap > 0 ? "+" : ""}${gap.toFixed(1)} pts`}
              </p>
            </div>
          </div>
          <div className="relative mt-6 h-3 overflow-hidden rounded-full bg-mist">
            <div
              className={`h-full rounded-full ${margin != null && margin >= metrics.target ? "bg-sage" : "bg-brass"}`}
              style={{ width: `${Math.max(0, Math.min(100, margin ?? 0))}%` }}
            />
            <div className="absolute top-0 h-full w-0.5 bg-brand-soft" style={{ left: `${Math.max(0, Math.min(100, metrics.target))}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted">The mark is your target. The fill is the blended menu, weighted by weekly covers.</p>
          <div className="mt-4 h-44">
            {drawn && metrics.trend.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.trend}>
                  <XAxis dataKey="date" tick={{ fill: "#AEB8AF", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#AEB8AF", fontSize: 12 }} axisLine={false} tickLine={false} width={36} domain={["auto", "auto"]} />
                  <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} contentStyle={{ borderRadius: 12, borderColor: "rgba(221,232,223,0.15)", background: "#0D1812", color: "#F6F3E9" }} />
                  <Area type="monotone" dataKey="margin" name="Margin" stroke="#718C78" fill="#718C78" fillOpacity={0.22} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-ink-soft">A trend appears once the menu has prices.</p>
            )}
          </div>
        </div>
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Ingredient price changes</h3>
            <Link href="/ingredients" className="text-sm font-semibold text-brand-soft">
              Ingredients
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {metrics.volatile.slice(0, 6).map((move) => (
              <li key={move.ingredient.id} className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{move.ingredient.name}</p>
                  <p className="text-xs text-muted">{move.recipeNames.length ? `Used in ${move.recipeNames.length}` : "Not in a recipe yet"}</p>
                </div>
                <ChangePill value={move.changePct} invert />
              </li>
            ))}
            {metrics.volatile.length === 0 ? <li className="text-sm text-ink-soft">No notable price moves this week.</li> : null}
          </ul>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="flex items-end justify-between gap-3 px-5 py-4">
          <div>
            <h3 className="text-xl font-semibold">Recipes at risk</h3>
            <p className="mt-1 text-sm text-ink-soft">Dishes under the margin target.</p>
          </div>
          <Link href="/menu" className="text-sm font-semibold text-brand-soft">
            Review menu
          </Link>
        </div>
        <div className="scroll-thin overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs font-semibold text-ink-soft">
              <tr>
                <th className="px-5 py-3">Recipe</th>
                <th className="px-3 py-3">Cost</th>
                <th className="px-3 py-3">Price</th>
                <th className="px-3 py-3">Profit</th>
                <th className="px-3 py-3">Margin</th>
                <th className="px-3 py-3">Change</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {(metrics.atRisk.length ? metrics.atRisk : metrics.onMenu.slice(0, 4)).map((dish) => (
                <tr key={dish.menuId} className={dish.status === "critical" ? "bg-chili-soft/70" : dish.status === "warning" ? "bg-brass-soft/60" : ""}>
                  <td className="px-5 py-3 font-medium">{dish.name}</td>
                  <td className="num px-3 py-3">{formatMoney(dish.plateCost, currency)}</td>
                  <td className="num px-3 py-3">{formatMoney(dish.sellingPrice, currency)}</td>
                  <td className="num px-3 py-3">{formatMoney(dish.profit, currency)}</td>
                  <td className="num px-3 py-3">{dish.margin == null ? "—" : formatPct(dish.margin)}</td>
                  <td className="px-3 py-3"><ChangePill value={dish.marginDelta} /></td>
                  <td className="px-5 py-3"><SeverityPill status={dish.status === "unset" ? "unset" : dish.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {metrics.onMenu.length === 0 ? <p className="px-5 py-8 text-sm text-ink-soft">No dishes are on the menu yet.</p> : null}
        </div>
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  detail,
  trend,
  tone,
  invertTrend,
}: {
  label: string;
  value: string;
  detail: string;
  trend?: number | null;
  tone: "good" | "bad" | "warn" | "neutral";
  invertTrend?: boolean;
}) {
  const ring = tone === "bad" ? "bg-chili" : tone === "warn" ? "bg-brass" : tone === "good" ? "bg-sage" : "bg-muted";
  return (
    <article className="card card-hover p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-soft">{label}</p>
        <span className={`h-2.5 w-2.5 rounded-full ${ring}`} aria-hidden="true" />
      </div>
      <p className="num mt-3 text-3xl text-ink">{value}</p>
      {trend != null ? (
        <p className={`mt-2 text-sm font-medium ${(invertTrend ? -trend : trend) >= 0 ? "text-sage" : "text-chili"}`}>
          {formatSignedPct(trend)} this period
        </p>
      ) : (
        <p className="mt-2 text-sm text-muted">This week</p>
      )}
      <p className="mt-1 text-xs text-muted">{detail}</p>
    </article>
  );
}
