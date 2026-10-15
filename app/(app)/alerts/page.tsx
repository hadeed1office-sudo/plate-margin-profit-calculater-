"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader, SeverityPill } from "@/components/ui";
import { useApp } from "@/lib/store";

type AlertFilter = "all" | "unread" | "critical" | "ingredient" | "recipe" | "margin";

export default function AlertsPage() {
  const { metrics, dismissAlert, restoreAlerts } = useApp();
  const [filter, setFilter] = useState<AlertFilter>("all");
  const [read, setRead] = useState<string[]>([]);
  if (!metrics) return null;
  const alerts = metrics.alerts.filter((alert) => {
    if (filter === "unread") return !read.includes(alert.id);
    if (filter === "critical") return alert.severity === "critical";
    if (filter === "ingredient") return /ingredient|pantry|price eased/i.test(`${alert.tag} ${alert.title}`);
    if (filter === "recipe") return /recipe/i.test(`${alert.tag} ${alert.title} ${alert.detail}`);
    if (filter === "margin") return /margin|floor|price/i.test(`${alert.tag} ${alert.detail}`);
    return true;
  });

  return (
    <div>
      <PageHeader
        eyebrow="Alerts"
        title="Alerts"
        lede="Each note says what changed, why it matters, and which dish or ingredient to open next."
        actions={<button className="btn-quiet" onClick={() => restoreAlerts()}>Restore dismissed</button>}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {([
          ["all", "All"],
          ["unread", "Unread"],
          ["critical", "Critical"],
          ["ingredient", "Ingredient"],
          ["recipe", "Recipe"],
          ["margin", "Margin"],
        ] as const).map(([id, label]) => (
          <button key={id} className={filter === id ? "btn-primary !py-2" : "btn-quiet !py-2"} onClick={() => setFilter(id)}>
            {label}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {alerts.map((alert) => (
          <article key={alert.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <SeverityPill status={alert.severity} />
                <span className="text-xs uppercase tracking-[0.14em] text-ink-soft">{alert.tag}</span>
              </div>
              <h2 className="mt-2 font-display text-2xl leading-tight">{alert.title}</h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-soft">{alert.detail}</p>
              <Link
                href={alert.href}
                className="mt-2 inline-block text-sm font-semibold text-brand-soft"
                onClick={() => setRead((current) => (current.includes(alert.id) ? current : [...current, alert.id]))}
              >
                {alert.href.includes("recipe") ? "Review recipe" : alert.href.includes("ingredient") ? "Review ingredient" : "Review menu"}
              </Link>
            </div>
            <button className="btn-quiet shrink-0" onClick={() => dismissAlert(alert.id)}>
              Dismiss
            </button>
          </article>
        ))}
        {alerts.length === 0 ? <p className="text-sm text-ink-soft">Nothing in this tray.</p> : null}
      </div>
    </div>
  );
}
