"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/ui";
import { formatMoney, formatPct } from "@/lib/format";
import { useApp } from "@/lib/store";

const tip = { borderRadius: 12, borderColor: "#E4D8C6", background: "#FFFCF7" };

export default function AnalyticsPage() {
  const { kitchen, metrics } = useApp();
  const [drawn, setDrawn] = useState(false);
  const [ingredientId, setIngredientId] = useState("");
  useEffect(() => setDrawn(true), []);

  useEffect(() => {
    if (!metrics || ingredientId) return;
    setIngredientId(metrics.volatile[0]?.ingredient.id ?? metrics.moves[0]?.ingredient.id ?? "");
  }, [metrics, ingredientId]);

  if (!kitchen || !metrics) return null;
  const currency = kitchen.profile.currency;
  const ingredient = kitchen.ingredients.find((item) => item.id === ingredientId);
  const dishBars = metrics.onMenu.map((dish) => ({
    name: dish.name.length > 18 ? `${dish.name.slice(0, 16)}…` : dish.name,
    margin: Number((dish.margin ?? 0).toFixed(1)),
  }));
  const spend = metrics.topIngredients.map((item) => ({
    name: item.name.length > 16 ? `${item.name.slice(0, 14)}…` : item.name,
    cost: Number(item.weeklyCost.toFixed(2)),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="The read"
        title="Analytics"
        lede="A short set of charts for price, plate cost, and which dishes are giving up margin."
      />
      <section className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Menu margin and food cost" lede="Blended across weekly covers.">
          {drawn ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.trend}>
                <CartesianGrid stroke="#EFE6D8" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#6B5E52", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6B5E52", fontSize: 12 }} axisLine={false} tickLine={false} width={32} />
                <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} contentStyle={tip} />
                <Line type="monotone" dataKey="margin" name="Margin" stroke="#246246" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="foodCost" name="Food cost" stroke="#9A4520" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : null}
        </ChartCard>
        <ChartCard title="Profitability by dish" lede="Margin percent, lowest to the eye from the left.">
          {drawn ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dishBars}>
                <CartesianGrid stroke="#EFE6D8" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#6B5E52", fontSize: 10 }} interval={0} angle={-28} height={70} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6B5E52", fontSize: 12 }} axisLine={false} tickLine={false} width={32} />
                <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} contentStyle={tip} />
                <Bar dataKey="margin" name="Margin" fill="#C4622D" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </ChartCard>
        <ChartCard title="Ingredient price" lede="Pick a pantry item. The last three weeks are on the line.">
          <select className="field mb-3" aria-label="Ingredient" value={ingredientId} onChange={(event) => setIngredientId(event.target.value)}>
            {kitchen.ingredients.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
          {drawn && ingredient ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ingredient.history.map((point) => ({ date: point.date.slice(5), price: point.unitPrice }))}>
                  <CartesianGrid stroke="#EFE6D8" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: "#6B5E52", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6B5E52", fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
                  <Tooltip formatter={(value) => formatMoney(Number(value), currency)} contentStyle={tip} />
                  <Line type="monotone" dataKey="price" name="Unit price" stroke="#2C241C" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : null}
        </ChartCard>
        <ChartCard title="Highest-cost ingredients" lede="Estimated weekly spend from covers on the menu.">
          {drawn ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spend} layout="vertical" margin={{ left: 24 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={110} tick={{ fill: "#6B5E52", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => formatMoney(Number(value), currency)} contentStyle={tip} />
                <Bar dataKey="cost" name="Weekly cost" fill="#246246" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </ChartCard>
      </section>
      <section className="card p-5">
        <h2 className="font-display text-2xl">Recipes with declining margins</h2>
        <ul className="mt-3 divide-y divide-line">
          {metrics.declining.map((dish) => (
            <li key={dish.menuId} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <span className="font-medium">{dish.name}</span>
              <span className="text-ink-soft">
                {dish.margin == null ? "—" : formatPct(dish.margin)} now · {dish.marginDelta == null ? "" : `${dish.marginDelta.toFixed(1)} pts this week`}
              </span>
            </li>
          ))}
          {metrics.declining.length === 0 ? <li className="py-3 text-sm text-ink-soft">No declining plates this week.</li> : null}
        </ul>
      </section>
    </div>
  );
}

function ChartCard({ title, lede, children }: { title: string; lede: string; children: React.ReactNode }) {
  return (
    <section className="card p-5" role="img" aria-label={title}>
      <h2 className="font-display text-2xl">{title}</h2>
      <p className="mb-3 text-sm text-ink-soft">{lede}</p>
      <div className="h-64">{children}</div>
    </section>
  );
}
