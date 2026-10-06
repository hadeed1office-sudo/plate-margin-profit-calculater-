"use client";

import { useState } from "react";
import { Field, PageHeader } from "@/components/ui";
import { rowsFromSheet, parseInvoiceText } from "@/lib/import-parse";
import { formatMoney, parseUnit } from "@/lib/format";
import { UNITS } from "@/lib/format";
import { useApp } from "@/lib/store";
import type { ImportRow, Unit } from "@/lib/types";

export default function ReceivingPage() {
  const { kitchen, applyImport, toast } = useApp();
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [reading, setReading] = useState(false);
  const [source, setSource] = useState("Delivery");
  const [result, setResult] = useState<{ updated: number; created: number; recipes: string[] } | null>(null);

  if (!kitchen) return null;
  const currency = kitchen.profile.currency;

  async function take(file: File) {
    setResult(null);
    setStatus("");
    setSource(file.name);
    const lower = file.name.toLowerCase();
    if (file.type.startsWith("image/") || /\.(png|jpe?g|webp)$/.test(lower)) {
      setPreview(URL.createObjectURL(file));
      setReading(true);
      setStatus("Reading the invoice…");
      try {
        const Tesseract = await import("tesseract.js");
        const recognized = await Tesseract.recognize(file, "eng");
        const parsed = parseInvoiceText(recognized.data.text || "");
        setRows(parsed);
        setStatus(parsed.length ? "Check every line before posting. Invoice text is a draft, not a receipt." : "Could not read prices from that photo. Add the lines yourself beside the image.");
      } catch {
        setRows([]);
        setStatus("The reader could not open that photo. Add the lines by hand, using the image as the source.");
      } finally {
        setReading(false);
      }
      return;
    }
    setPreview(null);
    try {
      const XLSX = await import("xlsx");
      const book = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = book.Sheets[book.SheetNames[0]];
      const records = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "", raw: false });
      const headers = records[0] ? Object.keys(records[0]) : [];
      const parsed = rowsFromSheet(headers, records);
      setRows(parsed);
      setStatus(
        parsed.length
          ? `${parsed.length} ${parsed.length === 1 ? "price" : "prices"} ready to review.`
          : "No price rows found. Use columns named ingredient, unit, and unit_price.",
      );
    } catch {
      setStatus("That file could not be read. Use CSV, Excel, or a photo of the invoice.");
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Receiving"
        title="Deliveries & price files"
        lede="Drop a spreadsheet of daily rates or a photo of an invoice. Nothing hits the pantry until you post it."
        actions={
          <a className="btn-quiet" href="/samples/pantry-prices.csv" download>
            Download example file
          </a>
        }
      />
      <label
        className="card flex cursor-pointer flex-col items-center justify-center border-dashed px-6 py-12 text-center"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const file = event.dataTransfer.files?.[0];
          if (file) void take(file);
        }}
      >
        <p className="font-display text-3xl">Drop a file on the pass</p>
        <p className="mt-2 max-w-md text-sm text-ink-soft">CSV, Excel, or a photo of a supplier invoice. Prices stay in {currency}.</p>
        <input
          className="mt-4 text-sm"
          type="file"
          accept=".csv,.xlsx,.xls,image/png,image/jpeg,image/webp"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void take(file);
          }}
        />
      </label>
      {status ? <p className="text-sm text-ink-soft" role="status">{reading ? "Reading the invoice…" : status}</p> : null}

      {preview || rows.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          {preview ? (
            <div className="card overflow-hidden p-3">
              {/* User-uploaded invoice preview. Blob URL, not a remote image. */}
              <img src={preview} alt="Uploaded invoice" className="max-h-[520px] w-full rounded-xl object-contain" />
            </div>
          ) : null}
          <div className="card p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl">Price ticket</h2>
              <button
                className="btn-quiet !py-2"
                type="button"
                onClick={() => setRows((current) => [...current, { name: "", unit: "kg", unitPrice: 0, packQuantity: 1 }])}
              >
                Add line
              </button>
            </div>
            <div className="scroll-thin max-h-[460px] space-y-2 overflow-auto">
              {rows.map((row, index) => (
                <div key={`${row.name}-${index}`} className="grid grid-cols-[1.4fr_0.6fr_0.7fr_auto] gap-2">
                  <input className="field" aria-label="Ingredient name" value={row.name} onChange={(event) => edit(index, { name: event.target.value })} />
                  <select className="field" aria-label="Unit" value={row.unit} onChange={(event) => edit(index, { unit: event.target.value as Unit })}>
                    {UNITS.map((unit) => <option key={unit.id} value={unit.id}>{unit.label}</option>)}
                  </select>
                  <input className="field num" aria-label="Unit price" inputMode="decimal" value={row.unitPrice || ""} onChange={(event) => edit(index, { unitPrice: Number(event.target.value) })} />
                  <button className="btn-quiet !px-3" type="button" aria-label="Remove line" onClick={() => setRows((current) => current.filter((_, item) => item !== index))}>✕</button>
                </div>
              ))}
            </div>
            <button
              className="btn-primary mt-4"
              disabled={!rows.some((row) => row.name.trim() && row.unitPrice > 0)}
              onClick={() => {
                const clean = rows.filter((row) => row.name.trim() && row.unitPrice > 0);
                const summary = applyImport(clean, source);
                setResult(summary);
                toast("Prices posted. Recipe costs recalculated.");
                setRows([]);
                setPreview(null);
                setStatus("");
              }}
            >
              Post these prices
            </button>
          </div>
        </div>
      ) : null}

      {result ? (
        <div className="card p-5">
          <p className="font-display text-2xl">{result.updated} updated · {result.created} added</p>
          <p className="mt-2 text-sm text-ink-soft">
            {result.recipes.length ? `Recalculated: ${result.recipes.join(", ")}.` : "No current recipe uses these names yet."}
          </p>
        </div>
      ) : null}

      <ManualEntry
        currency={currency}
        onAdd={(row) => {
          const summary = applyImport([row], "Manual ticket");
          setResult(summary);
          toast("Price posted.");
        }}
      />
    </div>
  );

  function edit(index: number, patch: Partial<ImportRow>) {
    setRows((current) => current.map((row, item) => (item === index ? { ...row, ...patch } : row)));
  }
}

function ManualEntry({ currency, onAdd }: { currency: Parameters<typeof formatMoney>[1]; onAdd: (row: ImportRow) => void }) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState<Unit>("kg");
  const [price, setPrice] = useState("");
  return (
    <form
      className="card grid gap-3 p-5 md:grid-cols-4"
      onSubmit={(event) => {
        event.preventDefault();
        const unitPrice = Number(price);
        if (!name.trim() || unitPrice <= 0) return;
        onAdd({ name: name.trim(), unit, unitPrice, packQuantity: 1 });
        setName("");
        setPrice("");
      }}
    >
      <div className="md:col-span-4">
        <h2 className="font-display text-2xl">Or post one price</h2>
        <p className="text-sm text-ink-soft">Useful when the invoice is short. Amounts are in {currency}.</p>
      </div>
      <Field label="Ingredient">
        <input className="field" value={name} onChange={(event) => setName(event.target.value)} />
      </Field>
      <Field label="Unit">
        <select className="field" value={unit} onChange={(event) => setUnit(parseUnit(event.target.value) ?? "kg")}>
          {UNITS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </Field>
      <Field label="Unit price">
        <input className="field num" inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} />
      </Field>
      <div className="flex items-end">
        <button className="btn-primary w-full" type="submit">Post price</button>
      </div>
    </form>
  );
}
