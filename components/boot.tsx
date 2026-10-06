export function BootScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-walnut text-paper">
      <div className="text-center">
        <Mark className="mx-auto h-14 w-14" />
        <p className="mt-5 font-display text-3xl">Hearthline</p>
        <p className="mt-2 text-sm text-[#d9cbb8]">Setting the pass…</p>
      </div>
    </div>
  );
}

export function Mark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="#9A4520" />
      <circle cx="32" cy="32" r="18" fill="none" stroke="#F6E7C1" strokeWidth="3" />
      <path d="M32 16v8M24 22c2 4 12 4 16 0" fill="none" stroke="#F6E7C1" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="32" cy="34" r="3" fill="#F6E7C1" />
    </svg>
  );
}
