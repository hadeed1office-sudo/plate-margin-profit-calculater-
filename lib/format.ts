import type { CurrencyCode, Unit } from "./types";

export const UNITS: { id: Unit; label: string; family: "mass" | "volume" | "count" }[] = [
  { id: "kg", label: "kg", family: "mass" },
  { id: "g", label: "g", family: "mass" },
  { id: "litre", label: "litre", family: "volume" },
  { id: "ml", label: "ml", family: "volume" },
  { id: "pieces", label: "pieces", family: "count" },
];

const TO_BASE: Record<Unit, { family: string; toBase: number }> = {
  kg: { family: "mass", toBase: 1000 },
  g: { family: "mass", toBase: 1 },
  litre: { family: "volume", toBase: 1000 },
  ml: { family: "volume", toBase: 1 },
  pieces: { family: "count", toBase: 1 },
};

export function convertQuantity(qty: number, from: Unit, to: Unit): number | null {
  const a = TO_BASE[from];
  const b = TO_BASE[to];
  if (!a || !b || a.family !== b.family) return null;
  return (qty * a.toBase) / b.toBase;
}

export function sameFamily(a: Unit, b: Unit) {
  return TO_BASE[a].family === TO_BASE[b].family;
}

export function parseUnit(value: string): Unit | null {
  const v = value.trim().toLowerCase().replace(/\./g, "");
  if (["kg", "kilo", "kilos", "kilogram", "kilograms"].includes(v)) return "kg";
  if (["g", "gr", "gram", "grams"].includes(v)) return "g";
  if (["l", "lt", "ltr", "liter", "litre", "liters", "litres"].includes(v)) return "litre";
  if (["ml", "millilitre", "milliliter", "millilitres", "milliliters"].includes(v)) return "ml";
  if (["pc", "pcs", "piece", "pieces", "each", "ea", "unit", "units"].includes(v)) return "pieces";
  return null;
}

export const CURRENCIES: CurrencyCode[] = ["USD", "EUR", "GBP", "PKR", "AED", "CAD", "AUD", "INR"];

/** Indicative units of each currency per 1 USD. Used only when a kitchen switches currency. */
export const PER_USD: Record<CurrencyCode, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  PKR: 278,
  AED: 3.67,
  CAD: 1.37,
  AUD: 1.53,
  INR: 84.2,
};

export function convertAmount(amount: number, from: CurrencyCode, to: CurrencyCode) {
  if (from === to) return amount;
  const usd = amount / PER_USD[from];
  return usd * PER_USD[to];
}

export function round(n: number, digits = 2) {
  const f = 10 ** digits;
  return Math.round((n + Number.EPSILON) * f) / f;
}

export function isoDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayISO() {
  return isoDate(new Date());
}

export function daysAgoISO(days: number) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return isoDate(d);
}

export function formatMoney(value: number, currency: CurrencyCode) {
  const abs = Math.abs(value);
  const digits = abs > 0 && abs < 1 ? 3 : 2;
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: digits,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function formatPct(value: number, digits = 1) {
  if (!Number.isFinite(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

export function formatSignedPct(value: number, digits = 1) {
  if (!Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${Math.abs(value).toFixed(digits)}%`;
}

export function currencyLabel(code: CurrencyCode) {
  try {
    return new Intl.DisplayNames(["en"], { type: "currency" }).of(code) ?? code;
  } catch {
    return code;
  }
}

export function formatWhen(iso: string) {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const diff = Date.now() - then;
  const min = Math.round(diff / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const day = Math.round(hr / 24);
  if (day === 1) return "Yesterday";
  if (day < 14) return `${day} days ago`;
  return new Date(iso).toLocaleDateString("en", { month: "short", day: "numeric" });
}

export function greeting(name: string) {
  const hour = new Date().getHours();
  const hello = hour < 11 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const first = name.trim().split(/\s+/)[0] || "chef";
  return `${hello}, ${first}`;
}

export function uid(prefix: string) {
  const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${id.slice(0, 8)}`;
}

export function slugName(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}
