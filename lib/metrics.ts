import { costRecipe, foodCostOf, marginOf, marginStatus, priceOn, profitOf } from "./calc";
import { daysAgoISO, todayISO } from "./format";
import type { Ingredient, KitchenData, Recipe, Severity } from "./types";

export interface DishView {
  menuId: string;
  recipeId: string;
  name: string;
  station: Recipe["station"];
  onMenu: boolean;
  weeklyCovers: number;
  plateCost: number;
  plateCostWeekAgo: number | null;
  costChangePct: number | null;
  sellingPrice: number;
  profit: number;
  margin: number | null;
  marginWeekAgo: number | null;
  marginDelta: number | null;
  foodCost: number | null;
  target: number;
  status: ReturnType<typeof marginStatus>;
  incomplete: boolean;
}

export interface MoveView {
  ingredient: Ingredient;
  previous: number | null;
  changePct: number | null;
  volatile: boolean;
  recipeNames: string[];
}

export interface AlertView {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  href: string;
  tag: string;
}

export interface TrendPoint {
  date: string;
  margin: number;
  foodCost: number;
}

export interface Metrics {
  dishes: DishView[];
  onMenu: DishView[];
  blendedMargin: number | null;
  blendedFoodCost: number | null;
  target: number;
  atRisk: DishView[];
  healthy: DishView[];
  warning: DishView[];
  critical: DishView[];
  improving: DishView[];
  declining: DishView[];
  moves: MoveView[];
  rises: MoveView[];
  drops: MoveView[];
  volatile: MoveView[];
  alerts: AlertView[];
  trend: TrendPoint[];
  topIngredients: { id: string; name: string; weeklyCost: number; unit: Ingredient["unit"] }[];
}

function ingredientMap(ingredients: Ingredient[]) {
  return new Map(ingredients.map((item) => [item.id, item]));
}

function dishFor(
  kitchen: KitchenData,
  recipe: Recipe,
  menu: KitchenData["menu"][number] | undefined,
  map: Map<string, Ingredient>,
  weekAgo: string,
): DishView | null {
  if (!menu) return null;
  const current = costRecipe(recipe, map);
  const past = costRecipe(recipe, map, (ingredient) => priceOn(ingredient, weekAgo));
  const target = menu.targetMargin ?? kitchen.profile.targetMargin;
  const margin = marginOf(menu.sellingPrice, current.plateCost);
  const pastMargin = marginOf(menu.sellingPrice, past.plateCost);
  const delta = margin != null && pastMargin != null ? margin - pastMargin : null;
  return {
    menuId: menu.id,
    recipeId: recipe.id,
    name: recipe.name,
    station: recipe.station,
    onMenu: menu.onMenu,
    weeklyCovers: menu.weeklyCovers,
    plateCost: current.plateCost,
    plateCostWeekAgo: past.plateCost,
    costChangePct: past.plateCost > 0 ? ((current.plateCost - past.plateCost) / past.plateCost) * 100 : null,
    sellingPrice: menu.sellingPrice,
    profit: profitOf(menu.sellingPrice, current.plateCost),
    margin,
    marginWeekAgo: pastMargin,
    marginDelta: delta,
    foodCost: foodCostOf(menu.sellingPrice, current.plateCost),
    target,
    status: marginStatus(margin, target),
    incomplete: current.incomplete,
  };
}

export function buildMetrics(kitchen: KitchenData): Metrics {
  const map = ingredientMap(kitchen.ingredients);
  const weekAgo = daysAgoISO(7);
  const menuByRecipe = new Map(kitchen.menu.map((item) => [item.recipeId, item]));
  const dishes = kitchen.recipes
    .map((recipe) => dishFor(kitchen, recipe, menuByRecipe.get(recipe.id), map, weekAgo))
    .filter((dish): dish is DishView => dish != null);

  const onMenu = dishes.filter((dish) => dish.onMenu && dish.sellingPrice > 0);
  let revenue = 0;
  let cost = 0;
  for (const dish of onMenu) {
    const covers = Math.max(0, dish.weeklyCovers || 0);
    revenue += dish.sellingPrice * covers;
    cost += dish.plateCost * covers;
  }
  const blendedMargin = revenue > 0 ? ((revenue - cost) / revenue) * 100 : null;
  const blendedFoodCost = revenue > 0 ? (cost / revenue) * 100 : null;
  const target = kitchen.profile.targetMargin;

  const atRisk = onMenu.filter((dish) => dish.status === "warning" || dish.status === "critical");
  const healthy = onMenu.filter((dish) => dish.status === "healthy");
  const warning = onMenu.filter((dish) => dish.status === "warning");
  const critical = onMenu.filter((dish) => dish.status === "critical");
  const improving = onMenu.filter((dish) => (dish.marginDelta ?? 0) >= 1.5);
  const declining = onMenu.filter((dish) => (dish.marginDelta ?? 0) <= -1.5);

  const recipeUsers = new Map<string, string[]>();
  for (const recipe of kitchen.recipes) {
    for (const line of recipe.lines) {
      const list = recipeUsers.get(line.ingredientId) ?? [];
      list.push(recipe.name);
      recipeUsers.set(line.ingredientId, list);
    }
  }

  const moves: MoveView[] = kitchen.ingredients.map((ingredient) => {
    const previous = priceOn(ingredient, weekAgo);
    const delta = changePct(ingredient.unitPrice, previous);
    const span = rangePct(ingredient);
    const volatile = (delta != null && Math.abs(delta) >= kitchen.profile.alertPricePct) || span >= 12;
    return {
      ingredient,
      previous,
      changePct: delta,
      volatile,
      recipeNames: recipeUsers.get(ingredient.id) ?? [],
    };
  });

  const rises = moves
    .filter((move) => (move.changePct ?? 0) > 0.4)
    .sort((a, b) => (b.changePct ?? 0) - (a.changePct ?? 0));
  const drops = moves
    .filter((move) => (move.changePct ?? 0) < -0.4)
    .sort((a, b) => (a.changePct ?? 0) - (b.changePct ?? 0));
  const volatile = moves.filter((move) => move.volatile).sort((a, b) => Math.abs(b.changePct ?? 0) - Math.abs(a.changePct ?? 0));

  const alerts = buildAlerts(kitchen, onMenu, moves).filter((alert) => !kitchen.dismissedAlerts.includes(alert.id));

  const trend = buildTrend(kitchen, map);
  const topIngredients = weeklyIngredientSpend(kitchen, map);

  return {
    dishes,
    onMenu,
    blendedMargin,
    blendedFoodCost,
    target,
    atRisk,
    healthy,
    warning,
    critical,
    improving,
    declining,
    moves,
    rises,
    drops,
    volatile,
    alerts,
    trend,
    topIngredients,
  };
}

function rangePct(ingredient: Ingredient) {
  if (ingredient.history.length < 3) return 0;
  const prices = ingredient.history.map((point) => point.unitPrice);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  if (mean <= 0) return 0;
  return ((max - min) / mean) * 100;
}

function buildAlerts(kitchen: KitchenData, dishes: DishView[], moves: MoveView[]): AlertView[] {
  const alerts: AlertView[] = [];
  const { alertPricePct, criticalPricePct } = kitchen.profile;

  for (const move of moves) {
    const delta = move.changePct;
    if (delta == null || delta < alertPricePct) continue;
    const severity: Severity = delta >= criticalPricePct ? "critical" : "warning";
    const names = move.recipeNames;
    const affectedDishes = dishes.filter((dish) => names.includes(dish.name));
    const under = affectedDishes.filter((dish) => dish.status === "critical" || dish.status === "warning");
    if (names.length >= 2) {
      alerts.push({
        id: `multi:${move.ingredient.id}`,
        severity,
        tag: "Shared ingredient",
        title: `${move.ingredient.name} is up ${delta.toFixed(0)}% and touches ${names.length} recipes`,
        detail: under.length
          ? `${under.map((dish) => dish.name).join(", ")} ${under.length === 1 ? "is" : "are"} already under the margin floor.`
          : `Check ${names.slice(0, 3).join(", ")} before the next delivery lands.`,
        href: `/ingredients?focus=${move.ingredient.id}`,
      });
    } else {
      const dish = affectedDishes[0];
      alerts.push({
        id: `price:${move.ingredient.id}`,
        severity: dish?.status === "critical" ? "critical" : severity,
        tag: "Pantry price",
        title: `${move.ingredient.name} jumped ${delta.toFixed(0)}% since last week`,
        detail: dish
          ? `${dish.name} now costs ${dish.foodCost?.toFixed(0) ?? "—"}% of its selling price.`
          : "No plate uses it yet. The next recipe card will pick up this price.",
        href: `/ingredients?focus=${move.ingredient.id}`,
      });
    }
  }

  for (const dish of dishes) {
    if (dish.status !== "warning" && dish.status !== "critical") continue;
    alerts.push({
      id: `margin:${dish.menuId}`,
      severity: dish.status,
      tag: dish.status === "critical" ? "Review the price" : "Under the floor",
      title:
        dish.status === "critical"
          ? `${dish.name} needs a selling-price review`
          : `${dish.name} slipped under the ${dish.target.toFixed(0)}% floor`,
      detail: `Margin is ${dish.margin?.toFixed(1) ?? "—"}% against a ${dish.target.toFixed(0)}% target. Plate cost is moving ${
        dish.costChangePct != null && dish.costChangePct > 0 ? "up" : "with the pantry"
      }.`,
      href: "/menu",
    });
  }

  const costJumps = dishes
    .filter((dish) => (dish.costChangePct ?? 0) >= 8)
    .sort((a, b) => (b.costChangePct ?? 0) - (a.costChangePct ?? 0))
    .slice(0, 4);
  for (const dish of costJumps) {
    if (alerts.some((alert) => alert.id === `margin:${dish.menuId}`)) continue;
    alerts.push({
      id: `cost:${dish.recipeId}`,
      severity: "warning",
      tag: "Recipe cost",
      title: `${dish.name} costs more to plate than last week`,
      detail: `Production cost is up ${dish.costChangePct?.toFixed(1)}%. The selling price has not caught up yet.`,
      href: `/recipes?focus=${dish.recipeId}`,
    });
  }

  if (kitchen.profile.onboarded && dishes.length > 0 && (blendedFrom(dishes) ?? 0) >= kitchen.profile.targetMargin) {
    alerts.push({
      id: "healthy:menu",
      severity: "healthy",
      tag: "Service health",
      title: "The menu as a whole is holding the floor",
      detail: "Blended margin is on the right side of the target. Keep an eye on the plates listed above.",
      href: "/margins",
    });
  }

  const eased = moves
    .filter((move) => (move.changePct ?? 0) <= -4 && move.recipeNames.length > 0)
    .slice(0, 2);
  for (const move of eased) {
    alerts.push({
      id: `ease:${move.ingredient.id}`,
      severity: "healthy",
      tag: "Price eased",
      title: `${move.ingredient.name} came down ${Math.abs(move.changePct ?? 0).toFixed(0)}%`,
      detail: `${move.recipeNames.slice(0, 2).join(" and ")} ${move.recipeNames.length === 1 ? "is" : "are"} cheaper to produce than last week.`,
      href: "/analytics",
    });
  }

  const rank: Record<Severity, number> = { critical: 0, warning: 1, healthy: 2 };
  return alerts.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

function blendedFrom(dishes: DishView[]) {
  let revenue = 0;
  let cost = 0;
  for (const dish of dishes) {
    revenue += dish.sellingPrice * dish.weeklyCovers;
    cost += dish.plateCost * dish.weeklyCovers;
  }
  if (revenue <= 0) return null;
  return ((revenue - cost) / revenue) * 100;
}

function buildTrend(kitchen: KitchenData, map: Map<string, Ingredient>): TrendPoint[] {
  const points: TrendPoint[] = [];
  const menus = kitchen.menu.filter((item) => item.onMenu && item.sellingPrice > 0);
  for (let day = 20; day >= 0; day -= 2) {
    const date = daysAgoISO(day);
    let revenue = 0;
    let cost = 0;
    for (const menu of menus) {
      const recipe = kitchen.recipes.find((item) => item.id === menu.recipeId);
      if (!recipe) continue;
      const priced = costRecipe(recipe, map, (ingredient) => (day === 0 ? ingredient.unitPrice : priceOn(ingredient, date)));
      const covers = Math.max(0, menu.weeklyCovers || 0);
      revenue += menu.sellingPrice * covers;
      cost += priced.plateCost * covers;
    }
    if (revenue <= 0) continue;
    points.push({
      date: date.slice(5),
      margin: ((revenue - cost) / revenue) * 100,
      foodCost: (cost / revenue) * 100,
    });
  }
  if (points.length) points[points.length - 1].date = todayISO().slice(5);
  return points;
}

function weeklyIngredientSpend(kitchen: KitchenData, map: Map<string, Ingredient>) {
  const spend = new Map<string, number>();
  for (const menu of kitchen.menu.filter((item) => item.onMenu)) {
    const recipe = kitchen.recipes.find((item) => item.id === menu.recipeId);
    if (!recipe) continue;
    const covers = Math.max(0, menu.weeklyCovers || 0);
    const perPlate = covers / Math.max(1, recipe.yieldCount || 1);
    const costing = costRecipe(recipe, map);
    for (const line of costing.lines) {
      if (line.mismatch) continue;
      spend.set(line.ingredientId, (spend.get(line.ingredientId) ?? 0) + line.cost * perPlate);
    }
  }
  return [...spend.entries()]
    .map(([id, weeklyCost]) => {
      const ingredient = map.get(id);
      return {
        id,
        name: ingredient?.name ?? "Ingredient",
        weeklyCost,
        unit: ingredient?.unit ?? "kg",
      };
    })
    .sort((a, b) => b.weeklyCost - a.weeklyCost)
    .slice(0, 6);
}

function changePct(current: number, previous: number | null) {
  if (previous == null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}
