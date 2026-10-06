"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Mark } from "@/components/boot";
import { useApp } from "@/lib/store";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/seed";

export default function HomePage() {
  const { user, kitchen, login } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    router.replace(kitchen?.profile.onboarded ? "/dashboard" : "/onboarding");
  }, [user, kitchen, router]);

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-3">
          <Mark className="h-10 w-10" />
          <span className="font-display text-2xl">Hearthline</span>
        </div>
        <div className="flex gap-2">
          <Link href="/login" className="btn-quiet">
            Log in
          </Link>
          <Link href="/signup" className="btn-primary">
            Start a kitchen
          </Link>
        </div>
      </header>
      <main className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-8 lg:grid-cols-[1.15fr_0.85fr] lg:pt-16">
        <div>
          <p className="eyebrow">Kitchen profit intelligence</p>
          <h1 className="mt-3 font-display text-5xl leading-[1.02] tracking-tight text-ink md:text-7xl">
            Know if the menu is still profitable today.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
            Hearthline is the operating board for ingredient prices, recipe costs, and plate margins. Built for the pass, not a finance department.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              className="btn-primary"
              onClick={async () => {
                const error = await login(DEMO_EMAIL, DEMO_PASSWORD);
                if (!error) router.push("/dashboard");
              }}
            >
              Enter the demo kitchen
            </button>
            <Link href="/signup" className="btn-quiet">
              Set up your own
            </Link>
          </div>
          <p className="mt-4 text-sm text-ink-soft">
            Demo login {DEMO_EMAIL} · {DEMO_PASSWORD}
          </p>
        </div>
        <div className="card rise p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">Tonight at Copper Hearth</p>
          <p className="mt-4 font-display text-5xl">79%</p>
          <p className="text-sm text-ink-soft">blended margin against a 68% floor</p>
          <div className="mt-6 space-y-3">
            {[
              ["Ribeye with thyme butter", "Healthy", "sage"],
              ["Truffle mushroom pasta", "Warning", "brass"],
              ["Avocado & egg toast", "Critical", "chili"],
            ].map(([name, status]) => (
              <div key={name} className="flex items-center justify-between rounded-xl border border-line bg-white px-3 py-3">
                <span className="text-sm font-medium">{name}</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">{status}</span>
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm leading-relaxed text-ink-soft">
            Post a delivery, a spreadsheet, or an invoice photo. Every affected plate recalculates before service.
          </p>
        </div>
      </main>
    </div>
  );
}
