import type { CurrencyCode, Ingredient, IngredientCategory, KitchenData, KitchenProfile, MenuItem, Recipe, Unit } from "./types";
import { convertAmount, isoDate, round } from "./format";

export const DEMO_EMAIL = "chef@platemargin.app";
export const DEMO_PASSWORD = "service123";
export const DEMO_KITCHEN_ID = "kit_copper";

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function history(oldPrice: number, newPrice: number, seed: number) {
  const rand = mulberry32(seed);
  const points = [];
  for (let i = 20; i >= 0; i--) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - i);
    const base = i <= 1 ? newPrice : oldPrice;
    const noise = i === 0 ? 0 : (rand() - 0.5) * oldPrice * 0.018;
    points.push({
      date: isoDate(date),
      unitPrice: round(Math.max(0.0001, base + noise), 4),
    });
  }
  points[points.length - 1].unitPrice = round(newPrice, 4);
  return points;
}

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 3600 * 1000).toISOString();
}

function ingredient(row: {
  id: string;
  name: string;
  category: IngredientCategory;
  unit: Unit;
  oldPrice: number;
  unitPrice: number;
  packQuantity: number;
  supplier: string;
  seed: number;
}): Ingredient {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    unit: row.unit,
    packQuantity: row.packQuantity,
    packPrice: round(row.unitPrice * row.packQuantity, 2),
    unitPrice: row.unitPrice,
    supplier: row.supplier,
    history: history(row.oldPrice, row.unitPrice, row.seed),
    updatedAt: hoursAgo(6),
  };
}

function plate(recipeId: string, price: number, covers: number): MenuItem {
  const today = isoDate(new Date());
  return {
    id: `menu_${recipeId}`,
    recipeId,
    sellingPrice: price,
    targetMargin: null,
    onMenu: true,
    weeklyCovers: covers,
    priceHistory: [
      { date: isoDate(new Date(Date.now() - 86400000 * 18)), unitPrice: round(price * 0.98, 2) },
      { date: today, unitPrice: price },
    ],
    updatedAt: hoursAgo(20),
  };
}

export function createDemoKitchen(): KitchenData {
  const ingredients: Ingredient[] = [
    ingredient({ id: "ing_ribeye", name: "Ribeye", category: "protein", unit: "kg", oldPrice: 26.2, unitPrice: 28.4, packQuantity: 5, supplier: "Harbour Meat Co.", seed: 11 }),
    ingredient({ id: "ing_salmon", name: "Salmon fillet", category: "protein", unit: "kg", oldPrice: 22.8, unitPrice: 21.6, packQuantity: 4, supplier: "North Quay Fish", seed: 12 }),
    ingredient({ id: "ing_chicken", name: "Chicken thigh", category: "protein", unit: "kg", oldPrice: 6.95, unitPrice: 7.2, packQuantity: 10, supplier: "Harbour Meat Co.", seed: 13 }),
    ingredient({ id: "ing_prawn", name: "Tiger prawns", category: "protein", unit: "kg", oldPrice: 16.8, unitPrice: 18.9, packQuantity: 2, supplier: "North Quay Fish", seed: 14 }),
    ingredient({ id: "ing_mince", name: "Beef mince", category: "protein", unit: "kg", oldPrice: 10.8, unitPrice: 11.4, packQuantity: 5, supplier: "Harbour Meat Co.", seed: 15 }),
    ingredient({ id: "ing_bacon", name: "Streaky bacon", category: "protein", unit: "kg", oldPrice: 10.3, unitPrice: 10.8, packQuantity: 2, supplier: "Harbour Meat Co.", seed: 16 }),
    ingredient({ id: "ing_anchovy", name: "Anchovy", category: "protein", unit: "kg", oldPrice: 13.9, unitPrice: 14.2, packQuantity: 0.5, supplier: "North Quay Fish", seed: 17 }),
    ingredient({ id: "ing_butter", name: "Cultured butter", category: "dairy", unit: "kg", oldPrice: 9.35, unitPrice: 9.6, packQuantity: 2, supplier: "Linden Dairy", seed: 21 }),
    ingredient({ id: "ing_cream", name: "Heavy cream", category: "dairy", unit: "litre", oldPrice: 4.05, unitPrice: 4.35, packQuantity: 5, supplier: "Linden Dairy", seed: 22 }),
    ingredient({ id: "ing_parmesan", name: "Parmesan", category: "dairy", unit: "kg", oldPrice: 16.7, unitPrice: 17.2, packQuantity: 1, supplier: "Caseificio Alba", seed: 23 }),
    ingredient({ id: "ing_milk", name: "Whole milk", category: "dairy", unit: "litre", oldPrice: 1.22, unitPrice: 1.28, packQuantity: 10, supplier: "Linden Dairy", seed: 24 }),
    ingredient({ id: "ing_egg", name: "Eggs", category: "dairy", unit: "pieces", oldPrice: 0.31, unitPrice: 0.34, packQuantity: 30, supplier: "Hill Farm", seed: 25 }),
    ingredient({ id: "ing_oil", name: "Olive oil", category: "oil", unit: "litre", oldPrice: 9.05, unitPrice: 8.7, packQuantity: 5, supplier: "Grove Press", seed: 31 }),
    ingredient({ id: "ing_truffle", name: "Truffle oil", category: "oil", unit: "ml", oldPrice: 0.17, unitPrice: 0.22, packQuantity: 250, supplier: "Grove Press", seed: 32 }),
    ingredient({ id: "ing_lemon", name: "Lemon", category: "produce", unit: "pieces", oldPrice: 0.4, unitPrice: 0.42, packQuantity: 40, supplier: "Morning Market", seed: 41 }),
    ingredient({ id: "ing_garlic", name: "Garlic", category: "produce", unit: "kg", oldPrice: 5.1, unitPrice: 4.6, packQuantity: 2, supplier: "Morning Market", seed: 42 }),
    ingredient({ id: "ing_onion", name: "Yellow onion", category: "produce", unit: "kg", oldPrice: 1.08, unitPrice: 1.15, packQuantity: 10, supplier: "Morning Market", seed: 43 }),
    ingredient({ id: "ing_potato", name: "Russet potato", category: "produce", unit: "kg", oldPrice: 1.58, unitPrice: 1.35, packQuantity: 15, supplier: "Morning Market", seed: 44 }),
    ingredient({ id: "ing_mushroom", name: "Mixed mushrooms", category: "produce", unit: "kg", oldPrice: 7.05, unitPrice: 9.4, packQuantity: 3, supplier: "Morning Market", seed: 45 }),
    ingredient({ id: "ing_tomato", name: "San Marzano tomatoes", category: "produce", unit: "kg", oldPrice: 3.25, unitPrice: 3.5, packQuantity: 6, supplier: "Caseificio Alba", seed: 46 }),
    ingredient({ id: "ing_romaine", name: "Romaine", category: "produce", unit: "kg", oldPrice: 2.5, unitPrice: 3.4, packQuantity: 4, supplier: "Morning Market", seed: 47 }),
    ingredient({ id: "ing_avocado", name: "Avocado", category: "produce", unit: "pieces", oldPrice: 1.02, unitPrice: 1.55, packQuantity: 20, supplier: "Morning Market", seed: 48 }),
    ingredient({ id: "ing_herb", name: "Soft herbs", category: "produce", unit: "g", oldPrice: 0.041, unitPrice: 0.045, packQuantity: 200, supplier: "Morning Market", seed: 49 }),
    ingredient({ id: "ing_flour", name: "Plain flour", category: "dry", unit: "kg", oldPrice: 1.02, unitPrice: 1.05, packQuantity: 10, supplier: "Millhouse", seed: 51 }),
    ingredient({ id: "ing_pasta", name: "Spaghetti", category: "dry", unit: "kg", oldPrice: 2.05, unitPrice: 2.15, packQuantity: 5, supplier: "Millhouse", seed: 52 }),
    ingredient({ id: "ing_sugar", name: "Caster sugar", category: "dry", unit: "kg", oldPrice: 1.4, unitPrice: 1.45, packQuantity: 5, supplier: "Millhouse", seed: 53 }),
    ingredient({ id: "ing_chocolate", name: "Dark chocolate", category: "dry", unit: "kg", oldPrice: 11.7, unitPrice: 12.4, packQuantity: 2, supplier: "Cacao Atelier", seed: 54 }),
    ingredient({ id: "ing_coffee", name: "Coffee beans", category: "dry", unit: "kg", oldPrice: 17.7, unitPrice: 18.5, packQuantity: 2, supplier: "Cacao Atelier", seed: 55 }),
    ingredient({ id: "ing_vanilla", name: "Vanilla extract", category: "dry", unit: "ml", oldPrice: 0.26, unitPrice: 0.28, packQuantity: 100, supplier: "Cacao Atelier", seed: 56 }),
    ingredient({ id: "ing_capers", name: "Capers", category: "dry", unit: "kg", oldPrice: 9.5, unitPrice: 9.8, packQuantity: 0.5, supplier: "Grove Press", seed: 57 }),
    ingredient({ id: "ing_bun", name: "Brioche bun", category: "bakery", unit: "pieces", oldPrice: 0.55, unitPrice: 0.58, packQuantity: 24, supplier: "Oven Room", seed: 61 }),
    ingredient({ id: "ing_sourdough", name: "Sourdough slice", category: "bakery", unit: "pieces", oldPrice: 0.4, unitPrice: 0.42, packQuantity: 20, supplier: "Oven Room", seed: 62 }),
  ];

  const recipes: Recipe[] = [
    {
      id: "rec_ribeye",
      name: "Ribeye with thyme butter",
      station: "grill",
      yieldType: "plate",
      yieldCount: 1,
      notes: "Rest four minutes. Spoon the butter on at the pass.",
      updatedAt: hoursAgo(30),
      lines: [
        { ingredientId: "ing_ribeye", quantity: 0.22, unit: "kg" },
        { ingredientId: "ing_butter", quantity: 25, unit: "g" },
        { ingredientId: "ing_potato", quantity: 180, unit: "g" },
        { ingredientId: "ing_herb", quantity: 6, unit: "g" },
        { ingredientId: "ing_oil", quantity: 12, unit: "ml" },
        { ingredientId: "ing_garlic", quantity: 8, unit: "g" },
      ],
    },
    {
      id: "rec_salmon",
      name: "Citrus salmon",
      station: "saute",
      yieldType: "plate",
      yieldCount: 1,
      notes: "Skin side first. Finish with lemon and herbs.",
      updatedAt: hoursAgo(48),
      lines: [
        { ingredientId: "ing_salmon", quantity: 0.18, unit: "kg" },
        { ingredientId: "ing_lemon", quantity: 0.5, unit: "pieces" },
        { ingredientId: "ing_butter", quantity: 20, unit: "g" },
        { ingredientId: "ing_herb", quantity: 5, unit: "g" },
        { ingredientId: "ing_oil", quantity: 10, unit: "ml" },
      ],
    },
    {
      id: "rec_piccata",
      name: "Chicken piccata",
      station: "saute",
      yieldType: "plate",
      yieldCount: 1,
      notes: "Dredge lightly. Sauce should stay bright, not thick.",
      updatedAt: hoursAgo(50),
      lines: [
        { ingredientId: "ing_chicken", quantity: 0.17, unit: "kg" },
        { ingredientId: "ing_flour", quantity: 20, unit: "g" },
        { ingredientId: "ing_butter", quantity: 20, unit: "g" },
        { ingredientId: "ing_lemon", quantity: 0.5, unit: "pieces" },
        { ingredientId: "ing_capers", quantity: 12, unit: "g" },
        { ingredientId: "ing_oil", quantity: 15, unit: "ml" },
      ],
    },
    {
      id: "rec_scampi",
      name: "Prawn scampi",
      station: "saute",
      yieldType: "plate",
      yieldCount: 1,
      notes: "Prawns off the heat as soon as they curl.",
      updatedAt: hoursAgo(12),
      lines: [
        { ingredientId: "ing_prawn", quantity: 0.2, unit: "kg" },
        { ingredientId: "ing_pasta", quantity: 120, unit: "g" },
        { ingredientId: "ing_garlic", quantity: 10, unit: "g" },
        { ingredientId: "ing_butter", quantity: 25, unit: "g" },
        { ingredientId: "ing_lemon", quantity: 0.5, unit: "pieces" },
        { ingredientId: "ing_oil", quantity: 12, unit: "ml" },
        { ingredientId: "ing_herb", quantity: 5, unit: "g" },
      ],
    },
    {
      id: "rec_truffle",
      name: "Truffle mushroom pasta",
      station: "saute",
      yieldType: "plate",
      yieldCount: 1,
      notes: "Truffle oil goes in off the heat. Do not boil it.",
      updatedAt: hoursAgo(8),
      lines: [
        { ingredientId: "ing_pasta", quantity: 120, unit: "g" },
        { ingredientId: "ing_mushroom", quantity: 100, unit: "g" },
        { ingredientId: "ing_cream", quantity: 70, unit: "ml" },
        { ingredientId: "ing_parmesan", quantity: 20, unit: "g" },
        { ingredientId: "ing_truffle", quantity: 15, unit: "ml" },
        { ingredientId: "ing_butter", quantity: 20, unit: "g" },
        { ingredientId: "ing_garlic", quantity: 5, unit: "g" },
      ],
    },
    {
      id: "rec_burger",
      name: "Hearth burger",
      station: "grill",
      yieldType: "plate",
      yieldCount: 1,
      notes: "Smash once. Onions under the patty.",
      updatedAt: hoursAgo(26),
      lines: [
        { ingredientId: "ing_mince", quantity: 0.16, unit: "kg" },
        { ingredientId: "ing_bun", quantity: 1, unit: "pieces" },
        { ingredientId: "ing_bacon", quantity: 30, unit: "g" },
        { ingredientId: "ing_onion", quantity: 20, unit: "g" },
        { ingredientId: "ing_butter", quantity: 10, unit: "g" },
        { ingredientId: "ing_potato", quantity: 150, unit: "g" },
      ],
    },
    {
      id: "rec_caesar",
      name: "Market caesar",
      station: "cold",
      yieldType: "plate",
      yieldCount: 1,
      notes: "Dress at the pass so the leaves stay crisp.",
      updatedAt: hoursAgo(18),
      lines: [
        { ingredientId: "ing_romaine", quantity: 120, unit: "g" },
        { ingredientId: "ing_parmesan", quantity: 20, unit: "g" },
        { ingredientId: "ing_anchovy", quantity: 15, unit: "g" },
        { ingredientId: "ing_egg", quantity: 0.5, unit: "pieces" },
        { ingredientId: "ing_oil", quantity: 20, unit: "ml" },
        { ingredientId: "ing_lemon", quantity: 0.25, unit: "pieces" },
        { ingredientId: "ing_sourdough", quantity: 1, unit: "pieces" },
      ],
    },
    {
      id: "rec_soup",
      name: "Roast tomato soup",
      station: "prep",
      yieldType: "batch",
      yieldCount: 8,
      notes: "Batch for the lunch board. Finish each bowl with cream.",
      updatedAt: hoursAgo(40),
      lines: [
        { ingredientId: "ing_tomato", quantity: 2.2, unit: "kg" },
        { ingredientId: "ing_onion", quantity: 0.32, unit: "kg" },
        { ingredientId: "ing_garlic", quantity: 0.06, unit: "kg" },
        { ingredientId: "ing_cream", quantity: 0.32, unit: "litre" },
        { ingredientId: "ing_oil", quantity: 0.12, unit: "litre" },
        { ingredientId: "ing_sourdough", quantity: 8, unit: "pieces" },
      ],
    },
    {
      id: "rec_fondant",
      name: "Dark chocolate fondant",
      station: "pastry",
      yieldType: "batch",
      yieldCount: 6,
      notes: "Bake from cold. Centre should still slump.",
      updatedAt: hoursAgo(60),
      lines: [
        { ingredientId: "ing_chocolate", quantity: 0.36, unit: "kg" },
        { ingredientId: "ing_butter", quantity: 0.24, unit: "kg" },
        { ingredientId: "ing_sugar", quantity: 0.18, unit: "kg" },
        { ingredientId: "ing_flour", quantity: 0.12, unit: "kg" },
        { ingredientId: "ing_egg", quantity: 6, unit: "pieces" },
        { ingredientId: "ing_vanilla", quantity: 18, unit: "ml" },
      ],
    },
    {
      id: "rec_benedict",
      name: "Eggs benedict",
      station: "saute",
      yieldType: "plate",
      yieldCount: 1,
      notes: "Hollandaise held warm, never hot.",
      updatedAt: hoursAgo(15),
      lines: [
        { ingredientId: "ing_egg", quantity: 2, unit: "pieces" },
        { ingredientId: "ing_bacon", quantity: 40, unit: "g" },
        { ingredientId: "ing_butter", quantity: 30, unit: "g" },
        { ingredientId: "ing_lemon", quantity: 0.25, unit: "pieces" },
        { ingredientId: "ing_sourdough", quantity: 2, unit: "pieces" },
      ],
    },
    {
      id: "rec_avocado",
      name: "Avocado & egg toast",
      station: "cold",
      yieldType: "plate",
      yieldCount: 1,
      notes: "Ripe fruit only. Add chilli oil at the pass if asked.",
      updatedAt: hoursAgo(5),
      lines: [
        { ingredientId: "ing_avocado", quantity: 1.5, unit: "pieces" },
        { ingredientId: "ing_sourdough", quantity: 2, unit: "pieces" },
        { ingredientId: "ing_lemon", quantity: 0.25, unit: "pieces" },
        { ingredientId: "ing_oil", quantity: 10, unit: "ml" },
        { ingredientId: "ing_egg", quantity: 1, unit: "pieces" },
      ],
    },
    {
      id: "rec_mushrooms",
      name: "Creamed mushrooms on toast",
      station: "saute",
      yieldType: "plate",
      yieldCount: 1,
      notes: "Cook the mushrooms dry first so they brown.",
      updatedAt: hoursAgo(9),
      lines: [
        { ingredientId: "ing_mushroom", quantity: 80, unit: "g" },
        { ingredientId: "ing_sourdough", quantity: 2, unit: "pieces" },
        { ingredientId: "ing_butter", quantity: 20, unit: "g" },
        { ingredientId: "ing_garlic", quantity: 5, unit: "g" },
        { ingredientId: "ing_cream", quantity: 30, unit: "ml" },
        { ingredientId: "ing_herb", quantity: 3, unit: "g" },
      ],
    },
  ];

  const menu: MenuItem[] = [
    plate("rec_ribeye", 34, 22),
    plate("rec_salmon", 26, 18),
    plate("rec_piccata", 19, 24),
    plate("rec_scampi", 16.5, 14),
    plate("rec_truffle", 15, 20),
    plate("rec_burger", 15, 36),
    plate("rec_caesar", 14, 22),
    plate("rec_soup", 9, 18),
    plate("rec_fondant", 12, 16),
    plate("rec_benedict", 15, 12),
    plate("rec_avocado", 8.5, 20),
    plate("rec_mushrooms", 12, 10),
  ];

  return {
    profile: {
      name: "Copper Hearth",
      cuisine: "Grill, pasta, and pastry",
      city: "Lisbon",
      currency: "USD",
      targetMargin: 68,
      alertPricePct: 8,
      criticalPricePct: 15,
      onboarded: true,
    },
    ingredients,
    recipes,
    menu,
    team: [
      { id: "tm_mara", name: "Mara Ellison", role: "owner" },
      { id: "tm_jonas", name: "Jonas Varga", role: "chef" },
      { id: "tm_imani", name: "Imani Cole", role: "buyer" },
    ],
    dismissedAlerts: [],
    activity: [
      { id: "act_1", at: hoursAgo(1), kind: "price", text: "Avocado posted at a higher market price after the morning delivery." },
      { id: "act_2", at: hoursAgo(3), kind: "import", text: "Grove Press invoice updated truffle oil." },
      { id: "act_3", at: hoursAgo(5), kind: "recipe", text: "Truffle mushroom pasta quantities were checked against the new oil price." },
      { id: "act_4", at: hoursAgo(8), kind: "price", text: "Mixed mushrooms moved up on the produce ticket." },
      { id: "act_5", at: hoursAgo(20), kind: "menu", text: "Ribeye selling price confirmed for tonight's board." },
      { id: "act_6", at: hoursAgo(28), kind: "price", text: "Salmon fillet eased at North Quay Fish." },
      { id: "act_7", at: hoursAgo(46), kind: "settings", text: "Margin floor held at 68% for the week." },
    ],
  };
}

export function emptyKitchen(profile: Partial<KitchenProfile> & Pick<KitchenProfile, "name" | "currency">): KitchenData {
  return {
    profile: {
      cuisine: profile.cuisine ?? "",
      city: profile.city ?? "",
      targetMargin: profile.targetMargin ?? 68,
      alertPricePct: profile.alertPricePct ?? 8,
      criticalPricePct: profile.criticalPricePct ?? 15,
      onboarded: profile.onboarded ?? false,
      name: profile.name,
      currency: profile.currency,
    },
    ingredients: [],
    recipes: [],
    menu: [],
    activity: [],
    team: [],
    dismissedAlerts: [],
  };
}

export function convertKitchen(kitchen: KitchenData, to: CurrencyCode): KitchenData {
  const from = kitchen.profile.currency;
  if (from === to) return kitchen;
  const money = (amount: number, digits: number) => round(convertAmount(amount, from, to), digits);
  return {
    ...kitchen,
    profile: { ...kitchen.profile, currency: to },
    ingredients: kitchen.ingredients.map((item) => ({
      ...item,
      unitPrice: money(item.unitPrice, 4),
      packPrice: money(item.packPrice, 2),
      history: item.history.map((point) => ({ ...point, unitPrice: money(point.unitPrice, 4) })),
    })),
    menu: kitchen.menu.map((item) => ({
      ...item,
      sellingPrice: money(item.sellingPrice, 2),
      priceHistory: item.priceHistory.map((point) => ({ ...point, unitPrice: money(point.unitPrice, 2) })),
    })),
  };
}

export function sampleInto(kitchen: KitchenData): KitchenData {
  const demo = convertKitchen(createDemoKitchen(), kitchen.profile.currency);
  return {
    ...kitchen,
    ingredients: demo.ingredients,
    recipes: demo.recipes,
    menu: demo.menu,
    activity: [
      {
        id: "act_sample",
        at: new Date().toISOString(),
        kind: "settings",
        text: "Sample service loaded. Prices, recipes, and the menu can all be edited.",
      },
      ...demo.activity,
    ],
  };
}
