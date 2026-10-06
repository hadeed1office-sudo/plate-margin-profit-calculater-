"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader, SeverityPill } from "@/components/ui";
import { useApp } from "@/lib/store";
import type { Severity } from "@/lib/types";

export default function AlertsPage() {
  const { metrics, dismissAlert, restoreAlerts } = useApp();
  const [filter, setFilter] = useState<"all" | Severity>("all");
  if (!metrics) return null;
  const alerts = metrics.alerts.filter((alert) => (filter === "all" ? true : alert.severity === filter));

  return (
    <div>
      <PageHeader
        eyebrow="Pass notes"
        title="Alerts"
        lede="Critical means act before service. Warning means the plate or the price is drifting. Healthy is a note worth keeping."
        actions={<button className="btn-quiet" onClick={() => restoreAlerts()}>Restore dismissed</button>}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", "critical", "warning", "healthy"] as const).map((item) => (
          <button key={item} className={filter === item ? "btn-primary !py-2 capitalize" : "btn-quiet !py-2 capitalize"} onClick={() => setFilter(item)}>
            {item}
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
              <Link href={alert.href} className="mt-2 inline-block text-sm font-semibold text-copper">
                Open the related board
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
