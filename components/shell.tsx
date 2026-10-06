"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Mark } from "./boot";
import {
  IconBars,
  IconBell,
  IconCard,
  IconCrate,
  IconDial,
  IconFlame,
  IconLine,
  IconMenu,
  IconPlate,
  IconPlus,
  IconScale,
  IconSearch,
  IconTag,
} from "./icons";
import { useApp } from "@/lib/store";
import { currencyLabel } from "@/lib/format";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: IconPlate },
  { href: "/ingredients", label: "Ingredients", icon: IconTag },
  { href: "/receiving", label: "Receiving", icon: IconCrate },
  { href: "/recipes", label: "Recipes", icon: IconCard },
  { href: "/menu", label: "Menu", icon: IconMenu },
  { href: "/calculator", label: "Profit Calculator", icon: IconScale },
  { href: "/margins", label: "Margin Monitor", icon: IconLine },
  { href: "/analytics", label: "Analytics", icon: IconBars },
  { href: "/alerts", label: "Alerts", icon: IconFlame },
  { href: "/settings", label: "Settings", icon: IconDial },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, kitchen, metrics, logout } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [quick, setQuick] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    if (!user) router.replace("/login");
    else if (kitchen && !kitchen.profile.onboarded) router.replace("/onboarding");
  }, [user, kitchen, router]);

  useEffect(() => {
    setNavOpen(false);
    setQuick(false);
    setNotesOpen(false);
    setAccountOpen(false);
    setQuery("");
  }, [pathname]);

  const attention = metrics?.alerts.filter((alert) => alert.severity !== "healthy") ?? [];

  const hits = useMemo(() => {
    if (!kitchen || query.trim().length < 1) return [];
    const q = query.trim().toLowerCase();
    const ingredientHits = kitchen.ingredients
      .filter((item) => item.name.toLowerCase().includes(q))
      .slice(0, 4)
      .map((item) => ({ href: `/ingredients?focus=${item.id}`, label: item.name, meta: "Ingredient" }));
    const recipeHits = kitchen.recipes
      .filter((item) => item.name.toLowerCase().includes(q))
      .slice(0, 4)
      .map((item) => ({ href: `/recipes?focus=${item.id}`, label: item.name, meta: "Recipe" }));
    const menuHits = kitchen.recipes
      .filter((item) => item.name.toLowerCase().includes(q) && kitchen.menu.some((menu) => menu.recipeId === item.id && menu.onMenu))
      .slice(0, 3)
      .map((item) => ({ href: "/menu", label: item.name, meta: "Menu" }));
    return [...ingredientHits, ...recipeHits, ...menuHits].slice(0, 8);
  }, [kitchen, query]);

  if (!user || !kitchen?.profile.onboarded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-ink-soft">Opening the kitchen…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>
      {navOpen ? <button className="fixed inset-0 z-30 bg-[#1c1712]/40 lg:hidden" aria-label="Close menu" onClick={() => setNavOpen(false)} /> : null}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[272px] flex-col bg-walnut text-[#f6f1e8] transition-transform duration-200 ${
          navOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center gap-3 px-5 pb-4 pt-6">
          <Mark className="h-10 w-10" />
          <div>
            <p className="font-display text-2xl leading-none">Hearthline</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-[#cbbba6]">Kitchen profit</p>
          </div>
        </div>
        <nav className="scroll-thin flex-1 space-y-1 overflow-y-auto px-3 py-2" aria-label="Kitchen">
          {NAV.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            const badge = item.href === "/alerts" ? attention.length : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  active ? "bg-walnut-2 text-white" : "text-[#eadfce] hover:bg-white/5"
                }`}
              >
                <span className={`h-5 w-1 rounded-full ${active ? "bg-copper-bright" : "bg-transparent"}`} />
                <Icon className="h-[18px] w-[18px]" />
                <span className="flex-1">{item.label}</span>
                {badge > 0 ? <span className="rounded-full bg-copper-bright px-2 py-0.5 text-[11px] font-semibold text-white">{badge}</span> : null}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 px-5 py-4">
          <p className="font-display text-lg leading-tight">{kitchen.profile.name}</p>
          <p className="mt-1 text-xs text-[#cbbba6]">
            {kitchen.profile.city ? `${kitchen.profile.city} · ` : ""}
            {kitchen.profile.currency} {currencyLabel(kitchen.profile.currency)}
          </p>
        </div>
      </aside>

      <div className="lg:pl-[272px]">
        <header className="sticky top-0 z-20 border-b border-line/80 bg-[#f3eee6]/90 backdrop-blur-md">
          <div className="flex items-center gap-2 px-4 py-3 md:px-6">
            <button className="btn-quiet !px-2.5 lg:hidden" onClick={() => setNavOpen(true)} aria-label="Open navigation">
              <span className="flex flex-col gap-1">
                <span className="block h-0.5 w-4 bg-ink" />
                <span className="block h-0.5 w-4 bg-ink" />
                <span className="block h-0.5 w-4 bg-ink" />
              </span>
            </button>
            <div className="relative hidden min-w-0 flex-1 md:block md:max-w-md">
              <SearchBox query={query} setQuery={setQuery} hits={hits} />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="relative">
                <button className="btn-primary !py-2" onClick={() => { setQuick((v) => !v); setNotesOpen(false); setAccountOpen(false); }} aria-expanded={quick}>
                  <IconPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Quick add</span>
                </button>
                {quick ? (
                  <div className="absolute right-0 z-30 mt-2 w-56 rounded-2xl border border-line bg-card p-2 shadow-lift">
                    <QuickLink href="/ingredients?compose=1" label="Pantry item" />
                    <QuickLink href="/recipes?compose=1" label="Recipe card" />
                    <QuickLink href="/receiving" label="Delivery or price file" />
                    <QuickLink href="/calculator" label="Price a plate" />
                  </div>
                ) : null}
              </div>
              <div className="relative">
                <button
                  className="btn-quiet relative !px-2.5"
                  aria-label={`Alerts, ${attention.length} need a look`}
                  onClick={() => { setNotesOpen((v) => !v); setQuick(false); setAccountOpen(false); }}
                >
                  <IconBell className="h-4 w-4" />
                  {attention.length > 0 ? <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-chili" /> : null}
                </button>
                {notesOpen ? (
                  <div className="absolute right-0 z-30 mt-2 w-[min(100vw-2rem,22rem)] rounded-2xl border border-line bg-card p-3 shadow-lift">
                    <p className="px-1 text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">Pass notes</p>
                    <div className="mt-2 space-y-2">
                      {attention.slice(0, 4).map((alert) => (
                        <Link key={alert.id} href={alert.href} className="block rounded-xl px-2 py-2 hover:bg-butter/50">
                          <p className="text-sm font-medium">{alert.title}</p>
                          <p className="text-xs text-ink-soft">{alert.tag}</p>
                        </Link>
                      ))}
                      {attention.length === 0 ? <p className="px-2 py-3 text-sm text-ink-soft">Nothing needs a look right now.</p> : null}
                    </div>
                    <Link href="/alerts" className="mt-2 block px-2 text-sm font-semibold text-copper">
                      Open alerts
                    </Link>
                  </div>
                ) : null}
              </div>
              <div className="relative">
                <button
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-walnut text-sm font-semibold text-paper"
                  aria-label="Account menu"
                  onClick={() => { setAccountOpen((v) => !v); setQuick(false); setNotesOpen(false); }}
                >
                  {initials(user.name)}
                </button>
                {accountOpen ? (
                  <div className="absolute right-0 z-30 mt-2 w-60 rounded-2xl border border-line bg-card p-3 shadow-lift">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-ink-soft">{user.email}</p>
                    <Link href="/settings" className="mt-3 block rounded-xl px-2 py-2 text-sm hover:bg-butter/60">
                      Kitchen settings
                    </Link>
                    <button
                      className="block w-full rounded-xl px-2 py-2 text-left text-sm hover:bg-butter/60"
                      onClick={() => {
                        logout();
                        router.replace("/login");
                      }}
                    >
                      Log out
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          <div className="px-4 pb-3 md:hidden">
            <SearchBox query={query} setQuery={setQuery} hits={hits} />
          </div>
        </header>
        <main id="main" className="px-4 py-6 md:px-6 md:py-8">
          <div className="mx-auto max-w-content">{children}</div>
        </main>
      </div>
    </div>
  );
}

function SearchBox({
  query,
  setQuery,
  hits,
}: {
  query: string;
  setQuery: (value: string) => void;
  hits: { href: string; label: string; meta: string }[];
}) {
  return (
    <div className="relative">
      <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="field pl-9"
        placeholder="Search plates, recipes, pantry"
        aria-label="Search the kitchen"
      />
      {query && hits.length > 0 ? (
        <div className="absolute z-30 mt-2 w-full rounded-2xl border border-line bg-card p-2 shadow-lift">
          {hits.map((hit) => (
            <Link key={`${hit.meta}-${hit.label}`} href={hit.href} className="flex items-center justify-between rounded-xl px-3 py-2 text-sm hover:bg-butter/60">
              <span>{hit.label}</span>
              <span className="text-xs text-ink-soft">{hit.meta}</span>
            </Link>
          ))}
        </div>
      ) : null}
      {query && hits.length === 0 ? (
        <div className="absolute z-30 mt-2 w-full rounded-2xl border border-line bg-card px-3 py-3 text-sm text-ink-soft shadow-lift">
          Nothing in the kitchen matches that.
        </div>
      ) : null}
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="block rounded-xl px-3 py-2 text-sm hover:bg-butter/60">
      {label}
    </Link>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
