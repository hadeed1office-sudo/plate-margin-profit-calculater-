export function BootScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas text-ink">
      <div className="text-center">
        <Mark className="mx-auto h-12 w-12" />
        <p className="mt-4 text-2xl font-semibold tracking-tight">Plate Margin</p>
        <p className="mt-1 text-sm text-ink-soft">Opening your kitchen…</p>
      </div>
    </div>
  );
}

export function Mark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="18" fill="#3E5646" />
      <rect x="1.4" y="1.4" width="61.2" height="61.2" rx="16.6" fill="none" stroke="#F2EBDD" strokeOpacity="0.45" strokeWidth="1.4" />
      <ellipse cx="32" cy="38" rx="18" ry="11" fill="#1C2A22" stroke="#F6F3E9" strokeWidth="2.1" />
      <ellipse cx="32" cy="38" rx="11" ry="6.2" fill="none" stroke="#DDE8DF" strokeOpacity="0.7" strokeWidth="1.3" />
      <path d="M32 14c4.2 4.4 5.6 8.4 3.2 12.4-4.4-1-8.2-4.8-3.2-12.4Z" fill="#F2EBDD" />
      <path d="M32 16.6c-2.6 3-3.2 6-1.6 8.6" fill="none" stroke="#3E5646" strokeWidth="1.15" strokeLinecap="round" />
    </svg>
  );
}
