"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui";
import { costRecipe, foodCostOf, marginOf, profitOf } from "@/lib/calc";
import { formatMoney, formatPct, uid } from "@/lib/format";
import { UNITS } from "@/lib/format";
import { useApp } from "@/lib/store";
import type { Unit } from "@/lib/types";

type Line = { key: string; ingredientId: string; quantity: number; unit: Unit; override: string };

export default function CalculatorPage() {
  const { kitchen, updateMenuItem, toast } = useApp();
  const [recipeId, setRecipeId] = useState(kitchen?.recipes[0]?.id ?? "");
  const [lines, setLines] = useState<Line[]>([]);
  const [price, setPrice] = useState("");

  const recipe = kitchen?.recipes.find((item) => item.id === recipeId) ?? null;
  const menu = kitchen?.menu.find((item) => item.recipeId === recipeId) ?? null;

  useEffect(() => {
    if (!recipe) return;
    setLines(recipe.lines.map((line) => ({ key: uid("calc"), ingredientId: line.ingredientId, quantity: line.quantity, unit: line.unit, override: "" })));
    setPrice(menu ? String(menu.sellingPrice) : "");
    // Reseed only when the chosen card changes, not when the menu price is saved.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipeId]);

  const pricedIngredients = useMemo(() => {
    if (!kitchen) return new Map();
    return new Map(
      kitchen.ingredients.map((item) => {
        const line = lines.find((entry) => entry.ingredientId === item.id && entry.override !== "");
        const override = line ? Number(line.override) : NaN;
        return [item.id, Number.isFinite(override) && override > 0 ? { ...item, unitPrice: override } : item];
      }),
    );
  }, [kitchen, lines]);

  if (!kitchen) return null;
  const currency = kitchen.profile.currency;
  const draft = recipe
    ? { ...recipe, lines: lines.map(({ ingredientId, quantity, unit }) => ({ ingredientId, quantity, unit })) }
    : null;
  const costing = draft ? costRecipe(draft, pricedIngredients) : null;
  const selling = Number(price);
  const plate = costing?.plateCost ?? 0;
  const profit = Number.isFinite(selling) ? profitOf(selling, plate) : null;
  const margin = Number.isFinite(selling) ? marginOf(selling, plate) : null;
  const food = Number.isFinite(selling) ? foodCostOf(selling, plate) : null;

  return (
    <div>
      <PageHeader
        eyebrow="The scale"
        title="Profit calculator"
        lede="Move a quantity, a price, or the selling price. The plate answers immediately. Nothing is saved until you apply it to the menu."
      />
      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="card space-y-4 p-5">
          <label className="block">
            <span className="label">Recipe</span>
            <select
              className="field"
              value={recipeId}
              onChange={(event) => setRecipeId(event.target.value)}
            >
              {kitchen.recipes.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
          {kitchen.recipes.length === 0 ? <p className="text-sm text-ink-soft">Create a recipe card first.</p> : null}
          <div className="space-y-2">
            {lines.map((line) => {
              const ingredient = kitchen.ingredients.find((item) => item.id === line.ingredientId);
              return (
                <div key={line.key} className="grid gap-2 rounded-xl border border-line bg-white p-3 md:grid-cols-4">
                  <p className="text-sm font-medium md:col-span-4">{ingredient?.name}</p>
                  <label className="text-xs text-ink-soft">
                    Quantity
                    <input className="field mt-1 num" inputMode="decimal" value={line.quantity} onChange={(event) => update(line.key, { quantity: Number(event.target.value) })} />
                  </label>
                  <label className="text-xs text-ink-soft">
                    Unit
                    <select className="field mt-1" value={line.unit} onChange={(event) => update(line.key, { unit: event.target.value as Unit })}>
                      {UNITS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                    </select>
                  </label>
                  <label className="text-xs text-ink-soft md:col-span-2">
                    Price override / {ingredient?.unit} (blank uses pantry)
                    <input className="field mt-1 num" inputMode="decimal" placeholder={ingredient ? String(ingredient.unitPrice) : ""} value={line.override} onChange={(event) => update(line.key, { override: event.target.value })} />
                  </label>
                </div>
              );
            })}
          </div>
          <label className="block">
            <span className="label">Selling price</span>
            <input className="field num text-lg" inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} />
          </label>
          {menu ? (
            <button
              className="btn-primary"
              onClick={() => {
                const next = Number(price);
                if (next > 0) {
                  updateMenuItem(menu.id, { sellingPrice: next });
                  toast("Selling price applied to the menu.");
                }
              }}
            >
              Apply selling price to the menu
            </button>
          ) : null}
        </div>
        <aside className="card p-6" aria-live="polite">
          <p className="eyebrow">This plate</p>
          <dl className="mt-4 space-y-4">
            <Row label="Ingredient cost" value={formatMoney(costing?.batchCost ?? 0, currency)} />
            <Row label="Cost per plate" value={formatMoney(plate, currency)} />
            <Row label="Selling price" value={Number.isFinite(selling) ? formatMoney(selling, currency) : "—"} />
            <Row label="Gross profit" value={profit == null ? "—" : formatMoney(profit, currency)} />
            <Row label="Profit margin" value={margin == null ? "—" : formatPct(margin)} />
            <Row label="Food cost" value={food == null ? "—" : formatPct(food)} />
          </dl>
          <p className="mt-6 text-sm leading-relaxed text-ink-soft">
            Food cost is the share of the selling price eaten by the plate. Margin is what remains. Target floor is {formatPct(kitchen.profile.targetMargin, 0)}.
          </p>
          {costing?.incomplete ? <p className="mt-3 text-sm text-chili">A unit cannot convert, so that line is left out of the cost.</p> : null}
          <ul className="mt-4 space-y-2 text-sm">
            {costing?.lines.map((line) => (
              <li key={`${line.ingredientId}-${line.quantity}`} className="flex justify-between gap-3">
                <span>{line.name} · {line.share.toFixed(0)}%</span>
                <span className="num">{line.mismatch ? "—" : formatMoney(line.cost, currency)}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );

  function update(key: string, patch: Partial<Line>) {
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
      <dt className="text-sm text-ink-soft">{label}</dt>
      <dd className="num text-xl">{value}</dd>
    </div>
  );
}
