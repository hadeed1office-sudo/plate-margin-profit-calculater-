"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Mark } from "@/components/boot";
import { useApp } from "@/lib/store";

const INGREDIENTS = [
  { name: "Olive Oil", note: "In stock", x: 66, y: 24, lx: 54, ly: 14, depth: 0.05 },
  { name: "Tomatoes", note: "Fresh", x: 84, y: 46, lx: 86, ly: 34, depth: 0.09 },
  { name: "Lemon", note: "Fresh", x: 78, y: 52, lx: 80, ly: 40, depth: 0.13 },
  { name: "Salmon", note: "Recipe ready", x: 70, y: 58, lx: 58, ly: 40, depth: 0.18 },
  { name: "Basil", note: "Fresh", x: 52, y: 82, lx: 44, ly: 70, depth: 0.24 },
];

const PLATE_IMAGE = { width: 1280, height: 720, bottom: 592 };

const FEATURES = [
  {
    title: "Track\nIngredients",
    href: "/ingredients",
    summary: "Today’s price sits next to last week’s, so a jump is visible before it lands on a plate.",
    details: [
      "Each pantry item keeps its current price, the previous price, and how far it moved.",
      "Volatile ingredients are marked so the sharpest rises are easy to find.",
      "A short price trail shows the last few weeks, and every recipe that uses the item is listed beside it.",
    ],
    icon: () => (
      <svg viewBox="0 0 32 32" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M17 26c7.5-3 12-10 10.2-17.2C21 8.2 14.2 10 12 16.5c1.6 2.4 3.4 5.6 5 9.5Z" strokeLinejoin="round" />
        <path d="M16.2 25.2C15 18 17.2 12.5 22.5 9.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Manage\nRecipes & Menu",
    href: "/recipes",
    summary: "A recipe card is the ingredient list and the amounts. The cost per plate follows from that list.",
    details: [
      "Add lines from the pantry and set the amount for each. The plate cost updates as you write.",
      "When an ingredient price changes, every recipe that uses it changes with it.",
      "Place a recipe on the menu, set the selling price, and see which dishes are ready for service.",
    ],
    icon: () => (
      <svg viewBox="0 0 32 32" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M13 6.5c0 3.2-1.6 5-1.6 8.2V25" strokeLinecap="round" />
        <path d="M10.2 6.5v6.2M15.8 6.5v6.2" strokeLinecap="round" />
        <path d="M20.5 6.5c1.8 2.4 1.8 5.2 0 8.2V25" strokeLinecap="round" />
        <path d="M18.6 14.7h3.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Monitor\nProfitability",
    href: "/margins",
    summary: "The blended menu margin is weighed against the target you set for the kitchen.",
    details: [
      "See actual margin, the target, and the gap, weighted by weekly covers.",
      "Dishes fall into healthy, watch, or critical so the ones under the line stand out.",
      "Food cost is shown as a share of the selling price, not as a separate guess.",
    ],
    icon: () => (
      <svg viewBox="0 0 32 32" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M7 25V8M7 25h18" strokeLinecap="round" />
        <path d="M11 20v-4M16 20V12M21 20V9" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Get Smart\nAlerts",
    href: "/alerts",
    summary: "The board speaks up when a price, a plate cost, or a margin needs a look.",
    details: [
      "Alerts cover sharp ingredient moves, dishes under the margin target, and recipes whose margin is slipping.",
      "Each note says what changed and opens the ingredient, recipe, or menu item behind it.",
      "Filter the tray so only the critical items, or only this week’s movement, stay in view.",
    ],
    icon: () => (
      <svg viewBox="0 0 32 32" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M10 22.5h12l-1.2-2.2V14a4.8 4.8 0 0 0-9.6 0v6.3L10 22.5Z" strokeLinejoin="round" />
        <path d="M14 24.2a2 2 0 0 0 4 0" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function HomePage() {
  const { user, kitchen } = useApp();
  const router = useRouter();
  const [feature, setFeature] = useState<(typeof FEATURES)[number] | null>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const accountHref = user ? (kitchen?.profile.onboarded ? "/dashboard" : "/onboarding") : "/login";

  useEffect(() => {
    const place = () => {
      const scale = Math.max(window.innerWidth / PLATE_IMAGE.width, window.innerHeight / PLATE_IMAGE.height);
      const offsetY = (window.innerHeight - PLATE_IMAGE.height * scale) / 2;
      const bottom = offsetY + PLATE_IMAGE.bottom * scale;
      document.documentElement.style.setProperty("--plate-end", `${Math.round(bottom)}px`);
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const plate = scene.querySelector<HTMLElement>("[data-plate]");
    const cards = [...scene.querySelectorAll<HTMLElement>("[data-depth]")];
    const lines = [...scene.querySelectorAll<SVGPathElement>("[data-line]")];
    const dots = [...scene.querySelectorAll<SVGCircleElement>("[data-dot]")];
    let current = window.scrollY;
    let running = false;

    const apply = (y: number) => {
      const travel = Math.min(Math.max(y, 0), window.innerHeight);
      const width = window.innerWidth || 1;
      const height = window.innerHeight || 1;
      const maxScroll = Math.max(document.documentElement.scrollHeight - height, 1);
      const scrollY = Math.max(y, 0);
      const plateShift = -scrollY - (scrollY / maxScroll) * 260;
      if (plate) plate.style.transform = `translate3d(0, ${plateShift}px, 0)`;
      const shifts = new Map<string, { x: number; y: number }>();
      cards.forEach((card) => {
        const depth = Number(card.dataset.depth);
        const lx = Number(card.dataset.lx);
        const shiftY = -travel * depth;
        const shiftX = ((lx - 64) / 28) * travel * depth * 0.14;
        shifts.set(card.dataset.name || "", { x: shiftX, y: shiftY });
        card.style.transform = `translate3d(${shiftX}px, ${shiftY}px, 0)`;
      });
      const platePercent = (plateShift / height) * 100;
      lines.forEach((line) => {
        const item = INGREDIENTS.find((entry) => entry.name === line.dataset.line);
        const shift = shifts.get(line.dataset.line || "");
        if (!item || !shift) return;
        const x1 = item.lx + 6 + (shift.x / width) * 100;
        const y1 = item.ly + 3 + (shift.y / height) * 100;
        const x2 = item.x;
        const y2 = item.y + platePercent;
        const cx = (x1 + x2) / 2;
        const cy = (y1 + y2) / 2;
        line.setAttribute("d", `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`);
      });
      dots.forEach((dot) => {
        const item = INGREDIENTS.find((entry) => entry.name === dot.dataset.dot);
        if (!item) return;
        dot.setAttribute("cy", String(item.y + platePercent));
      });
    };

    const tick = () => {
      const target = window.scrollY;
      current += (target - current) * 0.22;
      if (Math.abs(target - current) < 0.35) {
        current = target;
        running = false;
      } else {
        window.requestAnimationFrame(tick);
      }
      apply(current);
    };
    const onScroll = () => {
      if (running) return;
      running = true;
      window.requestAnimationFrame(tick);
    };
    apply(current);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!feature) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFeature(null);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [feature]);

  function seeInKitchen() {
    if (!feature) return;
    if (user) router.push(kitchen?.profile.onboarded ? feature.href : "/onboarding");
    else router.push("/login");
  }

  return (
    <div className="relative font-manrope text-[#F6F1E6]">
      <div
        className="fixed inset-0 z-0 bg-[#070b09] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/hero/kitchen-seat.jpg)" }}
      />
      <div ref={sceneRef} className="pointer-events-none fixed inset-0 z-20">
        <svg className="absolute inset-0 hidden h-full w-full lg:block" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {INGREDIENTS.map((item) => (
            <path
              key={item.name}
              data-line={item.name}
              className="hero-line"
              d={`M ${item.lx + 6} ${item.ly + 3} Q ${(item.lx + item.x) / 2} ${(item.ly + item.y) / 2} ${item.x} ${item.y}`}
              fill="none"
              stroke="#E7F0E4"
              strokeWidth="0.28"
              strokeLinecap="round"
            />
          ))}
          {INGREDIENTS.map((item) => (
            <circle key={`${item.name}-dot`} data-dot={item.name} cx={item.x} cy={item.y} r="0.45" fill="#E7F0E4" />
          ))}
        </svg>
        <div
          data-plate
          className="absolute inset-0 bg-cover bg-center bg-no-repeat will-change-transform"
          style={{ backgroundImage: "url(/hero/plate-cutout.png)" }}
          aria-hidden="true"
        />
        {INGREDIENTS.map((item, index) => (
          <div
            key={item.name}
            data-name={item.name}
            data-depth={item.depth}
            data-lx={item.lx}
            className="pointer-events-auto absolute hidden will-change-transform lg:block"
            style={{ left: `${item.lx}%`, top: `${item.ly}%` }}
          >
            <div className="ingredient-pop float-label" style={{ animationDelay: `${index * 0.35}s` }}>
              <div className="ingredient-card rounded-2xl border border-white/25 bg-[#101612]/80 px-3 py-2 shadow-[0_12px_28px_rgba(0,0,0,0.4),0_0_18px_rgba(113,140,120,0.28)] backdrop-blur-md">
                <p className="font-sora text-sm font-medium leading-none text-[#F6F1E6]">{item.name}</p>
                <p className="mt-1 text-[11px] leading-none text-[#C5D4C6]">{item.note}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="relative z-30 min-h-[var(--plate-end,78vh)]">
      <header className="relative z-40 flex items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex shrink-0 items-center gap-2.5">
          <Mark className="h-9 w-9 drop-shadow-[0_8px_16px_rgba(0,0,0,0.35)] sm:h-11 sm:w-11" />
          <span className="font-sora text-sm font-semibold leading-tight tracking-tight sm:text-base">Kitchen Profit Calculator</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link href={user ? accountHref : "/login"} className="btn-hero whitespace-nowrap px-3 py-2 text-xs sm:px-3.5 sm:py-2.5 sm:text-sm">
            {user ? "Open the kitchen" : "Log in"}
          </Link>
          <Link href="/signup" className="btn-primary whitespace-nowrap px-3 py-2 text-xs sm:px-3.5 sm:py-2.5 sm:text-sm">
            Sign up
          </Link>
        </div>
      </header>

      <main className="pointer-events-none relative z-10">
        <div className="pointer-events-auto max-w-xl px-5 pb-6 pt-4 lg:py-8 lg:pl-[max(1.25rem,calc((100vw-80rem)/2+1.25rem))] lg:pr-4">
          <h1 className="font-sora text-[2.15rem] font-semibold leading-[1.05] tracking-tight text-[#F6F1E6] sm:text-[2.7rem]">
            <span className="block whitespace-nowrap">Know More.</span>
            <span className="block whitespace-nowrap">Waste Less.</span>
            <span className="block whitespace-nowrap">Run Smarter.</span>
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-[#D7DDD4] md:text-lg">
            The dish, and the pantry beside it.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/signup" className="btn-primary">
              Start a kitchen
            </Link>
            <Link href={accountHref} className="btn-hero">
              Already have an account
            </Link>
          </div>
          <ul className="mt-6 flex flex-wrap gap-2 lg:hidden">
            {INGREDIENTS.map((item) => (
              <li key={item.name} className="rounded-full border border-white/15 bg-[#101612]/75 px-3 py-1.5 text-xs text-[#F6F1E6]">
                {item.name}
              </li>
            ))}
          </ul>
        </div>
      </main>
      </div>
      <footer className="relative z-40 px-4 pb-8 pt-3 sm:px-6">
        <div className="mx-auto grid max-w-5xl grid-cols-2 overflow-hidden rounded-2xl border border-white/15 bg-black/40 shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur-md md:grid-cols-4 md:divide-x md:divide-white/15">
          {FEATURES.map((item, index) => (
            <button
              key={item.title}
              type="button"
              className={`feature-tile group flex flex-col items-center gap-2.5 px-4 py-5 text-center ${index % 2 === 0 ? "border-r border-white/15 md:border-r-0" : ""} ${index < 2 ? "border-b border-white/15 md:border-b-0" : ""}`}
              onClick={() => setFeature(item)}
            >
              <span className="text-[#A9C3AE] transition duration-200 group-hover:scale-110 group-hover:text-[#F2EBDD] group-hover:drop-shadow-[0_0_12px_rgba(169,195,174,0.85)]">
                {item.icon()}
              </span>
              <span className="max-w-[11rem] whitespace-pre-line font-sora text-sm font-medium leading-snug text-[#F6F1E6]">{item.title}</span>
            </button>
          ))}
        </div>
        <div className="mx-auto mt-8 max-w-xl px-5 text-center">
          <h2 className="font-sora text-3xl font-semibold tracking-tight text-[#F2EBDD] sm:text-4xl">Put your kitchen on the plate.</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#D7DDD4] sm:text-base">
            Start with the pantry, the recipes, and the alerts that keep each dish in line.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/signup" className="btn-primary">Start a kitchen</Link>
            <Link href={accountHref} className="btn-hero">Already have an account</Link>
          </div>
        </div>
      </footer>
      {feature ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <button className="absolute inset-0 bg-black/65" aria-label="Close details" onClick={() => setFeature(null)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="feature-title"
            className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-[#0D1812]/95 p-6 text-[#F6F1E6] shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-md"
          >
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#718C78]/20 text-[#DDE8DF]">{feature.icon()}</span>
              <div>
                <h2 id="feature-title" className="font-sora text-2xl font-semibold text-[#F2EBDD]">{feature.title.replace("\n", " ")}</h2>
                <p className="mt-2 text-sm leading-relaxed text-[#D7DDD4]">{feature.summary}</p>
              </div>
            </div>
            <ul className="mt-5 space-y-3 text-sm leading-relaxed text-[#E7E1D4]">
              {feature.details.map((line) => (
                <li key={line} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#718C78]" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-2">
              <button type="button" className="btn-primary" onClick={seeInKitchen}>Seen in kitchen</button>
              <button type="button" className="btn-hero" onClick={() => setFeature(null)}>Close</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
