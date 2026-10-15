"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Mark } from "@/components/boot";
import { useApp } from "@/lib/store";

const FLOW = [
  {
    label: "Ingredients",
    href: "/ingredients",
    summary: "The pantry is where every plate begins.",
    details: [
      "Each ingredient keeps its name, unit, and the price you last paid.",
      "When that price changes, every recipe that uses it changes with it.",
      "What is on hand stays next to the item, so prep starts from the real pantry.",
    ],
    icon: LeafIcon,
  },
  {
    label: "Recipes",
    href: "/recipes",
    summary: "A recipe is the dish, written as ingredients and amounts.",
    details: [
      "Build a plate from the pantry and set how much of each ingredient it uses.",
      "The plate follows that list, and it updates when an ingredient price moves.",
      "A recipe can move onto the menu when it is ready to serve.",
    ],
    icon: ChefIcon,
  },
  {
    label: "Menu",
    href: "/menu",
    summary: "The menu is the set of dishes you are serving.",
    details: [
      "Choose which recipes are offered for this service.",
      "Each dish keeps its place, so the board shows what guests can order.",
      "Taking a dish off the menu leaves the recipe in the kitchen for next time.",
    ],
    icon: MenuIcon,
  },
  {
    label: "Service",
    href: "/dashboard",
    summary: "Service is the day the kitchen is open.",
    details: [
      "See which dishes are ready and which ingredients need a look before the pass.",
      "Notes point back to the ingredient, recipe, or menu item behind them.",
      "The board stays with the kitchen, from prep through the last plate.",
    ],
    icon: ServiceIcon,
  },
];

const STEPS = ["About you", "Your kitchen", "Ready for service"];

export default function SignupPage() {
  const { user, kitchen, signup, completeOnboarding } = useApp();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [kitchenName, setKitchenName] = useState("");
  const [city, setCity] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [sample, setSample] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [topic, setTopic] = useState<(typeof FLOW)[number] | null>(null);
  const draft = useRef<{ profile: { name: string; city: string; cuisine: string }; sample: boolean } | null>(null);
  const opened = useRef(false);

  useEffect(() => {
    if (!user || finishing) return;
    router.replace(kitchen?.profile.onboarded ? "/dashboard" : "/onboarding");
  }, [user, kitchen, router, finishing]);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const previousHtml = html.style.overflow;
    const previousBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = previousHtml;
      body.style.overflow = previousBody;
    };
  }, []);

  useEffect(() => {
    if (!finishing || !user || !kitchen || kitchen.profile.onboarded || opened.current || !draft.current) return;
    opened.current = true;
    const next = draft.current;
    completeOnboarding(
      {
        name: next.profile.name,
        city: next.profile.city,
        cuisine: next.profile.cuisine,
        currency: "USD",
        targetMargin: 68,
        alertPricePct: 8,
        criticalPricePct: 15,
        onboarded: true,
      },
      next.sample,
    );
    router.push("/dashboard");
  }, [finishing, user, kitchen, completeOnboarding, router]);

  useEffect(() => {
    if (!topic) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setTopic(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [topic]);

  function openKitchen() {
    if (!topic) return;
    if (user) router.push(kitchen?.profile.onboarded ? topic.href : "/onboarding");
    else router.push("/login");
  }

  function next() {
    setNotice("");
    if (step === 0) {
      if (name.trim().length < 2) return setError("Add your name.");
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("That email doesn't look complete.");
      if (password.length < 8) return setError("Use at least 8 characters.");
    }
    if (step === 1 && kitchenName.trim().length < 2) return setError("The kitchen needs a name.");
    setError("");
    setStep((value) => Math.min(2, value + 1));
  }

  async function finish() {
    setError("");
    setNotice("");
    setPending(true);
    draft.current = {
      profile: { name: kitchenName.trim(), city: city.trim(), cuisine: cuisine.trim() },
      sample,
    };
    const message = await signup({ name, email, password, role: "owner" });
    if (message) {
      draft.current = null;
      setPending(false);
      setStep(0);
      setError(message);
      return;
    }
    setFinishing(true);
  }

  return (
    <div className="relative h-dvh overflow-hidden bg-[#07100C] font-manrope text-[#F6F3E9]">
      <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[60vw] overflow-hidden lg:block">
        <img
          src="/hero/kitchen-bg.jpg"
          alt=""
          className="absolute max-w-none"
          style={{ width: "150%", height: "auto", left: "62%", top: "58%", transform: "translate(-70.7%, -56%)" }}
        />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,16,12,0.2)_0%,rgba(7,16,12,0.05)_32%,rgba(7,16,12,0.35)_52%,rgba(7,16,12,0.82)_66%,#07100C_78%)]" />
      <div className="relative z-10 mx-auto grid h-full max-w-[1440px] items-stretch gap-6 px-4 py-4 sm:px-6 lg:grid-cols-[1.12fr_0.88fr] lg:px-8 lg:py-5">
        <section className="relative hidden h-full min-h-0 flex-col lg:flex">
          <Link href="/" className="flex items-center gap-3">
            <Mark className="h-11 w-11" />
            <span>
              <span className="block font-sora text-lg font-semibold leading-none tracking-tight text-[#F2EBDD]">Plate Margin</span>
              <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#AEB8AF]">Kitchen intelligence</span>
            </span>
          </Link>

          <div className="mt-6">
            <h1 className="max-w-xl font-sora text-[2.7rem] font-semibold leading-[1.02] tracking-tight text-[#F6F3E9] xl:text-5xl">
              Your kitchen
              <span className="block">
                starts <span className="text-[#8EAE96]">here.</span>
              </span>
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-[#E4DDD0] xl:text-base">
              Bring your ingredients, recipes, menu, and daily decisions into one place.
            </p>
            <ol className="mt-4 flex max-w-lg items-start gap-3">
              {FLOW.map((item, index) => (
                <li key={item.label} className="flex items-start gap-3">
                  <button type="button" className="flow-chip group text-center" onClick={() => setTopic(item)}>
                    <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/25 text-[#E7F0E4] transition duration-200 group-hover:border-[#DDE8DF]/70 group-hover:bg-[#718C78]/20 group-hover:text-[#F6F3E9] group-hover:shadow-[0_0_18px_rgba(113,140,120,0.55)]">
                      <item.icon />
                    </span>
                    <span className="mt-1.5 block text-[11px] text-[#D7DDD4] transition group-hover:text-[#F6F3E9]">{item.label}</span>
                  </button>
                  {index < FLOW.length - 1 ? <span className="mt-3 text-[#AEB8AF]" aria-hidden="true">›</span> : null}
                </li>
              ))}
            </ol>
          </div>

          <div className="min-h-0 flex-1" />

          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C5D4C6]">
            Better ingredients <span className="px-2 text-[#718C78]">·</span> Better decisions <span className="px-2 text-[#718C78]">·</span> A stronger kitchen
          </p>
        </section>

        <section className="mx-auto flex h-full min-h-0 w-full max-w-[440px] flex-col justify-center">
          <Link href="/" className="mb-3 flex items-center gap-3 lg:hidden">
            <Mark className="h-10 w-10" />
            <span className="font-sora text-lg font-semibold text-[#F2EBDD]">Plate Margin</span>
          </Link>
          <div className="rounded-[28px] border border-white/10 bg-[#0D1812]/85 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-6">
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8EAE96]">Create your account</p>
            <h2 className="mt-2 text-center font-sora text-3xl font-semibold tracking-tight text-[#F6F3E9]">Open your kitchen.</h2>
            <p className="mt-1 text-center text-sm text-[#C5D0C6]">Let’s get the essentials ready.</p>

            <ol className="mt-4 grid grid-cols-3">
              {STEPS.map((label, index) => (
                <li key={label} className="relative text-center">
                  {index > 0 ? (
                    <span className={`absolute right-1/2 top-[13px] h-px w-full ${index <= step ? "bg-[#718C78]" : "bg-white/15"}`} />
                  ) : null}
                  <span
                    className={`relative mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                      index === step
                        ? "bg-[#718C78] text-[#F6F3E9] shadow-[0_0_18px_rgba(113,140,120,0.75)]"
                        : index < step
                          ? "bg-[#718C78]/35 text-[#E7F0E4]"
                          : "border border-white/20 text-[#8E9A91]"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className={`mt-2 block text-[11px] sm:text-xs ${index === step ? "text-[#F2EBDD]" : "text-[#8E9A91]"}`}>{label}</span>
                </li>
              ))}
            </ol>

            <div key={step} className="signup-step mt-4">
              {step === 0 ? (
                <div className="space-y-3">
                  <Field label="Full name" icon={<UserIcon />} value={name} onChange={setName} autoComplete="name" placeholder="Your name" />
                  <Field label="Email address" icon={<MailIcon />} value={email} onChange={setEmail} type="email" autoComplete="email" placeholder="you@restaurant.com" />
                  <Field
                    label="Password"
                    icon={<LockIcon />}
                    value={password}
                    onChange={setPassword}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Create a strong password"
                    hint="At least 8 characters. Saved only on this device."
                    trailing={
                      <button type="button" className="text-[#AEB8AF]" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)}>
                        <EyeIcon />
                      </button>
                    }
                  />
                </div>
              ) : null}
              {step === 1 ? (
                <div className="space-y-3">
                  <Field label="Kitchen name" icon={<ChefIcon />} value={kitchenName} onChange={setKitchenName} placeholder="The evening kitchen" />
                  <Field label="City" icon={<PinIcon />} value={city} onChange={setCity} placeholder="Where you cook" />
                  <Field label="Style of cooking" icon={<LeafIcon />} value={cuisine} onChange={setCuisine} placeholder="Grill, bakery, curry house" />
                </div>
              ) : null}
              {step === 2 ? (
                <div className="space-y-3">
                  <p className="text-sm leading-relaxed text-[#C5D0C6]">Choose how the first service should open.</p>
                  <Choice
                    active={sample}
                    title="A sample service"
                    note="A fictional kitchen already set with ingredients, recipes, and a menu you can edit."
                    onClick={() => setSample(true)}
                  />
                  <Choice
                    active={!sample}
                    title="An empty pantry"
                    note="A blank kitchen. Add your own ingredients when you are ready."
                    onClick={() => setSample(false)}
                  />
                </div>
              ) : null}
            </div>

            {error ? <p className="mt-4 text-sm text-[#E7B2AC]" role="alert">{error}</p> : null}
            {notice ? <p className="mt-4 text-sm text-[#DDE8DF]">{notice}</p> : null}

            <div className="mt-4 space-y-2">
              {step > 0 ? (
                <button type="button" className="text-sm text-[#AEB8AF] underline-offset-2 hover:underline" onClick={() => { setError(""); setStep((value) => value - 1); }}>
                  Back
                </button>
              ) : null}
              {step < 2 ? (
                <button type="button" className="btn-primary w-full !rounded-full !py-2.5" onClick={next}>
                  Continue to next step <span aria-hidden="true">→</span>
                </button>
              ) : (
                <button type="button" className="btn-primary w-full !rounded-full !py-2.5" disabled={pending} onClick={finish}>
                  {pending ? "Opening the kitchen…" : "Open the kitchen"} <span aria-hidden="true">→</span>
                </button>
              )}
            </div>

            {step === 0 ? (
              <>
                <div className="my-3 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-[#8E9A91]">
                  <span className="h-px flex-1 bg-white/10" />
                  Or
                  <span className="h-px flex-1 bg-white/10" />
                </div>
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-3 rounded-full border border-white/15 bg-transparent px-4 py-2.5 text-sm font-semibold text-[#F6F3E9] transition hover:border-[#DDE8DF]/40 hover:bg-white/5"
                  onClick={() => setNotice("Google sign-in isn’t connected for this kitchen. Continue with your email.")}
                >
                  <GoogleMark />
                  Sign up with Google
                </button>
              </>
            ) : null}

            <p className="mt-3 text-center text-sm text-[#AEB8AF]">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-[#8EAE96] hover:text-[#DDE8DF]">
                Log in
              </Link>
            </p>
          </div>
        </section>
      </div>
      {topic ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <button className="absolute inset-0 bg-black/65" aria-label="Close details" onClick={() => setTopic(null)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="signup-topic-title"
            className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-[#0D1812]/95 p-6 text-[#F6F1E6] shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-md"
          >
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#718C78]/20 text-[#DDE8DF]">
                <topic.icon />
              </span>
              <div>
                <h2 id="signup-topic-title" className="font-sora text-2xl font-semibold text-[#F2EBDD]">{topic.label}</h2>
                <p className="mt-2 text-sm leading-relaxed text-[#D7DDD4]">{topic.summary}</p>
              </div>
            </div>
            <ul className="mt-5 space-y-3 text-sm leading-relaxed text-[#E7E1D4]">
              {topic.details.map((line) => (
                <li key={line} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#718C78]" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-2">
              <button type="button" className="btn-primary" onClick={openKitchen}>Seen in kitchen</button>
              <button type="button" className="btn-hero" onClick={() => setTopic(null)}>Close</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  icon,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  hint,
  trailing,
}: {
  label: string;
  icon: ReactNode;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  hint?: string;
  trailing?: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-[#E7E1D4]">{label}</span>
      <span className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#07140F]/80 px-3 focus-within:border-[#718C78]">
        <span className="text-[#8EAE96]">{icon}</span>
        <input
          className="w-full bg-transparent py-2.5 text-sm text-[#F6F3E9] outline-none placeholder:text-[#8E9A91]"
          type={type}
          value={value}
          autoComplete={autoComplete}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
        {trailing}
      </span>
      {hint ? <span className="mt-1.5 block text-[11px] text-[#8E9A91]">{hint}</span> : null}
    </label>
  );
}

function Choice({ active, title, note, onClick }: { active: boolean; title: string; note: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition ${active ? "border-[#8EAE96] bg-[#718C78]/20 shadow-[0_0_18px_rgba(113,140,120,0.28)]" : "border-white/10 bg-black/20 hover:border-white/25"}`}
    >
      <span className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border ${active ? "border-[#DDE8DF] bg-[#718C78] shadow-[0_0_10px_#718C78]" : "border-white/30"}`} />
      <span>
      <span className="block font-sora text-sm font-semibold text-[#F6F3E9]">{title}</span>
      <span className="mt-1 block text-xs leading-relaxed text-[#C5D0C6]">{note}</span>
      </span>
    </button>
  );
}

function LeafIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M12 20c6-2.2 9-7 8-12-4.2.2-8.2 2-10 6" strokeLinecap="round" />
      <path d="M12 20c-1-5 0-9 3-12" strokeLinecap="round" />
    </svg>
  );
}

function ChefIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M8 6.5v4M12 5v5.5M16 6.5v4" strokeLinecap="round" />
      <path d="M7 10.5h10v8.5H7z" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M8 4.5h8v15H8z" />
      <path d="M10 8h4M10 11.5h4M10 15h3" strokeLinecap="round" />
    </svg>
  );
}

function ServiceIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M5 18V8M5 18h14" strokeLinecap="round" />
      <path d="M9 18v-4M13 18V9M17 18v-6" strokeLinecap="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <circle cx="12" cy="8" r="3" />
      <path d="M6 19c1.2-2.6 3.2-3.8 6-3.8S16.8 16.4 18 19" strokeLinecap="round" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <rect x="4" y="6" width="16" height="12" rx="2" />
      <path d="M5 8l7 5 7-5" strokeLinecap="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <rect x="6" y="10" width="12" height="9" rx="2" />
      <path d="M8.5 10V8a3.5 3.5 0 0 1 7 0v2" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z" />
      <circle cx="12" cy="11" r="1.8" />
    </svg>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.3 35.1 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.7-6.7 7.1l6.3 5.3C37.4 38.2 44 33 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  );
}
