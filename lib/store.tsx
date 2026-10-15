"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { buildMetrics, type Metrics } from "./metrics";
import { hashPassword, resetCode, verifyPassword } from "./password";
import { convertKitchen, createDemoKitchen, DEMO_EMAIL, DEMO_KITCHEN_ID, DEMO_PASSWORD, emptyKitchen, sampleInto } from "./seed";
import type {
  Activity,
  CurrencyCode,
  ImportRow,
  Ingredient,
  KitchenData,
  KitchenProfile,
  MenuItem,
  PersistedState,
  Recipe,
  Role,
  TeamMember,
  User,
} from "./types";
import { round, slugName, todayISO, uid } from "./format";
import { BootScreen } from "@/components/boot";

const STORAGE_KEY = "platemargin.v1";

type Toast = { id: string; text: string };

type AppContextValue = {
  ready: boolean;
  user: User | null;
  kitchen: KitchenData | null;
  metrics: Metrics | null;
  toasts: Toast[];
  signup: (input: { name: string; email: string; password: string; role: Role }) => Promise<string | null>;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
  requestReset: (email: string) => Promise<{ error: string | null; code: string | null }>;
  resetPassword: (email: string, code: string, password: string) => Promise<string | null>;
  completeOnboarding: (profile: KitchenProfile, withSample: boolean) => void;
  updateProfile: (patch: Partial<KitchenProfile>, options?: { convert?: boolean }) => void;
  updateUser: (patch: { name?: string }) => void;
  saveIngredient: (ingredient: Ingredient, isNew: boolean) => string | null;
  deleteIngredient: (id: string) => string | null;
  postIngredientPrice: (id: string, unitPrice: number) => void;
  saveRecipe: (recipe: Recipe, menu?: { sellingPrice: number; onMenu: boolean; weeklyCovers: number } | null) => void;
  deleteRecipe: (id: string) => void;
  updateMenuItem: (id: string, patch: Partial<Pick<MenuItem, "sellingPrice" | "onMenu" | "weeklyCovers" | "targetMargin">>) => void;
  applyImport: (rows: ImportRow[], source: string) => { updated: number; created: number; recipes: string[] };
  dismissAlert: (id: string) => void;
  restoreAlerts: () => void;
  addTeammate: (member: Omit<TeamMember, "id">) => void;
  removeTeammate: (id: string) => void;
  loadSample: () => void;
  toast: (text: string) => void;
  dismissToast: (id: string) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

function readStorage(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    if (parsed?.version !== 1 || !Array.isArray(parsed.users) || !parsed.kitchens) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function freshState(): Promise<PersistedState> {
  return {
    version: 1,
    users: [
      {
        id: "usr_mara",
        name: "Mara Ellison",
        email: DEMO_EMAIL,
        passwordHash: await hashPassword(DEMO_PASSWORD),
        role: "owner",
        kitchenId: DEMO_KITCHEN_ID,
      },
    ],
    sessionUserId: null,
    kitchens: { [DEMO_KITCHEN_ID]: createDemoKitchen() },
    resets: [],
  };
}

function pushActivity(kitchen: KitchenData, text: string, kind: Activity["kind"]): KitchenData {
  return {
    ...kitchen,
    activity: [{ id: uid("act"), at: new Date().toISOString(), text, kind }, ...kitchen.activity].slice(0, 40),
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState | null>(null);
  const [ready, setReady] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = readStorage();
      const next = saved ?? (await freshState());
      if (!cancelled) {
        setState(next);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || !state) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [ready, state]);

  const toast = (text: string) => {
    const id = uid("toast");
    setToasts((current) => [...current, { id, text }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 3400);
  };

  const user = state?.users.find((item) => item.id === state.sessionUserId) ?? null;
  const kitchen = user && state ? state.kitchens[user.kitchenId] ?? null : null;
  const metrics = useMemo(() => (kitchen ? buildMetrics(kitchen) : null), [kitchen]);

  const patchKitchen = (recipe: (current: KitchenData) => KitchenData) => {
    setState((current) => {
      if (!current?.sessionUserId) return current;
      const active = current.users.find((item) => item.id === current.sessionUserId);
      if (!active) return current;
      const book = current.kitchens[active.kitchenId];
      if (!book) return current;
      return {
        ...current,
        kitchens: { ...current.kitchens, [active.kitchenId]: recipe(book) },
      };
    });
  };

  const value: AppContextValue = {
    ready,
    user,
    kitchen,
    metrics,
    toasts,
    toast,
    dismissToast: (id) => setToasts((current) => current.filter((item) => item.id !== id)),
    signup: async ({ name, email, password, role }) => {
      const clean = email.trim().toLowerCase();
      if (!state) return "The kitchen is still starting.";
      if (state.users.some((item) => item.email === clean)) return "That email already has a kitchen here.";
      const kitchenId = uid("kit");
      const nextUser: User = {
        id: uid("usr"),
        name: name.trim(),
        email: clean,
        passwordHash: await hashPassword(password),
        role,
        kitchenId,
      };
      setState((current) =>
        current
          ? {
              ...current,
              users: [...current.users, nextUser],
              sessionUserId: nextUser.id,
              kitchens: {
                ...current.kitchens,
                [kitchenId]: emptyKitchen({ name: "", currency: "USD", onboarded: false }),
              },
            }
          : current,
      );
      return null;
    },
    login: async (email, password) => {
      const clean = email.trim().toLowerCase();
      const found = state?.users.find((item) => item.email === clean);
      if (!found || !(await verifyPassword(password, found.passwordHash))) {
        return "Those credentials don't match a kitchen on this device.";
      }
      setState((current) => (current ? { ...current, sessionUserId: found.id } : current));
      return null;
    },
    logout: () => setState((current) => (current ? { ...current, sessionUserId: null } : current)),
    requestReset: async (email) => {
      const clean = email.trim().toLowerCase();
      const found = state?.users.find((item) => item.email === clean);
      if (!found) return { error: "No kitchen uses that email on this device.", code: null };
      const code = resetCode();
      const slip = { email: clean, code, expiresAt: Date.now() + 15 * 60 * 1000 };
      setState((current) =>
        current ? { ...current, resets: [...current.resets.filter((item) => item.email !== clean), slip] } : current,
      );
      return { error: null, code };
    },
    resetPassword: async (email, code, password) => {
      const clean = email.trim().toLowerCase();
      const slip = state?.resets.find((item) => item.email === clean && item.code === code.trim());
      if (!slip || slip.expiresAt < Date.now()) return "That reset slip is missing or has expired.";
      const passwordHash = await hashPassword(password);
      setState((current) =>
        current
          ? {
              ...current,
              users: current.users.map((item) => (item.email === clean ? { ...item, passwordHash } : item)),
              resets: current.resets.filter((item) => item.email !== clean),
            }
          : current,
      );
      return null;
    },
    completeOnboarding: (profile, withSample) => {
      patchKitchen((current) => {
        const next: KitchenData = {
          ...current,
          profile: { ...profile, onboarded: true },
          team: current.team.length
            ? current.team
            : user
              ? [{ id: uid("tm"), name: user.name, role: user.role }]
              : [],
        };
        const seeded = withSample ? sampleInto(next) : next;
        return pushActivity(seeded, `${profile.name || "Kitchen"} is set up and ready for service.`, "settings");
      });
    },
    updateProfile: (patch, options) => {
      patchKitchen((current) => {
        let next: KitchenData = { ...current, profile: { ...current.profile, ...patch } };
        if (options?.convert && patch.currency && patch.currency !== current.profile.currency) {
          next = convertKitchen({ ...current, profile: { ...current.profile, ...patch, currency: current.profile.currency } }, patch.currency);
          next = { ...next, profile: { ...next.profile, ...patch, currency: patch.currency } };
        }
        return pushActivity(next, "Kitchen settings were updated.", "settings");
      });
    },
    updateUser: (patch) => {
      setState((current) => {
        if (!current?.sessionUserId) return current;
        return {
          ...current,
          users: current.users.map((item) =>
            item.id === current.sessionUserId ? { ...item, name: patch.name?.trim() || item.name } : item,
          ),
        };
      });
    },
    saveIngredient: (ingredient, isNew) => {
      const name = ingredient.name.trim();
      if (!name) return "Give the ingredient a name.";
      if (!ingredient.unitPrice || ingredient.unitPrice <= 0) return "Enter a price above zero.";
      let error: string | null = null;
      patchKitchen((current) => {
        const clash = current.ingredients.some(
          (item) => item.id !== ingredient.id && slugName(item.name) === slugName(name),
        );
        if (clash) {
          error = "That ingredient is already in the pantry.";
          return current;
        }
        const nextItem: Ingredient = {
          ...ingredient,
          name,
          packPrice: round(ingredient.unitPrice * (ingredient.packQuantity || 1), 2),
          updatedAt: new Date().toISOString(),
          history: ingredient.history.length
            ? ingredient.history
            : [{ date: todayISO(), unitPrice: ingredient.unitPrice }],
        };
        const ingredients = isNew
          ? [nextItem, ...current.ingredients]
          : current.ingredients.map((item) => (item.id === nextItem.id ? nextItem : item));
        return pushActivity(
          { ...current, ingredients },
          isNew ? `${name} joined the pantry.` : `${name} was updated.`,
          "price",
        );
      });
      return error;
    },
    deleteIngredient: (id) => {
      let error: string | null = null;
      patchKitchen((current) => {
        const used = current.recipes.filter((recipe) => recipe.lines.some((line) => line.ingredientId === id));
        if (used.length) {
          error = `Used in ${used.map((recipe) => recipe.name).join(", ")}. Remove it from those cards first.`;
          return current;
        }
        const name = current.ingredients.find((item) => item.id === id)?.name ?? "Ingredient";
        return pushActivity(
          { ...current, ingredients: current.ingredients.filter((item) => item.id !== id) },
          `${name} was removed from the pantry.`,
          "price",
        );
      });
      return error;
    },
    postIngredientPrice: (id, unitPrice) => {
      patchKitchen((current) => {
        const ingredients = current.ingredients.map((item) => {
          if (item.id !== id) return item;
          const today = todayISO();
          const history = item.history.some((point) => point.date === today)
            ? item.history.map((point) => (point.date === today ? { ...point, unitPrice } : point))
            : [...item.history, { date: today, unitPrice }];
          return {
            ...item,
            unitPrice,
            packPrice: round(unitPrice * (item.packQuantity || 1), 2),
            history,
            updatedAt: new Date().toISOString(),
          };
        });
        const name = current.ingredients.find((item) => item.id === id)?.name ?? "Ingredient";
        return pushActivity({ ...current, ingredients }, `Today's price for ${name} was posted.`, "price");
      });
    },
    saveRecipe: (recipe, menu) => {
      patchKitchen((current) => {
        const exists = current.recipes.some((item) => item.id === recipe.id);
        const recipes = exists
          ? current.recipes.map((item) => (item.id === recipe.id ? recipe : item))
          : [recipe, ...current.recipes];
        let nextMenu = current.menu;
        if (menu) {
          const found = current.menu.find((item) => item.recipeId === recipe.id);
          if (found) {
            nextMenu = current.menu.map((item) =>
              item.recipeId === recipe.id
                ? {
                    ...item,
                    sellingPrice: menu.sellingPrice,
                    onMenu: menu.onMenu,
                    weeklyCovers: menu.weeklyCovers,
                    updatedAt: new Date().toISOString(),
                  }
                : item,
            );
          } else {
            nextMenu = [
              {
                id: uid("menu"),
                recipeId: recipe.id,
                sellingPrice: menu.sellingPrice,
                targetMargin: null,
                onMenu: menu.onMenu,
                weeklyCovers: menu.weeklyCovers,
                priceHistory: [{ date: todayISO(), unitPrice: menu.sellingPrice }],
                updatedAt: new Date().toISOString(),
              },
              ...current.menu,
            ];
          }
        }
        return pushActivity(
          { ...current, recipes, menu: nextMenu },
          exists ? `${recipe.name} card was revised.` : `${recipe.name} was added to the recipe box.`,
          "recipe",
        );
      });
    },
    deleteRecipe: (id) => {
      patchKitchen((current) => {
        const name = current.recipes.find((item) => item.id === id)?.name ?? "Recipe";
        return pushActivity(
          {
            ...current,
            recipes: current.recipes.filter((item) => item.id !== id),
            menu: current.menu.filter((item) => item.recipeId !== id),
          },
          `${name} was taken off the board.`,
          "recipe",
        );
      });
    },
    updateMenuItem: (id, patch) => {
      patchKitchen((current) => {
        const menu = current.menu.map((item) => {
          if (item.id !== id) return item;
          const sellingPrice = patch.sellingPrice ?? item.sellingPrice;
          const today = todayISO();
          const priceChanged = patch.sellingPrice != null && patch.sellingPrice !== item.sellingPrice;
          const priceHistory = !priceChanged
            ? item.priceHistory
            : item.priceHistory.some((point) => point.date === today)
              ? item.priceHistory.map((point) => (point.date === today ? { ...point, unitPrice: sellingPrice } : point))
              : [...item.priceHistory, { date: today, unitPrice: sellingPrice }];
          return {
            ...item,
            ...patch,
            sellingPrice,
            priceHistory,
            updatedAt: new Date().toISOString(),
          };
        });
        const item = current.menu.find((entry) => entry.id === id);
        const recipe = current.recipes.find((entry) => entry.id === item?.recipeId);
        return pushActivity({ ...current, menu }, `${recipe?.name ?? "A dish"} was repriced on the menu.`, "menu");
      });
    },
    applyImport: (rows, source) => {
      const book = kitchen;
      if (!book) return { updated: 0, created: 0, recipes: [] as string[] };
      const unique = new Map<string, (typeof rows)[number]>();
      for (const row of rows) {
        const key = slugName(row.name);
        if (!key || !(row.unitPrice > 0)) continue;
        unique.set(key, row);
      }
      let updated = 0;
      let created = 0;
      const touched = new Set<string>();
      let ingredients = [...book.ingredients];
      const today = todayISO();
      for (const row of unique.values()) {
        const key = slugName(row.name);
        if (!key || !(row.unitPrice > 0)) continue;
        const index = ingredients.findIndex((item) => slugName(item.name) === key);
        if (index >= 0) {
          const item = ingredients[index];
          const history = item.history.some((point) => point.date === today)
            ? item.history.map((point) => (point.date === today ? { ...point, unitPrice: row.unitPrice } : point))
            : [...item.history, { date: today, unitPrice: row.unitPrice }];
          ingredients[index] = {
            ...item,
            unit: row.unit || item.unit,
            unitPrice: row.unitPrice,
            packQuantity: row.packQuantity || item.packQuantity,
            packPrice: round(row.unitPrice * (row.packQuantity || item.packQuantity || 1), 2),
            history,
            updatedAt: new Date().toISOString(),
          };
          updated += 1;
          touched.add(item.id);
        } else {
          const id = uid("ing");
          ingredients = [
            {
              id,
              name: row.name.trim(),
              category: "other",
              unit: row.unit,
              packQuantity: row.packQuantity || 1,
              packPrice: round(row.unitPrice * (row.packQuantity || 1), 2),
              unitPrice: row.unitPrice,
              supplier: source,
              history: [{ date: today, unitPrice: row.unitPrice }],
              updatedAt: new Date().toISOString(),
            },
            ...ingredients,
          ];
          created += 1;
          touched.add(id);
        }
      }
      const recipes = book.recipes
        .filter((recipe) => recipe.lines.some((line) => touched.has(line.ingredientId)))
        .map((recipe) => recipe.name);
      const nextIngredients = ingredients;
      const summary = `${source}: ${updated} prices updated, ${created} new pantry items.`;
      patchKitchen((current) => pushActivity({ ...current, ingredients: nextIngredients }, summary, "import"));
      return { updated, created, recipes };
    },
    dismissAlert: (id) => patchKitchen((current) => ({ ...current, dismissedAlerts: [...current.dismissedAlerts, id] })),
    restoreAlerts: () => patchKitchen((current) => ({ ...current, dismissedAlerts: [] })),
    addTeammate: (member) =>
      patchKitchen((current) => ({ ...current, team: [...current.team, { ...member, id: uid("tm"), name: member.name.trim() }] })),
    removeTeammate: (id) => patchKitchen((current) => ({ ...current, team: current.team.filter((item) => item.id !== id) })),
    loadSample: () => {
      patchKitchen((current) => sampleInto(current));
      toast("Sample service loaded.");
    },
  };

  if (!ready || !state) return <BootScreen />;

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
