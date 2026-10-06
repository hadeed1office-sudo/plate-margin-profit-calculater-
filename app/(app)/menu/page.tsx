"use client";

import { useEffect, useMemo, useState } from "react";
import { ChangePill, PageHeader, SeverityPill } from "@/components/ui";
import { MarginTrack } from "@/components/visuals";
import { formatMoney, formatPct } from "@/lib/format";
import { stationLabel } from "@/lib/labels";
import { useApp } from "@/lib/store";

export default function MenuPage() {
  const { kitchen, metrics, updateMenuItem, toast } = useApp();
  const [filter, setFilter] = useState<"all" | "risk" | "healthy">("all");
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!metrics) return;
    const timers = Object.entries(drafts).map(([id, value]) => {
      const next = Number(value);
      const dish = metrics.onMenu.find((item) => item.menuId === id);
      if (!dish || !Number.isFinite(next) || next <= 0 || next === dish.sellingPrice) return 0;
      return window.setTimeout(() => {
        updateMenuItem(id, { sellingPrice: next });
      }, 400);
    });
    return () => {
      timers.forEach((timer) => {
        if (timer) window.clearTimeout(timer);
      });
    };
  }, [drafts, metrics, updateMenuItem]);

  const dishes = useMemo(() => {
    if (!metrics) return [];
    const list = [...metrics.onMenu].sort((a, b) => (a.margin ?? 999) - (b.margin ?? 999));
    if (filter === "risk") return list.filter((dish) => dish.status === "warning" || dish.status === "critical");
    if (filter === "healthy") return list.filter((dish) => dish.status === "healthy");
    return list;
  }, [metrics, filter]);

  if (!kitchen || !metrics) return null;
  const currency = kitchen.profile.currency;

  return (
    <div>
      <PageHeader
        eyebrow="The board"
        title="Menu"
        lede="Change a selling price and the profit, margin, and food cost update before you leave the card."
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {([
          ["all", "All plates"],
          ["risk", "Under the floor"],
          ["healthy", "Holding"],
        ] as const).map(([id, label]) => (
          <button key={id} className={filter === id ? "btn-primary !py-2" : "btn-quiet !py-2"} onClick={() => setFilter(id)}>
            {label}
          </button>
        ))}
      </div>
      {dishes.length === 0 ? <p className="text-sm text-ink-soft">Nothing on the menu for this filter.</p> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {dishes.map((dish) => {
          const draft = drafts[dish.menuId] ?? String(dish.sellingPrice);
          const livePrice = Number(draft);
          const price = Number.isFinite(livePrice) && livePrice > 0 ? livePrice : dish.sellingPrice;
          const profit = price - dish.plateCost;
          const margin = price > 0 ? (profit / price) * 100 : null;
          const food = price > 0 ? (dish.plateCost / price) * 100 : null;
          const status = margin == null ? "unset" : margin >= dish.target ? "healthy" : margin >= dish.target - 6 ? "warning" : "critical";
          return (
            <article key={dish.menuId} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-ink-soft">{stationLabel(dish.station)}</p>
                  <h2 className="font-display text-2xl">{dish.name}</h2>
                </div>
                <SeverityPill status={status} />
              </div>
              <label className="mt-4 block">
                <span className="label">Selling price</span>
                <input
                  className="field num text-lg"
                  inputMode="decimal"
                  aria-label={`Selling price for ${dish.name}`}
                  value={draft}
                  onChange={(event) => setDrafts((current) => ({ ...current, [dish.menuId]: event.target.value }))}
                  onBlur={() => {
                    const next = Number(draft);
                    if (Number.isFinite(next) && next > 0 && next !== dish.sellingPrice) {
                      updateMenuItem(dish.menuId, { sellingPrice: next });
                      toast(`${dish.name} repriced.`);
                    }
                  }}
                />
              </label>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <Cell label="Plate cost" value={formatMoney(dish.plateCost, currency)} />
                <Cell label="Profit" value={formatMoney(profit, currency)} />
                <Cell label="Margin" value={margin == null ? "—" : formatPct(margin)} />
                <Cell label="Food cost" value={food == null ? "—" : formatPct(food)} />
              </div>
              <div className="mt-4">
                <MarginTrack margin={margin} target={dish.target} />
                <div className="mt-2 flex items-center justify-between text-xs text-ink-soft">
                  <span>Floor {formatPct(dish.target, 0)}</span>
                  <ChangePill value={dish.marginDelta} />
                </div>
              </div>
              <label className="mt-4 block text-sm text-ink-soft">
                Covers / week
                <input
                  className="field mt-1 num"
                  inputMode="numeric"
                  defaultValue={dish.weeklyCovers}
                  onBlur={(event) => updateMenuItem(dish.menuId, { weeklyCovers: Math.max(0, Number(event.target.value) || 0) })}
                />
              </label>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.12em] text-ink-soft">{label}</p>
      <p className="num text-base">{value}</p>
    </div>
  );
}
