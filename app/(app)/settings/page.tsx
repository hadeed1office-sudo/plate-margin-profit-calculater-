"use client";

import { useState } from "react";
import { Field, PageHeader } from "@/components/ui";
import { CURRENCIES, currencyLabel, PER_USD } from "@/lib/format";
import { ROLES, roleLabel } from "@/lib/labels";
import { useApp } from "@/lib/store";
import type { CurrencyCode, Role } from "@/lib/types";

export default function SettingsPage() {
  const { user, kitchen, updateProfile, updateUser, addTeammate, removeTeammate, loadSample, toast } = useApp();
  const [name, setName] = useState(user?.name ?? "");
  const [kitchenName, setKitchenName] = useState(kitchen?.profile.name ?? "");
  const [city, setCity] = useState(kitchen?.profile.city ?? "");
  const [cuisine, setCuisine] = useState(kitchen?.profile.cuisine ?? "");
  const [currency, setCurrency] = useState<CurrencyCode>(kitchen?.profile.currency ?? "USD");
  const [target, setTarget] = useState(kitchen?.profile.targetMargin ?? 68);
  const [warnAt, setWarnAt] = useState(kitchen?.profile.alertPricePct ?? 8);
  const [criticalAt, setCriticalAt] = useState(kitchen?.profile.criticalPricePct ?? 15);
  const [mate, setMate] = useState("");
  const [mateRole, setMateRole] = useState<Role>("chef");

  if (!kitchen || !user) return null;

  function saveKitchen(event: React.FormEvent) {
    event.preventDefault();
    const convert = currency !== kitchen!.profile.currency;
    updateProfile(
      {
        name: kitchenName.trim() || kitchen!.profile.name,
        city: city.trim(),
        cuisine: cuisine.trim(),
        currency,
        targetMargin: target,
        alertPricePct: warnAt,
        criticalPricePct: criticalAt,
      },
      { convert },
    );
    updateUser({ name });
    toast(convert ? "Currency converted across the ledger." : "Kitchen settings saved.");
  }

  function download() {
    const blob = new Blob([JSON.stringify(kitchen, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "plate-margin-kitchen.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="House"
        title="Settings"
        lede="Currency, the margin target, and who works in the kitchen. Everything stays in this browser."
      />
      <form onSubmit={saveKitchen} className="card space-y-4 p-5 md:p-6">
        <h2 className="font-display text-2xl">Kitchen</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Your name">
            <input className="field" value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label="Kitchen name">
            <input className="field" value={kitchenName} onChange={(event) => setKitchenName(event.target.value)} />
          </Field>
          <Field label="City">
            <input className="field" value={city} onChange={(event) => setCity(event.target.value)} />
          </Field>
          <Field label="Cooking">
            <input className="field" value={cuisine} onChange={(event) => setCuisine(event.target.value)} />
          </Field>
        </div>
        <Field label="Currency" hint="Switching converts every stored price with guide rates so the whole kitchen stays in one currency.">
          <select className="field" value={currency} onChange={(event) => setCurrency(event.target.value as CurrencyCode)}>
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>{code} — {currencyLabel(code)}</option>
            ))}
          </select>
        </Field>
        <p className="text-xs text-ink-soft">Guide rate: 1 USD ≈ {PER_USD[currency]} {currency}. Treat it as a switch, not a live market feed.</p>
        <Field label={`Target margin ${target}%`}>
          <input type="range" min={45} max={85} value={target} onChange={(event) => setTarget(Number(event.target.value))} className="w-full accent-[#718C78]" />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Warn when a price moves by (%)">
            <input className="field num" type="number" min={1} max={80} value={warnAt} onChange={(event) => setWarnAt(Number(event.target.value))} />
          </Field>
          <Field label="Critical when a price moves by (%)">
            <input className="field num" type="number" min={1} max={100} value={criticalAt} onChange={(event) => setCriticalAt(Number(event.target.value))} />
          </Field>
        </div>
        <button className="btn-primary" type="submit">Save settings</button>
      </form>

      <section className="card p-5 md:p-6">
        <h2 className="font-display text-2xl">Team</h2>
        <ul className="mt-3 divide-y divide-line">
          {kitchen.team.map((member) => (
            <li key={member.id} className="flex items-center justify-between py-3 text-sm">
              <span>{member.name} · {roleLabel(member.role)}</span>
              <button className="text-chili" onClick={() => removeTeammate(member.id)}>Remove</button>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input className="field" placeholder="Name" value={mate} onChange={(event) => setMate(event.target.value)} aria-label="Teammate name" />
          <select className="field sm:max-w-[200px]" value={mateRole} onChange={(event) => setMateRole(event.target.value as Role)} aria-label="Teammate role">
            {ROLES.map((role) => <option key={role.id} value={role.id}>{role.label}</option>)}
          </select>
          <button
            className="btn-quiet"
            type="button"
            onClick={() => {
              if (!mate.trim()) return;
              addTeammate({ name: mate, role: mateRole });
              setMate("");
            }}
          >
            Add
          </button>
        </div>
      </section>

      <section className="card space-y-3 p-5 md:p-6">
        <h2 className="font-display text-2xl">Ledger</h2>
        <p className="text-sm leading-relaxed text-ink-soft">
          Accounts and prices are stored in this browser. Download a copy, or load the sample Copper Hearth service into this kitchen.
        </p>
        <div className="flex flex-wrap gap-2">
          <button className="btn-quiet" type="button" onClick={download}>Download ledger</button>
          <button className="btn-primary" type="button" onClick={() => loadSample()}>Load sample service</button>
        </div>
      </section>
    </div>
  );
}
