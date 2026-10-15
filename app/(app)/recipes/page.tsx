"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { Drawer, EmptyState, Field, PageHeader, SeverityPill } from "@/components/ui";
import { costRecipe, marginOf } from "@/lib/calc";
import { formatMoney, formatPct, uid } from "@/lib/format";
import { UNITS } from "@/lib/format";
import { stationLabel, STATIONS } from "@/lib/labels";
import { useApp } from "@/lib/store";
import type { Ingredient, Recipe, RecipeLine, Station, Unit } from "@/lib/types";

type LineDraft = RecipeLine & { key: string };

function RecipesScreen() {
  const { kitchen, metrics, saveRecipe, deleteRecipe, toast } = useApp();
  const params = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | "new" | null>(null);

  useEffect(() => {
    if (params.get("compose") === "1") setOpenId("new");
    const focus = params.get("focus");
    if (focus) setOpenId(focus);
  }, [params]);

  const cards = useMemo(() => {
    if (!kitchen || !metrics) return [];
    return kitchen.recipes
      .filter((recipe) => recipe.name.toLowerCase().includes(query.trim().toLowerCase()))
      .map((recipe) => ({
        recipe,
        dish: metrics.dishes.find((dish) => dish.recipeId === recipe.id) ?? null,
      }));
  }, [kitchen, metrics, query]);

  if (!kitchen || !metrics) return null;
  const currency = kitchen.profile.currency;
  const active = openId && openId !== "new" ? kitchen.recipes.find((recipe) => recipe.id === openId) ?? null : null;

  return (
    <div>
      <PageHeader
        eyebrow="Recipe box"
        title="Recipes"
        lede="Name the dish, list the ingredients, and watch the cost update from the latest prices."
        actions={<button className="btn-primary" onClick={() => setOpenId("new")}>New recipe card</button>}
      />
      <input className="field mb-4 max-w-sm" placeholder="Search recipe cards" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search recipes" />
      {kitchen.recipes.length === 0 ? (
        <EmptyState title="No recipe cards yet" body="A card is a list of ingredients and amounts. The cost per plate is calculated for you." action={<button className="btn-primary" onClick={() => setOpenId("new")}>Write the first card</button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map(({ recipe, dish }) => (
            <button key={recipe.id} onClick={() => setOpenId(recipe.id)} className="card card-hover bg-soft p-5 text-left">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-ink-soft">{stationLabel(recipe.station)}</p>
                  <h2 className="mt-1 font-display text-2xl leading-tight">{recipe.name}</h2>
                </div>
                {dish ? <SeverityPill status={dish.status} /> : null}
              </div>
              <p className="mt-4 text-xs text-ink-soft">
                {recipe.yieldType === "batch" ? `Batch of ${recipe.yieldCount}` : "Per plate"} · {recipe.lines.length} ingredients
              </p>
              <p className="num mt-2 text-3xl">{dish ? formatMoney(dish.plateCost, currency) : "—"}</p>
              <p className="text-xs text-ink-soft">cost per plate</p>
            </button>
          ))}
        </div>
      )}

      <RecipeDrawer
        open={openId != null}
        recipe={openId === "new" ? null : active}
        currency={currency}
        ingredients={kitchen.ingredients}
        menu={kitchen.menu.find((item) => item.recipeId === active?.id) ?? null}
        onClose={() => {
          setOpenId(null);
          router.replace("/recipes");
        }}
        onSave={(recipe, menu) => {
          saveRecipe(recipe, menu);
          toast("Recipe card saved. Costs are live.");
          setOpenId(null);
          router.replace("/recipes");
        }}
        onDelete={(id) => {
          deleteRecipe(id);
          toast("Recipe card removed.");
          setOpenId(null);
        }}
      />
    </div>
  );
}

function RecipeDrawer({
  open,
  recipe,
  currency,
  ingredients,
  menu,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  recipe: Recipe | null;
  currency: Parameters<typeof formatMoney>[1];
  ingredients: Ingredient[];
  menu: { sellingPrice: number; onMenu: boolean; weeklyCovers: number } | null;
  onClose: () => void;
  onSave: (recipe: Recipe, menu: { sellingPrice: number; onMenu: boolean; weeklyCovers: number }) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [station, setStation] = useState<Station>("saute");
  const [yieldType, setYieldType] = useState<"plate" | "batch">("plate");
  const [yieldCount, setYieldCount] = useState("1");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([]);
  const [price, setPrice] = useState("0");
  const [onMenu, setOnMenu] = useState(true);
  const [covers, setCovers] = useState("10");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(recipe?.name ?? "");
    setStation(recipe?.station ?? "saute");
    setYieldType(recipe?.yieldType ?? "plate");
    setYieldCount(String(recipe?.yieldCount ?? 1));
    setNotes(recipe?.notes ?? "");
    setLines(
      recipe?.lines.map((line) => ({ ...line, key: uid("line") })) ??
        (ingredients[0] ? [{ key: uid("line"), ingredientId: ingredients[0].id, quantity: 1, unit: ingredients[0].unit }] : []),
    );
    setPrice(menu ? String(menu.sellingPrice) : "");
    setOnMenu(menu?.onMenu ?? true);
    setCovers(String(menu?.weeklyCovers ?? 10));
    setError("");
    // Initialize only when the card opens. Pantry updates should not wipe a draft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, recipe, menu]);

  const draftRecipe: Recipe = {
    id: recipe?.id ?? "draft",
    name: name || "Draft",
    station,
    yieldType,
    yieldCount: Math.max(1, Number(yieldCount) || 1),
    notes,
    updatedAt: "",
    lines: lines.filter((line) => line.ingredientId),
  };
  const map = new Map(ingredients.map((item) => [item.id, item]));
  const costing = costRecipe(draftRecipe, map);
  const selling = Number(price);
  const margin = Number.isFinite(selling) ? marginOf(selling, costing.plateCost) : null;

  return (
    <Drawer open={open} wide title={recipe ? recipe.name : "New recipe"} subtitle="Quantities can use kg, g, litre, ml, or pieces." onClose={onClose}>
      <form
        className="grid gap-5 xl:grid-cols-[0.9fr_1.15fr_0.8fr]"
        onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim()) return setError("Name the dish.");
            if (!lines.length) return setError("Add at least one ingredient.");
            if (lines.some((line) => !line.quantity || line.quantity <= 0)) return setError("Every line needs a quantity above zero.");
            const sellingPrice = Number(price);
            if (onMenu && (!Number.isFinite(sellingPrice) || sellingPrice <= 0)) return setError("Set a selling price above zero.");
            onSave(
              {
                id: recipe?.id ?? uid("rec"),
                name: name.trim(),
                station,
                yieldType,
                yieldCount: Math.max(1, Number(yieldCount) || 1),
                notes: notes.trim(),
                updatedAt: new Date().toISOString(),
                lines: lines.map(({ ingredientId, quantity, unit }) => ({ ingredientId, quantity, unit })),
              },
              { sellingPrice: Number.isFinite(sellingPrice) ? sellingPrice : 0, onMenu, weeklyCovers: Math.max(0, Number(covers) || 0) },
            );
          }}
      >
        <div className="space-y-4 rounded-2xl bg-soft p-4">
          <Field label="Recipe name">
            <input className="field" value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label="Category">
            <select className="field" value={station} onChange={(event) => setStation(event.target.value as Station)}>
              {STATIONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </Field>
          <Field label="Serving">
            <select className="field" value={yieldType} onChange={(event) => setYieldType(event.target.value as "plate" | "batch")}>
              <option value="plate">One serving</option>
              <option value="batch">A batch</option>
            </select>
          </Field>
          {yieldType === "batch" ? (
            <Field label="Servings in the batch">
              <input className="field num" inputMode="decimal" value={yieldCount} onChange={(event) => setYieldCount(event.target.value)} />
            </Field>
          ) : null}
          <Field label="Selling price">
            <input className="field num" inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} />
          </Field>
          <Field label="Covers per week" hint="Used to blend the menu margin.">
            <input className="field num" inputMode="numeric" value={covers} onChange={(event) => setCovers(event.target.value)} />
          </Field>
          <Field label="Kitchen note">
            <textarea className="field min-h-20" value={notes} onChange={(event) => setNotes(event.target.value)} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={onMenu} onChange={(event) => setOnMenu(event.target.checked)} />
            Show this on the menu
          </label>
          {error ? <p className="text-sm text-chili" role="alert">{error}</p> : null}
          <button className="btn-primary w-full" type="submit">Save recipe</button>
          {recipe ? (
            <button type="button" className="btn-danger w-full" onClick={() => onDelete(recipe.id)}>
              Delete recipe
            </button>
          ) : null}
        </div>
        <div className="space-y-2">
            <p className="label">Ingredients</p>
            <div className="hidden grid-cols-[1.4fr_0.6fr_0.55fr_0.7fr_0.7fr_auto] gap-2 px-1 text-xs text-muted sm:grid">
              <span>Ingredient</span>
              <span>Quantity</span>
              <span>Unit</span>
              <span>Price</span>
              <span>Cost</span>
              <span />
            </div>
            {lines.map((line, index) => (
              <div key={line.key} className="grid grid-cols-1 gap-2 sm:grid-cols-[1.4fr_0.6fr_0.55fr_0.7fr_0.7fr_auto]">
                <select
                  className="field"
                  aria-label={`Ingredient ${index + 1}`}
                  value={line.ingredientId}
                  onChange={(event) => {
                    const ingredient = ingredients.find((item) => item.id === event.target.value);
                    setLines((current) => current.map((item) => item.key === line.key ? { ...item, ingredientId: event.target.value, unit: ingredient?.unit ?? item.unit } : item));
                  }}
                >
                  {ingredients.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
                <input
                  className="field num"
                  aria-label="Quantity"
                  inputMode="decimal"
                  value={line.quantity}
                  onChange={(event) => setLines((current) => current.map((item) => item.key === line.key ? { ...item, quantity: Number(event.target.value) } : item))}
                />
                <select className="field" aria-label="Unit" value={line.unit} onChange={(event) => setLines((current) => current.map((item) => item.key === line.key ? { ...item, unit: event.target.value as Unit } : item))}>
                  {UNITS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
                <span className="num self-center text-sm text-ink-soft">{(() => {
                  const ingredient = ingredients.find((item) => item.id === line.ingredientId);
                  return ingredient ? formatMoney(ingredient.unitPrice, currency) : "—";
                })()}</span>
                <span className="num self-center text-sm">{costing.lines[index]?.mismatch ? "—" : formatMoney(costing.lines[index]?.cost ?? 0, currency)}</span>
                <button type="button" className="btn-quiet !px-3" aria-label="Remove line" onClick={() => setLines((current) => current.filter((item) => item.key !== line.key))}>
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn-quiet"
              onClick={() => {
                const first = ingredients[0];
                if (!first) return;
                setLines((current) => [...current, { key: uid("line"), ingredientId: first.id, quantity: 1, unit: first.unit }]);
              }}
            >
              Add ingredient
            </button>
            {ingredients.length === 0 ? <p className="text-sm text-chili">Add ingredients before building a recipe.</p> : null}
        </div>
        <aside className="h-fit rounded-2xl border border-line bg-card p-4 xl:sticky xl:top-0">
          <p className="eyebrow">Live cost</p>
          <dl className="mt-3 space-y-2 text-sm">
            <SummaryRow label="Total recipe cost" value={formatMoney(yieldType === "batch" ? costing.batchCost : costing.plateCost, currency)} />
            <SummaryRow label="Cost per serving" value={formatMoney(costing.plateCost, currency)} />
            <SummaryRow label="Selling price" value={Number.isFinite(selling) ? formatMoney(selling, currency) : "—"} />
            <SummaryRow label="Gross profit" value={margin == null ? "—" : formatMoney(selling - costing.plateCost, currency)} />
            <SummaryRow label="Margin" value={margin == null ? "—" : formatPct(margin)} />
            <SummaryRow label="Food cost" value={Number.isFinite(selling) && selling > 0 ? formatPct((costing.plateCost / selling) * 100) : "—"} />
          </dl>
          {costing.incomplete ? <p className="mt-2 text-xs text-chili">One line uses a unit that cannot convert. That line is excluded.</p> : null}
          <ul className="mt-4 space-y-2 text-sm">
            {costing.lines.map((line) => (
              <li key={`${line.ingredientId}-${line.unit}-${line.quantity}`} className="flex justify-between gap-2">
                <span className={line.mismatch ? "text-chili" : ""}>{line.name}</span>
                <span className="num">{line.mismatch ? "Unit clash" : formatMoney(line.cost, currency)}</span>
              </li>
            ))}
          </ul>
        </aside>
      </form>
    </Drawer>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="num font-semibold text-ink">{value}</dd>
    </div>
  );
}

export default function RecipesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-ink-soft">Opening recipe cards…</p>}>
      <RecipesScreen />
    </Suspense>
  );
}
