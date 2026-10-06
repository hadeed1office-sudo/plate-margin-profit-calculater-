"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { ChangePill, Drawer, EmptyState, Field, PageHeader } from "@/components/ui";
import { Sparkline } from "@/components/visuals";
import { formatMoney, todayISO, uid } from "@/lib/format";
import { CATEGORIES, categoryLabel } from "@/lib/labels";
import { useApp } from "@/lib/store";
import type { Ingredient, IngredientCategory, Unit } from "@/lib/types";
import { UNITS } from "@/lib/format";

function IngredientsScreen() {
  const { kitchen, metrics, saveIngredient, deleteIngredient, postIngredientPrice, toast } = useApp();
  const params = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<IngredientCategory | "all">("all");
  const [sort, setSort] = useState<"move" | "name" | "price">("move");
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!kitchen) return;
    const focus = params.get("focus");
    if (focus) {
      const found = kitchen.ingredients.find((item) => item.id === focus);
      if (found) setEditing(found);
    }
    if (params.get("compose") === "1") setCreating(true);
  }, [params, kitchen]);

  const moves = useMemo(() => {
    const list = metrics?.moves ?? [];
    return list
      .filter((move) => (category === "all" ? true : move.ingredient.category === category))
      .filter((move) => move.ingredient.name.toLowerCase().includes(query.trim().toLowerCase()))
      .sort((a, b) => {
        if (sort === "name") return a.ingredient.name.localeCompare(b.ingredient.name);
        if (sort === "price") return b.ingredient.unitPrice - a.ingredient.unitPrice;
        return Math.abs(b.changePct ?? 0) - Math.abs(a.changePct ?? 0);
      });
  }, [metrics, category, query, sort]);

  if (!kitchen || !metrics) return null;
  const currency = kitchen.profile.currency;

  function close() {
    setEditing(null);
    setCreating(false);
    setError("");
    router.replace("/ingredients");
  }

  return (
    <div>
      <PageHeader
        eyebrow="Pantry"
        title="Ingredients"
        lede="Today's price is the one every recipe uses. Last week stays on the ticket so you can see the move."
        actions={
          <>
            <button className="btn-quiet" onClick={() => router.push("/receiving")}>
              Receive a delivery
            </button>
            <button className="btn-primary" onClick={() => setCreating(true)}>
              Add ingredient
            </button>
          </>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="card px-4 py-3">
          <p className="text-xs text-ink-soft">In the pantry</p>
          <p className="num text-2xl">{kitchen.ingredients.length}</p>
        </div>
        <div className="card px-4 py-3">
          <p className="text-xs text-ink-soft">Volatile this week</p>
          <p className="num text-2xl">{metrics.volatile.length}</p>
        </div>
        <div className="card px-4 py-3">
          <p className="text-xs text-ink-soft">Sharpest rise</p>
          <p className="truncate text-lg font-semibold">{metrics.rises[0]?.ingredient.name ?? "—"}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 md:flex-row">
        <input className="field md:max-w-xs" placeholder="Find an ingredient" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Filter ingredients" />
        <select className="field md:max-w-[180px]" value={category} onChange={(event) => setCategory(event.target.value as IngredientCategory | "all")} aria-label="Category">
          <option value="all">All stations of the pantry</option>
          {CATEGORIES.map((item) => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </select>
        <select className="field md:max-w-[180px]" value={sort} onChange={(event) => setSort(event.target.value as "move" | "name" | "price")} aria-label="Sort">
          <option value="move">Sort by movement</option>
          <option value="name">Sort by name</option>
          <option value="price">Sort by price</option>
        </select>
      </div>

      {kitchen.ingredients.length === 0 ? (
        <EmptyState
          title="The pantry is empty"
          body="Add an ingredient, receive a spreadsheet, or load the sample service from settings."
          action={<button className="btn-primary" onClick={() => setCreating(true)}>Add the first ingredient</button>}
        />
      ) : (
        <div className="card scroll-thin overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-ink-soft">
              <tr>
                <th className="px-4 py-3 font-semibold">Ingredient</th>
                <th className="px-4 py-3 font-semibold">Price / unit</th>
                <th className="px-4 py-3 font-semibold">Last week</th>
                <th className="px-4 py-3 font-semibold">Move</th>
                <th className="px-4 py-3 font-semibold">Trail</th>
                <th className="px-4 py-3 font-semibold">Used in</th>
              </tr>
            </thead>
            <tbody>
              {moves.map((move) => (
                <tr
                  key={move.ingredient.id}
                  className="cursor-pointer border-t border-line hover:bg-butter/40 focus-within:bg-butter/40"
                  onClick={() => setEditing(move.ingredient)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setEditing(move.ingredient);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Edit ${move.ingredient.name}`}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium">{move.ingredient.name}</p>
                    <p className="text-xs text-ink-soft">
                      {categoryLabel(move.ingredient.category)} · {move.ingredient.unit}
                      {move.volatile ? " · volatile" : ""}
                    </p>
                  </td>
                  <td className="num px-4 py-3">{formatMoney(move.ingredient.unitPrice, currency)}</td>
                  <td className="num px-4 py-3 text-ink-soft">{move.previous == null ? "—" : formatMoney(move.previous, currency)}</td>
                  <td className="px-4 py-3"><ChangePill value={move.changePct} invert /></td>
                  <td className="px-4 py-3">
                    <Sparkline values={move.ingredient.history.map((point) => point.unitPrice)} tone={ (move.changePct ?? 0) > 0 ? "#9E342C" : "#246246"} />
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{move.recipeNames.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {moves.length === 0 ? <p className="px-4 py-8 text-sm text-ink-soft">No ingredients match that filter.</p> : null}
        </div>
      )}

      <IngredientDrawer
        open={creating || !!editing}
        ingredient={editing}
        currency={currency}
        recipes={kitchen.recipes}
        ingredients={kitchen.ingredients}
        error={error}
        onClose={close}
        onSave={(draft, isNew) => {
          const message = saveIngredient(draft, isNew);
          if (message) setError(message);
          else {
            toast(isNew ? "Ingredient added." : "Ingredient saved.");
            close();
          }
        }}
        onDelete={(id) => {
          const message = deleteIngredient(id);
          if (message) setError(message);
          else {
            toast("Removed from the pantry.");
            close();
          }
        }}
        onPostPrice={(id, price) => {
          postIngredientPrice(id, price);
          toast("Today's price is live on every recipe.");
          close();
        }}
      />
    </div>
  );
}

function IngredientDrawer({
  open,
  ingredient,
  currency,
  recipes,
  ingredients,
  error,
  onClose,
  onSave,
  onDelete,
  onPostPrice,
}: {
  open: boolean;
  ingredient: Ingredient | null;
  currency: Ingredient extends never ? never : Parameters<typeof formatMoney>[1];
  recipes: { id: string; name: string; lines: { ingredientId: string }[] }[];
  ingredients: Ingredient[];
  error: string;
  onClose: () => void;
  onSave: (ingredient: Ingredient, isNew: boolean) => void;
  onDelete: (id: string) => void;
  onPostPrice: (id: string, price: number) => void;
}) {
  const isNew = !ingredient;
  const [name, setName] = useState("");
  const [category, setCategory] = useState<IngredientCategory>("produce");
  const [unit, setUnit] = useState<Unit>("kg");
  const [packQuantity, setPackQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [supplier, setSupplier] = useState("");
  const [todayPrice, setTodayPrice] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(ingredient?.name ?? "");
    setCategory(ingredient?.category ?? "produce");
    setUnit(ingredient?.unit ?? "kg");
    setPackQuantity(String(ingredient?.packQuantity ?? 1));
    setUnitPrice(ingredient ? String(ingredient.unitPrice) : "");
    setSupplier(ingredient?.supplier ?? "");
    setTodayPrice(ingredient ? String(ingredient.unitPrice) : "");
  }, [open, ingredient]);

  const used = ingredient ? recipes.filter((recipe) => recipe.lines.some((line) => line.ingredientId === ingredient.id)) : [];

  return (
    <Drawer open={open} title={isNew ? "New pantry label" : ingredient?.name ?? "Ingredient"} subtitle="Price per unit is what the recipe card multiplies." onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const price = Number(unitPrice);
          const qty = Number(packQuantity);
          if (!name.trim()) return;
          if (!Number.isFinite(price) || price <= 0) return;
          onSave(
            {
              id: ingredient?.id ?? uid("ing"),
              name: name.trim(),
              category,
              unit,
              packQuantity: Number.isFinite(qty) && qty > 0 ? qty : 1,
              packPrice: price * (Number.isFinite(qty) && qty > 0 ? qty : 1),
              unitPrice: price,
              supplier: supplier.trim(),
              history: ingredient?.history?.length ? ingredient.history : [{ date: todayISO(), unitPrice: price }],
              updatedAt: new Date().toISOString(),
            },
            isNew,
          );
        }}
      >
        <Field label="Name">
          <input className="field" value={name} onChange={(event) => setName(event.target.value)} required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <select className="field" value={category} onChange={(event) => setCategory(event.target.value as IngredientCategory)}>
              {CATEGORIES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </Field>
          <Field label="Unit">
            <select className="field" value={unit} onChange={(event) => setUnit(event.target.value as Unit)}>
              {UNITS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={`Unit price (${unit})`} hint={`Shown as ${currency}.`}>
            <input className="field num" inputMode="decimal" value={unitPrice} onChange={(event) => setUnitPrice(event.target.value)} required />
          </Field>
          <Field label="Pack quantity" hint="How many units you usually buy at once.">
            <input className="field num" inputMode="decimal" value={packQuantity} onChange={(event) => setPackQuantity(event.target.value)} />
          </Field>
        </div>
        <Field label="Supplier">
          <input className="field" value={supplier} onChange={(event) => setSupplier(event.target.value)} />
        </Field>
        <p className="text-sm text-ink-soft">
          Pack cost {formatMoney((Number(unitPrice) || 0) * (Number(packQuantity) || 0), currency)}
        </p>
        {error ? <p className="text-sm text-chili" role="alert">{error}</p> : null}
        <button className="btn-primary w-full" type="submit">{isNew ? "Add to pantry" : "Save label"}</button>
      </form>

      {!isNew && ingredient ? (
        <div className="mt-6 space-y-4 border-t border-line pt-5">
          <Field label="Post today's price" hint="Recipes and menu margins recalculate immediately.">
            <div className="flex gap-2">
              <input className="field num" inputMode="decimal" value={todayPrice} onChange={(event) => setTodayPrice(event.target.value)} />
              <button
                type="button"
                className="btn-quiet shrink-0"
                onClick={() => {
                  const price = Number(todayPrice);
                  if (price > 0) onPostPrice(ingredient.id, price);
                }}
              >
                Post
              </button>
            </div>
          </Field>
          <div>
            <p className="label">Previous prices</p>
            <div className="max-h-40 space-y-1 overflow-auto rounded-xl border border-line bg-white p-3 text-sm">
              {[...ingredient.history].slice(-8).reverse().map((point) => (
                <div key={point.date} className="flex justify-between">
                  <span className="text-ink-soft">{point.date}</span>
                  <span className="num">{formatMoney(point.unitPrice, currency)}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="label">On these cards</p>
            {used.length === 0 ? <p className="text-sm text-ink-soft">Not used in a recipe yet.</p> : (
              <ul className="space-y-1 text-sm">
                {used.map((recipe) => (
                  <li key={recipe.id}>{recipe.name}</li>
                ))}
              </ul>
            )}
          </div>
          <button type="button" className="btn-danger w-full" onClick={() => onDelete(ingredient.id)}>
            Remove from pantry
          </button>
        </div>
      ) : null}
    </Drawer>
  );
}

export default function IngredientsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-ink-soft">Opening the pantry…</p>}>
      <IngredientsScreen />
    </Suspense>
  );
}
