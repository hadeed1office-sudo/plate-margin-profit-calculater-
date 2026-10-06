import type { ImportRow, Unit } from "./types";
import { parseUnit, slugName } from "./format";

export interface ParsedSheet {
  headers: string[];
  rows: Record<string, string>[];
}

const NAME_KEYS = ["ingredient", "name", "item", "product", "description", "ingredientname"];
const PRICE_KEYS = ["unitprice", "price", "rate", "cost", "amount", "unit_price", "marketprice"];
const PACK_PRICE_KEYS = ["packprice", "pack_price", "caseprice", "total"];
const UNIT_KEYS = ["unit", "uom", "measure", "measurement"];
const QTY_KEYS = ["packquantity", "quantity", "qty", "pack", "pack_quantity", "packqty"];

function normKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function pick(headers: string[], keys: string[]) {
  return headers.find((header) => keys.includes(normKey(header))) ?? "";
}

export function rowsFromSheet(headers: string[], records: Record<string, string>[]): ImportRow[] {
  const nameKey = pick(headers, NAME_KEYS);
  const unitKey = pick(headers, UNIT_KEYS);
  const qtyKey = pick(headers, QTY_KEYS);
  const packKey = pick(headers, PACK_PRICE_KEYS);
  const priceKey = pick(headers, PRICE_KEYS.filter((key) => key !== "total"));
  return records
    .map((record) => {
      const name = String(record[nameKey] ?? "").trim();
      const unit = parseUnit(String(record[unitKey] ?? "")) ?? "kg";
      const qty = Number(String(record[qtyKey] ?? "").replace(/,/g, "")) || 1;
      const pack = Number(String(record[packKey] ?? "").replace(/,/g, ""));
      const direct = Number(String(record[priceKey] ?? "").replace(/,/g, ""));
      const unitPrice = direct > 0 ? direct : pack > 0 && qty > 0 ? pack / qty : 0;
      if (!name || !Number.isFinite(unitPrice) || unitPrice <= 0) return null;
      return { name, unit: unit as Unit, unitPrice, packQuantity: qty > 0 ? qty : 1 };
    })
    .filter((row): row is ImportRow => row != null);
}

export function parseInvoiceText(text: string): ImportRow[] {
  const rows: ImportRow[] = [];
  const seen = new Set<string>();
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/\s+/g, " ").trim();
    if (line.length < 4) continue;
    if (/^(invoice|bill to|subtotal|total|tax|vat|gst|amount due|page|qty|description|price)\b/i.test(line)) continue;
    const match = line.match(/^(.*?)(?:\s+)(\d+(?:[.,]\d+)?)(?:\s*)(kg|g|ml|l|ltr|litre|liter|pcs|pc|pieces)?(?:\s+)(\d+(?:[.,]\d{1,4})?)\s*$/i);
    let name = "";
    let unit: Unit = "kg";
    let qty = 1;
    let price = 0;
    if (match) {
      name = match[1].replace(/[.\-–]+$/, "").trim();
      qty = Number(match[2].replace(",", ".")) || 1;
      unit = parseUnit(match[3] || "") ?? "pieces";
      price = Number(match[4].replace(",", "."));
      if (qty > 0 && price > qty) {
        const unitPrice = price / qty;
        price = unitPrice;
      }
    } else {
      const nums = [...line.matchAll(/\d+(?:[.,]\d+)?/g)];
      if (!nums.length) continue;
      const last = nums[nums.length - 1];
      price = Number(last[0].replace(",", "."));
      name = line.slice(0, last.index).replace(/[.\-–\s]+$/, "").trim();
      const unitMatch = name.match(/\b(kg|g|ml|litre|liter|pcs|pieces)\b/i);
      if (unitMatch) {
        unit = parseUnit(unitMatch[1]) ?? unit;
        name = name.replace(unitMatch[0], "").trim();
      }
    }
    if (!name || name.length < 2 || !Number.isFinite(price) || price <= 0 || price > 100000) continue;
    const key = slugName(name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    rows.push({ name, unit, unitPrice: price, packQuantity: qty || 1 });
    if (rows.length >= 40) break;
  }
  return rows;
}

export function guessColumns(headers: string[]) {
  return {
    name: pick(headers, NAME_KEYS),
    price: pick(headers, PRICE_KEYS),
    unit: pick(headers, UNIT_KEYS),
    qty: pick(headers, QTY_KEYS),
  };
}
