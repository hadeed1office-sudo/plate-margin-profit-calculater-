import type { IngredientCategory, Role, Station } from "./types";

export const CATEGORIES: { id: IngredientCategory; label: string }[] = [
  { id: "protein", label: "Protein" },
  { id: "dairy", label: "Dairy" },
  { id: "produce", label: "Produce" },
  { id: "dry", label: "Dry store" },
  { id: "oil", label: "Oils" },
  { id: "bakery", label: "Bakery" },
  { id: "other", label: "Other" },
];

export const STATIONS: { id: Station; label: string }[] = [
  { id: "grill", label: "Grill" },
  { id: "saute", label: "Sauté" },
  { id: "cold", label: "Cold" },
  { id: "pastry", label: "Pastry" },
  { id: "prep", label: "Prep" },
];

export const ROLES: { id: Role; label: string }[] = [
  { id: "owner", label: "Owner" },
  { id: "chef", label: "Chef" },
  { id: "manager", label: "Kitchen manager" },
  { id: "buyer", label: "Buyer" },
];

export function categoryLabel(id: IngredientCategory) {
  return CATEGORIES.find((item) => item.id === id)?.label ?? id;
}

export function stationLabel(id: Station) {
  return STATIONS.find((item) => item.id === id)?.label ?? id;
}

export function roleLabel(id: Role) {
  return ROLES.find((item) => item.id === id)?.label ?? id;
}
