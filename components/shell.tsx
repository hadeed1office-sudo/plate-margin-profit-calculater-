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

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: IconPlate },
  { href: "/ingredients", label: "Ingredients", icon: IconTag },
  { href: "/receiving", label: "Upload rate invoices", icon: IconCrate },
  { href: "/recipes", label: "Recipes", icon: IconCard },
  { href: "/menu", label: "Menu", icon: IconMenu },
  { href: "/calculator", label: "Profit Calculator", icon: IconScale },
  { href: "/margins", label: "Margin Monitor", icon: IconLine },
  { href: "/analytics", label: "Analytics", icon: IconBars },
  { href: "/alerts", label: "Alerts", icon: IconFlame },
  { href: "/settings", label: "Settings", icon: IconDial },
];

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/ingredients": "Ingredients",
  "/receiving": "Upload rate invoices",
  "/recipes": "Recipes",
  "/menu": "Menu",
  "/calculator": "Profit Calculator",
  "/margins": "Margin Monitor",
  "/analytics": "Analytics",
  "/alerts": "Alerts",
  "/settings": "Settings",
  "/privacy": "Privacy Policy",
  "/terms": "Terms & Conditions",
};

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
  const title = TITLES[pathname] ?? "Kitchen Profit Calculator";

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
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <p className="text-sm text-ink-soft">Opening your kitchen…</p>
      </div>
    );
  }

  return (
    <div className="app-atmosphere min-h-screen">
      <div className="kitchen-scene" aria-hidden="true">
        <span className="kitchen-leaf kitchen-leaf-corner" />
        <span className="kitchen-leaf kitchen-leaf-footer" />
        <img src="/hero/kitchen-bg.jpg" alt="" className="kitchen-plate" />
      </div>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-card focus:px-3 focus:py-2">
        Skip to content
      </a>
      {navOpen ? <button className="fixed inset-0 z-30 bg-black/60 lg:hidden" aria-label="Close menu" onClick={() => setNavOpen(false)} /> : null}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-line bg-[#0A1410]/95 backdrop-blur-md transition-transform duration-200 ${
          navOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center gap-3 px-5 pb-2 pt-6">
          <Mark className="h-10 w-10" />
          <div>
            <p className="font-sora text-sm font-semibold leading-tight tracking-tight text-cream">Kitchen Profit Calculator</p>
            <p className="mt-1 text-xs text-muted">{kitchen.profile.name}</p>
          </div>
        </div>
        <nav className="scroll-thin mt-4 flex-1 space-y-1 overflow-y-auto px-3 py-2" aria-label="Kitchen">
          {NAV.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            const badge = item.href === "/alerts" ? attention.length : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`nav-item flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                  active ? "nav-item-active" : ""
                }`}
              >
                <Icon className={`h-[18px] w-[18px] ${active ? "text-brand-soft" : ""}`} />
                <span className="flex-1">{item.label}</span>
                {badge > 0 ? <span className="rounded-lg bg-chili-soft px-2 py-0.5 text-[11px] font-semibold text-chili">{badge}</span> : null}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-line-soft px-3 py-3">
          <Link href="/privacy" className={`nav-item mb-1 flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${pathname === "/privacy" ? "nav-item-active" : ""}`}>
            Privacy Policy
          </Link>
          <Link href="/terms" className={`nav-item flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${pathname === "/terms" ? "nav-item-active" : ""}`}>
            Terms & Conditions
          </Link>
          <div className="px-3 pt-3">
            <p className="text-sm font-medium">{kitchen.profile.currency}</p>
            <p className="mt-0.5 text-xs text-muted">{kitchen.profile.city || "Your kitchen"}</p>
          </div>
        </div>
      </aside>

      <div className="relative z-10 lg:pl-[248px]">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[linear-gradient(90deg,rgba(7,16,12,0.94)_0%,rgba(7,16,12,0.78)_26%,rgba(7,16,12,0.28)_62%,rgba(7,16,12,0.12)_100%)] backdrop-blur-[2px]">
          <div className="flex items-center gap-3 px-4 py-3 md:px-6">
            <button className="btn-quiet !px-2.5 lg:hidden" onClick={() => setNavOpen(true)} aria-label="Open navigation">
              <span className="flex flex-col gap-1">
                <span className="block h-0.5 w-4 bg-ink" />
                <span className="block h-0.5 w-4 bg-ink" />
                <span className="block h-0.5 w-4 bg-ink" />
              </span>
            </button>
            <div className="min-w-0">
              <p className="text-xs text-muted">Kitchen Profit Calculator</p>
              <p className="truncate font-sora text-base font-semibold tracking-tight text-cream md:text-lg">{title}</p>
            </div>
            <div className="relative ml-auto hidden min-w-0 flex-1 md:block md:max-w-sm">
              <SearchBox query={query} setQuery={setQuery} hits={hits} />
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <button className="btn-primary !py-2" onClick={() => { setQuick((value) => !value); setNotesOpen(false); setAccountOpen(false); }} aria-expanded={quick}>
                  <IconPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Quick add</span>
                </button>
                {quick ? (
                  <div className="absolute right-0 z-30 mt-2 w-56 rounded-2xl border border-line bg-card p-2 shadow-lift">
                    <QuickLink href="/ingredients?compose=1" label="Add ingredient" />
                    <QuickLink href="/recipes?compose=1" label="Create recipe" />
                    <QuickLink href="/menu" label="Add menu item" />
                  </div>
                ) : null}
              </div>
              <div className="relative">
                <button
                  className="btn-quiet relative !px-2.5"
                  aria-label={`Notifications, ${attention.length} need attention`}
                  onClick={() => { setNotesOpen((value) => !value); setQuick(false); setAccountOpen(false); }}
                >
                  <IconBell className="h-4 w-4" />
                  {attention.length > 0 ? <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-chili" /> : null}
                </button>
                {notesOpen ? (
                  <div className="absolute right-0 z-30 mt-2 w-[min(100vw-2rem,22rem)] rounded-2xl border border-line bg-card p-3 shadow-lift">
                    <p className="px-1 text-xs font-semibold text-ink-soft">Needs attention</p>
                    <div className="mt-2 space-y-1">
                      {attention.slice(0, 4).map((alert) => (
                        <Link key={alert.id} href={alert.href} className="block rounded-xl px-2 py-2 hover:bg-mist">
                          <p className="text-sm font-medium">{alert.title}</p>
                          <p className="text-xs text-muted">{alert.tag}</p>
                        </Link>
                      ))}
                      {attention.length === 0 ? <p className="px-2 py-3 text-sm text-ink-soft">Nothing needs attention right now.</p> : null}
                    </div>
                    <Link href="/alerts" className="mt-2 block px-2 text-sm font-semibold text-brand-soft">
                      Open alerts
                    </Link>
                  </div>
                ) : null}
              </div>
              <div className="relative">
                <button
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/25 font-sora text-sm font-semibold text-cream shadow-[0_0_18px_rgba(113,140,120,0.28)]"
                  aria-label="Account menu"
                  onClick={() => { setAccountOpen((value) => !value); setQuick(false); setNotesOpen(false); }}
                >
                  {initials(user.name)}
                </button>
                {accountOpen ? (
                  <div className="absolute right-0 z-30 mt-2 w-60 rounded-2xl border border-line bg-card p-3 shadow-lift">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted">{user.email}</p>
                    <Link href="/settings" className="mt-3 block rounded-xl px-2 py-2 text-sm hover:bg-mist">
                      Kitchen settings
                    </Link>
                    <button
                      className="block w-full rounded-xl px-2 py-2 text-left text-sm hover:bg-mist"
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
        <main id="main" className="px-4 py-6 pb-24 md:px-6 md:py-8 lg:pb-8">
          <div className="mx-auto max-w-content">{children}</div>
        </main>
        <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-[#0A1410]/95 backdrop-blur-md lg:hidden" aria-label="Mobile">
          {NAV.slice(0, 5).map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={`flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium ${active ? "text-brand-soft" : "text-muted"}`}>
                <Icon className="h-4 w-4" />
                {item.label.split(" ")[0]}
              </Link>
            );
          })}
        </nav>
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
      <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="field pl-9"
        placeholder="Search ingredients, recipes, dishes"
        aria-label="Search the kitchen"
      />
      {query && hits.length > 0 ? (
        <div className="absolute z-30 mt-2 w-full rounded-2xl border border-line bg-card p-2 shadow-lift">
          {hits.map((hit) => (
            <Link key={`${hit.meta}-${hit.label}`} href={hit.href} className="flex items-center justify-between rounded-xl px-3 py-2 text-sm hover:bg-mist">
              <span>{hit.label}</span>
              <span className="text-xs text-muted">{hit.meta}</span>
            </Link>
          ))}
        </div>
      ) : null}
      {query && hits.length === 0 ? (
        <div className="absolute z-30 mt-2 w-full rounded-2xl border border-line bg-card px-3 py-3 text-sm text-ink-soft shadow-lift">
          Nothing matches that search.
        </div>
      ) : null}
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="block rounded-xl px-3 py-2 text-sm hover:bg-mist">
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
