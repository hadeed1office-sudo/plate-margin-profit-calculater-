"use client";

import { useEffect } from "react";
import { IconClose } from "./icons";
import { useApp } from "@/lib/store";

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-xs leading-relaxed text-ink-soft">{hint}</span> : null}
      {error ? (
        <span className="mt-1.5 block text-xs text-chili" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}

export function Tip({ text }: { text: string }) {
  return (
    <button
      type="button"
      className="group relative ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-line text-[10px] font-bold text-ink-soft"
      aria-label={text}
    >
      i
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-30 hidden w-56 -translate-x-1/2 rounded-xl border border-line bg-card px-3 py-2 text-left text-xs font-medium normal-case leading-relaxed tracking-normal text-cream group-hover:block group-focus:block"
      >
        {text}
      </span>
    </button>
  );
}

export function SeverityPill({ status }: { status: "critical" | "warning" | "healthy" | "unset" }) {
  const map = {
    critical: { label: "Critical", className: "bg-chili-soft text-chili", icon: "!" },
    warning: { label: "Warning", className: "bg-brass-soft text-brass", icon: "▲" },
    healthy: { label: "Healthy", className: "bg-sage-soft text-sage", icon: "✓" },
    unset: { label: "Set a price", className: "bg-mist text-ink-soft", icon: "–" },
  } as const;
  const item = map[status];
  return (
    <span className={`chip ${item.className}`}>
      <span aria-hidden="true">{item.icon}</span>
      {item.label}
    </span>
  );
}

export function ChangePill({ value, invert = false }: { value: number | null; invert?: boolean }) {
  if (value == null || Math.abs(value) < 0.05) return <span className="chip bg-paper text-ink-soft">Steady</span>;
  const up = value > 0;
  const good = invert ? !up : up;
  return (
    <span className={`chip num ${good ? "bg-sage-soft text-sage" : "bg-chili-soft text-chili"}`}>
      {up ? "↑" : "↓"} {Math.abs(value).toFixed(1)}%
    </span>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-card px-6 py-14 text-center shadow-card">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/20 text-brand-soft shadow-[0_0_24px_rgba(113,140,120,0.2)]">
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M12 21c-4-3.2-7-6.4-7-10a7 7 0 0 1 14 0c0 3.6-3 6.8-7 10Z" />
          <path d="M12 11V7" />
        </svg>
      </div>
      <h3 className="font-sora text-2xl font-semibold text-cream">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  lede,
  actions,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1 className="mt-1 font-sora text-[1.75rem] font-semibold tracking-tight text-cream md:text-[2rem]">{title}</h1>
        {lede ? <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft md:text-base">{lede}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Drawer({
  open,
  title,
  subtitle,
  onClose,
  children,
  wide,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button className="absolute inset-0 bg-black/60" aria-label="Close panel" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative flex h-full w-full flex-col bg-card shadow-lift ${wide ? "max-w-5xl" : "max-w-lg"}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <h2 className="font-sora text-2xl font-semibold text-cream">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm text-ink-soft">{subtitle}</p> : null}
          </div>
          <button className="btn-quiet !px-2.5" onClick={onClose} aria-label="Close">
            <IconClose className="h-4 w-4" />
          </button>
        </div>
        <div className="scroll-thin flex-1 overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

export function Toaster() {
  const { toasts, dismissToast } = useApp();
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-4 right-4 z-[60] flex w-[min(100%-2rem,22rem)] flex-col gap-2">
      {toasts.map((item) => (
        <button
          key={item.id}
          onClick={() => dismissToast(item.id)}
          className="rounded-2xl border border-line bg-card px-4 py-3 text-left text-sm text-ink shadow-lift"
        >
          {item.text}
        </button>
      ))}
    </div>
  );
}
