"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Mark } from "@/components/boot";
import { Field } from "@/components/ui";
import { CURRENCIES, currencyLabel } from "@/lib/format";
import { useApp } from "@/lib/store";
import type { CurrencyCode } from "@/lib/types";

export default function OnboardingPage() {
  const { user, kitchen, completeOnboarding } = useApp();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [target, setTarget] = useState(68);
  const [sample, setSample] = useState(true);
  const [error, setError] = useState("");
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!user) router.replace("/login");
    else if (kitchen?.profile.onboarded && leaving) router.replace("/dashboard");
    else if (kitchen?.profile.onboarded && !leaving) router.replace("/dashboard");
  }, [user, kitchen, router, leaving]);

  function finish() {
    if (!name.trim()) {
      setError("The kitchen needs a name.");
      setStep(0);
      return;
    }
    completeOnboarding(
      {
        name: name.trim(),
        city: city.trim(),
        cuisine: cuisine.trim(),
        currency,
        targetMargin: target,
        alertPricePct: 8,
        criticalPricePct: 15,
        onboarded: true,
      },
      sample,
    );
    setLeaving(true);
  }

  const steps = ["Name", "Money", "Board"];

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-5 py-8">
      <div className="flex items-center gap-3">
        <Mark className="h-10 w-10" />
        <span className="font-display text-2xl">Set the kitchen</span>
      </div>
      <ol className="mt-8 grid grid-cols-3 gap-2">
        {steps.map((label, index) => (
          <li key={label} className={`rounded-2xl border px-3 py-3 ${index === step ? "border-copper bg-white" : index < step ? "border-sage/30 bg-sage-soft" : "border-line bg-card"}`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">0{index + 1}</p>
            <p className="mt-1 font-medium">{label}</p>
          </li>
        ))}
      </ol>

      <div className="card mt-6 p-6 md:p-8">
        {step === 0 ? (
          <div className="space-y-4">
            <h1 className="font-display text-4xl">What do you call the kitchen?</h1>
            <Field label="Kitchen name" error={error}>
              <input className="field" value={name} onChange={(event) => setName(event.target.value)} placeholder="Copper Hearth" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="City">
                <input className="field" value={city} onChange={(event) => setCity(event.target.value)} placeholder="Lisbon" />
              </Field>
              <Field label="Style of cooking">
                <input className="field" value={cuisine} onChange={(event) => setCuisine(event.target.value)} placeholder="Grill, bakery, curry house" />
              </Field>
            </div>
          </div>
        ) : null}
        {step === 1 ? (
          <div className="space-y-5">
            <h1 className="font-display text-4xl">How should money read?</h1>
            <Field label="Currency" hint="Every ingredient, recipe, and selling price uses this currency.">
              <select className="field" value={currency} onChange={(event) => setCurrency(event.target.value as CurrencyCode)}>
                {CURRENCIES.map((code) => (
                  <option key={code} value={code}>
                    {code} — {currencyLabel(code)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={`Margin floor ${target}%`} hint="A plate under this profit margin is marked for review. Food cost is what remains of the selling price.">
              <input type="range" min={45} max={85} value={target} onChange={(event) => setTarget(Number(event.target.value))} className="w-full accent-[#9A4520]" />
            </Field>
          </div>
        ) : null}
        {step === 2 ? (
          <div className="space-y-4">
            <h1 className="font-display text-4xl">Start with a working board?</h1>
            <p className="text-sm leading-relaxed text-ink-soft">
              The sample service is a fictional grill kitchen with live prices, recipe cards, and a few plates already under the floor. You can edit or clear every line.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => setSample(true)} className={`rounded-2xl border p-4 text-left ${sample ? "border-copper bg-butter/40" : "border-line bg-white"}`}>
                <p className="font-semibold">Load a sample service</p>
                <p className="mt-1 text-sm text-ink-soft">Twelve plates, a full pantry, and price movement from the last three weeks.</p>
              </button>
              <button type="button" onClick={() => setSample(false)} className={`rounded-2xl border p-4 text-left ${!sample ? "border-copper bg-butter/40" : "border-line bg-white"}`}>
                <p className="font-semibold">Empty pantry</p>
                <p className="mt-1 text-sm text-ink-soft">Start from a blank board and add your own ingredients.</p>
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-8 flex justify-between gap-3">
          <button className="btn-quiet" type="button" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0}>
            Back
          </button>
          {step < 2 ? (
            <button
              className="btn-primary"
              type="button"
              onClick={() => {
                if (step === 0 && !name.trim()) {
                  setError("The kitchen needs a name.");
                  return;
                }
                setError("");
                setStep((value) => value + 1);
              }}
            >
              Continue
            </button>
          ) : (
            <button className="btn-primary" type="button" onClick={finish}>
              Open the pass
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
