export type Unit = "kg" | "g" | "litre" | "ml" | "pieces";

export type CurrencyCode = "USD" | "EUR" | "GBP" | "PKR" | "AED" | "CAD" | "AUD" | "INR";

export type IngredientCategory = "protein" | "dairy" | "produce" | "dry" | "oil" | "bakery" | "other";

export type Station = "grill" | "saute" | "cold" | "pastry" | "prep";

export type Role = "owner" | "chef" | "manager" | "buyer";

export type Severity = "critical" | "warning" | "healthy";

export interface PricePoint {
  date: string;
  unitPrice: number;
}

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  unit: Unit;
  packQuantity: number;
  packPrice: number;
  unitPrice: number;
  supplier: string;
  history: PricePoint[];
  updatedAt: string;
}

export interface RecipeLine {
  ingredientId: string;
  quantity: number;
  unit: Unit;
}

export interface Recipe {
  id: string;
  name: string;
  station: Station;
  yieldType: "plate" | "batch";
  yieldCount: number;
  lines: RecipeLine[];
  notes: string;
  updatedAt: string;
}

export interface MenuItem {
  id: string;
  recipeId: string;
  sellingPrice: number;
  targetMargin: number | null;
  onMenu: boolean;
  weeklyCovers: number;
  priceHistory: PricePoint[];
  updatedAt: string;
}

export interface Activity {
  id: string;
  at: string;
  text: string;
  kind: "price" | "recipe" | "menu" | "import" | "settings";
}

export interface TeamMember {
  id: string;
  name: string;
  role: Role;
}

export interface KitchenProfile {
  name: string;
  cuisine: string;
  city: string;
  currency: CurrencyCode;
  targetMargin: number;
  alertPricePct: number;
  criticalPricePct: number;
  onboarded: boolean;
}

export interface KitchenData {
  profile: KitchenProfile;
  ingredients: Ingredient[];
  recipes: Recipe[];
  menu: MenuItem[];
  activity: Activity[];
  team: TeamMember[];
  dismissedAlerts: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  kitchenId: string;
}

export interface ResetSlip {
  email: string;
  code: string;
  expiresAt: number;
}

export interface PersistedState {
  version: 1;
  users: User[];
  sessionUserId: string | null;
  kitchens: Record<string, KitchenData>;
  resets: ResetSlip[];
}

export interface ImportRow {
  name: string;
  unit: Unit;
  unitPrice: number;
  packQuantity: number;
}
