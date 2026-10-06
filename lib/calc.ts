import type { Ingredient, Recipe, Unit } from "./types";
import { convertQuantity, round } from "./format";

export interface LineCost {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: Unit;
  cost: number;
  share: number;
  mismatch: boolean;
}

export interface RecipeCost {
  batchCost: number;
  plateCost: number;
  lines: LineCost[];
  incomplete: boolean;
}

export function costRecipe(
  recipe: Recipe,
  ingredients: Map<string, Ingredient>,
  priceOf: (ingredient: Ingredient) => number = (ingredient) => ingredient.unitPrice,
): RecipeCost {
  const yieldCount = Math.max(1, recipe.yieldCount || 1);
  const lines: LineCost[] = recipe.lines.map((line) => {
    const ingredient = ingredients.get(line.ingredientId);
    if (!ingredient) {
      return {
        ingredientId: line.ingredientId,
        name: "Missing ingredient",
        quantity: line.quantity,
        unit: line.unit,
        cost: 0,
        share: 0,
        mismatch: true,
      };
    }
    const qty = convertQuantity(line.quantity, line.unit, ingredient.unit);
    if (qty == null) {
      return {
        ingredientId: ingredient.id,
        name: ingredient.name,
        quantity: line.quantity,
        unit: line.unit,
        cost: 0,
        share: 0,
        mismatch: true,
      };
    }
    return {
      ingredientId: ingredient.id,
      name: ingredient.name,
      quantity: line.quantity,
      unit: line.unit,
      cost: qty * priceOf(ingredient),
      share: 0,
      mismatch: false,
    };
  });

  const batchCost = lines.reduce((sum, line) => sum + (line.mismatch ? 0 : line.cost), 0);
  const priced = lines.map((line) => ({
    ...line,
    share: batchCost > 0 && !line.mismatch ? (line.cost / batchCost) * 100 : 0,
  }));

  return {
    batchCost,
    plateCost: batchCost / yieldCount,
    lines: priced,
    incomplete: priced.some((line) => line.mismatch),
  };
}

export function profitOf(sellingPrice: number, plateCost: number) {
  return sellingPrice - plateCost;
}

export function marginOf(sellingPrice: number, plateCost: number) {
  if (sellingPrice <= 0) return null;
  return (profitOf(sellingPrice, plateCost) / sellingPrice) * 100;
}

export function foodCostOf(sellingPrice: number, plateCost: number) {
  if (sellingPrice <= 0) return null;
  return (plateCost / sellingPrice) * 100;
}

export function marginStatus(margin: number | null, target: number): "critical" | "warning" | "healthy" | "unset" {
  if (margin == null) return "unset";
  if (margin >= target) return "healthy";
  if (margin >= target - 6) return "warning";
  return "critical";
}

export function priceOn(ingredient: Ingredient, date: string) {
  const sorted = [...ingredient.history].sort((a, b) => a.date.localeCompare(b.date));
  let price = sorted[0]?.unitPrice ?? ingredient.unitPrice;
  for (const point of sorted) {
    if (point.date <= date) price = point.unitPrice;
    else break;
  }
  return price;
}

export function roundMoney(n: number) {
  return round(n, 2);
}
